"use client"

import useSWR from "swr"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Mail, Key, CheckCircle, AlertTriangle, ExternalLink, ArrowLeft } from "lucide-react"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function EmailSettings() {
  const { toast } = useToast()
  const { data, isLoading, mutate, error } = useSWR("/api/settings/email", fetcher)
  const [fromEmail, setFromEmail] = useState("")
  const [fromName, setFromName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [testEmail, setTestEmail] = useState("")
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (data) {
      setFromEmail(data.fromEmail || "")
      setFromName(data.fromName || "")
    }
  }, [data])

  const configured = !!data?.isConfigured

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!fromEmail.trim()) {
      toast({ title: "Error", description: "From email is required", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/settings/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim() || undefined,
          fromEmail: fromEmail.trim(),
          fromName: fromName.trim() || undefined,
        }),
      })
      const responseData = await res.json()

      if (res.ok) {
        toast({ title: "Settings saved", description: "Email settings have been updated successfully" })
        setApiKey("")
        mutate()
      } else {
        toast({ title: "Error", description: responseData.error || "Failed to save email settings", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function onTestEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!testEmail.trim()) {
      toast({ title: "Error", description: "Please enter a test email address", variant: "destructive" })
      return
    }

    setTesting(true)
    try {
      const res = await fetch("/api/settings/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail: testEmail.trim() }),
      })
      const responseData = await res.json()

      if (res.ok) {
        toast({ title: "Test email sent", description: `Check your inbox at ${testEmail}` })
        setTestEmail("")
      } else {
        toast({ title: "Test failed", description: responseData.error || "Failed to send test email", variant: "destructive" })
      }
    } catch {
      toast({ title: "Test failed", description: "Network error. Please try again.", variant: "destructive" })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">

      <main className="flex-1 overflow-y-auto px-2 py-6 space-y-8">
        {/* Status Alert */}
        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Failed to load email settings. Check your connection.</AlertDescription>
          </Alert>
        ) : configured ? (
          <Alert className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Email provider is configured and ready.</AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>Email provider not configured. Set up Resend first.</AlertDescription>
          </Alert>
        )}

        {/* Form Section */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Resend Provider</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <form onSubmit={onSave} className="flex flex-col gap-6">
              <div>
                <Label htmlFor="fromEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> From Email Address *
                </Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="noreply@yourdomain.com"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  required
                  className="font-mono"
                />
              </div>

              <div>
                <Label htmlFor="fromName">From Name (optional)</Label>
                <Input
                  id="fromName"
                  placeholder="Your Company"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="apiKey" className="flex items-center gap-2">
                  <Key className="h-4 w-4" /> API Key {configured && "(Already set)"}
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={configured ? "Enter new key to update" : "re_xxxxxxxx"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get your API key from{" "}
                  <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline inline-flex items-center gap-1"
                  >
                    Resend Dashboard
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <Badge variant={configured ? "default" : "outline"}>
                  {configured ? "Configured" : "Not Configured"}
                </Badge>
                <Button type="submit" className="rounded-xl w-40" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          )}
        </section>

        {/* Instructions Section */}
        <section className="space-y-5">
          <h2 className="text-base font-semibold">Setup Instructions</h2>
          {[
            "Create Resend account at resend.com",
            "Verify your domain via DNS",
            "Generate API key in Resend dashboard",
            "Enter API key & email here",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                {i + 1}
              </div>
              <p className="text-sm">{step}</p>
            </div>
          ))}
        </section>

        {/* Test Email Section */}
        {configured && (
          <section className="space-y-3 border-t pt-4">
            <h2 className="text-base font-semibold">Test Configuration</h2>
            <form onSubmit={onTestEmail} className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter test email address"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={testing}>
                {testing ? "Sending..." : "Send"}
              </Button>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}
