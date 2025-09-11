"use client"

import useSWR from "swr"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface AssignTaskDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: any
  onSuccess?: () => void
}

export function AssignTaskDrawer({ open, onOpenChange, task, onSuccess }: AssignTaskDrawerProps) {
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
          assignedToUserId: assignedToUserId === "unassigned" ? null : assignedToUserId || null,
        }),
      })

      if (res.ok) {
        toast({
          title: "Task assigned",
          description: assignedToUserId
            ? "Task has been assigned successfully"
            : "Task has been unassigned",
        })
        onSuccess?.()
        onOpenChange(false)
      } else {
        const data = await res.json()
        toast({
          title: "Error",
          description: data.error || "Failed to assign task",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!task) return null

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="p-4 space-y-4 rounded-t-2xl">
        <DrawerHeader>
          <DrawerTitle className="text-lg font-semibold">
            Assign Task
          </DrawerTitle>
          <p className="text-sm text-muted-foreground">{task.title}</p>
        </DrawerHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Assign To</Label>
            <Select value={assignedToUserId} onValueChange={setAssignedToUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((member: any) => (
                  <SelectItem key={member.user.id} value={member.user.id}>
                    {member.user.name} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Current:</strong>{" "}
              {task.assignedTo?.name || "Unassigned"}
            </p>
            <p>
              <strong>Created by:</strong> {task.createdBy?.name}
            </p>
          </div>

          <DrawerFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Assigning..." : "Update"}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
