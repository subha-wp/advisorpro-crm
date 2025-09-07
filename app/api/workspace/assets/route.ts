import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { createAuditLog } from "@/lib/audit"
import { apiLimiter } from "@/lib/rate-limit"

const CreateAssetSchema = z.object({
  assetType: z.enum(["logo", "letterhead", "signature", "certificate", "other"]),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  cloudinaryPublicId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 200, session.sub) // Increased for asset browsing
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const url = new URL(req.url)
  const assetType = url.searchParams.get("type")

  try {
    const prisma = await getPrisma()
    const where: any = { workspaceId: session.ws }
    if (assetType) where.assetType = assetType

    const assets = await prisma.workspaceAsset.findMany({
      where,
      include: {
        uploadedByUser: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ items: assets })
  } catch (error) {
    console.error("[Workspace Assets GET Error]", error)
    return NextResponse.json({ 
      error: "Failed to load workspace assets",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await requireRole(ROLES.OWNER) // Only owners can upload assets
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 100, session.sub) // Increased for asset uploads
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const parsed = CreateAssetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: parsed.error.issues.map(i => i.message)
      }, { status: 400 })
    }

    const prisma = await getPrisma()

    // If this is a logo, update the workspace logo URL as well
    if (parsed.data.assetType === "logo") {
      await prisma.workspace.update({
        where: { id: session.ws },
        data: { logoUrl: parsed.data.fileUrl }
      })
    }

    // Create asset record
    const asset = await prisma.workspaceAsset.create({
      data: {
        workspaceId: session.ws,
        assetType: parsed.data.assetType,
        fileName: parsed.data.fileName,
        fileUrl: parsed.data.fileUrl,
        fileSize: parsed.data.fileSize,
        mimeType: parsed.data.mimeType,
        cloudinaryPublicId: parsed.data.cloudinaryPublicId,
        uploadedByUserId: session.sub,
      },
      include: {
        uploadedByUser: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Audit log
    await createAuditLog({
      workspaceId: session.ws,
      userId: session.sub,
      action: "CREATE",
      entity: "WORKSPACE",
      entityId: session.ws,
      after: { 
        assetUploaded: true,
        assetType: parsed.data.assetType,
        fileName: parsed.data.fileName,
        fileSize: parsed.data.fileSize,
      }
    })

    return NextResponse.json({ 
      item: asset,
      message: "Asset uploaded successfully"
    })
  } catch (error) {
    console.error("[Workspace Assets POST Error]", error)
    return NextResponse.json({ 
      error: "Failed to save asset",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    }, { status: 500 })
  }
}