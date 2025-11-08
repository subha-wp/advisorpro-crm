// @ts-nocheck
import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { createAuditLog } from "@/lib/audit"
import { apiLimiter } from "@/lib/rate-limit"
import { Decimal } from "@prisma/client/runtime/library"

const CreateLedgerEntrySchema = z.object({
  entryType: z.enum(["CASH_INFLOW", "CASH_OUTFLOW"]),
  category: z.enum([
    "PREMIUM_COLLECTION",
    "COMMISSION_RECEIVED",
    "OFFICE_EXPENSES",
    "SALARY_PAYMENT",
    "UTILITY_BILLS",
    "OFFICE_RENT",
    "TRAVEL_EXPENSES",
    "MARKETING_EXPENSES",
    "OFFICE_SUPPLIES",
    "BANK_CHARGES",
    "TAX_PAYMENT",
    "OTHER_INCOME",
    "OTHER_EXPENSE"
  ]),
  amount: z.number().positive(),
  description: z.string().min(1).max(500),
  transactionDate: z.string().datetime(),
  referenceNumber: z.string().optional(),
  paymentMode: z.enum(["CASH", "CHEQUE", "ONLINE_TRANSFER", "UPI", "DEBIT_CARD", "CREDIT_CARD", "NET_BANKING", "OTHER"]),
  bankName: z.string().optional(),
  chequeNumber: z.string().optional(),
  transactionId: z.string().optional(),
  clientId: z.string().uuid().optional(),
  policyId: z.string().uuid().optional(),
  remarks: z.string().optional(),
  attachments: z.array(z.string().url()).optional(),
})

const UpdateLedgerEntrySchema = CreateLedgerEntrySchema.partial()

// GET /api/ledger - Get ledger entries with filtering and pagination
export async function GET(req: NextRequest) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 100, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  try {
    const url = new URL(req.url)
    const page = Number(url.searchParams.get("page") ?? "1")
    const pageSize = Math.min(100, Number(url.searchParams.get("pageSize") ?? "20"))
    const entryType = url.searchParams.get("entryType") as "CASH_INFLOW" | "CASH_OUTFLOW" | null
    const category = url.searchParams.get("category")
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")
    const clientId = url.searchParams.get("clientId")

    const prisma = await getPrisma()

    const where: any = { workspaceId: session.ws }
    
    if (entryType) where.entryType = entryType
    if (category) where.category = category
    if (clientId) where.clientId = clientId
    
    if (startDate || endDate) {
      where.transactionDate = {}
      if (startDate) where.transactionDate.gte = new Date(startDate)
      if (endDate) where.transactionDate.lte = new Date(endDate)
    }

    const [items, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, email: true, mobile: true }
          },
          policy: {
            select: { id: true, policyNumber: true, planName: true }
          },
          processedBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { transactionDate: "desc" },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.ledgerEntry.count({ where })
    ])

    // Get current balance
    const balance = await prisma.ledgerBalance.findUnique({
      where: { workspaceId: session.ws }
    })

    return NextResponse.json({ 
      items, 
      total, 
      page, 
      pageSize,
      currentBalance: balance?.currentBalance || 0
    })
  } catch (error) {
    console.error("[Ledger GET Error]", error)
    return NextResponse.json({ 
      error: "Failed to fetch ledger entries",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    }, { status: 500 })
  }
}

// POST /api/ledger - Create new ledger entry
export async function POST(req: NextRequest) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 50, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const parsed = CreateLedgerEntrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: parsed.error.issues.map(i => i.message)
      }, { status: 400 })
    }

    const prisma = await getPrisma()

    // Validate client and policy if provided
    if (parsed.data.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: parsed.data.clientId, workspaceId: session.ws }
      })
      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 })
      }
    }

    if (parsed.data.policyId) {
      const policy = await prisma.policy.findFirst({
        where: { id: parsed.data.policyId }
      })
      if (!policy) {
        return NextResponse.json({ error: "Policy not found" }, { status: 404 })
      }
    }

    // Create ledger entry
    const entry = await prisma.ledgerEntry.create({
      data: {
        workspaceId: session.ws,
        entryType: parsed.data.entryType,
        category: parsed.data.category,
        amount: new Decimal(parsed.data.amount),
        description: parsed.data.description,
        transactionDate: new Date(parsed.data.transactionDate),
        referenceNumber: parsed.data.referenceNumber,
        paymentMode: parsed.data.paymentMode,
        bankName: parsed.data.bankName,
        chequeNumber: parsed.data.chequeNumber,
        transactionId: parsed.data.transactionId,
        clientId: parsed.data.clientId,
        policyId: parsed.data.policyId,
        remarks: parsed.data.remarks,
        attachments: parsed.data.attachments || [],
        processedByUserId: session.sub,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, mobile: true }
        },
        policy: {
          select: { id: true, policyNumber: true, planName: true }
        },
        processedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Update workspace balance
    const amountChange = parsed.data.entryType === "CASH_INFLOW" 
      ? new Decimal(parsed.data.amount) 
      : new Decimal(-parsed.data.amount)

    await prisma.ledgerBalance.upsert({
      where: { workspaceId: session.ws },
      update: { 
        currentBalance: {
          increment: amountChange
        }
      },
      create: {
        workspaceId: session.ws,
        currentBalance: amountChange
      }
    })

    // Audit log
    await createAuditLog({
      workspaceId: session.ws,
      userId: session.sub,
      action: "CREATE",
      entity: "LEDGER_ENTRY",
      entityId: entry.id,
      after: entry
    })

    return NextResponse.json({ 
      item: entry,
      message: "Ledger entry created successfully"
    })
  } catch (error) {
    console.error("[Ledger POST Error]", error)
    return NextResponse.json({ 
      error: "Failed to create ledger entry",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    }, { status: 500 })
  }
}