import { NextResponse } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { createAuditLog } from "@/lib/audit"
import { nameSchema, emailSchema, phoneSchema, sanitizeString, sanitizeEmail, sanitizePhone } from "@/lib/validation"

const UpdateClientSchema = z.object({
  name: nameSchema.optional(),
  mobile: phoneSchema.optional(),
  email: emailSchema.optional(),
  address: z.string().optional(),
  dob: z.string().optional(), // ISO
  panNo: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format")
    .optional(),
  aadhaarNo: z
    .string()
    .regex(/^[0-9]{12}$/, "Invalid Aadhaar format")
    .optional(),
  tags: z.array(z.string()).optional(),
  assignedToUserId: z.string().uuid().optional(),
  clientGroupId: z.string().uuid().optional(),
  relationshipToHead: z.string().optional(),
})

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const {id} = await params
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const prisma = await getPrisma()

  const item = await prisma.client.findFirst({
    where: { id: id, workspaceId: session.ws },
    include: {
      policies: true,
      clientGroup: {
        include: {
          clients: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  })
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ item })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const {id} = await params
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const prisma = await getPrisma()
  const body = await req.json().catch(() => ({}))
  const parsed = UpdateClientSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  // Get current client for audit log
  const currentClient = await prisma.client.findFirst({
    where: { id: id, workspaceId: session.ws },
    include: { clientGroup: true }
  })
  
  if (!currentClient) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 })
  }

  // Prepare update data
  const updateData: any = {}
  if (parsed.data.name) updateData.name = sanitizeString(parsed.data.name)
  if (parsed.data.mobile !== undefined) updateData.mobile = parsed.data.mobile ? sanitizePhone(parsed.data.mobile) : null
  if (parsed.data.email !== undefined) updateData.email = parsed.data.email ? sanitizeEmail(parsed.data.email) : null
  if (parsed.data.address !== undefined) updateData.address = parsed.data.address ? sanitizeString(parsed.data.address) : null
  if (parsed.data.dob !== undefined) updateData.dob = parsed.data.dob ? new Date(parsed.data.dob) : null
  if (parsed.data.panNo !== undefined) updateData.panNo = parsed.data.panNo || null
  if (parsed.data.aadhaarNo !== undefined) updateData.aadhaarNo = parsed.data.aadhaarNo || null
  if (parsed.data.tags !== undefined) updateData.tags = parsed.data.tags
  if (parsed.data.assignedToUserId !== undefined) updateData.assignedToUserId = parsed.data.assignedToUserId
  if (parsed.data.clientGroupId !== undefined) updateData.clientGroupId = parsed.data.clientGroupId
  if (parsed.data.relationshipToHead !== undefined) updateData.relationshipToHead = parsed.data.relationshipToHead

  const item = await prisma.client.update({
    where: { id: id },
    data: updateData,
    include: {
      clientGroup: true,
      assignedToUser: {
        select: { id: true, name: true, email: true }
      },
      policies: {
        select: { id: true, policyNumber: true, insurer: true, status: true }
      }
    },
  })

  // Create audit log
  await createAuditLog({
    workspaceId: session.ws,
    userId: session.sub,
    action: "UPDATE",
    entity: "CLIENT",
    entityId: id,
    before: {
      name: currentClient.name,
      mobile: currentClient.mobile,
      email: currentClient.email,
      address: currentClient.address,
      dob: currentClient.dob,
      panNo: currentClient.panNo,
      aadhaarNo: currentClient.aadhaarNo,
      tags: currentClient.tags,
      clientGroupId: currentClient.clientGroupId,
      relationshipToHead: currentClient.relationshipToHead
    },
    after: updateData
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
