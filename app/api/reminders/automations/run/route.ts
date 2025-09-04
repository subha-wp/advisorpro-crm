// @ts-nocheck
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { isPremium } from "@/lib/plan"
import { getPrisma } from "@/lib/db"
import { findUpcomingBirthdays, findUpcomingDuePremiums, varsFromClientPolicy } from "@/lib/reminders/automation"
import { renderTemplate } from "@/lib/text-template"

const RunSchema = z.object({
  type: z.enum(["birthdays", "due"]),
  days: z.number().int().min(1).max(60).default(7),
  templateId: z.string().uuid(),
  channel: z.enum(["email", "whatsapp"]).default("whatsapp"),
})

function digitsOnly(s: string) {
  return s.replace(/\D/g, "")
}

export async function POST(req: Request) {
  const session = await requireRole(ROLES.STAFF)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!(await isPremium(session.ws))) {
    return NextResponse.json({ error: "Premium feature" }, { status: 402 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = RunSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  const prisma = await getPrisma()
  const tpl = await prisma.reminderTemplate.findFirst({
    where: { id: parsed.data.templateId, workspaceId: session.ws },
  })
  if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 })

  const isBirthdays = parsed.data.type === "birthdays"
  const targets = isBirthdays
    ? await findUpcomingBirthdays(session.ws, parsed.data.days)
    : await findUpcomingDuePremiums(session.ws, parsed.data.days)

  const results: any[] = []
  for (const t of targets) {
    const client = isBirthdays ? t : t.client
    const policy = isBirthdays ? undefined : t
    const vars = varsFromClientPolicy(client ?? undefined, policy as any)
    const subject = tpl.subject ? renderTemplate(tpl.subject, vars) : undefined
    const bodyText = renderTemplate(tpl.body, vars)
    const to = parsed.data.channel === "email" ? (client?.email ?? "") : client?.mobile ? client.mobile : ""

    if (!to) continue

    if (parsed.data.channel === "email") {
      await prisma.reminderLog.create({
        data: {
          workspaceId: session.ws,
          clientId: client?.id,
          policyId: (policy as any)?.id,
          templateId: tpl.id,
          channel: "email",
          to,
          status: "SENT",
        },
      })
      results.push({ clientId: client?.id, policyId: (policy as any)?.id, subject, body: bodyText })
    } else {
      const phone = digitsOnly(to)
      const link = `https://wa.me/${phone}?text=${encodeURIComponent(bodyText)}`
      await prisma.reminderLog.create({
        data: {
          workspaceId: session.ws,
          clientId: client?.id,
          policyId: (policy as any)?.id,
          templateId: tpl.id,
          channel: "whatsapp",
          to,
          status: "QUEUED",
        },
      })
      results.push({ clientId: client?.id, policyId: (policy as any)?.id, link })
    }
  }

  return NextResponse.json({ count: results.length, items: results })
}
