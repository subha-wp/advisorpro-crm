// @ts-nocheck
import { getPrisma } from "@/lib/db"
import { decrypt } from "@/lib/crypto"
import { Resend } from "resend"

// System-wide Resend configuration from environment variables
// Used for emails when workspace-specific configuration isn't available (e.g., signup welcome emails).
// Requires RESEND_API_KEY and RESEND_FROM_EMAIL in .env, with RESEND_FROM_NAME optional for branding.
const resendSystem = new Resend(process.env.RESEND_API_KEY)
const fromSystem = process.env.RESEND_FROM_NAME 
  ? `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>` 
  : process.env.RESEND_FROM_EMAIL

/**
 * Get Resend configuration for a specific workspace.
 * Fetches encrypted API key, sender email, and display name from the Workspace model,
 * decrypts the API key, and initializes a Resend instance.
 * Returns null if the workspace hasn't configured email settings.
 * 
 * Use case: Sending branded emails for CRM activities like premium reminders, team invites,
 * policy maturity notifications, or birthday greetings after workspace setup.
 */
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

/**
 * Send email using workspace-specific Resend configuration.
 * Used for all regular CRM activities (e.g., premium reminders, team invites) after workspace setup.
 * Falls back to sendSystemEmail if workspace email isn't configured to prevent failures.
 * 
 * Use case: Sending emails from the workspace's branded email (e.g., "John’s Insurance Agency <advisor@theircompany.com>").
 * If workspace email isn't set up, it uses the system email (e.g., "AdvisorPro CRM <onboarding@codvix.in>").
 */
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
    console.warn(`[Email] Workspace ${workspaceId} email not configured, falling back to system email`)
    return sendSystemEmail({ to, subject, html, text })
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

/**
 * Send system email using global Resend configuration from .env.
 * Used for initial emails (e.g., signup welcome) when workspace email isn't set up.
 * Also serves as a fallback for sendEmail if workspace configuration is missing.
 * 
 * Use case: Sending emails from the system’s default email (e.g., "AdvisorPro CRM <onboarding@codvix.in>")
 * during signup or for system-level notifications (e.g., to admins).
 */
export async function sendSystemEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html?: string
  text?: string
}) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw new Error("System email configuration not set in environment")
  }

  try {
    const result = await resendSystem.emails.send({
      from: fromSystem,
      to,
      subject,
      html,
      text,
    })

    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error("[System Email Send Error]", error)
    throw new Error(`Failed to send system email: ${(error as Error).message}`)
  }
}