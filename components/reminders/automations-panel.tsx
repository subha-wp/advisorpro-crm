"use client"

import useSWR from "swr"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AutomationsPanel() {
  const { data: planData } = useSWR("/api/plan", fetcher)
  const plan = planData?.plan as "FREE" | "PREMIUM" | "PENDING" | undefined

  const { data: templatesData } = useSWR("/api/templates", fetcher)
  const templates = templatesData?.items ?? []

  const [type, setType] = useState<"birthdays" | "due">("birthdays")
  const [channel, setChannel] = useState<"email" | "whatsapp">("whatsapp")
  const [days, setDays] = useState(7)
  const [templateId, setTemplateId] = useState<string>("")
  const [preview, setPreview] = useState<any[]>([])
  const [running, setRunning] = useState(false)

  async function onPreview() {
    if (!templateId) return
    const res = await fetch("/api/reminders/automations/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, days, templateId, channel }),
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error || "Preview failed")
      return
    }
    setPreview(data.items || [])
  }

  async function onRun() {
    if (!templateId) return
    setRunning(true)
    try {
      const res = await fetch("/api/reminders/automations/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, days, templateId, channel }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Run failed")
        return
      }
      if (channel === "whatsapp") {
        // Open links one by one for user to confirm
        for (const item of data.items || []) {
          if (item.link) window.open(item.link, "_blank", "noopener,noreferrer")
        }
      } else {
        alert(`Queued ${data.count} emails`)
      }
    } finally {
      setRunning(false)
    }
  }

  const premiumLocked = plan && plan !== "PREMIUM"

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-balance">Premium Automations</CardTitle>
        {premiumLocked ? (
          <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">Requires Premium</span>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-4">
        {premiumLocked ? (
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">
              Automations are a premium feature. Upgrade to unlock bulk WhatsApp/email for birthdays and due premiums.
            </p>
            <Button asChild>
              <a href="/billing">Upgrade to Premium</a>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-3">
              <div className="grid gap-1">
                <Label>Automation Type</Label>
                <select
                  className="border rounded px-2 py-2 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                >
                  <option value="birthdays">Upcoming Birthdays</option>
                  <option value="due">Upcoming Premium Dues</option>
                </select>
              </div>
              <div className="grid gap-1">
                <Label>Channel</Label>
                <select
                  className="border rounded px-2 py-2 text-sm"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                >
                  <option value="whatsapp">whatsapp</option>
                  <option value="email">email</option>
                </select>
              </div>
              <div className="grid gap-1">
                <Label>Within Days</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={days}
                  onChange={(e) => setDays(Number.parseInt(e.target.value || "1", 10))}
                />
              </div>
              <div className="grid gap-1">
                <Label>Template</Label>
                <select
                  className="border rounded px-2 py-2 text-sm"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  <option value="">Select a template</option>
                  {templates.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.channel})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onPreview}>
                Preview
              </Button>
              <Button onClick={onRun} disabled={running || preview.length === 0}>
                {running ? "Running..." : "Run Now"}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>To</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>No preview yet</TableCell>
                    </TableRow>
                  ) : (
                    preview.map((p: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="max-w-[220px] truncate">{p.to}</TableCell>
                        <TableCell className="max-w-[220px] truncate">{p.subject ?? "-"}</TableCell>
                        <TableCell className="max-w-[520px] truncate">{p.body}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
