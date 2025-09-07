import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { createAuditLog } from "@/lib/audit"
import { apiLimiter } from "@/lib/rate-limit"

const UpdateMemberSchema = z.object({
  role: z.enum(["AGENT", "VIEWER"]),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const {id} = await params
  const session = await requireRole(ROLES.OWNER) // Only owners can modify roles
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 10, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = UpdateMemberSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ 
      error: "Invalid input", 
      details: parsed.error.issues.map(i => i.message)
    }, { status: 400 })
  }

  const prisma = await getPrisma()

  // Get current membership
  const currentMembership = await prisma.membership.findFirst({
    where: { id: id, workspaceId: session.ws },
    include: { user: { select: { name: true, email: true } } }
  })

  if (!currentMembership) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 })
  }

  // Cannot change owner role
  if (currentMembership.role === "OWNER") {
    return NextResponse.json({ error: "Cannot change owner role" }, { status: 403 })
  }

  const updatedMembership = await prisma.membership.update({
    where: { id: id },
    data: { role: parsed.data.role },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, createdAt: true }
      }
    }
  })

  // Audit log
  await createAuditLog({
    workspaceId: session.ws,
    userId: session.sub,
    action: "CHANGE_ROLE",
    entity: "MEMBERSHIP",
    entityId: id,
    before: { role: currentMembership.role },
    after: { role: parsed.data.role },
    metadata: { targetUserId: currentMembership.userId }
  })

  return NextResponse.json({ item: updatedMembership })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params
  const session = await requireRole(ROLES.OWNER) // Only owners can remove members
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 10, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const prisma = await getPrisma()

  // Get membership to check if it exists and get user info
  const membership = await prisma.membership.findFirst({
    where: { id: id, workspaceId: session.ws },
    include: { user: { select: { name: true, email: true } } }
  })

  if (!membership) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 })
  }

  // Cannot remove owner
  if (membership.role === "OWNER") {
    return NextResponse.json({ error: "Cannot remove workspace owner" }, { status: 403 })
  }

  // Cannot remove yourself
  if (membership.userId === session.sub) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 403 })
  }

  await prisma.membership.delete({
    where: { id: id }
  })

  // Audit log
  await createAuditLog({
    workspaceId: session.ws,
    userId: session.sub,
    action: "REMOVE_USER",
    entity: "MEMBERSHIP",
    entityId: id,
    before: { 
      userId: membership.userId, 
      role: membership.role,
      userName: membership.user.name,
      userEmail: membership.user.email
    }
  })

  return NextResponse.json({ ok: true })
}