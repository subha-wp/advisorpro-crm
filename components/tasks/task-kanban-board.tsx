"use client"

import useSWRInfinite from "swr/infinite"
import { useState } from "react"
import { TaskDetailsDialog } from "@/components/tasks/task-details-dialog"
import { CompleteTaskDialog } from "@/components/tasks/complete-task-dialog"

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { AssignTaskDrawer } from "./assign-task-dialog"
import { Eye, Trash2 } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface TaskKanbanBoardProps {
  filters: {
    status: string
    priority: string
    assignedTo: string
    myTasks: boolean
  }
}

export function TaskKanbanBoard({ filters }: TaskKanbanBoardProps) {
  const { toast } = useToast()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)

  // ✅ Infinite pagination
  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.items.length) return null
    return `/api/tasks?page=${pageIndex + 1}&pageSize=15&myTasks=${filters.myTasks}&status=${filters.status}&priority=${filters.priority}&assignedTo=${filters.assignedTo}`
  }

  const { data, size, setSize, mutate } = useSWRInfinite(getKey, fetcher)
  const tasks = data ? data.flatMap((d) => d.items) : []
  const isReachingEnd = data && data[data.length - 1]?.items?.length === 0

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
    <div className="space-y-4">
      {/* Task Feed */}
      {tasks.map((task) => (
        <div
          key={task.id}
          className="rounded-xl border bg-card shadow-sm p-2 flex flex-col gap-2 active:scale-[0.99] transition"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-base">{task.title}</h3>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                task.status === "PENDING"
                  ? "bg-amber-100 text-amber-700"
                  : task.status === "IN_PROGRESS"
                  ? "bg-blue-100 text-blue-700"
                  : task.status === "COMPLETED"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {task.status.replace("_", " ")}
            </span>
          </div>

          {/* Sub Info */}
              <div className="grid grid-cols-2 text-xs text-muted-foreground gap-1">
        <span>
          <strong>Priority:</strong> {task.priority || "Normal"}
        </span>
        {task.dueDate && (
          <span>
            <strong>Due:</strong> {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        <span>
          <strong>Created:</strong>{" "}
          {task.createdBy?.name || "Unknown"}
        </span>
        <span>
          <strong>Assigned:</strong>{" "}
          {task.assignedTo?.name || "Unassigned"}
        </span>
      </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button size="sm" variant="outline" onClick={() => openDetails(task)}>
              <Eye/>
            </Button>
            {task.status !== "COMPLETED" && (
              <Button size="sm" variant="default" onClick={() => openComplete(task)}>
                Complete
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => openAssign(task)}>
              Assign
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                await fetch(`/api/tasks/${task.id}`, { method: "DELETE" })
                toast({ title: "Task deleted" })
                mutate()
              }}
            >
              <Trash2/>
            </Button>
          </div>
        </div>
      ))}

      {/* Load More */}
      {!isReachingEnd && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            onClick={() => setSize(size + 1)}
            className="rounded-full"
          >
            Load More
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <TaskDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} task={selectedTask} />
      <CompleteTaskDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        task={selectedTask}
        onSuccess={() => {
          mutate()
          setCompleteOpen(false)
        }}
      />
      <AssignTaskDrawer
        open={assignOpen}
        onOpenChange={setAssignOpen}
        task={selectedTask}
        onSuccess={() => {
          mutate()
          setAssignOpen(false)
        }}
      />
    </div>
  )
}
