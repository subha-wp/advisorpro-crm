// @ts-nocheck
import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { signAccessToken } from "@/lib/auth/jwt"
import { ACCESS_COOKIE } from "@/lib/auth/cookies"
import { createAuditLog } from "@/lib/audit"

export async function POST(req: NextRequest) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    // Generate new access token with fresh 15-minute expiry
    const newAccessToken = await signAccessToken({
      sub: session.sub,
      ws: session.ws,
      role: session.role as any,
    })

    // Set new access token cookie
    const response = NextResponse.json({ ok: true, extended: true })
    const isProd = process.env.NODE_ENV === "production"
    
    response.cookies.set({
      name: ACCESS_COOKIE,
      value: newAccessToken,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
    })

    // Log session extension
    await createAuditLog({
      workspaceId: session.ws,
      userId: session.sub,
      action: "UPDATE",
      entity: "USER",
      entityId: session.sub,
      metadata: { 
        action: "session_extended",
        ip: req.ip || req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent")
      }
    })

    return response
  } catch (error) {
    console.error("[Session Extension Error]", error)
    return NextResponse.json({ error: "Failed to extend session" }, { status: 500 })
  }
}