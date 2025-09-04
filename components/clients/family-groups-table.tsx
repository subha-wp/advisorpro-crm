"use client"

import type React from "react"

import useSWR from "swr"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Eye, Trash2 } from "lucide-react"

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
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-balance flex items-center gap-2">
          <Users className="h-5 w-5" />
          Family Groups
        </CardTitle>
        <div className="flex items-center gap-2">
          <Input placeholder="Search groups..." value={q} onChange={(e) => setQ(e.target.value)} className="w-48" />
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Group
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>Loading...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No family groups found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="text-muted-foreground">{group.description || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <Users className="h-3 w-3" />
                        {group._count.clients} members
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => openDetails(group)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteGroup(group.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages} • {total} total
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <Button variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Group Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedGroup?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              {selectedGroup.description && <p className="text-muted-foreground">{selectedGroup.description}</p>}

              <div>
                <h4 className="font-medium mb-3">Family Members ({selectedGroup.clients.length})</h4>
                {selectedGroup.clients.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No members in this group yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedGroup.clients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{client.name}</span>
                          {client.relationshipToHead && <Badge variant="outline">{client.relationshipToHead}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Group Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Family Group</DialogTitle>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={submitForm}>
            <div className="grid gap-2">
              <Label>Group Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Smith Family"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Group</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
