import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { createAuditLog } from "@/lib/audit"
import { deleteFromCloudinary } from "@/lib/cloudinary"
import { apiLimiter } from "@/lib/rate-limit"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireRole(ROLES.OWNER) // Only owners can delete assets
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 10, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  try {
    const prisma = await getPrisma()

    // Get asset details
    const asset = await prisma.workspaceAsset.findFirst({
      where: { id, workspaceId: session.ws }
    })

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    // Delete from Cloudinary if it has a public ID
    if (asset.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(session.ws, asset.cloudinaryPublicId)
      } catch (cloudinaryError) {
        console.error("[Cloudinary Delete Error]", cloudinaryError)
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // If this was the workspace logo, clear the logo URL
    if (asset.assetType === "logo") {
      await prisma.workspace.update({
        where: { id: session.ws },
        data: { logoUrl: null }
      })
    }

    // Delete from database
    await prisma.workspaceAsset.delete({
      where: { id }
    })

    // Audit log
    await createAuditLog({
      workspaceId: session.ws,
      userId: session.sub,
      action: "DELETE",
      entity: "WORKSPACE",
      entityId: session.ws,
      before: { 
        assetDeleted: true,
        assetType: asset.assetType,
        fileName: asset.fileName,
        fileUrl: asset.fileUrl,
      }
    })

    return NextResponse.json({ 
      ok: true,
      message: "Asset deleted successfully"
    })
  } catch (error) {
    console.error("[Workspace Asset DELETE Error]", error)
    return NextResponse.json({ 
      error: "Failed to delete asset",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    }, { status: 500 })
  }
}