import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { REFRESH_COOKIE, setAuthCookies, clearAuthCookies } from "@/lib/auth/cookies"
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt"
import { getPrisma } from "@/lib/db"
import { verifyPassword, hashPassword } from "@/lib/auth/password"
import crypto from "node:crypto"

export async function POST() {
  const raw = cookies().get(REFRESH_COOKIE)?.value
  if (!raw) return NextResponse.json({ error: "No refresh token" }, { status: 401 })

  // Stored as "<refreshId>:<refreshPlain>"
  const [tid, plain] = raw.split(":")
  if (!tid || !plain) return NextResponse.json({ error: "Malformed refresh" }, { status: 401 })

  const prisma = await getPrisma()
  const dbTok = await prisma.refreshToken.findUnique({ where: { id: tid } })
  if (!dbTok || dbTok.revokedAt || dbTok.expiresAt < new Date()) {
    clearAuthCookies()
    return NextResponse.json({ error: "Refresh invalid" }, { status: 401 })
  }

  const ok = await verifyPassword(plain, dbTok.tokenHash)
  if (!ok) {
    clearAuthCookies()
    return NextResponse.json({ error: "Refresh invalid" }, { status: 401 })
  }

  // Fetch user + primary membership to embed role/ws
  const user = await prisma.user.findUnique({
    where: { id: dbTok.userId },
    include: { memberships: { take: 1, orderBy: { workspaceId: "asc" } } },
  })
  if (!user) {
    clearAuthCookies()
    return NextResponse.json({ error: "User missing" }, { status: 401 })
  }
  const mem = user.memberships[0]
  const ws = mem?.workspaceId
  const role = mem?.role ?? "OWNER"

  // Rotate: revoke old, create new entry
  await prisma.refreshToken.update({ where: { id: tid }, data: { revokedAt: new Date() } })
  const newTid = crypto.randomUUID()
  const newPlain = crypto.randomUUID() + "." + crypto.randomUUID()
  const newHash = await hashPassword(newPlain)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
  await prisma.refreshToken.create({ data: { id: newTid, userId: user.id, tokenHash: newHash, expiresAt } })

  const access = await signAccessToken({ sub: user.id, ws: ws!, role: role as any })
  const refresh = await signRefreshToken({ sub: user.id, tid: newTid })
  setAuthCookies(access, `${newTid}:${newPlain}`)

  return NextResponse.json({ ok: true })
}
