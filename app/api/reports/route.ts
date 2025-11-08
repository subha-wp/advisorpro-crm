import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { getPrisma } from "@/lib/db"

type ReportsResponse = {
  range: { from?: string; to?: string }
  kpis: {
    totalPolicies: number
    activePolicies: number
    totalPremiumsPaid: number
  }
  breakdowns: {
    byInsurer: { name: string; value: number }[]
    byStatus: { name: string; value: number }[]
  }
  trends: {
    monthlyPremiums: { month: string; value: number }[]
  }
}

export async function GET(req: NextRequest) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  const toDate = toParam ? new Date(toParam) : new Date()
  const fromDate = fromParam
    ? new Date(fromParam)
    : new Date(new Date(toDate).setMonth(toDate.getMonth() - 11))

  // Normalize to start/end of day
  const from = new Date(fromDate)
  from.setHours(0, 0, 0, 0)
  const to = new Date(toDate)
  to.setHours(23, 59, 59, 999)

  const prisma = await getPrisma()

  // Compute stats in parallel
  const [policies, payments] = await Promise.all([
    prisma.policy.findMany({
      where: { client: { workspaceId: session.ws } },
      select: { insurer: true, status: true },
    }),
    prisma.premiumPayment.findMany({
      where: {
        workspaceId: session.ws,
        paymentDate: { gte: from, lte: to },
      },
      select: { paymentDate: true, amountPaid: true },
      orderBy: { paymentDate: "asc" },
    }),
  ])

  // KPIs
  const totalPolicies = policies.length
  const activePolicies = policies.filter((p) => p.status === "ACTIVE").length
  const totalPremiumsPaid = payments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0)

  // Breakdown helpers
  const toEntries = (record: Record<string, number>) =>
    Object.entries(record)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))

  const byInsurer: Record<string, number> = {}
  const byStatus: Record<string, number> = {}
  for (const p of policies) {
    const insurer = p.insurer || "Unknown"
    byInsurer[insurer] = (byInsurer[insurer] || 0) + 1
    const status = p.status || "UNKNOWN"
    byStatus[status] = (byStatus[status] || 0) + 1
  }

  // Monthly trend across the selected range (ensure all months present)
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  const monthLabel = (d: Date) => d.toLocaleString("default", { month: "short" }) + " " + d.getFullYear()
  const monthBuckets = new Map<string, { month: string; value: number }>()
  // Seed 12 months or the full span between from..to
  const seed = new Date(from)
  seed.setDate(1)
  const cursor = new Date(seed)
  const end = new Date(to.getFullYear(), to.getMonth(), 1)
  while (cursor <= end) {
    monthBuckets.set(monthKey(cursor), { month: monthLabel(cursor), value: 0 })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  for (const pay of payments) {
    const d = new Date(pay.paymentDate)
    const key = monthKey(d)
    const entry = monthBuckets.get(key)
    const amount = Number(pay.amountPaid || 0)
    if (entry) entry.value += amount
    else monthBuckets.set(key, { month: monthLabel(d), value: amount })
  }

  const response: ReportsResponse = {
    range: { from: from.toISOString(), to: to.toISOString() },
    kpis: {
      totalPolicies,
      activePolicies,
      totalPremiumsPaid,
    },
    breakdowns: {
      byInsurer: toEntries(byInsurer),
      byStatus: toEntries(byStatus),
    },
    trends: {
      monthlyPremiums: Array.from(monthBuckets.values()),
    },
  }

  return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } })
}


