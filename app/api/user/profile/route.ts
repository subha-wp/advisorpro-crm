import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { createAuditLog } from "@/lib/audit"
import { nameSchema, emailSchema, phoneSchema, sanitizeString, sanitizeEmail, sanitizePhone } from "@/lib/validation"
import { apiLimiter } from "@/lib/rate-limit"

const UpdateProfileSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
})

export async function GET(req: NextRequest) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const prisma = await getPrisma()
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, phone: true, avatarUrl: true, createdAt: true }
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({ item: user })
}

export async function PATCH(req: NextRequest) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 10, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = UpdateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ 
      error: "Invalid input", 
      details: parsed.error.issues.map(i => i.message)
    }, { status: 400 })
  }

  const prisma = await getPrisma()

  // Get current user data for audit
  const currentUser = await prisma.user.findUnique({
    where: { id: session.sub }
  })

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Check for conflicts if email/phone is being changed
  const updateData: any = {}
  if (parsed.data.name) updateData.name = sanitizeString(parsed.data.name)
  if (parsed.data.email) {
    const email = sanitizeEmail(parsed.data.email)
    if (email !== currentUser.email) {
      const existing = await prisma.user.findFirst({
        where: { email, id: { not: session.sub } }
      })
      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 })
      }
      updateData.email = email
    }
  }
  if (parsed.data.phone) {
    const phone = sanitizePhone(parsed.data.phone)
    if (phone !== currentUser.phone) {
      const existing = await prisma.user.findFirst({
        where: { phone, id: { not: session.sub } }
      })
      if (existing) {
        return NextResponse.json({ error: "Phone already in use" }, { status: 409 })
      }
      updateData.phone = phone
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No changes to save" }, { status: 400 })
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.sub },
    data: updateData,
    select: { id: true, name: true, email: true, phone: true, avatarUrl: true, createdAt: true }
  })

  // Audit log
  await createAuditLog({
    workspaceId: session.ws,
    userId: session.sub,
    action: "UPDATE",
    entity: "USER",
    entityId: session.sub,
    before: { 
      name: currentUser.name, 
      email: currentUser.email, 
      phone: currentUser.phone 
    },
    after: updateData
  })

  return NextResponse.json({ item: updatedUser })
}