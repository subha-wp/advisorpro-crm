// @ts-nocheck
import { NextResponse } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { createAuditLog } from "@/lib/audit"
import { sanitizeString } from "@/lib/validation"

const UpdateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  headClientId: z.string().uuid().optional(),
})

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const prisma = await getPrisma()

  const item = await prisma.clientGroup.findFirst({
    where: { id: params.id, workspaceId: session.ws },
    include: {
      clients: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          policies: {
            select: { id: true, policyNumber: true, insurer: true, status: true },
          },
        },
      },
    },
  })
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ item })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const prisma = await getPrisma()
  const body = await req.json().catch(() => ({}))
  const parsed = UpdateGroupSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  const item = await prisma.clientGroup.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.name ? { name: sanitizeString(parsed.data.name) } : {}),
      ...(parsed.data.description !== undefined
        ? { description: parsed.data.description ? sanitizeString(parsed.data.description) : null }
        : {}),
      ...(parsed.data.headClientId ? { headClientId: parsed.data.headClientId } : {}),
    },
    include: {
      clients: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  await createAuditLog({
    workspaceId: session.ws,
    userId: session.sub,
    action: "UPDATE",
    entity: "CLIENT_GROUP",
    entityId: item.id,
    after: item,
  })

  return NextResponse.json({ item })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const prisma = await getPrisma()

  // Soft delete the group and remove group association from clients
  await prisma.$transaction([
    prisma.client.updateMany({
      where: { clientGroupId: params.id },
      data: { clientGroupId: null, relationshipToHead: null },
    }),
    prisma.clientGroup.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    }),
  ])

  await createAuditLog({
    workspaceId: session.ws,
    userId: session.sub,
    action: "DELETE",
    entity: "CLIENT_GROUP",
    entityId: params.id,
  })

  return NextResponse.json({ success: true })
}
