import { NextResponse } from "next/server"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { clearAuthCookies } from "@/lib/auth/cookies"
import { createAuditLog } from "@/lib/audit"

export async function POST() {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const prisma = await getPrisma()

  // Revoke all refresh tokens for this user
  await prisma.refreshToken.updateMany({
    where: { userId: session.sub, revokedAt: null },
    data: { revokedAt: new Date() }
  })

  // Audit log
  await createAuditLog({
    workspaceId: session.ws,
    userId: session.sub,
    action: "LOGOUT",
    entity: "USER",
    entityId: session.sub,
    metadata: { allSessions: true }
  })

  // Clear cookies
  clearAuthCookies()

  return NextResponse.json({ ok: true })
}