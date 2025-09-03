import { NextResponse } from "next/server"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"

export async function GET(req: Request) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const page = Number(url.searchParams.get("page") ?? "1")
  const pageSize = Math.min(100, Number(url.searchParams.get("pageSize") ?? "20"))
  const channel = url.searchParams.get("channel") ?? undefined
  const prisma = await getPrisma()

  const where: any = { workspaceId: session.ws, ...(channel ? { channel } : {}) }
  const [items, total] = await Promise.all([
    prisma.reminderLog.findMany({
      where,
      orderBy: { sentAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.reminderLog.count({ where }),
  ])

  return NextResponse.json({ items, total, page, pageSize })
}
