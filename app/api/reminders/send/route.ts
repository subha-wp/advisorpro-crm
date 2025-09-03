import { NextResponse } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { renderTemplate } from "@/lib/text-template"

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

  // Sending
  if (parsed.data.channel === "email") {
    // Placeholder: integrate Resend or another provider later.
    // For now, record as SENT and return ok.
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
    return NextResponse.json({ ok: true, subject, body: bodyText })
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
    return NextResponse.json({ ok: true, link })
  }
}
