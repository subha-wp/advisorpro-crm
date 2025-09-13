"use client"

import useSWR from "swr"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { TaskKanbanBoard } from "@/components/tasks/task-kanban-board"

import { TaskStatsCards } from "@/components/tasks/task-stats-cards"
import { Plus, Filter } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateTaskDrawer } from "@/components/tasks/create-task-dialog"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function TasksPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assignedTo: "",
    myTasks: false,
  })

  const { data: statsData } = useSWR("/api/tasks/stats", fetcher)
  const stats = statsData?.stats

  const hasActive =
    filters.myTasks ||
    filters.status ||
    filters.priority ||
    filters.assignedTo


  return (
    <section className="space-y-6 pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Tasks</h1>

          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div>
        <TaskStatsCards stats={stats} />
      </div>

      {/* Quick Filters */}
    <Card className="rounded-2xl border shadow-sm bg-white/70 backdrop-blur-md p-2">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Filter className="h-4 w-4 text-purple-500" />
          Quick Filters
        </CardTitle>

        {/* Dropdown Trigger */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full hover:bg-muted"
            >
              <Filter className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          {/* Dropdown Content */}
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => setFilters((f: any) => ({ ...f, myTasks: !f.myTasks }))}
            >
              My Activities
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                setFilters((f: any) => ({
                  ...f,
                  status: f.status === "PENDING" ? "" : "PENDING",
                }))
              }
            >
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                setFilters((f: any) => ({
                  ...f,
                  status: f.status === "IN_PROGRESS" ? "" : "IN_PROGRESS",
                }))
              }
            >
              In Progress
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                setFilters((f: any) => ({
                  ...f,
                  priority: f.priority === "URGENT" ? "" : "URGENT",
                }))
              }
            >
              Urgent
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                setFilters((f: any) => ({
                  ...f,
                  priority: f.priority === "HIGH" ? "" : "HIGH",
                }))
              }
            >
              High Priority
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                setFilters({ status: "", priority: "", assignedTo: "", myTasks: false })
              }
            >
              Clear All
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      {/* Active filters preview — only if active */}
      {hasActive && (
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {filters.myTasks && (
              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs">
                My Activities
              </span>
            )}
            {filters.status === "PENDING" && (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs">
                Pending
              </span>
            )}
            {filters.status === "IN_PROGRESS" && (
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
                In Progress
              </span>
            )}
            {filters.priority === "URGENT" && (
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs">
                Urgent
              </span>
            )}
            {filters.priority === "HIGH" && (
              <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs">
                High Priority
              </span>
            )}
          </div>
        </CardContent>
      )}
    </Card>



      {/* Task Cards (Mobile Focus) */}
      <div>
        <TaskKanbanBoard filters={filters} />
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-16 right-6 h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
      >
        <Plus className="h-12 w-12" />
      </Button>

      {/* Create Activity Dialog */}
      <CreateTaskDrawer open={createOpen} onOpenChange={setCreateOpen} />
    </section>
  )
}
