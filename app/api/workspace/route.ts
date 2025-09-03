import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { createAuditLog } from "@/lib/audit"
import { workspaceNameSchema, sanitizeString } from "@/lib/validation"
import { apiLimiter } from "@/lib/rate-limit"

const UpdateWorkspaceSchema = z.object({
  name: workspaceNameSchema,
})

export async function GET(req: NextRequest) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 100, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const prisma = await getPrisma()
  const workspace = await prisma.workspace.findUnique({
    where: { id: session.ws },
    include: {
      owner: {
        select: { id: true, name: true, email: true }
      },
      _count: {
        select: {
          memberships: true,
          clients: { where: { deletedAt: null } },
        }
      }
    }
  })

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  }

  return NextResponse.json({ item: workspace })
}

export async function PATCH(req: NextRequest) {
  const session = await requireRole(ROLES.OWNER) // Only owners can update workspace
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 10, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = UpdateWorkspaceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ 
      error: "Invalid input", 
      details: parsed.error.issues.map(i => i.message)
    }, { status: 400 })
  }

  const prisma = await getPrisma()

  // Get current workspace for audit
  const currentWorkspace = await prisma.workspace.findUnique({
    where: { id: session.ws }
  })

  if (!currentWorkspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  }

  const updatedWorkspace = await prisma.workspace.update({
    where: { id: session.ws },
    data: {
      name: sanitizeString(parsed.data.name),
    }
  })

  // Audit log
  await createAuditLog({
    workspaceId: session.ws,
    userId: session.sub,
    action: "UPDATE",
    entity: "WORKSPACE",
    entityId: session.ws,
    before: { name: currentWorkspace.name },
    after: { name: updatedWorkspace.name }
  })

  return NextResponse.json({ item: updatedWorkspace })
}