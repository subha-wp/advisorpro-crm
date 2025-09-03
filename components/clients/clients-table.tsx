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
import * as XLSX from "xlsx"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Client = {
  id: string
  name: string
  mobile?: string
  email?: string
  address?: string
  tags: string[]
  deletedAt?: string | null
}

const allowedSorts = ["createdAt", "updatedAt", "name", "email", "mobile"] as const
type SortKey = (typeof allowedSorts)[number]

export function ClientsTable() {
  const [q, setQ] = useState("")
  const [showDeleted, setShowDeleted] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [sort, setSort] = useState<SortKey>("createdAt")
  const [dir, setDir] = useState<"asc" | "desc">("desc")

  const url = useMemo(() => {
    const params = new URLSearchParams({
      q,
      page: String(page),
      pageSize: String(pageSize),
      deleted: String(showDeleted),
      sort,
      dir,
    })
    return `/api/clients?${params.toString()}`
  }, [q, page, pageSize, showDeleted, sort, dir])

  const { data, mutate, isLoading } = useSWR(url, fetcher)

  const items: Client[] = data?.items ?? []
  const total = data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))

  // Create/Edit modal state
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState({ name: "", mobile: "", email: "", address: "", tags: "" })

  function openCreate() {
    setEditing(null)
    setForm({ name: "", mobile: "", email: "", address: "", tags: "" })
    setOpen(true)
  }
  function openEdit(c: Client) {
    setEditing(c)
    setForm({
      name: c.name ?? "",
      mobile: c.mobile ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      tags: (c.tags ?? []).join(","),
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
      mobile: form.mobile.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
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
    } else {
      // optionally show toast
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

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-balance">Clients</CardTitle>
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
          <Button onClick={openCreate}>Add Client</Button>
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
                <TableHead role="button" onClick={() => toggleSort("mobile" as SortKey)}>
                  Mobile {sort === "mobile" ? (dir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead role="button" onClick={() => toggleSort("email" as SortKey)}>
                  Email {sort === "email" ? (dir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead>Tags</TableHead>
                <TableHead role="button" onClick={() => toggleSort("updatedAt" as SortKey)}>
                  Updated {sort === "updatedAt" ? (dir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>Loading...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>No clients</TableCell>
                </TableRow>
              ) : (
                items.map((c) => (
                  <TableRow key={c.id} className={c.deletedAt ? "opacity-60" : ""}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.mobile}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{(c.tags ?? []).join(", ")}</TableCell>
                    <TableCell>{""}</TableCell>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Client" : "Add Client"}</DialogTitle>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={submitForm}>
            <div className="grid gap-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="grid gap-1">
              <Label>Mobile</Label>
              <Input value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label>Tags (comma separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
            </div>
            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit">{editing ? "Save changes" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )

  function exportCSV() {
    const rows = items.map((c: any) => ({
      id: c.id,
      name: c.name,
      mobile: c.mobile ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      tags: (c.tags ?? []).join(","),
      deletedAt: c.deletedAt ?? "",
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Clients")
    XLSX.writeFile(wb, "clients.csv")
  }
}
