import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { getWorkspaceCloudinary, CLOUDINARY_TRANSFORMATIONS } from "@/lib/cloudinary"
import { getPrisma } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { apiLimiter } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const session = await requireRole(ROLES.OWNER) // Only owners can upload files
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 10, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  try {
    // Check if Cloudinary is configured
    const cloudinaryConfig = await getWorkspaceCloudinary(session.ws)
    if (!cloudinaryConfig) {
      return NextResponse.json({ 
        error: "Cloudinary not configured. Please set up your Cloudinary account in workspace settings." 
      }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const assetType = formData.get('assetType') as string
    const folder = formData.get('folder') as string || 'workspace-assets'

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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, PDF" 
      }, { status: 400 })
    }

    // Upload to Cloudinary
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('folder', `${folder}/${session.ws}`)
    
    // Add transformation based on asset type
    const transformation = CLOUDINARY_TRANSFORMATIONS[assetType as keyof typeof CLOUDINARY_TRANSFORMATIONS]
    if (transformation) {
      uploadFormData.append('transformation', transformation)
    }

    // Generate signature for authenticated upload
    const timestamp = Math.round(Date.now() / 1000)
    const crypto = require('crypto')
    
    const paramsToSign = `folder=${folder}/${session.ws}&timestamp=${timestamp}`
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + cloudinaryConfig.apiSecret)
      .digest('hex')

    uploadFormData.append('api_key', cloudinaryConfig.apiKey)
    uploadFormData.append('timestamp', timestamp.toString())
    uploadFormData.append('signature', signature)

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: uploadFormData,
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json()
      throw new Error(error.error?.message || 'Upload failed')
    }

    const uploadResult = await uploadResponse.json()

    // Save asset to database
    const prisma = await getPrisma()
    
    // If this is a logo, update the workspace logo URL
    if (assetType === "logo") {
      await prisma.workspace.update({
        where: { id: session.ws },
        data: { logoUrl: uploadResult.secure_url }
      })
    }

    const asset = await prisma.workspaceAsset.create({
      data: {
        workspaceId: session.ws,
        assetType,
        fileName: file.name,
        fileUrl: uploadResult.secure_url,
        fileSize: file.size,
        mimeType: file.type,
        cloudinaryPublicId: uploadResult.public_id,
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
        fileUploaded: true,
        assetType,
        fileName: file.name,
        fileSize: file.size,
        cloudinaryPublicId: uploadResult.public_id,
      }
    })

    return NextResponse.json({ 
      item: asset,
      uploadResult: {
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
        originalFilename: uploadResult.original_filename,
        bytes: uploadResult.bytes,
        format: uploadResult.format,
      },
      message: "File uploaded successfully"
    })
  } catch (error) {
    console.error("[Workspace Upload Error]", error)
    return NextResponse.json({ 
      error: "Failed to upload file",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    }, { status: 500 })
  }
}