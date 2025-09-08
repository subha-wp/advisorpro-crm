"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Clock, 
  User, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Pause,
  MoreHorizontal,
  Building2,
  FileText
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface TaskActivityCardProps {
  task: any
  onEdit?: (task: any) => void
  onComplete?: (task: any) => void
  onAssign?: (task: any) => void
  onDelete?: (taskId: string) => void
  onStatusChange?: (taskId: string, status: string) => void
  currentUserId?: string
  userRole?: string
}

export function TaskActivityCard({ 
  task, 
  onEdit, 
  onComplete, 
  onAssign, 
  onDelete, 
  onStatusChange,
  currentUserId,
  userRole
}: TaskActivityCardProps) {
  const { toast } = useToast()

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "URGENT": return "destructive"
      case "HIGH": return "default"
      case "MEDIUM": return "secondary"
      case "LOW": return "outline"
      default: return "outline"
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "COMPLETED": return "default"
      case "IN_PROGRESS": return "secondary"
      case "PENDING": return "outline"
      case "CANCELLED": return "destructive"
      default: return "outline"
    }
  }

  function formatTaskType(type: string) {
    return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  function isOverdue(dueDate: string | null, status: string) {
    if (!dueDate || status === "COMPLETED" || status === "CANCELLED") return false
    return new Date(dueDate) < new Date()
  }

  function getUserInitials(name?: string) {
    if (!name) return "U"
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const canEdit = task.createdByUserId === currentUserId || 
                  task.assignedToUserId === currentUserId || 
                  userRole === "OWNER"
  
  const canDelete = task.createdByUserId === currentUserId || userRole === "OWNER"
  const canAssign = userRole === "OWNER"
  const canComplete = task.assignedToUserId === currentUserId || 
                     task.createdByUserId === currentUserId || 
                     userRole === "OWNER"

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
                {task.priority}
              </Badge>
              <Badge variant={getStatusColor(task.status) as any} className="text-xs">
                {task.status.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {formatTaskType(task.type)}
              </Badge>
              {isOverdue(task.dueDate, task.status) && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
            <CardTitle className="text-base leading-tight">{task.title}</CardTitle>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit?.(task)}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              )}
              
              {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                <>
                  {canComplete && (
                    <DropdownMenuItem onClick={() => onComplete?.(task)}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark Complete
                    </DropdownMenuItem>
                  )}
                  
                  {canAssign && (
                    <DropdownMenuItem onClick={() => onAssign?.(task)}>
                      <User className="h-4 w-4 mr-2" />
                      Reassign
                    </DropdownMenuItem>
                  )}

                  {task.status === "PENDING" && canEdit && (
                    <DropdownMenuItem 
                      onClick={() => onStatusChange?.(task.id, "IN_PROGRESS")}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Task
                    </DropdownMenuItem>
                  )}

                  {task.status === "IN_PROGRESS" && canEdit && (
                    <DropdownMenuItem 
                      onClick={() => onStatusChange?.(task.id, "PENDING")}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Task
                    </DropdownMenuItem>
                  )}
                </>
              )}
              
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(task.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Assignment Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Assigned to:</span>
            {task.assignedTo ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage 
                    src={task.assignedTo.avatarUrl || undefined} 
                    alt={`${task.assignedTo.name}'s avatar`}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xs">
                    {getUserInitials(task.assignedTo.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{task.assignedTo.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground italic">Unassigned</span>
            )}
          </div>
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Due:</span>
            <span className={isOverdue(task.dueDate, task.status) ? "text-destructive font-medium" : ""}>
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Related Records */}
        {(task.client || task.policy) && (
          <div className="space-y-2">
            {task.client && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Client:</span>
                <span className="font-medium">{task.client.name}</span>
              </div>
            )}
            {task.policy && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Policy:</span>
                <span className="font-medium">{task.policy.policyNumber}</span>
              </div>
            )}
          </div>
        )}

        {/* Created Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
          </div>
          <span>by {task.createdBy.name}</span>
        </div>

        {/* Completion Info */}
        {task.status === "COMPLETED" && task.completedAt && (
          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">Completed on {new Date(task.completedAt).toLocaleDateString()}</span>
            </div>
            {task.completionRemarks && (
              <p className="text-sm text-green-600 dark:text-green-300 mt-2">
                {task.completionRemarks}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}