"use client"

import type React from "react"

import useSWR from "swr"
import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, UserPlus, Workflow } from "lucide-react"
import { FamilyWorkflow } from "./family-workflow"
import * as XLSX from "xlsx"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type ClientGroup = {
  id: string
  name: string
  description?: string
  clients: Client[]
  _count: { clients: number }
}

type Client = {
  id: string
  name: string
  dob?: string
  panNo?: string
  aadhaarNo?: string
  mobile?: string
  email?: string
  address?: string
  tags: string[]
  deletedAt?: string | null
  clientGroup?: ClientGroup
  relationshipToHead?: string
}

const allowedSorts = ["createdAt", "updatedAt", "name", "email", "mobile"] as const
type SortKey = (typeof allowedSorts)[number]

const relationshipOptions = ["Head", "Spouse", "Son", "Daughter", "Father", "Mother", "Brother", "Sister", "Other"]

export function ClientsTable() {
  const [q, setQ] = useState("")
  const [showDeleted, setShowDeleted] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedGroupId, setSelectedGroupId] = useState<string>("")
  const pageSize = 20
  const [sort, setSort] = useState<SortKey>("createdAt")
  const [dir, setDir] = useState<"asc" | "desc">("desc")

  const [familyWorkflowOpen, setFamilyWorkflowOpen] = useState(false)

  const url = useMemo(() => {
    const params = new URLSearchParams({
      q,
      page: String(page),
      pageSize: String(pageSize),
      deleted: String(showDeleted),
      sort,
      dir,
      ...(selectedGroupId ? { groupId: selectedGroupId } : {}),
    })
    return `/api/clients?${params.toString()}`
  }, [q, page, pageSize, showDeleted, sort, dir, selectedGroupId])

  // Fetch groups for filter dropdown
  const { data: groupsData, mutate: mutateGroups } = useSWR("/api/client-groups", fetcher)
  const groups: ClientGroup[] = groupsData?.items ?? []

  const { data, mutate, isLoading } = useSWR(url, fetcher)

  const items: Client[] = data?.items ?? []
  const total = data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))

  // Create/Edit modal state
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState({
    name: "",
    dob: "",
    panNo: "",
    aadhaarNo: "",
    mobile: "",
    email: "",
    address: "",
    tags: "",
    clientGroupId: "",
    relationshipToHead: "",
    createNewGroup: false,
    groupName: "",
  })

  // Group management modal
  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [groupForm, setGroupForm] = useState({ name: "", description: "" })

  function openCreate() {
    setEditing(null)
    setForm({
      name: "",
      dob: "",
      panNo: "",
      aadhaarNo: "",
      mobile: "",
      email: "",
      address: "",
      tags: "",
      clientGroupId: "",
      relationshipToHead: "",
      createNewGroup: false,
      groupName: "",
    })
    setOpen(true)
  }

  function openEdit(c: Client) {
    setEditing(c)
    setForm({
      name: c.name ?? "",
      dob: c.dob ? new Date(c.dob).toISOString().split("T")[0] : "",
      panNo: c.panNo ?? "",
      aadhaarNo: c.aadhaarNo ?? "",
      mobile: c.mobile ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      tags: (c.tags ?? []).join(","),
      clientGroupId: c.clientGroup?.id ?? "",
      relationshipToHead: c.relationshipToHead ?? "",
      createNewGroup: false,
      groupName: "",
    })
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    const payload: any = {
      name: form.name.trim(),
      dob: form.dob || undefined,
      panNo: form.panNo.trim() || undefined,
      aadhaarNo: form.aadhaarNo.trim() || undefined,
      mobile: form.mobile.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      clientGroupId: form.clientGroupId || undefined,
      relationshipToHead: form.relationshipToHead || undefined,
      createNewGroup: form.createNewGroup,
      groupName: form.groupName.trim() || undefined,
    }
    if (!payload.name) return

    const res = await fetch(editing ? `/api/clients/${editing.id}` : "/api/clients", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setOpen(false)
      mutate()
      // Refresh groups data if new group was created
      if (form.createNewGroup) {
        mutateGroups()
      }
    } else {
      // optionally show toast
    }
  }

  async function submitGroupForm(e: React.FormEvent) {
    e.preventDefault()
    if (!groupForm.name.trim()) return

    const res = await fetch("/api/client-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: groupForm.name.trim(),
        description: groupForm.description.trim() || undefined,
      }),
    })

    if (res.ok) {
      setGroupModalOpen(false)
      setGroupForm({ name: "", description: "" })
      mutateGroups()
    }
  }

  async function onDelete(id: string) {
    await fetch(`/api/clients/${id}`, { method: "DELETE" })
    mutate()
  }

  async function onRestore(id: string) {
    await fetch(`/api/clients/${id}/restore`, { method: "POST" })
    mutate()
  }

  // CSV import
  const inputRef = useRef<HTMLInputElement>(null)
  function triggerImport() {
    inputRef.current?.click()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" })
    for (const r of rows) {
      const payload = {
        name: String(r.name ?? "").trim(),
        dob: String(r.dob ?? "").trim() || undefined,
        panNo: String(r.panNo ?? "").trim() || undefined,
        aadhaarNo: String(r.aadhaarNo ?? "").trim() || undefined,
        mobile: String(r.mobile ?? "").trim() || undefined,
        email: String(r.email ?? "").trim() || undefined,
        address: String(r.address ?? "").trim() || undefined,
        tags: String(r.tags ?? "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }
      if (payload.name) {
        await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }
    }
    mutate()
    e.target.value = ""
  }

  function toggleSort(key: SortKey) {
    if (sort === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSort(key)
      setDir(key === "name" ? "asc" : "desc")
    }
  }

  function handleFamilyWorkflowComplete() {
    mutate()
    mutateGroups()
  }

  return (
    <div className="space-y-6">
     

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-balance">
            {selectedGroupId ? `${groups.find((g) => g.id === selectedGroupId)?.name} Members` : "Clients"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} className="w-40" />
            <Button variant="secondary" onClick={() => setShowDeleted((v) => !v)}>
              {showDeleted ? "Hide deleted" : "Show deleted"}
            </Button>
            <Button onClick={triggerImport}>Import CSV</Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
              onChange={handleFile}
            />
            <Button onClick={exportCSV}>Export CSV</Button>
            <Button onClick={openCreate}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead role="button" onClick={() => toggleSort("name")}>
                    Name {sort === "name" ? (dir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                  <TableHead>Family</TableHead>
                  <TableHead>Relation</TableHead>
                  <TableHead>PAN</TableHead>
                  <TableHead>Aadhaar</TableHead>
                  <TableHead role="button" onClick={() => toggleSort("mobile" as SortKey)}>
                    Mobile {sort === "mobile" ? (dir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                  <TableHead role="button" onClick={() => toggleSort("email" as SortKey)}>
                    Email {sort === "email" ? (dir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Loading...</TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>No clients</TableCell>
                  </TableRow>
                ) : (
                  items.map((c) => (
                    <TableRow key={c.id} className={c.deletedAt ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        {c.clientGroup && (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <Users className="h-3 w-3" />
                            {c.clientGroup.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.relationshipToHead && <Badge variant="outline">{c.relationshipToHead}</Badge>}
                      </TableCell>
                      <TableCell>{c.panNo}</TableCell>
                      <TableCell>{c.aadhaarNo}</TableCell>
                      <TableCell>{c.mobile}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(c.tags ?? []).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {c.deletedAt ? (
                          <Button size="sm" variant="outline" onClick={() => onRestore(c.id)}>
                            Restore
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => onDelete(c.id)}>
                              Delete
                            </Button>
                          </div>
                        )}
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

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-96">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Client" : "Add Client"}</DialogTitle>
            </DialogHeader>
            <form className="grid gap-4" onSubmit={submitForm}>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={form.dob}
                    onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Mobile</Label>
                  <Input
                    value={form.mobile}
                    onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                    placeholder="+91 9876543210"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>PAN Number</Label>
                  <Input
                    value={form.panNo}
                    onChange={(e) => setForm((f) => ({ ...f, panNo: e.target.value.toUpperCase() }))}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                  />
                  <p className="text-xs text-muted-foreground">Format: ABCDE1234F</p>
                </div>
                <div className="grid gap-2">
                  <Label>Aadhaar Number</Label>
                  <Input
                    value={form.aadhaarNo}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 12)
                      setForm((f) => ({ ...f, aadhaarNo: value }))
                    }}
                    placeholder="1234 5678 9012"
                    maxLength={12}
                  />
                  <p className="text-xs text-muted-foreground">12-digit number</p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </div>

              <div className="grid gap-2">
                <Label>Tags (comma separated)</Label>
                <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Family Group</h4>
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.createNewGroup}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            createNewGroup: e.target.checked,
                            clientGroupId: e.target.checked ? "" : f.clientGroupId,
                          }))
                        }
                      />
                      Create new family group
                    </label>
                  </div>

                  {form.createNewGroup ? (
                    <div className="grid gap-2">
                      <Label>Family Group Name *</Label>
                      <Input
                        value={form.groupName}
                        onChange={(e) => setForm((f) => ({ ...f, groupName: e.target.value }))}
                        placeholder="e.g., Smith Family"
                        required={form.createNewGroup}
                      />
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label>Select Existing Group</Label>
                      <Select
                        value={form.clientGroupId}
                        onValueChange={(value) => setForm((f) => ({ ...f, clientGroupId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a family group (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No group</SelectItem>
                          {groups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name} ({group._count.clients} members)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(form.clientGroupId || form.createNewGroup) && (
                    <div className="grid gap-2">
                      <Label>Relationship to Head</Label>
                      <Select
                        value={form.relationshipToHead}
                        onValueChange={(value) => setForm((f) => ({ ...f, relationshipToHead: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationshipOptions.map((rel) => (
                            <SelectItem key={rel} value={rel}>
                              {rel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit">{editing ? "Save changes" : "Create Client"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={groupModalOpen} onOpenChange={setGroupModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Family Group</DialogTitle>
            </DialogHeader>
            <form className="grid gap-4" onSubmit={submitGroupForm}>
              <div className="grid gap-2">
                <Label>Group Name *</Label>
                <Input
                  value={groupForm.name}
                  onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Smith Family"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input
                  value={groupForm.description}
                  onChange={(e) => setGroupForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setGroupModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Group</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Card>

      <FamilyWorkflow
        open={familyWorkflowOpen}
        onOpenChange={setFamilyWorkflowOpen}
        onComplete={handleFamilyWorkflowComplete}
      />
    </div>
  )

  function exportCSV() {
    const rows = items.map((c: any) => ({
      id: c.id,
      name: c.name,
      dob: c.dob ?? "",
      panNo: c.panNo ?? "",
      aadhaarNo: c.aadhaarNo ?? "",
      mobile: c.mobile ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      tags: (c.tags ?? []).join(","),
      familyGroup: c.clientGroup?.name ?? "",
      relationship: c.relationshipToHead ?? "",
      deletedAt: c.deletedAt ?? "",
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Clients")
    XLSX.writeFile(wb, "clients.csv")
  }
}
