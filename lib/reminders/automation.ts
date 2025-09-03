import { getPrisma } from "@/lib/db"

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}
function addDays(d: Date, days: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}
function sameMonthDay(a: Date, b: Date) {
  return a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// Birthdays preview set: clients whose DOB month/day falls within [today, today+withinDays]
export async function findUpcomingBirthdays(workspaceId: string, withinDays = 7) {
  const prisma = await getPrisma()
  const clients = await prisma.client.findMany({
    where: { workspaceId, dob: { not: null } },
    select: { id: true, name: true, email: true, mobile: true, dob: true },
  })
  const today = startOfDay(new Date())
  const end = endOfDay(addDays(today, withinDays))
  const days: Date[] = []
  for (let d = new Date(today); d <= end; d = addDays(d, 1)) days.push(new Date(d))

  const hits = clients.filter((c) => {
    if (!c.dob) return false
    return days.some((d) => sameMonthDay(d, c.dob as unknown as Date))
  })
  return hits
}

// Due premiums: policies with nextDueDate in [today, today+withinDays]
export async function findUpcomingDuePremiums(workspaceId: string, withinDays = 15) {
  const prisma = await getPrisma()
  const now = startOfDay(new Date())
  const to = endOfDay(addDays(now, withinDays))
  const policies = await prisma.policy.findMany({
    where: {
      nextDueDate: { gte: now, lte: to },
      client: { workspaceId },
    },
    select: {
      id: true,
      policyNumber: true,
      premiumAmount: true,
      insurer: true,
      planName: true,
      nextDueDate: true,
      client: { select: { id: true, name: true, email: true, mobile: true } },
    },
    orderBy: { nextDueDate: "asc" },
  })
  return policies
}

export type TemplateVars = {
  client_name?: string
  client_mobile?: string
  client_email?: string
  policy_no?: string
  premium_amount?: string | number
  due_date?: string
  insurer?: string
  plan_name?: string
}

export function varsFromClientPolicy(
  client?: { name?: string | null; email?: string | null; mobile?: string | null },
  policy?: {
    policyNumber?: string | null
    premiumAmount?: any
    nextDueDate?: Date | null
    insurer?: string | null
    planName?: string | null
  },
): TemplateVars {
  return {
    client_name: client?.name ?? "",
    client_mobile: client?.mobile ?? "",
    client_email: client?.email ?? "",
    policy_no: policy?.policyNumber ?? "",
    premium_amount: policy?.premiumAmount ?? "",
    due_date: policy?.nextDueDate ? new Date(policy.nextDueDate).toLocaleDateString() : "",
    insurer: policy?.insurer ?? "",
    plan_name: policy?.planName ?? "",
  }
}
