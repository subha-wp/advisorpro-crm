// @ts-nocheck
import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { hashPassword } from "@/lib/auth/password"
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt"
import { attachAuthCookies } from "@/lib/auth/cookies"
import { createAuditLog } from "@/lib/audit"
import { authLimiter } from "@/lib/rate-limit"
import { nameSchema, emailSchema, phoneSchema, passwordSchema, workspaceNameSchema, sanitizeString, sanitizeEmail, sanitizePhone } from "@/lib/validation"
import crypto from "node:crypto"

const SignupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  workspaceName: workspaceNameSchema.default("My Workspace"),
})

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown"
  const rateLimitResult = authLimiter.check(req, 3, ip) // 3 signups per 15 minutes
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again later." },
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
  const parse = SignupSchema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ 
      error: "Invalid input", 
      details: parse.error.issues.map(i => i.message)
    }, { status: 400 })
  }
  
  try {
    const rawData = parse.data
    const name = sanitizeString(rawData.name)
    const email = sanitizeEmail(rawData.email)
    const phone = sanitizePhone(rawData.phone)
    const password = rawData.password
    const workspaceName = sanitizeString(rawData.workspaceName)
    
    const prisma = await getPrisma()

    // Guard uniqueness
    const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } })
    if (exists) {
      return NextResponse.json({ error: "An account with this email or phone already exists" }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash },
    })

    const workspace = await prisma.workspace.create({
      data: { name: workspaceName, ownerId: user.id, plan: "FREE" },
    })

    await prisma.membership.create({
      data: { userId: user.id, workspaceId: workspace.id, role: "OWNER" },
    })

    // Create refresh token DB entry
    const refreshId = crypto.randomUUID()
    const refreshPlain = crypto.randomUUID() + "." + crypto.randomUUID()
    const refreshHash = await hashPassword(refreshPlain)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)

    await prisma.refreshToken.create({
      data: { id: refreshId, userId: user.id, tokenHash: refreshHash, expiresAt },
    })

    const access = await signAccessToken({ sub: user.id, ws: workspace.id, role: "OWNER" })
    const refresh = await signRefreshToken({ sub: user.id, tid: refreshId })

    // Audit log
    await createAuditLog({
      workspaceId: workspace.id,
      userId: user.id,
      action: "SIGNUP",
      entity: "USER",
      entityId: user.id,
      after: { name, email, phone, workspaceName },
      metadata: { ip, userAgent: req.headers.get("user-agent") }
    })

    const res = NextResponse.json({ ok: true, workspaceId: workspace.id })
    attachAuthCookies(res, access, `${refreshId}:${refreshPlain}`)
    return res
  } catch (err) {
    console.log(" signup error:", (err as Error).message)
    return NextResponse.json({ error: "Signup failed. Please try again." }, { status: 500 })
  }
}
