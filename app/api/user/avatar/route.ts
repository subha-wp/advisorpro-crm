import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { getWorkspaceCloudinary, generateCloudinarySignature } from "@/lib/cloudinary"
import { getPrisma } from "@/lib/db"
import { createAuditLog } from "@/lib/audit"
import { apiLimiter } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const session = await requireRole(ROLES.ANY)
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
        error: "File upload not configured. Please ask your workspace owner to set up Cloudinary.",
      }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (max 5MB for avatars)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Avatar file size must be less than 5MB" }, { status: 400 })
    }

    // Validate file type (only images)
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: "Invalid file type. Please upload JPEG, PNG, GIF, or WebP images only.",
      }, { status: 400 })
    }

    // Generate timestamp and public_id for avatar
    const timestamp = Math.round(Date.now() / 1000)
    const publicId = `avatar_${session.sub}_${Date.now()}`
    const folderPath = `advisorpro/${session.ws}/avatars`

    const signatureParams = {
      folder: folderPath,
      public_id: publicId,
      timestamp: timestamp,
      transformation: "c_fill,g_face,h_200,w_200,f_auto,q_auto", // Professional avatar transformation
    }

    const signature = generateCloudinarySignature(signatureParams, cloudinaryConfig.apiSecret)

    // Upload to Cloudinary with avatar-specific transformations
    const uploadFormData = new FormData()
    uploadFormData.append("file", file)
    uploadFormData.append("folder", folderPath)
    uploadFormData.append("public_id", publicId)
    uploadFormData.append("api_key", cloudinaryConfig.apiKey)
    uploadFormData.append("timestamp", timestamp.toString())
    uploadFormData.append("signature", signature)
    uploadFormData.append("transformation", "c_fill,g_face,h_200,w_200,f_auto,q_auto")

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: uploadFormData,
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json()
      console.error("[Avatar Upload Error]", error)
      throw new Error(error.error?.message || `Upload failed: ${uploadResponse.status}`)
    }

    const uploadResult = await uploadResponse.json()

    // Generate different sizes for different use cases
    const baseUrl = uploadResult.secure_url
    const avatarUrls = {
      small: baseUrl.replace("/upload/", "/upload/c_fill,g_face,h_32,w_32,f_auto,q_auto/"), // 32x32 for small displays
      medium: baseUrl.replace("/upload/", "/upload/c_fill,g_face,h_64,w_64,f_auto,q_auto/"), // 64x64 for normal use
      large: baseUrl.replace("/upload/", "/upload/c_fill,g_face,h_200,w_200,f_auto,q_auto/"), // 200x200 for profiles
    }

    // Update user avatar URL in database
    const prisma = await getPrisma()
    const updatedUser = await prisma.user.update({
      where: { id: session.sub },
      data: { 
        avatarUrl: avatarUrls.medium, // Store medium size as default
        avatarCloudinaryId: uploadResult.public_id,
      },
      select: { id: true, name: true, email: true, avatarUrl: true }
    })

    // Audit log
    await createAuditLog({
      workspaceId: session.ws,
      userId: session.sub,
      action: "UPDATE",
      entity: "USER",
      entityId: session.sub,
      after: {
        avatarUploaded: true,
        fileName: file.name,
        fileSize: file.size,
        cloudinaryPublicId: uploadResult.public_id,
      }
    })

    return NextResponse.json({
      user: updatedUser,
      avatarUrls,
      uploadResult: {
        publicId: uploadResult.public_id,
        originalFilename: uploadResult.original_filename,
        bytes: uploadResult.bytes,
        format: uploadResult.format,
      },
      message: "Avatar uploaded successfully",
    })
  } catch (error) {
    console.error("[Avatar Upload Error]", error)
    return NextResponse.json({
      error: "Failed to upload avatar",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const prisma = await getPrisma()
    
    // Get current user to check if they have an avatar
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { avatarUrl: true, avatarCloudinaryId: true }
    })

    if (!user?.avatarUrl) {
      return NextResponse.json({ error: "No avatar to delete" }, { status: 404 })
    }

    // Delete from Cloudinary if we have the public ID
    if (user.avatarCloudinaryId) {
      try {
        const cloudinaryConfig = await getWorkspaceCloudinary(session.ws)
        if (cloudinaryConfig) {
          const deleteUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/destroy`
          const timestamp = Math.round(Date.now() / 1000)
          
          const signatureParams = {
            public_id: user.avatarCloudinaryId,
            timestamp: timestamp,
          }
          
          const signature = generateCloudinarySignature(signatureParams, cloudinaryConfig.apiSecret)
          
          const deleteFormData = new FormData()
          deleteFormData.append("public_id", user.avatarCloudinaryId)
          deleteFormData.append("api_key", cloudinaryConfig.apiKey)
          deleteFormData.append("timestamp", timestamp.toString())
          deleteFormData.append("signature", signature)

          await fetch(deleteUrl, {
            method: "POST",
            body: deleteFormData,
          })
        }
      } catch (cloudinaryError) {
        console.error("[Cloudinary Avatar Delete Error]", cloudinaryError)
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Remove avatar from database
    const updatedUser = await prisma.user.update({
      where: { id: session.sub },
      data: { 
        avatarUrl: null,
        avatarCloudinaryId: null,
      },
      select: { id: true, name: true, email: true, avatarUrl: true }
    })

    // Audit log
    await createAuditLog({
      workspaceId: session.ws,
      userId: session.sub,
      action: "UPDATE",
      entity: "USER",
      entityId: session.sub,
      before: { avatarUrl: user.avatarUrl },
      after: { avatarRemoved: true }
    })

    return NextResponse.json({
      user: updatedUser,
      message: "Avatar removed successfully",
    })
  } catch (error) {
    console.error("[Avatar Delete Error]", error)
    return NextResponse.json({
      error: "Failed to remove avatar",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
    }, { status: 500 })
  }
}