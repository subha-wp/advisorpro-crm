import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { getWorkspaceStats } from "@/lib/backup"

export async function GET() {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const stats = await getWorkspaceStats(session.ws)
    return NextResponse.json({ stats })
  } catch (error) {
    console.error("[Stats Error]", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}