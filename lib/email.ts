// @ts-nocheck
import { getPrisma } from "@/lib/db"
import { decrypt } from "@/lib/crypto"
import { Resend } from "resend"

export async function getWorkspaceResend(workspaceId: string) {
  const prisma = await getPrisma()
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      resendApiKeyEnc: true,
      resendFromEmail: true,
      resendFromName: true,
    },
  })
  
  if (!ws || !ws.resendApiKeyEnc || !ws.resendFromEmail) return null

  const apiKey = decrypt(ws.resendApiKeyEnc)
  if (!apiKey) return null

  const resend = new Resend(apiKey)
  const from = ws.resendFromName ? `${ws.resendFromName} <${ws.resendFromEmail}>` : ws.resendFromEmail

  return { resend, from }
}

export async function sendEmail({
  workspaceId,
  to,
  subject,
  html,
  text,
}: {
  workspaceId: string
  to: string
  subject: string
  html?: string
  text?: string
}) {
  const emailConfig = await getWorkspaceResend(workspaceId)
  if (!emailConfig) {
    throw new Error("Email not configured for this workspace")
  }

  const { resend, from } = emailConfig

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    })

    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error("[Email Send Error]", error)
    throw new Error(`Failed to send email: ${(error as Error).message}`)
  }
}