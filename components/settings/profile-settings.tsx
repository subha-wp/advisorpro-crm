// @ts-nocheck
"use client"

import useSWR from "swr"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AvatarUpload } from "@/components/ui/avatar-upload"
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

  useEffect(() => {
    if (user) {
      setForm((f) => ({
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
        toast({ title: "Error", description: data.error || "Failed to update profile", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" })
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
        setForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }))
      } else {
        const data = await res.json()
        toast({ title: "Error", description: data.error || "Failed to change password", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return <p className="text-center text-muted-foreground p-6">Loading...</p>
  }

  return (
    <div className="flex flex-col gap-8  max-w-md mx-auto">
      {/* Avatar Section */}
      <section className="flex flex-col items-center gap-3">
        <AvatarUpload
          currentAvatarUrl={user?.avatarUrl}
          userName={user?.name}
          onAvatarUpdate={(avatarUrl) => {
            mutate((current) => ({ ...current, item: { ...current?.item, avatarUrl } }), false)
          }}
          size="2xl"
        />
      </section>

      {/* Profile Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Profile Information</h2>
        <form onSubmit={onUpdateProfile} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="profile-name">Full Name</Label>
            <Input
              id="profile-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Your full name"
            />
          </div>
          <div>
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com"
            />
          </div>
          <div>
            <Label htmlFor="profile-phone">Phone</Label>
            <Input
              id="profile-phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+91 9876543210"
            />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={saving}>
            {saving ? "Saving..." : "Update Profile"}
          </Button>
        </form>
      </section>

      {/* Change Password */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Change Password</h2>
        <form onSubmit={onChangePassword} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
              placeholder="Enter current password"
            />
          </div>
          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              placeholder="Enter new password"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
            />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={saving}>
            {saving ? "Changing..." : "Change Password"}
          </Button>
        </form>
      </section>
    </div>
  )
}
