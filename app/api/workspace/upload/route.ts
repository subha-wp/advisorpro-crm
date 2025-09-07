import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { getWorkspaceCloudinary, CLOUDINARY_TRANSFORMATIONS, generateCloudinarySignature } from "@/lib/cloudinary"
import { getPrisma } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { apiLimiter } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const session = await requireRole(ROLES.OWNER) // Only owners can upload files
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 50, session.sub) // Increased for file uploads
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  try {
    // Check if Cloudinary is configured
    const cloudinaryConfig = await getWorkspaceCloudinary(session.ws)
    if (!cloudinaryConfig) {
      return NextResponse.json(
        {
          error: "Cloudinary not configured. Please set up your Cloudinary account in workspace settings.",
        },
        { status: 400 },
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const assetType = formData.get("assetType") as string
    const folder = (formData.get("folder") as string) || "workspace-assets"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!assetType) {
      return NextResponse.json({ error: "Asset type is required" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, PDF",
        },
        { status: 400 },
      )
    }

    // Generate timestamp and public_id
    const timestamp = Math.round(Date.now() / 1000)
    const publicId = `${assetType}_${Date.now()}`
    const folderPath = `advisorpro/${session.ws}/${assetType}`

    const signatureParams = {
      folder: folderPath,
      public_id: publicId,
      timestamp: timestamp,
    }

    const signature = generateCloudinarySignature(signatureParams, cloudinaryConfig.apiSecret)

    // Upload to Cloudinary
    const uploadFormData = new FormData()
    uploadFormData.append("file", file)
    uploadFormData.append("folder", folderPath)
    uploadFormData.append("public_id", publicId)
    uploadFormData.append("api_key", cloudinaryConfig.apiKey)
    uploadFormData.append("timestamp", timestamp.toString())
    uploadFormData.append("signature", signature)

    const resourceType = file.type.startsWith("image/") ? "image" : "raw"
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/upload`

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: uploadFormData,
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json()
      console.error("[Cloudinary Upload Error]", error)
      throw new Error(error.error?.message || `Upload failed: ${uploadResponse.status}`)
    }

    const uploadResult = await uploadResponse.json()

    // Save asset to database
    const prisma = await getPrisma()

    // Apply transformation URL for images
    let finalUrl = uploadResult.secure_url
    if (file.type.startsWith("image/")) {
      const transformation = CLOUDINARY_TRANSFORMATIONS[assetType as keyof typeof CLOUDINARY_TRANSFORMATIONS]
      if (transformation) {
        finalUrl = uploadResult.secure_url.replace("/upload/", `/upload/${transformation}/`)
      }
    }

    // If this is a logo, update the workspace logo URL
    if (assetType === "logo") {
      await prisma.workspace.update({
        where: { id: session.ws },
        data: { logoUrl: finalUrl },
      })
    }

    const asset = await prisma.workspaceAsset.create({
      data: {
        workspaceId: session.ws,
        assetType,
        fileName: file.name,
        fileUrl: finalUrl,
        fileSize: file.size,
        mimeType: file.type,
        cloudinaryPublicId: uploadResult.public_id,
        uploadedByUserId: session.sub,
      },
      include: {
        uploadedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Audit log
    await createAuditLog({
      workspaceId: session.ws,
      userId: session.sub,
      action: "CREATE",
      entity: "WORKSPACE",
      entityId: session.ws,
      after: {
        fileUploaded: true,
        assetType,
        fileName: file.name,
        fileSize: file.size,
        cloudinaryPublicId: uploadResult.public_id,
      },
    })

    return NextResponse.json({
      item: asset,
      uploadResult: {
        publicId: uploadResult.public_id,
        secureUrl: finalUrl,
        originalFilename: uploadResult.original_filename,
        bytes: uploadResult.bytes,
        format: uploadResult.format,
      },
      message: "File uploaded successfully",
    })
  } catch (error) {
    console.error("[Workspace Upload Error]", error)
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}
