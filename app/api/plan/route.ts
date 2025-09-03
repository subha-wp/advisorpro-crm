import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { getWorkspacePlan } from "@/lib/plan"

export async function GET() {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const plan = await getWorkspacePlan(session.ws)
  return NextResponse.json({ plan })
}
