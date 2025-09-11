"use client"

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  User,
  Building2,
  FileText,
  Clock,
  CheckCircle,
  Star,
  AlertTriangle,
  Phone,
  Mail,
  Users,
} from "lucide-react"

interface TaskDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: any
}

export function TaskDetailsDialog({
  open,
  onOpenChange,
  task,
}: TaskDetailsDialogProps) {
  if (!task) return null

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "URGENT":
        return "destructive"
      case "HIGH":
        return "default"
      case "MEDIUM":
        return "secondary"
      case "LOW":
        return "outline"
      default:
        return "outline"
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "COMPLETED":
        return "default"
      case "IN_PROGRESS":
        return "secondary"
      case "PENDING":
        return "outline"
      case "CANCELLED":
        return "destructive"
      default:
        return "outline"
    }
  }

  function formatTaskType(type: string) {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  function getOutcomeColor(outcome: string) {
    switch (outcome) {
      case "SUCCESSFUL":
        return "text-green-600 dark:text-green-400"
      case "PARTIALLY_SUCCESSFUL":
        return "text-yellow-600 dark:text-yellow-400"
      case "UNSUCCESSFUL":
        return "text-red-600 dark:text-red-400"
      case "RESCHEDULED":
        return "text-blue-600 dark:text-blue-400"
      case "CLIENT_UNAVAILABLE":
        return "text-gray-600 dark:text-gray-400"
      default:
        return ""
    }
  }

  function getSatisfactionStars(satisfaction: string) {
    const levels = {
      VERY_SATISFIED: 5,
      SATISFIED: 4,
      NEUTRAL: 3,
      DISSATISFIED: 2,
      VERY_DISSATISFIED: 1,
    }
    return levels[satisfaction as keyof typeof levels] || 0
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[92vh] rounded-t-2xl flex flex-col">
        {/* Sticky Header */}
        <DrawerHeader className="shrink-0 flex items-center justify-between border-b">
          <DrawerTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5" />
            Activity Details
          </DrawerTitle>
          <DrawerClose />
        </DrawerHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-base">{task.title}</h3>
              {task.description && (
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {task.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={getPriorityColor(task.priority) as any}>
                {task.priority} Priority
              </Badge>
              <Badge variant={getStatusColor(task.status) as any}>
                {task.status.replace("_", " ")}
              </Badge>
              <Badge variant="outline">{formatTaskType(task.type)}</Badge>
            </div>
          </div>

          <Separator />

          {/* Assignment & Dates */}
          <div className="grid gap-5">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-muted-foreground" />
                Created By
              </div>
              <div className="ml-6 mt-1 text-sm">
                <div className="font-medium">{task.createdBy.name}</div>
                <div className="text-muted-foreground">{task.createdBy.email}</div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-muted-foreground" />
                Assigned To
              </div>
              <div className="ml-6 mt-1 text-sm">
                {task.assignedTo ? (
                  <>
                    <div className="font-medium">{task.assignedTo.name}</div>
                    <div className="text-muted-foreground">{task.assignedTo.email}</div>
                  </>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Created
              </div>
              <div className="ml-6 mt-1 text-sm">
                {new Date(task.createdAt).toLocaleString()}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Due Date
              </div>
              <div className="ml-6 mt-1 text-sm">
                {task.dueDate ? (
                  <span
                    className={
                      new Date(task.dueDate) < new Date() &&
                      task.status !== "COMPLETED"
                        ? "text-destructive font-medium"
                        : ""
                    }
                  >
                    {new Date(task.dueDate).toLocaleDateString()}
                    {new Date(task.dueDate) < new Date() &&
                      task.status !== "COMPLETED" &&
                      " (Overdue)"}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No due date</span>
                )}
              </div>
            </div>
          </div>

          {/* Related Records */}
          {(task.client || task.policy) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Related Records</h4>

                {task.client && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Client: <strong>{task.client.name}</strong>
                  </div>
                )}

                {task.policy && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Policy:{" "}
                    <strong>{task.policy.policyNumber}</strong> (
                    {task.policy.insurer})
                  </div>
                )}
              </div>
            </>
          )}

          {/* Completion Details */}
          {task.status === "COMPLETED" && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium text-sm">
                    Activity Completion Report
                  </h4>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <strong>Completed:</strong>{" "}
                    {new Date(task.completedAt).toLocaleString()}
                  </div>

                  {task.completionRemarks && (
                    <div className="bg-muted p-3 rounded-md">
                      <strong>Remarks:</strong> {task.completionRemarks}
                    </div>
                  )}

                  {/* More sections from your original code go here, unchanged but in same scroll */}
                </div>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
