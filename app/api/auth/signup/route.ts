import { NextResponse } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { hashPassword } from "@/lib/auth/password"
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt"
import { attachAuthCookies } from "@/lib/auth/cookies"
import crypto from "node:crypto"

const SignupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(6),
  workspaceName: z.string().min(1).default("My Workspace"),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parse = SignupSchema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  try {
    const { name, email, phone, password, workspaceName } = parse.data
    const prisma = await getPrisma()

    // Guard uniqueness
    const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } })
    if (exists) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
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

    const res = NextResponse.json({ ok: true, workspaceId: workspace.id })
    attachAuthCookies(res, access, `${refreshId}:${refreshPlain}`)
    return res
  } catch (err) {
    console.log("[v0] signup error:", (err as Error).message)
    return NextResponse.json({ error: "Signup failed. Please try again." }, { status: 500 })
  }
}
