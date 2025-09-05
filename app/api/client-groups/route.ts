// @ts-nocheck
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { createAuditLog } from "@/lib/audit"
import { sanitizeString } from "@/lib/validation"
import { apiLimiter } from "@/lib/rate-limit"

const CreateGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rateLimitResult = apiLimiter.check(req, 100, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const url = new URL(req.url)
  const q = url.searchParams.get("q") ?? ""
  const page = Number(url.searchParams.get("page") ?? "1")
  const pageSize = Math.min(100, Number(url.searchParams.get("pageSize") ?? "20"))
  const includeDeleted = url.searchParams.get("deleted") === "true"

  const prisma = await getPrisma()
  const where: any = {
    workspaceId: session.ws,
    ...(includeDeleted ? {} : { deletedAt: null }),
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
  }

  const [items, total] = await Promise.all([
    prisma.clientGroup.findMany({
      where,
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
          orderBy: [
            { relationshipToHead: "asc" },
            { name: "asc" }
          ]
        },
        _count: {
          select: { clients: { where: { deletedAt: null } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.clientGroup.count({ where }),
  ])

  return NextResponse.json({ items, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rateLimitResult = apiLimiter.check(req, 20, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const prisma = await getPrisma()
  const body = await req.json().catch(() => ({}))
  const parsed = CreateGroupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid input",
        details: parsed.error.issues.map((i) => i.message),
      },
      { status: 400 },
    )
  }

  const group = await prisma.clientGroup.create({
    data: {
      workspaceId: session.ws,
      name: sanitizeString(parsed.data.name),
      description: parsed.data.description ? sanitizeString(parsed.data.description) : undefined,
    },
    include: {
      clients: true,
      _count: {
        select: { clients: true },
      },
    },
  })

  await createAuditLog({
    workspaceId: session.ws,
    userId: session.sub,
    action: "CREATE",
    entity: "CLIENT_GROUP",
    entityId: group.id,
    after: group,
  })

  return NextResponse.json({ item: group })
}
