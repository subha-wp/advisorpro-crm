// @ts-nocheck
import { getPrisma } from "@/lib/db"

export type AuditAction = 
  | "CREATE" | "UPDATE" | "DELETE" | "RESTORE"
  | "LOGIN" | "LOGOUT" | "SIGNUP"
  | "INVITE_USER" | "REMOVE_USER" | "CHANGE_ROLE"
  | "UPGRADE_PLAN" | "DOWNGRADE_PLAN"
  | "SEND_REMINDER" | "BULK_SEND"
  | "ASSIGN_TASK" | "COMPLETE_TASK" | "CANCEL_TASK"

export type AuditEntity = 
  | "USER" | "CLIENT" | "POLICY" | "TEMPLATE" 
  | "WORKSPACE" | "MEMBERSHIP" | "REMINDER" | "TASK"

export async function createAuditLog({
  workspaceId,
  userId,
  action,
  entity,
  entityId,
  before,
  after,
  metadata,
}: {
  workspaceId: string
  userId?: string
  action: AuditAction
  entity: AuditEntity
  entityId?: string
  before?: any
  after?: any
  metadata?: Record<string, any>
}) {
  const prisma = await getPrisma()
  
  const diffJson = before || after ? {
    before: before || null,
    after: after || null,
    metadata: metadata || null,
  } : null

  await prisma.auditLog.create({
    data: {
      workspaceId,
      userId,
      action,
      entity,
      entityId,
      diffJson,
    }
  })
}

export async function getAuditLogs(workspaceId: string, options: {
  page?: number
  pageSize?: number
  entity?: AuditEntity
  action?: AuditAction
  userId?: string
  startDate?: Date
  endDate?: Date
} = {}) {
  const prisma = await getPrisma()
  const {
    page = 1,
    pageSize = 50,
    entity,
    action,
    userId,
    startDate,
    endDate
  } = options

  const where: any = { workspaceId }
  if (entity) where.entity = entity
  if (action) where.action = action
  if (userId) where.userId = userId
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.auditLog.count({ where })
  ])

  return { items, total, page, pageSize }
}