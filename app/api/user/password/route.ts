import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { verifyPassword, hashPassword } from "@/lib/auth/password"
import { createAuditLog } from "@/lib/audit"
import { passwordSchema } from "@/lib/validation"
import { authLimiter } from "@/lib/rate-limit"

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
})

export async function PATCH(req: NextRequest) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = authLimiter.check(req, 3, session.sub) // 3 password changes per 15 minutes
  if (!rateLimitResult.success) {
    return NextResponse.json({ 
      error: "Too many password change attempts. Please try again later." 
    }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = ChangePasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ 
      error: "Invalid input", 
      details: parsed.error.issues.map(i => i.message)
    }, { status: 400 })
  }

  const prisma = await getPrisma()

  // Get current user
  const user = await prisma.user.findUnique({
    where: { id: session.sub }
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Verify current password
  const isCurrentPasswordValid = await verifyPassword(parsed.data.currentPassword, user.passwordHash)
  if (!isCurrentPasswordValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
  }

  // Hash new password
  const newPasswordHash = await hashPassword(parsed.data.newPassword)

  // Update password
  await prisma.user.update({
    where: { id: session.sub },
    data: { passwordHash: newPasswordHash }
  })

  // Revoke all refresh tokens to force re-login on other devices
  await prisma.refreshToken.updateMany({
    where: { userId: session.sub, revokedAt: null },
    data: { revokedAt: new Date() }
  })

  // Audit log
  await createAuditLog({
    workspaceId: session.ws,
    userId: session.sub,
    action: "UPDATE",
    entity: "USER",
    entityId: session.sub,
    metadata: { action: "password_change", allSessionsRevoked: true }
  })

  return NextResponse.json({ ok: true })
}