import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { getUserLocationHistory, getWorkspaceCurrentLocations } from "@/lib/location"
import { apiLimiter } from "@/lib/rate-limit"

export async function GET(req: NextRequest) {
  const session = await requireRole(ROLES.OWNER) // Only owners can view location data
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 100, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const url = new URL(req.url)
  const type = url.searchParams.get("type") || "history"
  const userId = url.searchParams.get("userId") || undefined
  const page = Number(url.searchParams.get("page") ?? "1")
  const pageSize = Math.min(100, Number(url.searchParams.get("pageSize") ?? "50"))
  const startDate = url.searchParams.get("startDate") ? new Date(url.searchParams.get("startDate")!) : undefined
  const endDate = url.searchParams.get("endDate") ? new Date(url.searchParams.get("endDate")!) : undefined
  const locationSource = url.searchParams.get("source") || undefined

  try {
    if (type === "current") {
      // Get current locations of all team members
      const currentLocations = await getWorkspaceCurrentLocations(session.ws)
      return NextResponse.json({ items: currentLocations })
    } else {
      // Get location history
      const result = await getUserLocationHistory(session.ws, userId, {
        page,
        pageSize,
        startDate,
        endDate,
        locationSource
      })
      return NextResponse.json(result)
    }
  } catch (error) {
    console.error("[Location API Error]", error)
    return NextResponse.json({ 
      error: "Failed to fetch location data",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    }, { status: 500 })
  }
}