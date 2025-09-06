"use client"

import useSWR from "swr"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TasksTable } from "@/components/tasks/tasks-table"
import { TaskKanbanBoard } from "@/components/tasks/task-kanban-board"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"
import { TaskStatsCards } from "@/components/tasks/task-stats-cards"
import { Plus, Filter, LayoutGrid, List } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function TasksPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [view, setView] = useState<"kanban" | "table">("kanban")
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assignedTo: "",
    myTasks: false,
  })

  const { data: statsData } = useSWR("/api/tasks/stats", fetcher)
  const stats = statsData?.stats

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-balance">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Track client follow-ups, policy renewals, and team activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={view === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("kanban")}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Board
            </Button>
            <Button
              variant={view === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("table")}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Activity
          </Button>
        </div>
      </header>

      {/* Task Statistics */}
      <TaskStatsCards stats={stats} />

      {/* Quick Filters */}
      <Card className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
        <CardHeader>
          <CardTitle className="text-sm text-white flex items-center">
            <Filter className="h-4 w-4" />
            Quick Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.myTasks ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(f => ({ ...f, myTasks: !f.myTasks }))}
            >
              My Activities
            </Button>
            <Button
              variant={filters.status === "PENDING" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(f => ({ 
                ...f, 
                status: f.status === "PENDING" ? "" : "PENDING" 
              }))}
            >
              Pending
            </Button>
            <Button
              variant={filters.status === "IN_PROGRESS" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(f => ({ 
                ...f, 
                status: f.status === "IN_PROGRESS" ? "" : "IN_PROGRESS" 
              }))}
            >
              In Progress
            </Button>
            <Button
              variant={filters.priority === "URGENT" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(f => ({ 
                ...f, 
                priority: f.priority === "URGENT" ? "" : "URGENT" 
              }))}
            >
              Urgent
            </Button>
            <Button
              variant={filters.priority === "HIGH" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(f => ({ 
                ...f, 
                priority: f.priority === "HIGH" ? "" : "HIGH" 
              }))}
            >
              High Priority
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ status: "", priority: "", assignedTo: "", myTasks: false })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task Views */}
      {view === "kanban" ? (
        <TaskKanbanBoard filters={filters} />
      ) : (
        <TasksTable filters={filters} />
      )}

      {/* Create Activity Dialog */}
      <CreateTaskDialog 
        open={createOpen} 
        onOpenChange={setCreateOpen}
      />
    </section>
  )
}