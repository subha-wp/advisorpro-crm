"use client"

import useSWR from "swr"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TaskActivityCard } from "@/components/tasks/task-activity-card"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"
import { TaskDetailsDialog } from "@/components/tasks/task-details-dialog"
import { CompleteTaskDialog } from "@/components/tasks/complete-task-dialog"
import { AssignTaskDialog } from "@/components/tasks/assign-task-dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"
import { Badge } from "../ui/badge"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface TaskKanbanBoardProps {
  filters: {
    status: string
    priority: string
    assignedTo: string
    myTasks: boolean
  }
}

const statusColumns = [
  { key: "PENDING", label: "Pending", color: "bg-yellow-50 dark:bg-yellow-950/20" },
  { key: "IN_PROGRESS", label: "In Progress", color: "bg-blue-50 dark:bg-blue-950/20" },
  { key: "COMPLETED", label: "Completed", color: "bg-green-50 dark:bg-green-950/20" },
  { key: "CANCELLED", label: "Cancelled", color: "bg-red-50 dark:bg-red-950/20" },
]

export function TaskKanbanBoard({ filters }: TaskKanbanBoardProps) {
  const { toast } = useToast()
  const { data: profileData } = useSWR("/api/user/profile", fetcher)
  const user = profileData?.item

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)

  // Fetch tasks for each status
  const { data: pendingData, mutate: mutatePending } = useSWR(
    `/api/tasks?status=PENDING&myTasks=${filters.myTasks}&priority=${filters.priority}&assignedTo=${filters.assignedTo}&pageSize=50`,
    fetcher
  )
  const { data: inProgressData, mutate: mutateInProgress } = useSWR(
    `/api/tasks?status=IN_PROGRESS&myTasks=${filters.myTasks}&priority=${filters.priority}&assignedTo=${filters.assignedTo}&pageSize=50`,
    fetcher
  )
  const { data: completedData, mutate: mutateCompleted } = useSWR(
    `/api/tasks?status=COMPLETED&myTasks=${filters.myTasks}&priority=${filters.priority}&assignedTo=${filters.assignedTo}&pageSize=50`,
    fetcher
  )
  const { data: cancelledData, mutate: mutateCancelled } = useSWR(
    `/api/tasks?status=CANCELLED&myTasks=${filters.myTasks}&priority=${filters.priority}&assignedTo=${filters.assignedTo}&pageSize=50`,
    fetcher
  )

  const tasksByStatus = {
    PENDING: pendingData?.items ?? [],
    IN_PROGRESS: inProgressData?.items ?? [],
    COMPLETED: completedData?.items ?? [],
    CANCELLED: cancelledData?.items ?? [],
  }

  function mutateAll() {
    mutatePending()
    mutateInProgress()
    mutateCompleted()
    mutateCancelled()
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
        mutateAll()
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
        mutateAll()
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {statusColumns.map((column) => (
          <Card key={column.key} className={column.color}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>{column.label}</span>
                <Badge variant="outline" className="text-xs">
                  {tasksByStatus[column.key as keyof typeof tasksByStatus].length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {column.key === "PENDING" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              )}
              
              {tasksByStatus[column.key as keyof typeof tasksByStatus].map((task: any) => (
                <TaskActivityCard
                  key={task.id}
                  task={task}
                  onEdit={openDetails}
                  onComplete={openComplete}
                  onAssign={openAssign}
                  onDelete={deleteTask}
                  onStatusChange={updateTaskStatus}
                  currentUserId={user?.id}
                  userRole={user?.role}
                />
              ))}
              
              {tasksByStatus[column.key as keyof typeof tasksByStatus].length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No {column.label.toLowerCase()} tasks
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialogs */}
      <CreateTaskDialog 
        open={createOpen} 
        onOpenChange={setCreateOpen}
        onSuccess={mutateAll}
      />
      
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
          mutateAll()
          setCompleteOpen(false)
        }}
      />
      
      <AssignTaskDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        task={selectedTask}
        onSuccess={() => {
          mutateAll()
          setAssignOpen(false)
        }}
      />
    </>
  )
}