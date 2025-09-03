import { NextResponse } from "next/server"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const prisma = await getPrisma()
  const item = await prisma.client.update({
    where: { id: params.id },
    data: { deletedAt: null },
  })
  return NextResponse.json({ item })
}
