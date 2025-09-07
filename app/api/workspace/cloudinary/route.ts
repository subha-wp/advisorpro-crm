import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { encrypt, decrypt } from "@/lib/crypto"
import { createAuditLog } from "@/lib/audit"
import { apiLimiter } from "@/lib/rate-limit"

const UpdateCloudinarySchema = z.object({
  cloudName: z.string().min(1, "Cloud name is required"),
  apiKey: z.string().min(1, "API key is required"),
  apiSecret: z.string().min(1, "API secret is required"),
})

export async function GET(req: NextRequest) {
  const session = await requireRole(ROLES.OWNER) // Only owners can view Cloudinary settings
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 50, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  try {
    const prisma = await getPrisma()
    const workspace = await prisma.workspace.findUnique({
      where: { id: session.ws },
      select: {
        id: true,
        name: true,
        cloudinaryCloudNameEnc: true,
        cloudinaryApiKeyEnc: true,
        cloudinaryApiSecretEnc: true,
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Return current Cloudinary settings (without sensitive data)
    const isConfigured = !!(workspace.cloudinaryCloudNameEnc && workspace.cloudinaryApiKeyEnc && workspace.cloudinaryApiSecretEnc)
    let cloudName = ""
    
    if (isConfigured && workspace.cloudinaryCloudNameEnc) {
      cloudName = decrypt(workspace.cloudinaryCloudNameEnc)
    }

    return NextResponse.json({
      isConfigured,
      cloudName: cloudName || "",
    })
  } catch (error) {
    console.error("[Cloudinary Settings GET Error]", error)
    return NextResponse.json({ 
      error: "Failed to load Cloudinary settings",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireRole(ROLES.OWNER) // Only owners can update Cloudinary settings
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 5, session.sub) // Limited attempts for security
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const parsed = UpdateCloudinarySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: parsed.error.issues.map(i => i.message)
      }, { status: 400 })
    }

    const { cloudName, apiKey, apiSecret } = parsed.data
    const prisma = await getPrisma()

    // Test Cloudinary connection before saving
    try {
      const testUrl = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image`
      const testResponse = await fetch(testUrl, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
        }
      })
      
      if (!testResponse.ok) {
        return NextResponse.json({ 
          error: "Invalid Cloudinary credentials. Please check your cloud name, API key, and API secret." 
        }, { status: 400 })
      }
    } catch (testError) {
      return NextResponse.json({ 
        error: "Failed to verify Cloudinary credentials. Please check your settings." 
      }, { status: 400 })
    }

    // Encrypt credentials
    const cloudNameEnc = encrypt(cloudName)
    const apiKeyEnc = encrypt(apiKey)
    const apiSecretEnc = encrypt(apiSecret)

    if (!cloudNameEnc || !apiKeyEnc || !apiSecretEnc) {
      return NextResponse.json({ error: "Failed to encrypt credentials" }, { status: 500 })
    }

    // Update workspace with encrypted Cloudinary settings
    await prisma.workspace.update({
      where: { id: session.ws },
      data: {
        cloudinaryCloudNameEnc,
        cloudinaryApiKeyEnc,
        cloudinaryApiSecretEnc,
      },
    })

    // Audit log
    await createAuditLog({
      workspaceId: session.ws,
      userId: session.sub,
      action: "UPDATE",
      entity: "WORKSPACE",
      entityId: session.ws,
      after: { 
        cloudinaryConfigured: true,
        cloudName: cloudName,
      }
    })

    return NextResponse.json({ 
      ok: true,
      message: "Cloudinary settings saved successfully"
    })
  } catch (error) {
    console.error("[Cloudinary Settings PUT Error]", error)
    return NextResponse.json({ 
      error: "Failed to save Cloudinary settings",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    }, { status: 500 })
  }
}