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
import { saveUserLocation, reverseGeocode } from "@/lib/location"
import crypto from "node:crypto"

const LoginSchema = z.object({
  identifier: z.string().min(3).max(255).transform(val => val.trim().toLowerCase()), // email or phone
  password: passwordSchema,
  location: z.object({ // Now required, not optional
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
  }),
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

    // Improved user lookup - handle both email and phone more reliably
    const isEmail = identifier.includes("@")
    const searchCondition = isEmail 
      ? { email: identifier }
      : { phone: identifier.startsWith("+") ? identifier : `+91${identifier.replace(/\D/g, "")}` }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          searchCondition,
          // Also try exact match for phone without country code
          ...(isEmail ? [] : [{ phone: identifier }])
        ]
      },
      include: {
        memberships: { 
          include: { workspace: true },
          orderBy: { workspaceId: "asc" } 
        },
        workspaces: true,
      },
    })
    
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })

    // Enhanced password verification with better error handling
    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })

    // Find the correct membership and workspace
    let wsId: string
    let role: string

    // First, check if user has any memberships
    if (user.memberships.length > 0) {
      const membership = user.memberships[0] // Use first membership
      wsId = membership.workspaceId
      role = membership.role
    } else {
      // If no memberships, check if user owns any workspace
      const ownedWorkspace = user.workspaces.find(ws => ws.ownerId === user.id)
      if (ownedWorkspace) {
        // Create missing membership for owned workspace
        await prisma.membership.create({
          data: { 
            userId: user.id, 
            workspaceId: ownedWorkspace.id, 
            role: "OWNER" 
          }
        })
        wsId = ownedWorkspace.id
        role = "OWNER"
      } else {
        // Create a new workspace for the user (this should rarely happen)
        const newWorkspace = await prisma.workspace.create({
          data: { 
            name: `${user.name ?? "My"} Workspace`, 
            ownerId: user.id, 
            plan: "FREE" 
          },
        })
        await prisma.membership.create({
          data: { 
            userId: user.id, 
            workspaceId: newWorkspace.id, 
            role: "OWNER" 
          }
        })
        wsId = newWorkspace.id
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

    const access = await signAccessToken({ sub: user.id, ws: wsId, role: role as any })
    const refresh = await signRefreshToken({ sub: user.id, tid: refreshId })

    // Save user location (mandatory during login)
    try {
      const address = await reverseGeocode(
        parse.data.location.latitude,
        parse.data.location.longitude
      )
      
      await saveUserLocation({
        userId: user.id,
        workspaceId: wsId,
        location: {
          latitude: parse.data.location.latitude,
          longitude: parse.data.location.longitude,
          accuracy: parse.data.location.accuracy,
          address: address || undefined,
        },
        ipAddress: ip,
        userAgent: req.headers.get("user-agent") || undefined,
        locationSource: 'login'
      })
    } catch (locationError) {
      console.error("[Location Save Error]", locationError)
      // Don't fail login if location save fails, but log it
    }

    // Audit log
    await createAuditLog({
      workspaceId: wsId,
      userId: user.id,
      action: "LOGIN",
      entity: "USER",
      entityId: user.id,
      metadata: { 
        ip, 
        userAgent: req.headers.get("user-agent"),
        role: role,
        workspaceId: wsId,
        location: {
          latitude: parse.data.location.latitude,
          longitude: parse.data.location.longitude,
          accuracy: parse.data.location.accuracy
        }
      }
    })

    // Return minimal response for faster processing
    const res = NextResponse.json({ 
      ok: true, 
      workspaceId: wsId, 
      role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
    attachAuthCookies(res, access, `${refreshId}:${refreshPlain}`)
    return res
  } catch (err) {
    console.log("[v0] login error:", (err as Error).message)
    
    // Audit failed login attempt
    try {
      const prisma = await getPrisma()
      const { identifier } = parse.data
      const isEmail = identifier.includes("@")
      const searchCondition = isEmail 
        ? { email: identifier }
        : { phone: identifier.startsWith("+") ? identifier : `+91${identifier.replace(/\D/g, "")}` }

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            searchCondition,
            ...(isEmail ? [] : [{ phone: identifier }])
          ]
        }
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
