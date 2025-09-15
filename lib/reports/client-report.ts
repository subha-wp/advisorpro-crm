// @ts-nocheck
import { getPrisma } from "@/lib/db"
import { format } from "date-fns"

export interface ClientReportData {
  workspace: {
    name: string
    logoUrl?: string
    officeEmail?: string
    officePhone?: string
    officeAddressFull?: string
    websiteUrl?: string
    businessRegistration?: string
    gstNumber?: string
    panNumber?: string
  }
  client: {
    id: string
    name: string
    dob?: Date
    mobile?: string
    email?: string
    address?: string
    panNo?: string
    aadhaarNo?: string
    tags: string[]
    relationshipToHead?: string
    createdAt: Date
  }
  clientGroup?: {
    id: string
    name: string
    members: Array<{
      id: string
      name: string
      relationshipToHead?: string
      dob?: Date
      mobile?: string
      email?: string
      panNo?: string
    }>
  }
  policies: Array<{
    id: string
    policyNumber: string
    insurer: string
    planName?: string
    policyType?: string
    sumAssured?: number
    premiumAmount?: number
    premiumMode?: string
    commencementDate?: Date
    maturityDate?: Date
    nextDueDate?: Date
    lastPaidDate?: Date
    status: string
    riders: Array<{
      name: string
      sumAssured?: number
      premium?: number
    }>
  }>
  premiumPayments: Array<{
    id: string
    policyId: string
    paymentDate: Date
    amountPaid: number
    paymentMode: string
    receiptNumber?: string
    chequeNumber?: string
    bankName?: string
    transactionId?: string
    lateFee?: number
    discount?: number
    remarks?: string
  }>
  tasks: Array<{
    id: string
    title: string
    type: string
    status: string
    priority: string
    createdAt: Date
    completedAt?: Date
    assignedTo?: {
      name: string
    }
  }>
  analytics: {
    totalPolicies: number
    activePolicies: number
    totalSumAssured: number
    totalAnnualPremium: number
    totalPremiumsPaid: number
    averagePolicyValue: number
    policyStatusBreakdown: Record<string, number>
    insurerBreakdown: Record<string, number>
    premiumModeBreakdown: Record<string, number>
    monthlyPremiumTrend: Array<{
      month: string
      amount: number
    }>
  }
}

export async function getClientReportData(workspaceId: string, clientId: string): Promise<ClientReportData> {
  const prisma = await getPrisma()

  // Fetch workspace details
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      name: true,
      logoUrl: true,
      officeEmail: true,
      officePhone: true,
      officeAddressFull: true,
      websiteUrl: true,
      businessRegistration: true,
      gstNumber: true,
      panNumber: true,
    }
  })

  // Fetch client with group details
  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId },
    include: {
      clientGroup: {
        include: {
          clients: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              relationshipToHead: true,
              dob: true,
              mobile: true,
              email: true,
              panNo: true,
            }
          }
        }
      },
      policies: {
        include: {
          policyRiders: true,
          premiumPayments: {
            orderBy: { paymentDate: "desc" }
          }
        }
      },
      tasks: {
        include: {
          assignedTo: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 20
      }
    }
  })

  if (!client || !workspace) {
    throw new Error("Client or workspace not found")
  }

  // Calculate analytics
  const policies = client.policies
  const allPayments = policies.flatMap(p => p.premiumPayments)

  const analytics = {
    totalPolicies: policies.length,
    activePolicies: policies.filter(p => p.status === "ACTIVE").length,
    totalSumAssured: policies.reduce((sum, p) => sum + Number(p.sumAssured || 0), 0),
    totalAnnualPremium: policies.reduce((sum, p) => {
      const annual = p.annualPremium ? Number(p.annualPremium) : 
                   p.premiumAmount ? Number(p.premiumAmount) * (p.premiumMode === "MONTHLY" ? 12 : 
                                                               p.premiumMode === "QUARTERLY" ? 4 :
                                                               p.premiumMode === "HALF_YEARLY" ? 2 : 1) : 0
      return sum + annual
    }, 0),
    totalPremiumsPaid: allPayments.reduce((sum, p) => sum + Number(p.amountPaid), 0),
    averagePolicyValue: policies.length > 0 ? 
      policies.reduce((sum, p) => sum + Number(p.sumAssured || 0), 0) / policies.length : 0,
    policyStatusBreakdown: policies.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    insurerBreakdown: policies.reduce((acc, p) => {
      acc[p.insurer] = (acc[p.insurer] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    premiumModeBreakdown: policies.reduce((acc, p) => {
      const mode = p.premiumMode || "YEARLY"
      acc[mode] = (acc[mode] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    monthlyPremiumTrend: generateMonthlyTrend(allPayments)
  }

  return {
    workspace: {
      name: workspace.name,
      logoUrl: workspace.logoUrl || undefined,
      officeEmail: workspace.officeEmail || undefined,
      officePhone: workspace.officePhone || undefined,
      officeAddressFull: workspace.officeAddressFull || undefined,
      websiteUrl: workspace.websiteUrl || undefined,
      businessRegistration: workspace.businessRegistration || undefined,
      gstNumber: workspace.gstNumber || undefined,
      panNumber: workspace.panNumber || undefined,
    },
    client: {
      id: client.id,
      name: client.name,
      dob: client.dob || undefined,
      mobile: client.mobile || undefined,
      email: client.email || undefined,
      address: client.address || undefined,
      panNo: client.panNo || undefined,
      aadhaarNo: client.aadhaarNo || undefined,
      tags: client.tags,
      relationshipToHead: client.relationshipToHead || undefined,
      createdAt: client.createdAt,
    },
    clientGroup: client.clientGroup ? {
      id: client.clientGroup.id,
      name: client.clientGroup.name,
      members: client.clientGroup.clients.map(c => ({
        id: c.id,
        name: c.name,
        relationshipToHead: c.relationshipToHead || undefined,
        dob: c.dob || undefined,
        mobile: c.mobile || undefined,
        email: c.email || undefined,
        panNo: c.panNo || undefined,
      }))
    } : undefined,
    policies: policies.map(p => ({
      id: p.id,
      policyNumber: p.policyNumber,
      insurer: p.insurer,
      planName: p.planName || undefined,
      policyType: (p.metadata as any)?.policyType || undefined,
      sumAssured: p.sumAssured ? Number(p.sumAssured) : undefined,
      premiumAmount: p.premiumAmount ? Number(p.premiumAmount) : undefined,
      premiumMode: p.premiumMode || undefined,
      commencementDate: p.commencementDate || undefined,
      maturityDate: p.maturityDate || undefined,
      nextDueDate: p.nextDueDate || undefined,
      lastPaidDate: p.lastPaidDate || undefined,
      status: p.status,
      riders: p.policyRiders.map(r => ({
        name: r.riderName,
        sumAssured: r.sumAssured ? Number(r.sumAssured) : undefined,
        premium: r.annualPremium ? Number(r.annualPremium) : undefined,
      }))
    })),
    premiumPayments: allPayments.map(p => ({
      id: p.id,
      policyId: p.policyId,
      paymentDate: p.paymentDate,
      amountPaid: Number(p.amountPaid),
      paymentMode: p.paymentMode,
      receiptNumber: p.receiptNumber || undefined,
      chequeNumber: (p as any).chequeNumber || undefined,
      bankName: (p as any).bankName || undefined,
      transactionId: (p as any).transactionId || undefined,
      lateFee: (p as any).lateFee ? Number((p as any).lateFee) : undefined,
      discount: (p as any).discount ? Number((p as any).discount) : undefined,
      remarks: (p as any).remarks || undefined,
    })),
    tasks: client.tasks.map(t => ({
      id: t.id,
      title: t.title,
      type: t.type,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt,
      completedAt: t.completedAt || undefined,
      assignedTo: t.assignedTo ? { name: t.assignedTo.name } : undefined,
    })),
    analytics
  }
}

function generateMonthlyTrend(payments: any[]): Array<{ month: string; amount: number }> {
  const last12Months = []
  const now = new Date()
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = format(date, "yyyy-MM")
    const monthLabel = format(date, "MMM yyyy")
    
    const monthPayments = payments.filter(p => 
      format(new Date(p.paymentDate), "yyyy-MM") === monthKey
    )
    
    const amount = monthPayments.reduce((sum, p) => sum + Number(p.amountPaid), 0)
    
    last12Months.push({
      month: monthLabel,
      amount
    })
  }
  
  return last12Months
}