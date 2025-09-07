import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { apiLimiter } from "@/lib/rate-limit"

export async function GET(req: NextRequest) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 100, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const url = new URL(req.url)
  const q = url.searchParams.get("q") ?? ""

  if (q.length < 2) {
    return NextResponse.json([])
  }

  const prisma = await getPrisma()

  try {
    const clients = await prisma.client.findMany({
      where: {
        workspaceId: session.ws,
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { mobile: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
          { panNo: { contains: q, mode: "insensitive" } },
          { aadhaarNo: { contains: q } },
          { clientGroup: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: {
        clientGroup: {
          select: { id: true, name: true }
        },
        policies: {
          select: {
            id: true,
            policyNumber: true,
            insurer: true,
            planName: true,
            status: true,
            nextDueDate: true,
            premiumAmount: true,
          },
          where: { status: "ACTIVE" },
          take: 5,
        },
      },
      take: 20,
      orderBy: { name: "asc" },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error("[Client Search Error]", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}