import { db } from "@/lib/db"
import { decrypt } from "@/lib/crypto"
import { Resend } from "resend"

export async function getWorkspaceResend(workspaceId: string) {
  const ws = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      resend_api_key_enc: true as any,
      resend_from_email: true as any,
      resend_from_name: true as any,
    } as any,
  })
  if (!ws || !ws.resend_api_key_enc || !ws.resend_from_email) return null

  const apiKey = decrypt(ws.resend_api_key_enc)
  if (!apiKey) return null

  const resend = new Resend(apiKey)
  const from = ws.resend_from_name ? `${ws.resend_from_name} <${ws.resend_from_email}>` : ws.resend_from_email

  return { resend, from }
}
