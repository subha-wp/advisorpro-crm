"use client"

import useSWR from "swr"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TaskDetailsDialog } from "@/components/tasks/task-details-dialog"
import { CompleteTaskDialog } from "@/components/tasks/complete-task-dialog"
import { AssignTaskDialog } from "@/components/tasks/assign-task-dialog"
import { useToast } from "@/hooks/use-toast"
import { 
  MoreHorizontal, 
  Eye, 
  CheckCircle, 
  UserPlus, 
  Edit, 
  Trash2,
  Clock,
  AlertTriangle
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface TasksTableProps {
  filters: {
    status: string
    priority: string
    assignedTo: string
    myTasks: boolean
  }
}

export function TasksTable({ filters }: TasksTableProps) {
  const { toast } = useToast()
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("createdAt")
  const [dir, setDir] = useState<"asc" | "desc">("desc")
  const pageSize = 20

  // Dialog states
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)

  const url = useMemo(() => {
    const params = new URLSearchParams({
      q,
      page: String(page),
      pageSize: String(pageSize),
      sort,
      dir,
    })
    if (filters.status) params.set("status", filters.status)
    if (filters.priority) params.set("priority", filters.priority)
    if (filters.assignedTo) params.set("assignedTo", filters.assignedTo)
    if (filters.myTasks) params.set("myTasks", "true")
    return `/api/tasks?${params.toString()}`
  }, [q, page, pageSize, sort, dir, filters])

  const { data, mutate, isLoading } = useSWR(url, fetcher)
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))

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

  async function updateTaskStatus(taskId: string, status: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      
      if (res.ok) {
        toast({ title: "Task updated", description: "Task status has been updated" })
        mutate()
      } else {
        const data = await res.json()
        toast({ 
          title: "Error", 
          description: data.error || "Failed to update task",
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

  async function deleteTask(taskId: string) {
    if (!confirm("Are you sure you want to delete this task?")) return
    
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
      
      if (res.ok) {
        toast({ title: "Task deleted", description: "Task has been deleted" })
        mutate()
      } else {
        const data = await res.json()
        toast({ 
          title: "Error", 
          description: data.error || "Failed to delete task",
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

  function openDetails(task: any) {
    setSelectedTask(task)
    setDetailsOpen(true)
  }

  function openComplete(task: any) {
    setSelectedTask(task)
    setCompleteOpen(true)
  }

  function openAssign(task: any) {
    setSelectedTask(task)
    setAssignOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Task List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Search tasks..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-sm"
            />
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDir(d => d === "asc" ? "desc" : "asc")}
            >
              {dir === "asc" ? "↑" : "↓"}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No tasks found
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((task: any) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {task.description}
                            </div>
                          )}
                          {task.completionData?.activityOutcome && (
                            <div className="text-xs mt-1">
                              <span className="text-muted-foreground">Outcome: </span>
                              <span className={
                                task.completionData.activityOutcome === "SUCCESSFUL" ? "text-green-600" :
                                task.completionData.activityOutcome === "UNSUCCESSFUL" ? "text-red-600" :
                                "text-yellow-600"
                              }>
                                {task.completionData.activityOutcome.replace(/_/g, " ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(task.priority) as any}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(task.status) as any}>
                            {task.status.replace("_", " ")}
                          </Badge>
                          {isOverdue(task.dueDate, task.status) && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                          {task.completionData?.followUpRequired && (
                            <Clock className="h-4 w-4 text-yellow-500" title="Follow-up required" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatTaskType(task.type)}</span>
                      </TableCell>
                      <TableCell>
                        {task.assignedTo ? (
                          <div>
                            <div className="font-medium text-sm">{task.assignedTo.name}</div>
                            <div className="text-xs text-muted-foreground">{task.assignedTo.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.dueDate ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-sm">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No due date</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.client ? (
                          <div>
                            <div className="text-sm font-medium">{task.client.name}</div>
                            {task.policy && (
                              <div className="text-xs text-muted-foreground">
                                {task.policy.policyNumber}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetails(task)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            
                            {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                              <>
                                <DropdownMenuItem onClick={() => openComplete(task)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Complete Activity
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => openAssign(task)}>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Reassign
                                </DropdownMenuItem>

                                {task.status === "PENDING" && (
                                  <DropdownMenuItem 
                                    onClick={() => updateTaskStatus(task.id, "IN_PROGRESS")}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Start Activity
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteTask(task.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              Page {page} of {pages} • {total} total activities
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                disabled={page <= 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                disabled={page >= pages} 
                onClick={() => setPage(p => Math.min(pages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TaskDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        task={selectedTask}
      />
      
      <CompleteTaskDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        task={selectedTask}
        onSuccess={() => {
          mutate()
          setCompleteOpen(false)
        }}
      />
      
      <AssignTaskDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        task={selectedTask}
        onSuccess={() => {
          mutate()
          setAssignOpen(false)
        }}
      />
    </>
  )
}