import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { updateWorkspaceOfficeLocation, getWorkspaceLocationSettings, reverseGeocode } from "@/lib/location"
import { createAuditLog } from "@/lib/audit"
import { apiLimiter } from "@/lib/rate-limit"

const UpdateOfficeLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  trackingEnabled: z.boolean().default(true),
})

export async function GET(req: NextRequest) {
  const session = await requireRole(ROLES.OWNER)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 50, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  try {
    const settings = await getWorkspaceLocationSettings(session.ws)
    return NextResponse.json({ 
      settings: {
        latitude: settings?.officeLatitude ? Number(settings.officeLatitude) : null,
        longitude: settings?.officeLongitude ? Number(settings.officeLongitude) : null,
        address: settings?.officeAddress,
        trackingEnabled: settings?.locationTrackingEnabled || false,
      }
    })
  } catch (error) {
    console.error("[Workspace Location GET Error]", error)
    return NextResponse.json({ 
      error: "Failed to load location settings",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireRole(ROLES.OWNER) // Only owners can update office location
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 10, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const parsed = UpdateOfficeLocationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: parsed.error.issues.map(i => i.message)
      }, { status: 400 })
    }

    const { latitude, longitude, address, trackingEnabled } = parsed.data

    // Reverse geocode if address not provided
    let finalAddress = address
    if (!finalAddress) {
      finalAddress = await reverseGeocode(latitude, longitude)
    }

    const workspace = await updateWorkspaceOfficeLocation(
      session.ws,
      { latitude, longitude, address: finalAddress },
      trackingEnabled
    )

    // Audit log
    await createAuditLog({
      workspaceId: session.ws,
      userId: session.sub,
      action: "UPDATE",
      entity: "WORKSPACE",
      entityId: session.ws,
      after: { 
        officeLocationUpdated: true,
        latitude,
        longitude,
        address: finalAddress,
        trackingEnabled
      }
    })

    return NextResponse.json({ 
      ok: true,
      message: "Office location updated successfully",
      location: {
        latitude,
        longitude,
        address: finalAddress,
        trackingEnabled
      }
    })
  } catch (error) {
    console.error("[Workspace Location PUT Error]", error)
    return NextResponse.json({ 
      error: "Failed to update office location",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    }, { status: 500 })
  }
}