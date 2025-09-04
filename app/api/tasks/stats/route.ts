import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { getPrisma } from "@/lib/db"

export async function GET() {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const prisma = await getPrisma()

  const [
    totalTasks,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    myTasks,
    overdueTasks,
    urgentTasks,
  ] = await Promise.all([
    prisma.task.count({ 
      where: { workspaceId: session.ws } 
    }),
    prisma.task.count({ 
      where: { workspaceId: session.ws, status: "PENDING" } 
    }),
    prisma.task.count({ 
      where: { workspaceId: session.ws, status: "IN_PROGRESS" } 
    }),
    prisma.task.count({ 
      where: { workspaceId: session.ws, status: "COMPLETED" } 
    }),
    prisma.task.count({ 
      where: { workspaceId: session.ws, assignedToUserId: session.sub } 
    }),
    prisma.task.count({ 
      where: { 
        workspaceId: session.ws, 
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueDate: { lt: new Date() }
      } 
    }),
    prisma.task.count({ 
      where: { 
        workspaceId: session.ws, 
        priority: "URGENT",
        status: { in: ["PENDING", "IN_PROGRESS"] }
      } 
    }),
  ])

  return NextResponse.json({
    stats: {
      total: totalTasks,
      pending: pendingTasks,
      inProgress: inProgressTasks,
      completed: completedTasks,
      myTasks,
      overdue: overdueTasks,
      urgent: urgentTasks,
    }
  })
}