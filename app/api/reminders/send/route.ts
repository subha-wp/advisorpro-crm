// @ts-nocheck
import { NextResponse } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { renderTemplate } from "@/lib/text-template"
import { sendEmail } from "@/lib/email"
import { apiLimiter } from "@/lib/rate-limit"

const SendSchema = z.object({
  templateId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  policyId: z.string().uuid().optional(),
  channel: z.enum(["email", "whatsapp"]),
  // if provided, overrides client/policy destination
  to: z.string().optional(),
})

function digitsOnly(s: string) {
  return s.replace(/\D/g, "")
}

export async function POST(req: Request) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req as any, 10, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = SendSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  const prisma = await getPrisma()
  const tpl = await prisma.reminderTemplate.findFirst({
    where: { id: parsed.data.templateId, workspaceId: session.ws },
  })
  if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 })

  // Load entities to build variables and default destination
  const client = parsed.data.clientId
    ? await prisma.client.findFirst({ where: { id: parsed.data.clientId, workspaceId: session.ws } })
    : null
  const policy = parsed.data.policyId ? await prisma.policy.findFirst({ where: { id: parsed.data.policyId } }) : null

  const vars = {
    client_name: client?.name ?? "",
    client_mobile: client?.mobile ?? "",
    client_email: client?.email ?? "",
    policy_no: policy?.policyNumber ?? "",
    premium_amount: policy?.premiumAmount ?? "",
    due_date: policy?.nextDueDate ? new Date(policy.nextDueDate).toLocaleDateString() : "",
    insurer: policy?.insurer ?? "",
    plan_name: policy?.planName ?? "",
  }

  const subject = tpl.subject ? renderTemplate(tpl.subject, vars) : undefined
  const bodyText = renderTemplate(tpl.body, vars)

  let to = parsed.data.to
  if (!to) {
    to = parsed.data.channel === "email" ? (client?.email ?? "") : (client?.mobile ?? "")
  }
  if (!to) return NextResponse.json({ error: "Destination missing" }, { status: 400 })

  try {
    // Sending
    if (parsed.data.channel === "email") {
      // Use the workspace's configured Resend settings
      await sendEmail({
        workspaceId: session.ws,
        to,
        subject: subject || "Reminder from AdvisorPro",
        text: bodyText,
        html: `<p>${bodyText.replace(/\n/g, '<br>')}</p>`,
      })

      await prisma.reminderLog.create({
        data: {
          workspaceId: session.ws,
          clientId: client?.id,
          policyId: policy?.id,
          templateId: tpl.id,
          channel: "email",
          to,
          status: "SENT",
        },
      })
      
      return NextResponse.json({ ok: true, subject, body: bodyText, message: "Email sent successfully" })
    } else {
      const phone = digitsOnly(to)
      const link = `https://wa.me/${phone}?text=${encodeURIComponent(bodyText)}`
      
      await prisma.reminderLog.create({
        data: {
          workspaceId: session.ws,
          clientId: client?.id,
          policyId: policy?.id,
          templateId: tpl.id,
          channel: "whatsapp",
          to,
          status: "QUEUED",
        },
      })
      
      return NextResponse.json({ ok: true, link, message: "WhatsApp link generated" })
    }
  } catch (error) {
    console.error("[Send Reminder Error]", error)
    
    // Log the failed attempt
    await prisma.reminderLog.create({
      data: {
        workspaceId: session.ws,
        clientId: client?.id,
        policyId: policy?.id,
        templateId: tpl.id,
        channel: parsed.data.channel,
        to,
        status: "FAILED",
        error: (error as Error).message,
      },
    })

    return NextResponse.json({ 
      error: "Failed to send reminder", 
      details: (error as Error).message 
    }, { status: 500 })
  }
}