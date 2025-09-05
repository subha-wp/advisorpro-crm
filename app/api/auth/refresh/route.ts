// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { REFRESH_COOKIE, ACCESS_COOKIE } from "@/lib/auth/cookies"
import { verifyJWT, signAccessToken, type RefreshPayload } from "@/lib/auth/jwt"
import { getPrisma } from "@/lib/db"
import { verifyPassword, hashPassword } from "@/lib/auth/password"
import crypto from "node:crypto"

function loginRedirect(req: NextRequest) {
  return NextResponse.redirect(new URL("/login", req.url))
}

function dashboardRedirect(req: NextRequest) {
  return NextResponse.redirect(new URL("/dashboard", req.url))
}

async function readRefreshCookie(): Promise<{ id: string; plain: string } | null> {
  const cookieStore = await cookies()
  const tok = cookieStore.get(REFRESH_COOKIE)?.value
  if (!tok) return null
  // stored as "<id>:<plaintext>"
  const [id, plain] = tok.split(":")
  if (!id || !plain) return null
  return { id, plain }
}

// Enhanced token rotation with activity-based expiration
async function rotateTokens(req: NextRequest): Promise<
  | {
      error: NextResponse
    }
  | {
      accessToken: string
      refreshCombined: string
    }
> {
  const parsed = await readRefreshCookie()
  if (!parsed) {
    return { error: loginRedirect(req) }
  }

  const { id: oldId, plain } = parsed
  const prisma = await getPrisma()
  const dbTok = await prisma.refreshToken.findUnique({ where: { id: oldId } })
  if (!dbTok || dbTok.revokedAt || dbTok.expiresAt <= new Date()) {
    return { error: loginRedirect(req) }
  }

  const ok = await verifyPassword(plain, dbTok.tokenHash)
  if (!ok) {
    return { error: loginRedirect(req) }
  }

  // Fetch user with membership info
  const user = await prisma.user.findUnique({
    where: { id: dbTok.userId },
    include: {
      memberships: { take: 1, orderBy: { workspaceId: "asc" } },
    },
  })

  if (!user) {
    return { error: loginRedirect(req) }
  }

  const primary = user.memberships?.[0]
  if (!primary) {
    return { error: loginRedirect(req) }
  }

  // Issue new access token with 15-minute expiry
  const accessToken = await signAccessToken({
    sub: user.id,
    ws: primary.workspaceId,
    role: primary.role as any,
  })

  // Create new refresh token
  const refreshPlain = crypto.randomBytes(32).toString("hex")
  const refreshId = crypto.randomUUID()
  const refreshHash = await hashPassword(refreshPlain)
  const refreshExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: oldId },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        id: refreshId,
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt: refreshExpiresAt,
      },
    }),
  ])

  const refreshCombined = `${refreshId}:${refreshPlain}`

  return {
    accessToken,
    refreshCombined,
  }
}

function withAuthCookies(
  res: NextResponse,
  {
    accessToken,
    refreshCombined,
  }: {
    accessToken: string
    refreshCombined: string
  },
) {
  const isProd = process.env.NODE_ENV === "production"
  
  // Access token cookie
  res.cookies.set({
    name: ACCESS_COOKIE,
    value: accessToken,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    // Don't set expires for access token - let it be session-based
  })

  // Refresh token cookie
  res.cookies.set({
    name: REFRESH_COOKIE,
    value: refreshCombined,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  return res
}

function withClearedAuth(res: NextResponse) {
  res.cookies.set({
    name: ACCESS_COOKIE,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  })
  res.cookies.set({
    name: REFRESH_COOKIE,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  })
  return res
}

export async function GET(req: NextRequest) {
  try {
    const result = await rotateTokens(req)
    if ("error" in result) {
      return withClearedAuth(result.error)
    }

    const res = dashboardRedirect(req)
    return withAuthCookies(res, result)
  } catch (err) {
    console.error("[Refresh GET Error]", err)
    return withClearedAuth(loginRedirect(req))
  }
}

export async function POST(req: NextRequest) {
  try {
    const result = await rotateTokens(req)
    if ("error" in result) {
      const res = NextResponse.json({ ok: false }, { status: 401 })
      return withClearedAuth(res)
    }

    const res = NextResponse.json({ ok: true }, { status: 200 })
    return withAuthCookies(res, result)
  } catch (err) {
    console.error("[Refresh POST Error]", err)
    const res = NextResponse.json({ ok: false }, { status: 401 })
    return withClearedAuth(res)
  }
}
