import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { createAuditLog } from "@/lib/audit"
import { apiLimiter } from "@/lib/rate-limit"

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  type: z.enum(["FOLLOW_UP", "POLICY_RENEWAL", "CLAIM_ASSISTANCE", "DOCUMENTATION", "MEETING", "OTHER"]).default("OTHER"),
  assignedToUserId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  policyId: z.string().uuid().optional(),
  dueDate: z.string().optional(), // ISO date
})

export async function GET(req: NextRequest) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 100, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const url = new URL(req.url)
  const q = url.searchParams.get("q") ?? ""
  const page = Number(url.searchParams.get("page") ?? "1")
  const pageSize = Math.min(100, Number(url.searchParams.get("pageSize") ?? "20"))
  const status = url.searchParams.get("status") ?? ""
  const priority = url.searchParams.get("priority") ?? ""
  const assignedTo = url.searchParams.get("assignedTo") ?? ""
  const myTasks = url.searchParams.get("myTasks") === "true"
  const sortParam = url.searchParams.get("sort") ?? "createdAt"
  const dir = (url.searchParams.get("dir") ?? "desc") as "asc" | "desc"

  const prisma = await getPrisma()
  const where: any = {
    workspaceId: session.ws,
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(assignedTo ? { assignedToUserId: assignedTo } : {}),
    ...(myTasks ? { assignedToUserId: session.sub } : {}),
    ...(q ? {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ]
    } : {}),
  }

  const allowedSorts = new Set([
    "createdAt", "updatedAt", "title", "priority", "status", "dueDate", "type"
  ])
  const sort = allowedSorts.has(sortParam) ? sortParam : "createdAt"

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
        client: { select: { id: true, name: true } },
        policy: { select: { id: true, policyNumber: true, insurer: true } },
      },
      orderBy: { [sort]: dir },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.task.count({ where }),
  ])

  return NextResponse.json({ items, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 20, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = CreateTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ 
      error: "Invalid input", 
      details: parsed.error.issues.map(i => i.message)
    }, { status: 400 })
  }

  const prisma = await getPrisma()
  const data = parsed.data

  // Auto-assignment logic for staff vs owner
  let finalAssignedToUserId = data.assignedToUserId
  
  // Handle "unassigned" placeholder value
  if (finalAssignedToUserId === "unassigned") {
    finalAssignedToUserId = undefined
  }
  
  // If no assignment specified and user is staff, auto-assign to self
  if (!finalAssignedToUserId && session.role !== "OWNER") {
    finalAssignedToUserId = session.sub
  }
  // Validate client and policy belong to workspace if provided
  if (data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, workspaceId: session.ws }
    })
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
  }

  if (data.policyId) {
    const policy = await prisma.policy.findFirst({
      where: { 
        id: data.policyId,
        client: { workspaceId: session.ws }
      }
    })
    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }
  }

  // Validate assigned user is a member of the workspace
  if (finalAssignedToUserId) {
    const membership = await prisma.membership.findFirst({
      where: { 
        userId: finalAssignedToUserId, 
        workspaceId: session.ws 
      }
    })
    if (!membership) {
      return NextResponse.json({ error: "Assigned user not found in workspace" }, { status: 404 })
    }
  }

  const task = await prisma.task.create({
    data: {
      workspaceId: session.ws,
      title: data.title,
      description: data.description,
      priority: data.priority,
      type: data.type,
      createdByUserId: session.sub,
      assignedToUserId: finalAssignedToUserId,
      clientId: data.clientId,
      policyId: data.policyId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
      assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      client: { select: { id: true, name: true } },
      policy: { select: { id: true, policyNumber: true, insurer: true } },
    }
  })

  // Audit log
  await createAuditLog({
    workspaceId: session.ws,
    userId: session.sub,
    action: "CREATE",
    entity: "TASK",
    entityId: task.id,
    after: {
      title: task.title,
      priority: task.priority,
      type: task.type,
      assignedToUserId: finalAssignedToUserId,
      clientId: task.clientId,
      policyId: task.policyId,
      autoAssigned: !data.assignedToUserId && finalAssignedToUserId === session.sub,
      createdByRole: session.role,
    }
  })

  // Additional audit log for assignment if task is assigned
  if (finalAssignedToUserId && finalAssignedToUserId !== session.sub) {
    await createAuditLog({
      workspaceId: session.ws,
      userId: session.sub,
      action: "ASSIGN_TASK",
      entity: "TASK",
      entityId: task.id,
      after: { assignedToUserId: finalAssignedToUserId }
    })
  }

  return NextResponse.json({ item: task })
}