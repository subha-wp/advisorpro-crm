import { NextResponse } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { verifyPassword, hashPassword } from "@/lib/auth/password"
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt"
import { attachAuthCookies } from "@/lib/auth/cookies"
import crypto from "node:crypto"

const LoginSchema = z.object({
  identifier: z.string().min(3), // email or phone
  password: z.string().min(6),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parse = LoginSchema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
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
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)

    await prisma.refreshToken.create({
      data: { id: refreshId, userId: user.id, tokenHash: refreshHash, expiresAt },
    })

    const access = await signAccessToken({ sub: user.id, ws: wsId!, role: role as any })
    const refresh = await signRefreshToken({ sub: user.id, tid: refreshId })

    const res = NextResponse.json({ ok: true, workspaceId: wsId })
    attachAuthCookies(res, access, `${refreshId}:${refreshPlain}`)
    return res
  } catch (err) {
    console.log("[v0] login error:", (err as Error).message)
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 })
  }
}
