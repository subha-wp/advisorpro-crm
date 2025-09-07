import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { createAuditLog } from "@/lib/audit"
import { emailSchema, phoneSchema, sanitizeString, sanitizeEmail, sanitizePhone } from "@/lib/validation"
import { apiLimiter } from "@/lib/rate-limit"

const UpdateWorkspaceDetailsSchema = z.object({
  officeEmail: emailSchema.optional(),
  officePhone: phoneSchema.optional(),
  officeAddressFull: z.string().max(500).optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  businessRegistration: z.string().max(100).optional(),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST format").optional().or(z.literal("")),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format").optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
})

export async function GET(req: NextRequest) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 100, session.sub)
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
        officeEmail: true,
        officePhone: true,
        officeAddressFull: true,
        logoUrl: true,
        websiteUrl: true,
        businessRegistration: true,
        gstNumber: true,
        panNumber: true,
        cloudinaryCloudNameEnc: true,
        cloudinaryApiKeyEnc: true,
        cloudinaryApiSecretEnc: true,
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    return NextResponse.json({
      details: {
        officeEmail: workspace.officeEmail || "",
        officePhone: workspace.officePhone || "",
        officeAddressFull: workspace.officeAddressFull || "",
        logoUrl: workspace.logoUrl || "",
        websiteUrl: workspace.websiteUrl || "",
        businessRegistration: workspace.businessRegistration || "",
        gstNumber: workspace.gstNumber || "",
        panNumber: workspace.panNumber || "",
        cloudinaryConfigured: !!(workspace.cloudinaryCloudNameEnc && workspace.cloudinaryApiKeyEnc),
      }
    })
  } catch (error) {
    console.error("[Workspace Details GET Error]", error)
    return NextResponse.json({ 
      error: "Failed to load workspace details",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireRole(ROLES.OWNER) // Only owners can update workspace details
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 10, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const parsed = UpdateWorkspaceDetailsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: parsed.error.issues.map(i => i.message)
      }, { status: 400 })
    }

    const data = parsed.data
    const prisma = await getPrisma()

    // Get current workspace for audit
    const currentWorkspace = await prisma.workspace.findUnique({
      where: { id: session.ws }
    })

    if (!currentWorkspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (data.officeEmail !== undefined) updateData.officeEmail = data.officeEmail ? sanitizeEmail(data.officeEmail) : null
    if (data.officePhone !== undefined) updateData.officePhone = data.officePhone ? sanitizePhone(data.officePhone) : null
    if (data.officeAddressFull !== undefined) updateData.officeAddressFull = data.officeAddressFull ? sanitizeString(data.officeAddressFull) : null
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl || null
    if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl || null
    if (data.businessRegistration !== undefined) updateData.businessRegistration = data.businessRegistration ? sanitizeString(data.businessRegistration) : null
    if (data.gstNumber !== undefined) updateData.gstNumber = data.gstNumber || null
    if (data.panNumber !== undefined) updateData.panNumber = data.panNumber || null

    const updatedWorkspace = await prisma.workspace.update({
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
      before: {
        officeEmail: currentWorkspace.officeEmail,
        officePhone: currentWorkspace.officePhone,
        officeAddressFull: currentWorkspace.officeAddressFull,
        logoUrl: currentWorkspace.logoUrl,
        websiteUrl: currentWorkspace.websiteUrl,
        businessRegistration: currentWorkspace.businessRegistration,
        gstNumber: currentWorkspace.gstNumber,
        panNumber: currentWorkspace.panNumber,
      },
      after: updateData
    })

    return NextResponse.json({ 
      ok: true,
      message: "Workspace details updated successfully"
    })
  } catch (error) {
    console.error("[Workspace Details PUT Error]", error)
    return NextResponse.json({ 
      error: "Failed to update workspace details",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    }, { status: 500 })
  }
}