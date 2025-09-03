import { getPrisma } from "@/lib/db"
import * as XLSX from "xlsx"

export async function exportWorkspaceData(workspaceId: string) {
  const prisma = await getPrisma()

  // Fetch all workspace data
  const [workspace, clients, policies, templates, reminderLogs, auditLogs] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: { select: { name: true, email: true } },
        memberships: {
          include: {
            user: { select: { name: true, email: true, phone: true } }
          }
        }
      }
    }),
    prisma.client.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" }
    }),
    prisma.policy.findMany({
      where: { client: { workspaceId } },
      include: {
        client: { select: { name: true } }
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.reminderTemplate.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" }
    }),
    prisma.reminderLog.findMany({
      where: { workspaceId },
      orderBy: { sentAt: "desc" },
      take: 1000 // Limit to recent 1000 logs
    }),
    prisma.auditLog.findMany({
      where: { workspaceId },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 1000 // Limit to recent 1000 logs
    })
  ])

  // Create workbook
  const wb = XLSX.utils.book_new()

  // Workspace info sheet
  const wsData = [{
    name: workspace?.name,
    owner: workspace?.owner?.name,
    ownerEmail: workspace?.owner?.email,
    plan: workspace?.plan,
    createdAt: workspace?.createdAt,
    memberCount: workspace?.memberships?.length || 0,
    clientCount: clients.length,
    policyCount: policies.length,
  }]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wsData), "Workspace")

  // Team members sheet
  const membersData = workspace?.memberships?.map(m => ({
    name: m.user.name,
    email: m.user.email,
    phone: m.user.phone,
    role: m.role,
  })) || []
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(membersData), "Team")

  // Clients sheet
  const clientsData = clients.map(c => ({
    id: c.id,
    name: c.name,
    mobile: c.mobile,
    email: c.email,
    address: c.address,
    dob: c.dob,
    tags: c.tags.join(", "),
    createdAt: c.createdAt,
    deletedAt: c.deletedAt,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientsData), "Clients")

  // Policies sheet
  const policiesData = policies.map(p => ({
    id: p.id,
    clientName: p.client.name,
    insurer: p.insurer,
    planName: p.planName,
    policyNumber: p.policyNumber,
    sumAssured: p.sumAssured,
    premiumAmount: p.premiumAmount,
    premiumMode: p.premiumMode,
    nextDueDate: p.nextDueDate,
    lastPaidDate: p.lastPaidDate,
    maturityDate: p.maturityDate,
    status: p.status,
    createdAt: p.createdAt,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(policiesData), "Policies")

  // Templates sheet
  const templatesData = templates.map(t => ({
    id: t.id,
    name: t.name,
    channel: t.channel,
    subject: t.subject,
    body: t.body,
    variables: t.variables.join(", "),
    createdAt: t.createdAt,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(templatesData), "Templates")

  // Recent reminder logs
  const logsData = reminderLogs.map(l => ({
    channel: l.channel,
    to: l.to,
    status: l.status,
    error: l.error,
    sentAt: l.sentAt,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logsData), "Reminder Logs")

  // Recent audit logs
  const auditData = auditLogs.map(a => ({
    user: a.user?.name || "System",
    action: a.action,
    entity: a.entity,
    entityId: a.entityId,
    createdAt: a.createdAt,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(auditData), "Audit Logs")

  return wb
}

export async function getWorkspaceStats(workspaceId: string) {
  const prisma = await getPrisma()

  const [
    clientCount,
    activeClientCount,
    policyCount,
    activePolicyCount,
    templateCount,
    memberCount,
    reminderCount,
  ] = await Promise.all([
    prisma.client.count({ where: { workspaceId } }),
    prisma.client.count({ where: { workspaceId, deletedAt: null } }),
    prisma.policy.count({ where: { client: { workspaceId } } }),
    prisma.policy.count({ where: { client: { workspaceId }, status: "ACTIVE" } }),
    prisma.reminderTemplate.count({ where: { workspaceId } }),
    prisma.membership.count({ where: { workspaceId } }),
    prisma.reminderLog.count({ where: { workspaceId } }),
  ])

  return {
    clients: { total: clientCount, active: activeClientCount },
    policies: { total: policyCount, active: activePolicyCount },
    templates: templateCount,
    members: memberCount,
    reminders: reminderCount,
  }
}