"use client"

import useSWR from "swr"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function QuickSend() {
  const { data: templatesData } = useSWR("/api/templates", fetcher)
  const templates = templatesData?.items ?? []
  const [templateId, setTemplateId] = useState<string>("")
  const [channel, setChannel] = useState<"email" | "whatsapp">("whatsapp")
  const [clientId, setClientId] = useState("")
  const [policyId, setPolicyId] = useState("")
  const [to, setTo] = useState("")
  const [preview, setPreview] = useState("")

  function onTemplateChange(id: string) {
    setTemplateId(id)
    const tpl = templates.find((t: any) => t.id === id)
    if (tpl) setChannel(tpl.channel)
  }

  async function buildPreview() {
    if (!templateId) return
    // Ask server to render variables by fetching entities; alternatively client-side editable preview:
    const tpl = templates.find((t: any) => t.id === templateId)
    if (!tpl) return
    // Minimal preview using dummy tokens; real render will happen server-side on send.
    setPreview(tpl.body)
  }

  async function onSend() {
    if (!templateId) return
    const res = await fetch("/api/reminders/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId,
        channel,
        clientId: clientId || undefined,
        policyId: policyId || undefined,
        to: to || undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error ?? "Failed to send")
      return
    }
    if (channel === "whatsapp" && data.link) {
      window.open(data.link, "_blank", "noopener,noreferrer")
    } else {
      alert("Email queued")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-balance">Quick Send</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="grid gap-1">
            <Label>Template</Label>
            <select
              className="border rounded px-2 py-2 text-sm"
              value={templateId}
              onChange={(e) => onTemplateChange(e.target.value)}
            >
              <option value="">Select a template</option>
              {templates.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.channel})
                </option>
              ))}
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
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="grid gap-1">
            <Label>Client ID (optional)</Label>
            <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="uuid" />
          </div>
          <div className="grid gap-1">
            <Label>Policy ID (optional)</Label>
            <Input value={policyId} onChange={(e) => setPolicyId(e.target.value)} placeholder="uuid" />
          </div>
          <div className="grid gap-1">
            <Label>To (override)</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="email or mobile number (digits)" />
          </div>
        </div>
        <div className="grid gap-1">
          <Label>Preview</Label>
          <Textarea rows={5} value={preview} onChange={(e) => setPreview(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={buildPreview}>
              Load Template
            </Button>
            <Button onClick={onSend}>Send</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
