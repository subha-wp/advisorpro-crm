"use client"

import useSWR from "swr"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function EmailSettingsPage() {
  const { toast } = useToast()
  const { data, isLoading, mutate } = useSWR("/api/settings/email", fetcher)
  const [fromEmail, setFromEmail] = useState("")
  const [fromName, setFromName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [saving, setSaving] = useState(false)

  const configured = !!data?.isConfigured

  return (
    <main className="p-4 md:p-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-pretty">Email Provider (Resend)</CardTitle>
          <CardDescription>
            Send emails from your own professional address. Only workspace Owners can edit.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">From Email</label>
            <Input
              type="email"
              placeholder="you@yourdomain.com"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">From Name (optional)</label>
            <Input placeholder="Your Office Name" value={fromName} onChange={(e) => setFromName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Resend API Key {configured ? "(Already set)" : ""}</label>
            <Input type="password" placeholder="re_..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          </div>
          <div>
            <Button
              disabled={saving}
              onClick={async () => {
                setSaving(true)
                try {
                  const res = await fetch("/api/settings/email", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ apiKey: apiKey || undefined, fromEmail, fromName }),
                  })
                  const json = await res.json()
                  if (!res.ok) throw new Error(json?.error || "Failed to save settings")
                  toast({ title: "Saved", description: "Email settings updated." })
                  setApiKey("")
                  setFromEmail("")
                  setFromName("")
                  mutate()
                } catch (e: any) {
                  toast({ title: "Error", description: e.message, variant: "destructive" })
                } finally {
                  setSaving(false)
                }
              }}
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading current settings...</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Status: {configured ? "Configured" : "Not configured"}
              {data?.fromEmail ? ` • From: ${data.fromEmail}` : ""}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
