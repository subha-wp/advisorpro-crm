"use client"

import type React from "react"
import useSWR from "swr"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Eye, Trash2, Search, X, Calendar } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Client = {
  id: string
  name: string
  relationshipToHead?: string
}

type ClientGroup = {
  id: string
  name: string
  description?: string
  clients: Client[]
  _count: { clients: number }
  createdAt: string
}

export function FamilyGroupsTable() {
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 20

  const url = `/api/client-groups?q=${q}&page=${page}&pageSize=${pageSize}`
  const { data, mutate, isLoading } = useSWR(url, fetcher)

  const items: ClientGroup[] = data?.items ?? []
  const total = data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))

  // Group details modal
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<ClientGroup | null>(null)

  // Create group modal
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: "", description: "" })

  function openDetails(group: ClientGroup) {
    setSelectedGroup(group)
    setDetailsOpen(true)
  }

  function openCreate() {
    setForm({ name: "", description: "" })
    setCreateOpen(true)
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return

    const res = await fetch("/api/client-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      }),
    })

    if (res.ok) {
      setCreateOpen(false)
      setForm({ name: "", description: "" })
      mutate()
    }
  }

  async function deleteGroup(id: string) {
    if (!confirm("Are you sure? This will remove all clients from this group.")) return

    const res = await fetch(`/api/client-groups/${id}`, { method: "DELETE" })
    if (res.ok) {
      mutate()
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Users className="h-6 w-6 text-primary" />
              </div>
              Family Groups
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-10 pr-10 h-12 w-full sm:w-64 rounded-2xl border-2 focus:border-primary"
                />
                {q && (
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-muted/80"
                    onClick={() => setQ("")}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              <Button onClick={openCreate} className="h-12 px-6 rounded-2xl font-medium">
                <Plus className="h-4 w-4 mr-2" />
                New Group
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading family groups...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">No family groups found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {q ? `No results for "${q}"` : "Create your first family group to get started"}
                </p>
              </div>
            ) : (
              items.map((group) => (
                <Card key={group.id} className="border-2 rounded-2xl hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg text-balance">{group.name}</h3>
                          {group.description && (
                            <p className="text-muted-foreground text-sm mt-1">{group.description}</p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                            <Users className="h-3 w-3" />
                            {group._count.clients} members
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(group.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetails(group)}
                          className="rounded-full h-9 px-4"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteGroup(group.id)}
                          className="rounded-full h-9 px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {pages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-full h-12 px-6"
              >
                Previous
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
                <span className="text-sm font-medium">
                  {page} of {pages} • {total} total
                </span>
              </div>
              <Button
                variant="outline"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full h-12 px-6"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    
    </div>
  )
}
