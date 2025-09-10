import { NextResponse } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"

const CreatePolicySchema = z.object({
  clientId: z.string().uuid(),
  insurer: z.string().min(1),
  planName: z.string().optional(),
  policyNumber: z.string().min(1),
  sumAssured: z.number().optional(),
  premiumAmount: z.number().optional(),
  premiumMode: z.string().optional(),
  commencementDate: z.string().optional(),
  nextDueDate: z.string().optional(), // ISO date
  lastPaidDate: z.string().optional(),
  maturityDate: z.string().optional(),
  status: z.enum(["ACTIVE", "LAPSED", "MATURED", "SURRENDERED"]).optional(),
  metadata: z.record(z.any()).optional(),
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get("q") ?? ""
  const page = Number(url.searchParams.get("page") ?? "1")
  const pageSize = Math.min(100, Number(url.searchParams.get("pageSize") ?? "20"))
  const sortParam = url.searchParams.get("sort") ?? "createdAt"
  const dir = (url.searchParams.get("dir") ?? "desc") as "asc" | "desc"
  const clientId = url.searchParams.get("clientId") ?? undefined
  const status = url.searchParams.get("status") ?? undefined

  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const prisma = await getPrisma()
  const where: any = {
    client: { workspaceId: session.ws },
    ...(clientId ? { clientId } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { insurer: { contains: q, mode: "insensitive" } },
            { planName: { contains: q, mode: "insensitive" } },
            { policyNumber: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const allowedSorts = new Set([
    "createdAt",
    "insurer",
    "planName",
    "policyNumber",
    "premiumAmount",
    "nextDueDate",
    "status",
  ])
  const sort = allowedSorts.has(sortParam) ? sortParam : "createdAt"

  const [items, total] = await Promise.all([
    prisma.policy.findMany({
      where,
      include: {
        client: {
          select: { 
            id: true, 
            name: true, 
            mobile: true, 
            email: true,
            clientGroup: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { [sort]: dir },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.policy.count({ where }),
  ])

  return NextResponse.json({ items, total, page, pageSize })
}

export async function POST(req: Request) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const prisma = await getPrisma()
  const body = await req.json().catch(() => ({}))
  const parsed = CreatePolicySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  const d = parsed.data

  // Ensure client belongs to workspace
  const client = await prisma.client.findFirst({ where: { id: d.clientId, workspaceId: session.ws } })
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const item = await prisma.policy.create({
    data: {
      clientId: d.clientId,
      insurer: d.insurer,
      planName: d.planName,
      policyNumber: d.policyNumber,
      sumAssured: d.sumAssured ? d.sumAssured : undefined,
      premiumAmount: d.premiumAmount ? d.premiumAmount : undefined,
      premiumMode: d.premiumMode,
      commencementDate: d.commencementDate ? new Date(d.commencementDate) : undefined,
      nextDueDate: d.nextDueDate ? new Date(d.nextDueDate) : undefined,
      lastPaidDate: d.lastPaidDate ? new Date(d.lastPaidDate) : undefined,
      maturityDate: d.maturityDate ? new Date(d.maturityDate) : undefined,
      status: d.status,
      metadata: d.metadata,
    },
    include: {
      client: {
        select: { id: true, name: true, workspaceId: true }
      }
    }
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      workspaceId: session.ws,
      userId: session.sub,
      action: "CREATE",
      entity: "POLICY",
      entityId: item.id,
      diffJson: {
        after: {
          clientId: item.clientId,
          policyNumber: item.policyNumber,
          insurer: item.insurer,
          premiumAmount: item.premiumAmount,
          nextDueDate: item.nextDueDate?.toISOString(),
        }
      }
    }
  })

  return NextResponse.json({ item })
}
