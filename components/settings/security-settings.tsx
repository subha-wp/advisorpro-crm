"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function SecuritySettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    loginAlerts: true,
    sessionTimeout: 15, // minutes
  })
  const [saving, setSaving] = useState(false)

  async function onSave() {
    setSaving(true)
    
    try {
      const res = await fetch("/api/user/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      
      if (res.ok) {
        toast({ title: "Settings saved", description: "Security settings have been updated" })
      } else {
        const data = await res.json()
        toast({ 
          title: "Error", 
          description: data.error || "Failed to save settings",
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

  async function onLogoutAllSessions() {
    if (!confirm("This will log you out of all devices. Continue?")) return
    
    try {
      const res = await fetch("/api/auth/logout-all", { method: "POST" })
      if (res.ok) {
        toast({ title: "Success", description: "Logged out of all sessions" })
        // Redirect to login
        window.location.href = "/login"
      } else {
        toast({ 
          title: "Error", 
          description: "Failed to logout all sessions",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Network error. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Preferences</CardTitle>
          <CardDescription>
            Configure security settings for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              checked={settings.twoFactorEnabled}
              onCheckedChange={(checked) => 
                setSettings(s => ({ ...s, twoFactorEnabled: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for important events
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => 
                setSettings(s => ({ ...s, emailNotifications: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Login Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone logs into your account
              </p>
            </div>
            <Switch
              checked={settings.loginAlerts}
              onCheckedChange={(checked) => 
                setSettings(s => ({ ...s, loginAlerts: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Session Timeout (minutes)</Label>
            <select
              value={settings.sessionTimeout}
              onChange={(e) => setSettings(s => ({ ...s, sessionTimeout: Number(e.target.value) }))}
              className="border rounded px-3 py-2 text-sm w-full"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={240}>4 hours</option>
              <option value={480}>8 hours</option>
            </select>
          </div>

          <Button onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save Security Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>
            Manage your active sessions across devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Active Sessions</p>
              <p className="text-sm text-muted-foreground">
                You are currently logged in on this device
              </p>
            </div>
            <Button variant="destructive" onClick={onLogoutAllSessions}>
              Logout All Sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}