"use client"

import useSWR from "swr"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface AssignTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: any
  onSuccess?: () => void
}

export function AssignTaskDialog({ open, onOpenChange, task, onSuccess }: AssignTaskDialogProps) {
  const { toast } = useToast()
  const { data: teamData } = useSWR("/api/team", fetcher)
  const teamMembers = teamData?.items ?? []
  
  const [assignedToUserId, setAssignedToUserId] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (task) {
      setAssignedToUserId(task.assignedToUserId || "")
    }
  }, [task])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!task) return
    
    setSubmitting(true)
    
    try {
      const res = await fetch(`/api/tasks/${task.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedToUserId: assignedToUserId || null,
        }),
      })
      
      if (res.ok) {
        toast({ 
          title: "Task assigned", 
          description: assignedToUserId 
            ? "Task has been assigned successfully" 
            : "Task has been unassigned"
        })
        onSuccess?.()
      } else {
        const data = await res.json()
        toast({ 
          title: "Error", 
          description: data.error || "Failed to assign task",
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

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Task: {task.title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Assign To</Label>
            <Select value={assignedToUserId} onValueChange={setAssignedToUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {teamMembers.map((member: any) => (
                  <SelectItem key={member.user.id} value={member.user.id}>
                    {member.user.name} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            <p><strong>Current assignment:</strong> {task.assignedTo?.name || "Unassigned"}</p>
            <p><strong>Created by:</strong> {task.createdBy?.name}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Assigning..." : "Update Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}