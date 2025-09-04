// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "node:crypto"
// Adjust these imports to your project’s structure:
import { PrismaClient } from "@prisma/client"
import { verifyPassword, hashPassword } from "@/lib/auth/password"
import { signAccessToken } from "@/lib/auth/jwt"

// create a Prisma singleton (adjust if you already export one)
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  })
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// centralize cookie names and timing
const ACCESS_COOKIE = "access_token"
const REFRESH_COOKIE = "refresh_token"
const ACCESS_TTL_MS = 1000 * 60 * 15 // 15 minutes
const REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

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

// core token rotation logic; returns either an error (as a NextResponse redirect)
// or the new cookies to set (so caller can decide response type)
async function rotateTokens(req: NextRequest): Promise<
  | {
      error: NextResponse
    }
  | {
      accessToken: string
      accessExpiresAt: Date
      refreshCombined: string
      refreshExpiresAt: Date
    }
> {
  const parsed = await readRefreshCookie()
  if (!parsed) {
    return { error: loginRedirect(req) }
  }

  const { id: oldId, plain } = parsed
  const dbTok = await prisma.refreshToken.findUnique({ where: { id: oldId } })
  if (!dbTok || dbTok.revokedAt || dbTok.expiresAt <= new Date()) {
    return { error: loginRedirect(req) }
  }

  const ok = await verifyPassword(plain, dbTok.tokenHash)
  if (!ok) {
    return { error: loginRedirect(req) }
  }

  // fetch user plus a primary membership/role if your app uses it
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
  const accessExpiresAt = new Date(Date.now() + ACCESS_TTL_MS)

  // issue new access token (adjust payload to your app)
  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: primary?.role ?? "user",
    ws: primary?.workspaceId ?? null,
    exp: Math.floor(accessExpiresAt.getTime() / 1000),
  })

  // rotate refresh token: revoke old, create new hashed token
  const refreshPlain = crypto.randomBytes(32).toString("hex")
  const refreshId = crypto.randomUUID()
  const refreshHash = await hashPassword(refreshPlain)
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_MS)

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
    accessExpiresAt,
    refreshCombined,
    refreshExpiresAt,
  }
}

// sets auth cookies on the provided response and returns it
function withAuthCookies(
  res: NextResponse,
  {
    accessToken,
    accessExpiresAt,
    refreshCombined,
    refreshExpiresAt,
  }: {
    accessToken: string
    accessExpiresAt: Date
    refreshCombined: string
    refreshExpiresAt: Date
  },
) {
  // Access token cookie
  res.cookies.set({
    name: ACCESS_COOKIE,
    value: accessToken,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: accessExpiresAt,
  })

  // Refresh token cookie
  res.cookies.set({
    name: REFRESH_COOKIE,
    value: refreshCombined,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: refreshExpiresAt,
  })

  return res
}

// clear cookies helper
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
      // ensure stale cookies are cleared on redirect to login
      return withClearedAuth(result.error)
    }

    // On success, redirect to dashboard and set cookies on the redirect response
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
      // return 401 JSON for XHR/silent refresh flows
      const res = NextResponse.json({ ok: false }, { status: 401 })
      return withClearedAuth(res)
    }

    // Success: return JSON with cookies set
    const res = NextResponse.json({ ok: true }, { status: 200 })
    return withAuthCookies(res, result)
  } catch (err) {
    console.error("[Refresh POST Error]", err)
    const res = NextResponse.json({ ok: false }, { status: 401 })
    return withClearedAuth(res)
  }
}
