import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { getPrisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const prisma = await getPrisma()
    
    // Update user's last activity timestamp
    await prisma.user.update({
      where: { id: session.sub },
      data: { 
        // We can add a lastActivityAt field if needed for analytics
        // For now, just acknowledge the activity
      }
    })

    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error("[Activity Update Error]", error)
    return NextResponse.json({ error: "Failed to update activity" }, { status: 500 })
  }
}