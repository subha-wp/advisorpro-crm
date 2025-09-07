import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { encrypt, decrypt } from "@/lib/crypto"
import { createAuditLog } from "@/lib/audit"
import { apiLimiter } from "@/lib/rate-limit"

const UpdateEmailSettingsSchema = z.object({
  apiKey: z.string().optional(),
  fromEmail: z.string().email("Invalid email format"),
  fromName: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await requireRole(ROLES.OWNER) // Only owners can view email settings
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 200, session.sub) // Increased for settings
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
        resendApiKeyEnc: true,
        resendFromEmail: true,
        resendFromName: true,
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Return current email settings
    return NextResponse.json({
      fromEmail: workspace.resendFromEmail || "",
      fromName: workspace.resendFromName || "",
      isConfigured: !!workspace.resendApiKeyEnc,
    })
  } catch (error) {
    console.error("[Email Settings GET Error]", error)
    return NextResponse.json({ 
      error: "Failed to load email settings",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireRole(ROLES.OWNER) // Only owners can update email settings
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 50, session.sub) // Increased for settings updates
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const parsed = UpdateEmailSettingsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: parsed.error.issues.map(i => i.message)
      }, { status: 400 })
    }

    const { apiKey, fromEmail, fromName } = parsed.data
    const prisma = await getPrisma()

    // Get current workspace for audit
    const currentWorkspace = await prisma.workspace.findUnique({
      where: { id: session.ws }
    })

    if (!currentWorkspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const updateData: any = {
      resendFromEmail: fromEmail,
      resendFromName: fromName || null,
    }

    // Encrypt API key if provided
    if (apiKey) {
      const encrypted = encrypt(apiKey)
      if (!encrypted) {
        return NextResponse.json({ error: "Failed to encrypt API key" }, { status: 500 })
      }
      updateData.resendApiKeyEnc = encrypted
    }

    // Update workspace with email settings
    await prisma.workspace.update({
      where: { id: session.ws },
      data: updateData,
    })

    // Audit log
    await createAuditLog({
      workspaceId: session.ws,
      userId: session.sub,
      action: "UPDATE",
      entity: "WORKSPACE",
      entityId: session.ws,
      after: { 
        emailSettingsUpdated: true,
        fromEmail,
        fromName,
        apiKeyUpdated: !!apiKey
      }
    })

    return NextResponse.json({ 
      ok: true,
      message: "Email settings saved successfully"
    })
  } catch (error) {
    console.error("[Email Settings PUT Error]", error)
    return NextResponse.json({ 
      error: "Failed to save email settings",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    }, { status: 500 })
  }
}