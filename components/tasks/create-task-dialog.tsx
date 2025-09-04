"use client"

import useSWR from "swr"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateTaskDialog({ open, onOpenChange, onSuccess }: CreateTaskDialogProps) {
  const { toast } = useToast()
  const { data: teamData } = useSWR("/api/team", fetcher)
  const { data: clientsData } = useSWR("/api/clients?pageSize=100", fetcher)
  const { data: policiesData } = useSWR("/api/policies?pageSize=100", fetcher)
  const { data: profileData } = useSWR("/api/user/profile", fetcher)
  
  const teamMembers = teamData?.items ?? []
  const clients = clientsData?.items ?? []
  const policies = policiesData?.items ?? []
  const currentUser = profileData?.item

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    type: "OTHER",
    assignedToUserId: "",
    clientId: "",
    policyId: "",
    dueDate: "",
    assignToSelf: false,
  })
  const [submitting, setSubmitting] = useState(false)

  // Auto-assign logic based on user role
  const isOwner = currentUser?.role === "OWNER"
  const shouldAutoAssign = !isOwner || form.assignToSelf
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        type: form.type,
        assignedToUserId: shouldAutoAssign 
          ? (form.assignedToUserId === "unassigned" ? currentUser?.id : form.assignedToUserId || currentUser?.id) 
          : (form.assignedToUserId === "unassigned" ? undefined : form.assignedToUserId || undefined),
        clientId: form.clientId === "none" ? undefined : form.clientId || undefined,
        policyId: form.policyId === "none" ? undefined : form.policyId || undefined,
        dueDate: form.dueDate || undefined,
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      if (res.ok) {
        toast({ 
          title: "Activity created", 
          description: isOwner && !form.assignToSelf 
            ? "Activity created and ready for assignment"
            : "Activity created and assigned successfully"
        })
        setForm({
          title: "",
          description: "",
          priority: "MEDIUM",
          type: "OTHER",
          assignedToUserId: "",
          clientId: "",
          policyId: "",
          dueDate: "",
          assignToSelf: false,
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        const data = await res.json()
        toast({ 
          title: "Error", 
          description: data.error || "Failed to create activity",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Activity</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Activity Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Follow up with client about policy renewal"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Additional details about the activity..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(value) => setForm(f => ({ ...f, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Activity Type</Label>
              <Select value={form.type} onValueChange={(value) => setForm(f => ({ ...f, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                  <SelectItem value="POLICY_RENEWAL">Policy Renewal</SelectItem>
                  <SelectItem value="CLAIM_ASSISTANCE">Claim Assistance</SelectItem>
                  <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                  <SelectItem value="MEETING">Meeting</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignment Logic */}
          {isOwner ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="assignToSelf"
                  checked={form.assignToSelf}
                  onCheckedChange={(checked) => setForm(f => ({ ...f, assignToSelf: checked }))}
                />
                <Label htmlFor="assignToSelf">Assign to myself</Label>
              </div>
              
              {form.assignToSelf ? (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This activity will be assigned to you ({currentUser?.name})
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label>Assign To Staff Member</Label>
                  <Select value={form.assignedToUserId} onValueChange={(value) => setForm(f => ({ ...f, assignedToUserId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member (can assign later)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Assign later</SelectItem>
                      {teamMembers.filter((m: any) => m.role !== "OWNER").map((member: any) => (
                        <SelectItem key={member.user.id} value={member.user.id}>
                          {member.user.name} ({member.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(!form.assignedToUserId || form.assignedToUserId === "unassigned") && (
                    <p className="text-xs text-muted-foreground">
                      You can assign this activity to a staff member later
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                This activity will be assigned to you ({currentUser?.name})
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Related Client</Label>
              <Select value={form.clientId} onValueChange={(value) => setForm(f => ({ ...f, clientId: value === "none" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client</SelectItem>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Related Policy</Label>
              <Select value={form.policyId} onValueChange={(value) => setForm(f => ({ ...f, policyId: value === "none" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select policy (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No policy</SelectItem>
                  {policies.map((policy: any) => (
                    <SelectItem key={policy.id} value={policy.id}>
                      {policy.policyNumber} - {policy.insurer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}