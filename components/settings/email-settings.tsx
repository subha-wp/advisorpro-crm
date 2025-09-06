"use client"

import useSWR from "swr"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Mail, Key, Building2, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function EmailSettings() {
  const { toast } = useToast()
  const { data, isLoading, mutate, error } = useSWR("/api/settings/email", fetcher)
  const [fromEmail, setFromEmail] = useState("")
  const [fromName, setFromName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [saving, setSaving] = useState(false)

  // Update form when data loads
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
      toast({
        title: "Error",
        description: "From email is required",
        variant: "destructive"
      })
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
          fromName: fromName.trim() || undefined 
        }),
      })
      
      const responseData = await res.json()
      
      if (res.ok) {
        toast({ 
          title: "Settings saved", 
          description: "Email settings have been updated successfully" 
        })
        setApiKey("") // Clear the API key field after saving
        mutate() // Refresh the data
      } else {
        toast({ 
          title: "Error", 
          description: responseData.error || "Failed to save email settings",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Network error. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Alert */}
      {error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load email settings. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      ) : configured ? (
        <Alert className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-white">
            Email provider is configured and ready to send emails.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            Email provider not configured. Set up Resend to send professional emails.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Resend Email Provider
            </CardTitle>
            <CardDescription>
              Configure Resend to send emails from your professional domain.{" "}
              <a 
                href="https://resend.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Get your API key from Resend
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              </div>
            ) : (
              <form onSubmit={onSave} className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fromEmail" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      From Email Address *
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
                    <p className="text-xs text-muted-foreground">
                      Must be a verified domain in your Resend account
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fromName">
                      From Name (Optional)
                    </Label>
                    <Input 
                      id="fromName"
                      placeholder="Your Insurance Office" 
                      value={fromName} 
                      onChange={(e) => setFromName(e.target.value)} 
                    />
                    <p className="text-xs text-muted-foreground">
                      Display name that appears in email clients
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="apiKey" className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Resend API Key {configured && "(Already configured)"}
                    </Label>
                    <Input 
                      id="apiKey"
                      type="password" 
                      placeholder={configured ? "Enter new API key to update" : "re_xxxxxxxxxx"} 
                      value={apiKey} 
                      onChange={(e) => setApiKey(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Get your API key from{" "}
                      <a 
                        href="https://resend.com/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Resend Dashboard
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Badge variant={configured ? "default" : "outline"}>
                      {configured ? "Configured" : "Not Configured"}
                    </Badge>
                    {data?.fromEmail && (
                      <span className="text-sm text-muted-foreground">
                        Current: {data.fromEmail}
                      </span>
                    )}
                  </div>
                  
                  <Button type="submit" disabled={saving || !fromEmail.trim()}>
                    {saving ? "Saving..." : "Save Email Settings"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Create Resend Account</p>
                  <p className="text-sm text-muted-foreground">
                    Sign up at{" "}
                    <a 
                      href="https://resend.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      resend.com
                      <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    if you don't have an account
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Verify Your Domain</p>
                  <p className="text-sm text-muted-foreground">
                    Add your domain to Resend and complete DNS verification
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Get API Key</p>
                  <p className="text-sm text-muted-foreground">
                    Generate an API key from your{" "}
                    <a 
                      href="https://resend.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Resend dashboard
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium">Configure Settings</p>
                  <p className="text-sm text-muted-foreground">
                    Enter your API key and from email address in the form
                  </p>
                </div>
              </div>
            </div>

            {/* Test Email Section */}
            {configured && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Test Configuration</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Send a test email to verify your configuration is working
                </p>
                <Button variant="outline" size="sm" disabled>
                  Send Test Email (Coming Soon)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}