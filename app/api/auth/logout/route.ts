import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { REFRESH_COOKIE, clearAuthCookies } from "@/lib/auth/cookies"
import { getPrisma } from "@/lib/db"

export async function POST() {
  const raw = (await cookies()).get(REFRESH_COOKIE)?.value
  if (raw) {
    const [tid] = raw.split(":")
    if (tid) {
      const prisma = await getPrisma()
      await prisma.refreshToken.updateMany({
        where: { id: tid, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }
  }
  await clearAuthCookies()
  return NextResponse.json({ ok: true })
}
