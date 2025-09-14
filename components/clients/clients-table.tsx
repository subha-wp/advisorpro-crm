//@ts-nocheck
"use client"

import type React from "react"
import { useMemo, useRef, useState, useEffect } from "react"
import useSWRInfinite from "swr/infinite"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardTitle } from "@/components/ui/card"
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
  Filter,
  Plus,
  User,
  MoreVertical,
} from "lucide-react"
import * as XLSX from "xlsx"
import { ClientCard } from "./client-card"
import { toast } from "@/components/ui/use-toast"

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

const relationshipOptions = ["Head", "Spouse", "Son", "Daughter", "Father", "Mother", "Brother", "Sister", "Other"]

const PAGE_SIZE = 20

// Search Bar
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

// Reusable Client Form
const ClientForm: React.FC<{
  form: any
  setForm: (form: any) => void
  groups: ClientGroup[]
  editing: Client | null
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  submitting: boolean
  success: boolean
}> = ({ form, setForm, groups, editing, onSubmit, onCancel, submitting, success }) => {
  return (
    <form className="space-y-4" onSubmit={onSubmit} id="client-form">
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
            <Select
              value={form.clientGroupId || "none"}
              onValueChange={(value) => setForm({ ...form, clientGroupId: value === "none" ? "" : value })}
            >
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
              value={form.relationshipToHead || "none"}
              onValueChange={(value) => setForm({ ...form, relationshipToHead: value === "none" ? "" : value })}
            >
              <SelectTrigger className="py-6">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
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
      <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-between">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-full bg-transparent">
          Cancel
        </Button>
        <Button
          type="submit"
          form="client-form"
          className="rounded-full flex items-center justify-center gap-2"
          disabled={submitting || success}
        >
          {submitting && !success && (
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          )}
          {success ? "✔ Success!" : (editing ? "Save changes" : "Create Client")}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Main ClientsTable
export function ClientsTable() {
  const [q, setQ] = useState("")
  const [showDeleted, setShowDeleted] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string>("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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

  // SWR Infinite
  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.items.length) return null
    const params = new URLSearchParams({
      q,
      page: String(pageIndex + 1),
      pageSize: String(PAGE_SIZE),
      deleted: String(showDeleted),
      sort: "createdAt",
      dir: "desc",
      ...(selectedGroupId ? { groupId: selectedGroupId } : {}),
    })
    return `/api/clients?${params.toString()}`
  }

  const { data, size, setSize, isValidating, mutate } = useSWRInfinite(getKey, fetcher)
  const items: Client[] = data ? data.flatMap((d) => d.items) : []
  const total = data?.[0]?.total ?? 0
  const isReachingEnd = data && data[data.length - 1]?.items.length < PAGE_SIZE

  const { data: groupsData } = useSWRInfinite(() => "/api/client-groups", fetcher)
  const groups: ClientGroup[] = groupsData?.[0]?.items ?? []

  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!loadMoreRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isReachingEnd) {
          setSize((s) => s + 1)
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [setSize, isReachingEnd])

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

    if (!form.name.trim()) {
      toast({ title: "Validation Error", description: "Client name is required", variant: "destructive" })
      return
    }

    if (form.createNewGroup && !form.groupName.trim()) {
      toast({
        title: "Validation Error",
        description: "Family group name is required when creating a new group",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    setSuccess(false)

    const payload: any = {
      name: form.name.trim(),
      dob: form.dob || undefined,
      panNo: form.panNo.trim() || undefined,
      aadhaarNo: form.aadhaarNo.trim() || undefined,
      mobile: form.mobile.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      clientGroupId: form.clientGroupId || undefined,
      relationshipToHead: form.relationshipToHead || undefined,
      createNewGroup: form.createNewGroup,
      groupName: form.groupName.trim() || undefined,
    }

    try {
      const res = await fetch(editing ? `/api/clients/${editing.id}` : "/api/clients", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)

        toast({
          title: editing ? "Client Updated" : "Client Created",
          description: `${payload.name} has been ${editing ? "updated" : "created"} successfully`,
        })

        mutate()

        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
        }, 1200)
      } else {
        toast({ title: "Error", description: data.error || "Failed", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" })
    } finally {
      setSubmitting(false)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="sticky top-0 z-40 bg-white/95 border-b ">
        <div className="space-y-4 p-4">
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="rounded-full"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setShowDeleted(!showDeleted)}>
                    <Filter className="h-4 w-4 mr-2" />
                    {showDeleted ? "Hide Deleted" : "Show Deleted"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search Bar */}
          <SearchBar value={q} onChange={setQ} />

          {/* Filters */}
          {showFilters && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Filter by Family Group</Label>
                <Select value={selectedGroupId || "all"} onValueChange={(value) => setSelectedGroupId(value === "all" ? "" : value)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All clients</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} ({group._count.clients} members)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-6 pb-32 space-y-4">
        {isValidating && items.length === 0 ? (
          <div className="text-center py-12">Loading clients...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">No clients found</div>
        ) : (
          <>
            {items.map((client) => (
              <ClientCard key={client.id} client={client} onEdit={() => openEdit(client)} onDelete={onDelete} onRestore={onRestore} />
            ))}
            {!isReachingEnd && (
              <div ref={loadMoreRef} className="h-16 flex items-center justify-center text-sm text-muted-foreground">
                {isValidating ? "Loading more..." : "Scroll to load more"}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          onClick={openCreate}
          className="h-16 w-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[95vh] overflow-y-auto max-w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {editing ? "Edit Client" : "Add New Client"}
            </DialogTitle>
          </DialogHeader>
          <ClientForm
            form={form}
            setForm={setForm}
            groups={groups}
            editing={editing}
            onSubmit={submitForm}
            onCancel={() => setOpen(false)}
            submitting={submitting}
            success={success}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
