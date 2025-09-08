import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { createAuditLog } from "@/lib/audit"
import { apiLimiter } from "@/lib/rate-limit"

const CompleteTaskSchema = z.object({
  completionRemarks: z.string().min(1).max(1000),
  completionData: z.object({
    activityOutcome: z.enum(["SUCCESSFUL", "PARTIALLY_SUCCESSFUL", "UNSUCCESSFUL", "RESCHEDULED", "CLIENT_UNAVAILABLE"]).optional(),
    clientSatisfaction: z.enum(["VERY_SATISFIED", "SATISFIED", "NEUTRAL", "DISSATISFIED", "VERY_DISSATISFIED"]).optional(),
    documentsCollected: z.array(z.string()).optional(),
    documentsRequired: z.array(z.string()).optional(),
    nextSteps: z.string().optional(),
    followUpRequired: z.boolean().optional(),
    followUpDate: z.string().optional(),
    followUpType: z.enum(["FOLLOW_UP", "POLICY_RENEWAL", "CLAIM_ASSISTANCE", "DOCUMENTATION", "MEETING"]).optional(),
    meetingDuration: z.string().optional(),
    callDuration: z.string().optional(),
    emailsSent: z.string().optional(),
    clientFeedback: z.string().optional(),
    issuesEncountered: z.string().optional(),
    resolutionProvided: z.string().optional(),
  }).optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const {id} = await params
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 20, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = CompleteTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ 
      error: "Invalid input", 
      details: parsed.error.issues.map(i => i.message)
    }, { status: 400 })
  }

  const prisma = await getPrisma()

  // Get current task to check permissions and status
  const currentTask = await prisma.task.findFirst({
    where: { 
      id: id, 
      workspaceId: session.ws 
    }
  })

  if (!currentTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  // Check if task is already completed
  if (currentTask.status === "COMPLETED") {
    return NextResponse.json({ error: "Task is already completed" }, { status: 400 })
  }

  // Check permissions: only assignee or task creator or owner can complete
  const canComplete = currentTask.assignedToUserId === session.sub ||
                     currentTask.createdByUserId === session.sub ||
                     session.role === "OWNER"

  if (!canComplete) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const completedTask = await prisma.task.update({
    where: { id: id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      completionRemarks: parsed.data.completionRemarks,
      completionData: parsed.data.completionData,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
      assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      client: { select: { id: true, name: true } },
      policy: { select: { id: true, policyNumber: true, insurer: true } },
    }
  })

  // Auto-create follow-up task if required
  if (parsed.data.completionData?.followUpRequired && parsed.data.completionData?.followUpDate) {
    const followUpTask = await prisma.task.create({
      data: {
        workspaceId: session.ws,
        title: `Follow-up: ${currentTask.title}`,
        description: `Follow-up activity for completed task. ${parsed.data.completionData.nextSteps || ""}`.trim(),
        priority: "MEDIUM",
        type: parsed.data.completionData.followUpType || "FOLLOW_UP",
        createdByUserId: session.sub,
        assignedToUserId: currentTask.assignedToUserId || session.sub,
        clientId: currentTask.clientId,
        policyId: currentTask.policyId,
        dueDate: new Date(parsed.data.completionData.followUpDate),
      }
    })
  // Audit log
  await createAuditLog({
    workspaceId: session.ws,
    userId: session.sub,
    action: "COMPLETE_TASK",
    entity: "TASK",
    entityId: id,
    before: { status: currentTask.status },
    after: { 
      status: "COMPLETED",
      completionRemarks: parsed.data.completionRemarks,
      completionData: parsed.data.completionData,
      completedBy: session.sub
    }
  })

    await createAuditLog({
      workspaceId: session.ws,
      userId: session.sub,
      action: "CREATE",
      entity: "TASK",
      entityId: followUpTask.id,
      after: {
        title: followUpTask.title,
        autoCreated: true,
        parentTaskId: id,
        followUpType: parsed.data.completionData.followUpType,
      activityOutcome: parsed.data.completionData?.activityOutcome,
      clientSatisfaction: parsed.data.completionData?.clientSatisfaction,
      followUpCreated: parsed.data.completionData?.followUpRequired,
      }
    })
  }
  return NextResponse.json({ item: completedTask })
}