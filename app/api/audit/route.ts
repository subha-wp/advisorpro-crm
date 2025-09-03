import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { getAuditLogs } from "@/lib/audit"
import { apiLimiter } from "@/lib/rate-limit"

export async function GET(req: NextRequest) {
  const session = await requireRole(ROLES.OWNER) // Only owners can view audit logs
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 50, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const url = new URL(req.url)
  const page = Number(url.searchParams.get("page") ?? "1")
  const pageSize = Math.min(100, Number(url.searchParams.get("pageSize") ?? "50"))
  const entity = url.searchParams.get("entity") as any
  const action = url.searchParams.get("action") as any
  const userId = url.searchParams.get("userId") || undefined
  const startDate = url.searchParams.get("startDate") ? new Date(url.searchParams.get("startDate")!) : undefined
  const endDate = url.searchParams.get("endDate") ? new Date(url.searchParams.get("endDate")!) : undefined

  const result = await getAuditLogs(session.ws, {
    page,
    pageSize,
    entity,
    action,
    userId,
    startDate,
    endDate,
  })

  return NextResponse.json(result)
}