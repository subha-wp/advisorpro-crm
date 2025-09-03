import { cookies } from "next/headers"
import { ACCESS_COOKIE } from "@/lib/auth/cookies"
import { verifyJWT, type AccessPayload } from "@/lib/auth/jwt"
import { canAccess, type Role } from "@/lib/auth/roles"

export async function getServerSession() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value
  if (!token) return null
  try {
    const payload = await verifyJWT<AccessPayload>(token)
    if (payload.type !== "access") return null
    return payload
  } catch {
    return null
  }
}

export async function requireRole(roles: Role[]) {
  const s = await getServerSession()
  if (!s || !canAccess(s.role as Role, roles)) return null
  return s
}
