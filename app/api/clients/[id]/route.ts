import { NextResponse } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"

const UpdateClientSchema = z.object({
  name: z.string().min(1).optional(),
  mobile: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  dob: z.string().optional(), // ISO
  tags: z.array(z.string()).optional(),
  assignedToUserId: z.string().uuid().optional(),
})

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const prisma = await getPrisma()

  const item = await prisma.client.findFirst({
    where: { id: params.id, workspaceId: session.ws },
    include: { policies: true },
  })
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ item })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const prisma = await getPrisma()
  const body = await req.json().catch(() => ({}))
  const parsed = UpdateClientSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  const item = await prisma.client.update({
    where: { id: params.id },
    data: {
      ...("name" in parsed.data ? { name: parsed.data.name } : {}),
      mobile: parsed.data.mobile,
      email: parsed.data.email,
      address: parsed.data.address,
      dob: parsed.data.dob ? new Date(parsed.data.dob) : undefined,
      tags: parsed.data.tags,
      assignedToUserId: parsed.data.assignedToUserId,
    },
  })

  return NextResponse.json({ item })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const prisma = await getPrisma()
  const item = await prisma.client.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  })
  return NextResponse.json({ item })
}
