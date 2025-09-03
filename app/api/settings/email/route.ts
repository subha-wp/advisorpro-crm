import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { encrypt } from "@/lib/crypto"
import { isOwner } from "@/lib/auth/roles"

export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isOwner(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const ws = await db.workspace.findUnique({
    where: { id: session.workspaceId },
    select: {
      resend_api_key_enc: true as any,
      resend_from_email: true as any,
      resend_from_name: true as any,
    } as any,
  })

  if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

  return NextResponse.json({
    fromEmail: ws.resend_from_email || "",
    fromName: ws.resend_from_name || "",
    // Do not return decrypted key; only indicate if configured
    isConfigured: !!ws.resend_api_key_enc,
  })
}

export async function PUT(req: Request) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isOwner(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { apiKey, fromEmail, fromName } = body || {}

  if (!fromEmail || typeof fromEmail !== "string") {
    return NextResponse.json({ error: "fromEmail is required" }, { status: 400 })
  }

  const updateData: any = {
    resend_from_email: fromEmail,
    resend_from_name: fromName || null,
  }

  if (apiKey && typeof apiKey === "string") {
    const enc = encrypt(apiKey)
    if (!enc) return NextResponse.json({ error: "Failed to encrypt apiKey" }, { status: 500 })
    updateData.resend_api_key_enc = enc
  }

  await db.workspace.update({
    where: { id: session.workspaceId },
    data: updateData,
  })

  return NextResponse.json({ ok: true })
}
