// app\api\clients\route.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { checkClientLimit } from "@/lib/workspace-limits"
import { createAuditLog } from "@/lib/audit"
import { nameSchema, emailSchema, phoneSchema, sanitizeString, sanitizeEmail, sanitizePhone } from "@/lib/validation"
import { apiLimiter } from "@/lib/rate-limit"

const CreateClientSchema = z.object({
  name: nameSchema,
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
  createNewGroup: z.boolean().optional(),
  groupName: z.string().optional(),
})

export async function GET(req: NextRequest) {
  // Rate limiting
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rateLimitResult = apiLimiter.check(req, 100, session.sub) // 100 requests per minute
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const url = new URL(req.url)
  const q = url.searchParams.get("q") ?? ""
  const page = Number(url.searchParams.get("page") ?? "1")
  const pageSize = Math.min(100, Number(url.searchParams.get("pageSize") ?? "20"))
  const includeDeleted = url.searchParams.get("deleted") === "true"
  const sortParam = (url.searchParams.get("sort") ?? "createdAt") as string
  const dir = (url.searchParams.get("dir") ?? "desc") as "asc" | "desc"
  const groupId = url.searchParams.get("groupId")

  const prisma = await getPrisma()
  const where: any = {
    workspaceId: session.ws,
    ...(includeDeleted ? {} : { deletedAt: null }),
    ...(groupId ? { clientGroupId: groupId } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { mobile: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
            { panNo: { contains: q, mode: "insensitive" } },
            { aadhaarNo: { contains: q } },
            { tags: { has: q } },
            { clientGroup: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  }

  const allowedSorts = new Set(["createdAt", "updatedAt", "name", "email", "mobile"])
  const sort = allowedSorts.has(sortParam) ? sortParam : "createdAt"

  const [items, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        clientGroup: {
          include: {
            clients: {
              where: { deletedAt: null },
              select: { 
                id: true, 
                name: true, 
                relationshipToHead: true,
                panNo: true,
                mobile: true,
                email: true
              },
              orderBy: { relationshipToHead: "asc" }
            }
          }
        },
      },
      orderBy: { [sort]: dir },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.client.count({ where }),
  ])

  return NextResponse.json({ items, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Check workspace limits
  const limitCheck = await checkClientLimit(session.ws)
  if (!limitCheck.canAdd) {
    return NextResponse.json(
      {
        error: "Client limit reached",
        details: `Maximum ${limitCheck.max} clients allowed on your plan`,
      },
      { status: 402 },
    )
  }

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 20, session.sub) // 20 creates per minute
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const prisma = await getPrisma()
  const body = await req.json().catch(() => ({}))
  const parsed = CreateClientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid input",
        details: parsed.error.issues.map((i) => i.message),
      },
      { status: 400 },
    )
  }

  const rawData = parsed.data
  const data = {
    name: sanitizeString(rawData.name),
    mobile: rawData.mobile ? sanitizePhone(rawData.mobile) : undefined,
    email: rawData.email ? sanitizeEmail(rawData.email) : undefined,
    address: rawData.address ? sanitizeString(rawData.address) : undefined,
    dob: rawData.dob,
    panNo: rawData.panNo,
    aadhaarNo: rawData.aadhaarNo,
    tags: rawData.tags || [],
    assignedToUserId: rawData.assignedToUserId,
    clientGroupId: rawData.clientGroupId,
    relationshipToHead: rawData.relationshipToHead,
    createNewGroup: rawData.createNewGroup,
    groupName: rawData.groupName,
  }

  // Check for duplicates
  if (data.email || data.mobile || data.panNo || data.aadhaarNo) {
    const existing = await prisma.client.findFirst({
      where: {
        workspaceId: session.ws,
        deletedAt: null,
        OR: [
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.mobile ? [{ mobile: data.mobile }] : []),
          ...(data.panNo ? [{ panNo: data.panNo }] : []),
          ...(data.aadhaarNo ? [{ aadhaarNo: data.aadhaarNo }] : []),
        ],
      },
    })
    if (existing) {
      return NextResponse.json(
        {
          error: "A client with this email, phone, PAN, or Aadhaar already exists",
        },
        { status: 409 },
      )
    }
  }

  let finalGroupId = data.clientGroupId

  if (data.createNewGroup && data.groupName) {
    // Create new group
    const newGroup = await prisma.clientGroup.create({
      data: {
        workspaceId: session.ws,
        name: sanitizeString(data.groupName),
      },
    })
    finalGroupId = newGroup.id
  }

  const client = await prisma.client.create({
    data: {
      workspaceId: session.ws,
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      address: data.address,
      dob: data.dob ? new Date(data.dob) : undefined,
      panNo: data.panNo,
      aadhaarNo: data.aadhaarNo,
      tags: data.tags ?? [],
      assignedToUserId: data.assignedToUserId,
      clientGroupId: finalGroupId,
      relationshipToHead: data.relationshipToHead,
    },
    include: {
      clientGroup: true,
    },
  })

  if (finalGroupId && (!data.relationshipToHead || data.relationshipToHead === "Head")) {
    await prisma.clientGroup.update({
      where: { id: finalGroupId },
      data: { headClientId: client.id },
    })
  }

  // Audit log
  await createAuditLog({
    workspaceId: session.ws,
    userId: session.sub,
    action: "CREATE",
    entity: "CLIENT",
    entityId: client.id,
    after: client,
  })

  return NextResponse.json({ item: client })
}
