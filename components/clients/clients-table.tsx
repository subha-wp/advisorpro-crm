// @ts-nocheck
"use client"

import type React from "react"
import { useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  Search,
  X,
  Download,
  Upload,
  Filter,
  Phone,
  Mail,
  CreditCard,
  Hash,
  MoreVertical,
  UsersRound,
} from "lucide-react"
import { FamilyWorkflow } from "./family-workflow"
import * as XLSX from "xlsx"
import { ClientCard } from "./client-card"

// Types
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

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const allowedSorts = ["createdAt", "updatedAt", "name", "email", "mobile"] as const
type SortKey = (typeof allowedSorts)[number]

const relationshipOptions = ["Head", "Spouse", "Son", "Daughter", "Father", "Mother", "Brother", "Sister", "Other"]


const SearchBar: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        placeholder="Search clients by name, mobile, email..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-12 pr-12 h-14 text-base rounded-2xl border-2 focus:border-primary transition-all duration-200"
      />
      {value && (
        <button
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-muted/80 transition-colors"
          onClick={() => onChange("")}
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}

const Pagination: React.FC<{
  page: number
  pages: number
  setPage: (page: number) => void
}> = ({ page, pages, setPage }) => {
  return (
    <div className="flex justify-center items-center gap-4 mt-6 pb-4">
      <Button
        variant="outline"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
        className="rounded-full h-12 px-6"
      >
        Previous
      </Button>
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
        <span className="text-sm font-medium">
          {page} of {pages}
        </span>
      </div>
      <Button
        variant="outline"
        disabled={page >= pages}
        onClick={() => setPage(page + 1)}
        className="rounded-full h-12 px-6"
      >
        Next
      </Button>
    </div>
  )
}

// Reusable Client Form Component
const ClientForm: React.FC<{
  form: any
  setForm: (form: any) => void
  groups: ClientGroup[]
  editing: Client | null
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}> = ({ form, setForm, groups, editing, onSubmit, onCancel }) => {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="py-6"
        />
      </div>
      <div className="space-y-2">
        <Label>Date of Birth</Label>
        <Input
          type="date"
          value={form.dob}
          onChange={(e) => setForm({ ...form, dob: e.target.value })}
          className="py-6"
        />
      </div>
      <div className="space-y-2">
        <Label>Mobile</Label>
        <Input
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          placeholder="+91 9876543210"
          className="py-6"
        />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="py-6"
        />
      </div>
      <div className="space-y-2">
        <Label>PAN Number</Label>
        <Input
          value={form.panNo}
          onChange={(e) => setForm({ ...form, panNo: e.target.value.toUpperCase() })}
          placeholder="ABCDE1234F"
          maxLength={10}
          pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
          className="py-6"
        />
        <p className="text-xs text-gray-400">Format: ABCDE1234F</p>
      </div>
      <div className="space-y-2">
        <Label>Aadhaar Number</Label>
        <Input
          value={form.aadhaarNo}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "").slice(0, 12)
            setForm({ ...form, aadhaarNo: value })
          }}
          placeholder="1234 5678 9012"
          maxLength={12}
          className="py-6"
        />
        <p className="text-xs text-gray-400">12-digit number</p>
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="py-6" />
      </div>
      <div className="space-y-2">
        <Label>Tags (comma separated)</Label>
        <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="py-6" />
      </div>
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Family Group</h4>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.createNewGroup}
            onChange={(e) =>
              setForm({
                ...form,
                createNewGroup: e.target.checked,
                clientGroupId: e.target.checked ? "" : form.clientGroupId,
              })
            }
          />
          Create new family group
        </label>
        {form.createNewGroup ? (
          <div className="space-y-2 mt-2">
            <Label>Family Group Name *</Label>
            <Input
              value={form.groupName}
              onChange={(e) => setForm({ ...form, groupName: e.target.value })}
              placeholder="e.g., Smith Family"
              required={form.createNewGroup}
              className="py-6"
            />
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            <Label>Select Existing Group</Label>
            <Select value={form.clientGroupId} onValueChange={(value) => setForm({ ...form, clientGroupId: value })}>
              <SelectTrigger className="py-6">
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
          <div className="space-y-2 mt-2">
            <Label>Relationship to Head</Label>
            <Select
              value={form.relationshipToHead}
              onValueChange={(value) => setForm({ ...form, relationshipToHead: value })}
            >
              <SelectTrigger className="py-6">
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
      <DialogFooter className="mt-4 flex justify-between">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-full bg-transparent">
          Cancel
        </Button>
        <Button type="submit" className="rounded-full">
          {editing ? "Save changes" : "Create Client"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Reusable Group Form Component
const GroupForm: React.FC<{
  groupForm: { name: string; description: string }
  setGroupForm: (form: any) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}> = ({ groupForm, setGroupForm, onSubmit, onCancel }) => {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Group Name *</Label>
        <Input
          value={groupForm.name}
          onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
          placeholder="e.g., Smith Family"
          required
          className="py-6"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={groupForm.description}
          onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
          placeholder="Optional description"
          className="py-6"
        />
      </div>
      <DialogFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-full bg-transparent">
          Cancel
        </Button>
        <Button type="submit" className="rounded-full">
          Create Group
        </Button>
      </DialogFooter>
    </form>
  )
}

// Main ClientsTable Component
export function ClientsTable() {
  const [q, setQ] = useState("")
  const [showDeleted, setShowDeleted] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedGroupId, setSelectedGroupId] = useState<string>("")
  const pageSize = 20
  const [sort, setSort] = useState<SortKey>("createdAt")
  const [dir, setDir] = useState<"asc" | "desc">("desc")
  const [familyWorkflowOpen, setFamilyWorkflowOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [groupModalOpen, setGroupModalOpen] = useState(false)

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

  const [groupForm, setGroupForm] = useState({ name: "", description: "" })

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

  const { data: groupsData, mutate: mutateGroups } = useSWR("/api/client-groups", fetcher)
  const groups: ClientGroup[] = groupsData?.items ?? []

  const { data, mutate, isLoading } = useSWR(url, fetcher)
  const items: Client[] = data?.items ?? []
  const total = data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))

  const inputRef = useRef<HTMLInputElement>(null)

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
      if (form.createNewGroup) {
        mutateGroups()
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="sticky top-0 z-40 bg-white  border-b">
        <div className="space-y-4 pb-2">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">
                  {selectedGroupId ? groups.find((g) => g.id === selectedGroupId)?.name : "Clients"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{total} total clients</p>
              </div>
            </div>

            {/* Actions Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-2 bg-transparent">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setShowDeleted(!showDeleted)}>
                  <Filter className="h-4 w-4 mr-2" />
                  {showDeleted ? "Hide Deleted" : "Show Deleted"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={triggerImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setGroupModalOpen(true)}>
                  <UsersRound className="h-4 w-4 mr-2" />
                  Create Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search and Group Filter Row */}

              <SearchBar value={q} onChange={setQ} />
        
        </div>
      </div>

      <div className=" pt-6 pb-24 space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-muted-foreground">No clients found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {q ? `No results for "${q}"` : "Start by adding your first client"}
            </p>
          </div>
        ) : (
          <>
            {items.map((client) => (
              <ClientCard key={client.id} client={client} onEdit={openEdit} onDelete={onDelete} onRestore={onRestore} />
            ))}
            <Pagination page={page} pages={pages} setPage={setPage} />
          </>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Client" : "Add Client"}</DialogTitle>
          </DialogHeader>
          <ClientForm
            form={form}
            setForm={setForm}
            groups={groups}
            editing={editing}
            onSubmit={submitForm}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={groupModalOpen} onOpenChange={setGroupModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Family Group</DialogTitle>
          </DialogHeader>
          <GroupForm
            groupForm={groupForm}
            setGroupForm={setGroupForm}
            onSubmit={submitGroupForm}
            onCancel={() => setGroupModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <FamilyWorkflow
        open={familyWorkflowOpen}
        onOpenChange={setFamilyWorkflowOpen}
        onComplete={handleFamilyWorkflowComplete}
      />
    </div>
  )
}
