import { NextResponse } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"

const UpdatePolicySchema = z.object({
  insurer: z.string().optional(),
  planName: z.string().optional(),
  policyNumber: z.string().optional(),
  sumAssured: z.number().nullable().optional(),
  premiumAmount: z.number().nullable().optional(),
  premiumMode: z.string().optional(),
  nextDueDate: z.string().nullable().optional(),
  lastPaidDate: z.string().nullable().optional(),
  maturityDate: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "LAPSED", "MATURED", "SURRENDERED"]).optional(),
})

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const prisma = await getPrisma()

  const item = await prisma.policy.findFirst({
    where: { id: params.id, client: { workspaceId: session.ws } },
  })
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ item })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const prisma = await getPrisma()
  const body = await req.json().catch(() => ({}))
  const parsed = UpdatePolicySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  const d = parsed.data

  const item = await prisma.policy.update({
    where: { id: params.id },
    data: {
      insurer: d.insurer ?? undefined,
      planName: d.planName ?? undefined,
      policyNumber: d.policyNumber ?? undefined,
      sumAssured: d.sumAssured === null ? undefined : d.sumAssured,
      premiumAmount: d.premiumAmount === null ? undefined : d.premiumAmount,
      premiumMode: d.premiumMode ?? undefined,
      nextDueDate: d.nextDueDate ? (d.nextDueDate === null ? null : new Date(d.nextDueDate)) : undefined,
      lastPaidDate: d.lastPaidDate ? (d.lastPaidDate === null ? null : new Date(d.lastPaidDate)) : undefined,
      maturityDate: d.maturityDate ? (d.maturityDate === null ? null : new Date(d.maturityDate)) : undefined,
      status: d.status ?? undefined,
    },
  })

  return NextResponse.json({ item })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const prisma = await getPrisma()
  await prisma.policy.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
