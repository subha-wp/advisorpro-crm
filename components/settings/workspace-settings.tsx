"use client"

import useSWR from "swr"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function WorkspaceSettings() {
  const { toast } = useToast()
  const { data, mutate, isLoading } = useSWR("/api/workspace", fetcher)
  const workspace = data?.item
  
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)

  // Update form when data loads
  useEffect(() => {
    if (workspace?.name) {
      setName(workspace.name)
    }
  }, [workspace])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    
    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      
      if (res.ok) {
        toast({ title: "Saved", description: "Workspace settings updated" })
        mutate()
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
          <CardTitle>Workspace Information</CardTitle>
          <CardDescription>
            Manage your workspace settings and view usage statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onSave} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Insurance Office"
                required
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan & Usage</CardTitle>
          <CardDescription>
            Current plan limits and usage statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current Plan:</span>
            <Badge variant={workspace?.plan === "PREMIUM" ? "default" : "outline"}>
              {workspace?.plan || "FREE"}
            </Badge>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Team Members</span>
                <span>{workspace?._count?.memberships || 0}/3</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(100, ((workspace?._count?.memberships || 0) / 3) * 100)}%` 
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Clients</span>
                <span>{workspace?._count?.clients || 0}/100</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(100, ((workspace?._count?.clients || 0) / 100) * 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Owner: {workspace?.owner?.name} ({workspace?.owner?.email})
            </p>
            <p className="text-xs text-muted-foreground">
              Created: {workspace?.createdAt ? new Date(workspace.createdAt).toLocaleDateString() : "Unknown"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}