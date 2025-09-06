"use client"

import useSWR from "swr"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { UpgradePrompt } from "@/components/upgrade-modal"
import { useToast } from "@/hooks/use-toast"
import { LocationDashboard } from "@/components/team/location-dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function TeamPage() {
  const { toast } = useToast()
  const { data, mutate, isLoading } = useSWR("/api/team", fetcher)
  const members = data?.items ?? []
  const limits = data?.limits
  
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "AGENT" as "AGENT" | "VIEWER"
  })
  const [submitting, setSubmitting] = useState(false)

  async function onInvite(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast({ 
          title: "User invited", 
          description: data.tempPassword 
            ? `Temporary password: ${data.tempPassword}` 
            : "User added to workspace"
        })
        setOpen(false)
        setForm({ name: "", email: "", phone: "", role: "AGENT" })
        mutate()
      } else {
        toast({ 
          title: "Error", 
          description: data.error || "Failed to invite user",
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
      setSubmitting(false)
    }
  }

  async function onRemove(memberId: string, userName: string) {
    if (!confirm(`Remove ${userName} from the workspace?`)) return
    
    try {
      const res = await fetch(`/api/team/${memberId}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "User removed", description: `${userName} has been removed from the workspace` })
        mutate()
      } else {
        const data = await res.json()
        toast({ 
          title: "Error", 
          description: data.error || "Failed to remove user",
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

  async function onChangeRole(memberId: string, newRole: "AGENT" | "VIEWER") {
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      
      if (res.ok) {
        toast({ title: "Role updated", description: "User role has been changed" })
        mutate()
      } else {
        const data = await res.json()
        toast({ 
          title: "Error", 
          description: data.error || "Failed to update role",
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
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-balance">Team</h1>
          <p className="text-sm text-muted-foreground">
            Manage staff and track locations • {limits?.current || 0}/{limits?.max || 0} users
          </p>
        </div>
        {!limits?.canAdd ? (
          <UpgradePrompt trigger={<Button>Upgrade to add more</Button>} />
        ) : (
          <Button onClick={() => setOpen(true)}>Invite Member</Button>
        )}
      </header>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No team members yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        members.map((member: any) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">{member.user.name}</TableCell>
                            <TableCell>{member.user.email}</TableCell>
                            <TableCell>{member.user.phone}</TableCell>
                            <TableCell>
                              {member.role === "OWNER" ? (
                                <Badge variant="default">Owner</Badge>
                              ) : (
                                <select
                                  value={member.role}
                                  onChange={(e) => onChangeRole(member.id, e.target.value as any)}
                                  className="border rounded px-2 py-1 text-sm"
                                  disabled={member.role === "OWNER"}
                                >
                                  <option value="AGENT">Agent</option>
                                  <option value="VIEWER">Viewer</option>
                                </select>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(member.user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {member.role !== "OWNER" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => onRemove(member.id, member.user.name)}
                                >
                                  Remove
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="locations">
          <LocationDashboard />
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={onInvite} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 9876543210"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setForm(f => ({ ...f, role: e.target.value as any }))}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="AGENT">Team Member - Can manage clients and policies</option>
                <option value="VIEWER">Viewer - Read-only access</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Inviting..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
