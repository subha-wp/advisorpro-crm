"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Cloud, Key, ExternalLink, CheckCircle, AlertTriangle } from "lucide-react"

interface CloudinarySetupProps {
  isConfigured: boolean
  cloudName?: string
  onConfigured: () => void
}

export function CloudinarySetup({ isConfigured, cloudName, onConfigured }: CloudinarySetupProps) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    cloudName: cloudName || "",
    apiKey: "",
    apiSecret: "",
  })
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.cloudName || !form.apiKey || !form.apiSecret) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    
    try {
      const res = await fetch("/api/workspace/cloudinary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      
      if (res.ok) {
        toast({ 
          title: "Cloudinary configured", 
          description: "File upload service has been configured successfully" 
        })
        setForm(prev => ({ ...prev, apiKey: "", apiSecret: "" })) // Clear sensitive fields
        onConfigured()
      } else {
        const data = await res.json()
        toast({ 
          title: "Error", 
          description: data.error || "Failed to configure Cloudinary",
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

  if (isConfigured) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            Cloudinary is configured for cloud: <strong>{cloudName}</strong>
          </span>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reconfigure
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Configure Cloudinary
        </CardTitle>
        <CardDescription>
          Set up your Cloudinary account to enable file uploads.{" "}
          <a 
            href="https://cloudinary.com/console" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            Get your credentials from Cloudinary Console
            <ExternalLink className="h-3 w-3" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cloudName" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Cloud Name *
              </Label>
              <Input
                id="cloudName"
                value={form.cloudName}
                onChange={(e) => setForm(f => ({ ...f, cloudName: e.target.value }))}
                placeholder="your-cloud-name"
                required
              />
              <p className="text-xs text-muted-foreground">
                Found in your Cloudinary dashboard URL: cloudinary.com/console/c/YOUR_CLOUD_NAME
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apiKey" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Key *
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm(f => ({ ...f, apiKey: e.target.value }))}
                placeholder="123456789012345"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apiSecret">
                API Secret *
              </Label>
              <Input
                id="apiSecret"
                type="password"
                value={form.apiSecret}
                onChange={(e) => setForm(f => ({ ...f, apiSecret: e.target.value }))}
                placeholder="abcdefghijklmnopqrstuvwxyz"
                required
              />
              <p className="text-xs text-muted-foreground">
                Your credentials are encrypted and stored securely
              </p>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Setup Instructions:</p>
                <ol className="text-sm space-y-1 ml-4 list-decimal">
                  <li>Create a free account at cloudinary.com</li>
                  <li>Go to your Dashboard → Settings → API Keys</li>
                  <li>Copy your Cloud Name, API Key, and API Secret</li>
                  <li>Create an unsigned upload preset in Settings → Upload</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Configuring..." : "Configure Cloudinary"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}