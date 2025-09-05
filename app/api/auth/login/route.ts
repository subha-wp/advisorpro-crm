// @ts-nocheck
import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { verifyPassword, hashPassword } from "@/lib/auth/password"
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt"
import { attachAuthCookies } from "@/lib/auth/cookies"
import { createAuditLog } from "@/lib/audit"
import { authLimiter } from "@/lib/rate-limit"
import { emailSchema, passwordSchema } from "@/lib/validation"
import crypto from "node:crypto"

const LoginSchema = z.object({
  identifier: z.string().min(3).max(255), // email or phone
  password: passwordSchema,
})

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown"
  const rateLimitResult = authLimiter.check(req, 5, ip) // 5 attempts per 15 minutes
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { 
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toISOString(),
        }
      }
    )
  }

  const body = await req.json().catch(() => ({}))
  const parse = LoginSchema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ 
      error: "Invalid input", 
      details: parse.error.issues.map(i => i.message)
    }, { status: 400 })
  }
  
  try {
    const { identifier, password } = parse.data
    const prisma = await getPrisma()

    const user = await prisma.user.findFirst({
      where: identifier.includes("@") ? { email: identifier } : { phone: identifier },
      include: {
        memberships: { take: 1, orderBy: { workspaceId: "asc" } }, // pick first workspace
        workspaces: true,
      },
    })
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })

    const membership = user.memberships[0]
    // If user has no memberships yet, create one using their owned workspace if exists
    let wsId = membership?.workspaceId
    let role = membership?.role ?? "OWNER"
    if (!wsId) {
      const owned = user.workspaces[0]
      if (owned) {
        wsId = owned.id
        role = "OWNER"
      } else {
        // create a personal workspace on first login if somehow missing
        const ws = await prisma.workspace.create({
          data: { name: `${user.name ?? "Workspace"}`, ownerId: user.id, plan: "FREE" },
        })
        await prisma.membership.create({ data: { userId: user.id, workspaceId: ws.id, role: "OWNER" } })
        wsId = ws.id
        role = "OWNER"
      }
    }

    const refreshId = crypto.randomUUID()
    const refreshPlain = crypto.randomUUID() + "." + crypto.randomUUID()
    const refreshHash = await hashPassword(refreshPlain)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days

    await prisma.refreshToken.create({
      data: { id: refreshId, userId: user.id, tokenHash: refreshHash, expiresAt },
    })

    const access = await signAccessToken({ sub: user.id, ws: wsId!, role: role as any })
    const refresh = await signRefreshToken({ sub: user.id, tid: refreshId })

    // Audit log
    await createAuditLog({
      workspaceId: wsId!,
      userId: user.id,
      action: "LOGIN",
      entity: "USER",
      entityId: user.id,
      metadata: { ip, userAgent: req.headers.get("user-agent") }
    })

    const res = NextResponse.json({ ok: true, workspaceId: wsId })
    attachAuthCookies(res, access, `${refreshId}:${refreshPlain}`)
    return res
  } catch (err) {
    console.log("[v0] login error:", (err as Error).message)
    
    // Audit failed login attempt
    try {
      const prisma = await getPrisma()
      const user = await prisma.user.findFirst({
        where: identifier.includes("@") ? { email: identifier } : { phone: identifier }
      })
      if (user) {
        const membership = await prisma.membership.findFirst({
          where: { userId: user.id }
        })
        if (membership) {
          await createAuditLog({
            workspaceId: membership.workspaceId,
            userId: user.id,
            action: "LOGIN",
            entity: "USER",
            entityId: user.id,
            metadata: { 
              success: false, 
              error: (err as Error).message,
              ip,
              userAgent: req.headers.get("user-agent")
            }
          })
        }
      }
    } catch (auditErr) {
      console.error("[audit] Failed to log failed login:", auditErr)
    }
    
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 })
  }
}
