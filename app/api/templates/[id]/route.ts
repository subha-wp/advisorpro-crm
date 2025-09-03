import { NextResponse } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"

const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  variables: z.array(z.string()).optional(),
})

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const prisma = await getPrisma()
  const item = await prisma.reminderTemplate.findFirst({ where: { id: params.id, workspaceId: session.ws } })
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ item })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  const prisma = await getPrisma()
  const item = await prisma.reminderTemplate.update({
    where: { id: params.id },
    data: parsed.data,
  })
  return NextResponse.json({ item })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const prisma = await getPrisma()
  await prisma.reminderTemplate.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
