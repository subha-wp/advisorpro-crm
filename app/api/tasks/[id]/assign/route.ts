import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { createAuditLog } from "@/lib/audit"
import { apiLimiter } from "@/lib/rate-limit"

const AssignTaskSchema = z.object({
  assignedToUserId: z.string().uuid().nullable(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const {id} = await params
  const session = await requireRole(ROLES.OWNER) // Only owners can reassign tasks
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 20, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = AssignTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ 
      error: "Invalid input", 
      details: parsed.error.issues.map(i => i.message)
    }, { status: 400 })
  }

  const prisma = await getPrisma()

  // Get current task
  const currentTask = await prisma.task.findFirst({
    where: { 
      id: id, 
      workspaceId: session.ws 
    }
  })

  if (!currentTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  // Validate assigned user is a member of the workspace if provided
  if (parsed.data.assignedToUserId) {
    const membership = await prisma.membership.findFirst({
      where: { 
        userId: parsed.data.assignedToUserId, 
        workspaceId: session.ws 
      }
    })
    if (!membership) {
      return NextResponse.json({ error: "Assigned user not found in workspace" }, { status: 404 })
    }
  }

  const updatedTask = await prisma.task.update({
    where: { id: id },
    data: {
      assignedToUserId: parsed.data.assignedToUserId,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true } },
      policy: { select: { id: true, policyNumber: true, insurer: true } },
    }
  })

  // Audit log
  await createAuditLog({
    workspaceId: session.ws,
    userId: session.sub,
    action: "ASSIGN_TASK",
    entity: "TASK",
    entityId: id,
    before: { assignedToUserId: currentTask.assignedToUserId },
    after: { assignedToUserId: parsed.data.assignedToUserId }
  })

  return NextResponse.json({ item: updatedTask })
}