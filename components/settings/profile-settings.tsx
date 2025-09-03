"use client"

import useSWR from "swr"
import { useEffect } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ProfileSettings() {
  const { toast } = useToast()
  const { data, mutate, isLoading } = useSWR("/api/user/profile", fetcher)
  const user = data?.item
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [saving, setSaving] = useState(false)

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }))
    }
  }, [user])

  async function onUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
        }),
      })
      
      if (res.ok) {
        toast({ title: "Profile updated", description: "Your profile has been updated successfully" })
        mutate()
      } else {
        const data = await res.json()
        toast({ 
          title: "Error", 
          description: data.error || "Failed to update profile",
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

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault()
    
    if (form.newPassword !== form.confirmPassword) {
      toast({ 
        title: "Error", 
        description: "New passwords do not match",
        variant: "destructive"
      })
      return
    }
    
    setSaving(true)
    
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      })
      
      if (res.ok) {
        toast({ title: "Password changed", description: "Your password has been updated successfully" })
        setForm(f => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }))
      } else {
        const data = await res.json()
        toast({ 
          title: "Error", 
          description: data.error || "Failed to change password",
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onUpdateProfile} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="profile-name">Full Name</Label>
              <Input
                id="profile-name"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input
                id="profile-phone"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 9876543210"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Update Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onChangePassword} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm(f => ({ ...f, currentPassword: e.target.value }))}
                placeholder="Enter current password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Enter new password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}