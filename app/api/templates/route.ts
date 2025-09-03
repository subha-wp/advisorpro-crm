import { NextResponse } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"

const TemplateSchema = z.object({
  name: z.string().min(1),
  channel: z.enum(["email", "whatsapp"]),
  subject: z.string().optional(),
  body: z.string().min(1),
  variables: z.array(z.string()).default([]),
})

export async function GET() {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const prisma = await getPrisma()
  const items = await prisma.reminderTemplate.findMany({
    where: { workspaceId: session.ws },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const parsed = TemplateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  const prisma = await getPrisma()
  const item = await prisma.reminderTemplate.create({
    data: { workspaceId: session.ws, ...parsed.data },
  })
  return NextResponse.json({ item })
}
