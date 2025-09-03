import { NextResponse } from "next/server"
import { z } from "zod"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { isPremium } from "@/lib/plan"
import { getPrisma } from "@/lib/db"
import { findUpcomingBirthdays, findUpcomingDuePremiums, varsFromClientPolicy } from "@/lib/reminders/automation"
import { renderTemplate } from "@/lib/text-template"

const PreviewSchema = z.object({
  type: z.enum(["birthdays", "due"]),
  days: z.number().int().min(1).max(60).default(7),
  templateId: z.string().uuid(),
  channel: z.enum(["email", "whatsapp"]).default("whatsapp"),
})

export async function POST(req: Request) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!(await isPremium(session.ws))) {
    return NextResponse.json({ error: "Premium feature" }, { status: 402 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = PreviewSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  const prisma = await getPrisma()
  const tpl = await prisma.reminderTemplate.findFirst({
    where: { id: parsed.data.templateId, workspaceId: session.ws },
  })
  if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 })

  if (parsed.data.type === "birthdays") {
    const clients = await findUpcomingBirthdays(session.ws, parsed.data.days)
    const items = clients.map((c) => {
      const vars = varsFromClientPolicy({ name: c.name, email: c.email, mobile: c.mobile }, undefined)
      const subject = tpl.subject ? renderTemplate(tpl.subject, vars) : undefined
      const bodyText = renderTemplate(tpl.body, vars)
      const to = parsed.data.channel === "email" ? c.email : c.mobile
      return { clientId: c.id, subject, body: bodyText, to }
    })
    return NextResponse.json({ items })
  } else {
    const policies = await findUpcomingDuePremiums(session.ws, parsed.data.days)
    const items = policies.map((p) => {
      const vars = varsFromClientPolicy(p.client, {
        policyNumber: p.policyNumber,
        premiumAmount: p.premiumAmount,
        nextDueDate: p.nextDueDate as Date | null,
        insurer: p.insurer,
        planName: p.planName,
      })
      const subject = tpl.subject ? renderTemplate(tpl.subject, vars) : undefined
      const bodyText = renderTemplate(tpl.body, vars)
      const to = parsed.data.channel === "email" ? (p.client?.email ?? "") : (p.client?.mobile ?? "")
      return { clientId: p.client?.id, policyId: p.id, subject, body: bodyText, to }
    })
    return NextResponse.json({ items })
  }
}
