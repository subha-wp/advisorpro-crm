import { NextResponse } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"

const CreateClientSchema = z.object({
  name: z.string().min(1),
  mobile: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  dob: z.string().optional(), // ISO
  tags: z.array(z.string()).optional(),
  assignedToUserId: z.string().uuid().optional(),
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get("q") ?? ""
  const page = Number(url.searchParams.get("page") ?? "1")
  const pageSize = Math.min(100, Number(url.searchParams.get("pageSize") ?? "20"))
  const includeDeleted = url.searchParams.get("deleted") === "true"
  const sortParam = (url.searchParams.get("sort") ?? "createdAt") as string
  const dir = (url.searchParams.get("dir") ?? "desc") as "asc" | "desc"

  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const prisma = await getPrisma()
  const where: any = {
    workspaceId: session.ws,
    ...(includeDeleted ? {} : { deletedAt: null }),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { mobile: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
            { tags: { has: q } },
          ],
        }
      : {}),
  }

  const allowedSorts = new Set(["createdAt", "updatedAt", "name", "email", "mobile"])
  const sort = allowedSorts.has(sortParam) ? sortParam : "createdAt"

  const [items, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { [sort]: dir },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.client.count({ where }),
  ])

  return NextResponse.json({ items, total, page, pageSize })
}

export async function POST(req: Request) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const prisma = await getPrisma()
  const body = await req.json().catch(() => ({}))
  const parsed = CreateClientSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  const data = parsed.data

  const client = await prisma.client.create({
    data: {
      workspaceId: session.ws,
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      address: data.address,
      dob: data.dob ? new Date(data.dob) : undefined,
      tags: data.tags ?? [],
      assignedToUserId: data.assignedToUserId,
    },
  })

  return NextResponse.json({ item: client })
}
