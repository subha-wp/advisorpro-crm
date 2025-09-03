import { SignJWT, jwtVerify } from "jose"

const encoder = new TextEncoder()
function getSecret() {
  const key = process.env.STACK_SECRET_SERVER_KEY
  if (!key) throw new Error("Missing STACK_SECRET_SERVER_KEY")
  return encoder.encode(key)
}

export type AccessPayload = {
  sub: string // userId
  ws: string // workspaceId
  role: "OWNER" | "AGENT" | "VIEWER"
  type: "access"
}

export type RefreshPayload = {
  sub: string // userId
  tid: string // refresh token id (uuid)
  type: "refresh"
}

export async function signAccessToken(payload: Omit<AccessPayload, "type">, ttlSeconds = 60 * 15) {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(getSecret())
}

export async function signRefreshToken(payload: Omit<RefreshPayload, "type">, ttlSeconds = 60 * 60 * 24 * 7) {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(getSecret())
}

export async function verifyJWT<T>(token: string) {
  const { payload } = await jwtVerify(token, getSecret())
  return payload as unknown as T
}
