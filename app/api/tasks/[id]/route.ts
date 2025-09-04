import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { createAuditLog } from "@/lib/audit"
import { apiLimiter } from "@/lib/rate-limit"

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  type: z.enum(["FOLLOW_UP", "POLICY_RENEWAL", "CLAIM_ASSISTANCE", "DOCUMENTATION", "MEETING", "OTHER"]).optional(),
  assignedToUserId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  policyId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
})

const CompleteTaskSchema = z.object({
  completionRemarks: z.string().min(1).max(1000),
  completionData: z.record(z.any()).optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const prisma = await getPrisma()
  const task = await prisma.task.findFirst({
    where: { 
      id: params.id, 
      workspaceId: session.ws 
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, mobile: true, email: true } },
      policy: { select: { id: true, policyNumber: true, insurer: true, planName: true } },
    }
  })

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  return NextResponse.json({ item: task })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const {id} = await params
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 20, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = UpdateTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ 
      error: "Invalid input", 
      details: parsed.error.issues.map(i => i.message)
    }, { status: 400 })
  }

  const prisma = await getPrisma()

  // Get current task to check permissions
  const currentTask = await prisma.task.findFirst({
    where: { 
      id: id, 
      workspaceId: session.ws 
    }
  })

  if (!currentTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  // Check permissions: task creator, assignee, or workspace owner can update
  const canUpdate = currentTask.createdByUserId === session.sub ||
                   currentTask.assignedToUserId === session.sub ||
                   session.role === "OWNER"

  if (!canUpdate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updateData: any = {}
  if (parsed.data.title) updateData.title = parsed.data.title
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description
  if (parsed.data.priority) updateData.priority = parsed.data.priority
  if (parsed.data.status) updateData.status = parsed.data.status
  if (parsed.data.type) updateData.type = parsed.data.type
  if (parsed.data.dueDate !== undefined) {
    updateData.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null
  }

  // Handle assignment changes (only owners can reassign)
  if (parsed.data.assignedToUserId !== undefined && session.role === "OWNER") {
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
    updateData.assignedToUserId = parsed.data.assignedToUserId
  }

  // Validate client and policy if provided
  if (parsed.data.clientId !== undefined) {
    if (parsed.data.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: parsed.data.clientId, workspaceId: session.ws }
      })
      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 })
      }
    }
    updateData.clientId = parsed.data.clientId
  }

  if (parsed.data.policyId !== undefined) {
    if (parsed.data.policyId) {
      const policy = await prisma.policy.findFirst({
        where: { 
          id: parsed.data.policyId,
          client: { workspaceId: session.ws }
        }
      })
      if (!policy) {
        return NextResponse.json({ error: "Policy not found" }, { status: 404 })
      }
    }
    updateData.policyId = parsed.data.policyId
  }

  const updatedTask = await prisma.task.update({
    where: { id: id },
    data: updateData,
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
    action: "UPDATE",
    entity: "TASK",
    entityId: id,
    before: currentTask,
    after: updateData
  })

  // Additional audit log for assignment changes
  if (updateData.assignedToUserId !== undefined && 
      updateData.assignedToUserId !== currentTask.assignedToUserId) {
    await createAuditLog({
      workspaceId: session.ws,
      userId: session.sub,
      action: "ASSIGN_TASK",
      entity: "TASK",
      entityId: id,
      before: { assignedToUserId: currentTask.assignedToUserId },
      after: { assignedToUserId: updateData.assignedToUserId }
    })
  }

  return NextResponse.json({ item: updatedTask })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const {id} = await params
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 10, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const prisma = await getPrisma()

  // Get task to check permissions
  const task = await prisma.task.findFirst({
    where: { 
      id: id, 
      workspaceId: session.ws 
    }
  })

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  // Only task creator or workspace owner can delete
  const canDelete = task.createdByUserId === session.sub || session.role === "OWNER"
  if (!canDelete) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.task.delete({
    where: { id: id }
  })

  // Audit log
  await createAuditLog({
    workspaceId: session.ws,
    userId: session.sub,
    action: "DELETE",
    entity: "TASK",
    entityId: id,
    before: task
  })

  return NextResponse.json({ ok: true })
}