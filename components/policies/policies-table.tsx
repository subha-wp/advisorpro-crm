"use client"

import type React from "react"

import useSWR from "swr"
import { useMemo, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import * as XLSX from "xlsx"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Policy = {
  id: string
  clientId: string
  insurer: string
  planName?: string
  policyNumber: string
  premiumAmount?: number
  premiumMode?: string
  nextDueDate?: string | null
  status: "ACTIVE" | "LAPSED" | "MATURED" | "SURRENDERED"
}

const allowedSorts = [
  "createdAt",
  "insurer",
  "planName",
  "policyNumber",
  "premiumAmount",
  "nextDueDate",
  "status",
] as const
type SortKey = (typeof allowedSorts)[number]

export function PoliciesTable() {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<string>("")
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [sort, setSort] = useState<SortKey>("createdAt")
  const [dir, setDir] = useState<"asc" | "desc">("desc")

  const url = useMemo(() => {
    const params = new URLSearchParams({
      q,
      page: String(page),
      pageSize: String(pageSize),
      sort,
      dir,
    })
    if (status) params.set("status", status)
    return `/api/policies?${params.toString()}`
  }, [q, page, pageSize, sort, dir, status])

  const { data, mutate, isLoading } = useSWR(url, fetcher)

  const items: Policy[] = data?.items ?? []
  const total = data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))

  // Create/Edit modal
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Policy | null>(null)
  const [form, setForm] = useState({
    clientId: "",
    insurer: "",
    planName: "",
    policyNumber: "",
    premiumAmount: "",
    premiumMode: "",
    nextDueDate: "",
    status: "ACTIVE",
  })

  function openCreate() {
    setEditing(null)
    setForm({
      clientId: "",
      insurer: "",
      planName: "",
      policyNumber: "",
      premiumAmount: "",
      premiumMode: "",
      nextDueDate: "",
      status: "ACTIVE",
    })
    setOpen(true)
  }

  function openEdit(p: Policy) {
    setEditing(p)
    setForm({
      clientId: p.clientId,
      insurer: p.insurer ?? "",
      planName: p.planName ?? "",
      policyNumber: p.policyNumber ?? "",
      premiumAmount: p.premiumAmount ? String(p.premiumAmount) : "",
      premiumMode: p.premiumMode ?? "",
      nextDueDate: p.nextDueDate ? p.nextDueDate.slice(0, 10) : "",
      status: p.status,
    })
    setOpen(true)
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    const payload: any = {
      clientId: form.clientId,
      insurer: form.insurer.trim() || undefined,
      planName: form.planName.trim() || undefined,
      policyNumber: form.policyNumber.trim() || undefined,
      premiumAmount: form.premiumAmount ? Number(form.premiumAmount) : undefined,
      premiumMode: form.premiumMode.trim() || undefined,
      nextDueDate: form.nextDueDate || undefined,
      status: form.status as Policy["status"],
    }
    if (!editing) {
      if (!payload.clientId || !payload.insurer || !payload.policyNumber) return
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setOpen(false)
        mutate()
      }
    } else {
      // Update
      const res = await fetch(`/api/policies/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insurer: payload.insurer,
          planName: payload.planName,
          policyNumber: payload.policyNumber,
          premiumAmount: payload.premiumAmount,
          premiumMode: payload.premiumMode,
          nextDueDate: payload.nextDueDate,
          status: payload.status,
        }),
      })
      if (res.ok) {
        setOpen(false)
        mutate()
      }
    }
  }

  async function onDelete(id: string) {
    await fetch(`/api/policies/${id}`, { method: "DELETE" })
    mutate()
  }

  function toggleSort(key: SortKey) {
    if (sort === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSort(key)
      setDir(key === "policyNumber" ? "asc" : "desc")
    }
  }

  function exportCSV() {
    const rows = items.map((p: any) => ({
      id: p.id,
      clientId: p.clientId,
      insurer: p.insurer,
      planName: p.planName ?? "",
      policyNumber: p.policyNumber,
      premiumAmount: p.premiumAmount ?? "",
      premiumMode: p.premiumMode ?? "",
      nextDueDate: p.nextDueDate ?? "",
      status: p.status,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Policies")
    XLSX.writeFile(wb, "policies.csv")
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
        clientId: String(r.clientId ?? "").trim(),
        insurer: String(r.insurer ?? "").trim(),
        planName: String(r.planName ?? "").trim() || undefined,
        policyNumber: String(r.policyNumber ?? "").trim(),
        premiumAmount: r.premiumAmount !== "" ? Number(r.premiumAmount) : undefined,
        premiumMode: String(r.premiumMode ?? "").trim() || undefined,
        nextDueDate: String(r.nextDueDate ?? "").trim() || undefined,
        status: (String(r.status ?? "ACTIVE").trim() || "ACTIVE") as Policy["status"],
      }
      if (payload.clientId && payload.insurer && payload.policyNumber) {
        await fetch("/api/policies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }
    }
    mutate()
    e.target.value = ""
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-balance">Policies</CardTitle>
        <div className="flex items-center gap-2">
          <Input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} className="w-40" />
          <select
            className="border rounded px-2 py-1 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="LAPSED">LAPSED</option>
            <option value="MATURED">MATURED</option>
            <option value="SURRENDERED">SURRENDERED</option>
          </select>
          <Button onClick={triggerImport}>Import CSV</Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
            onChange={handleFile}
          />
          <Button onClick={exportCSV}>Export CSV</Button>
          <Button onClick={openCreate}>Add Policy</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead role="button" onClick={() => toggleSort("policyNumber")}>
                  Policy # {sort === "policyNumber" ? (dir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead role="button" onClick={() => toggleSort("insurer")}>
                  Insurer {sort === "insurer" ? (dir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead role="button" onClick={() => toggleSort("planName")}>
                  Plan {sort === "planName" ? (dir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead role="button" onClick={() => toggleSort("premiumAmount")}>
                  Premium {sort === "premiumAmount" ? (dir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead role="button" onClick={() => toggleSort("nextDueDate")}>
                  Next Due {sort === "nextDueDate" ? (dir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead role="button" onClick={() => toggleSort("status")}>
                  Status {sort === "status" ? (dir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
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
                  <TableCell colSpan={7}>No policies</TableCell>
                </TableRow>
              ) : (
                items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.policyNumber}</TableCell>
                    <TableCell>{p.insurer}</TableCell>
                    <TableCell>{p.planName}</TableCell>
                    <TableCell>{p.premiumAmount ?? "-"}</TableCell>
                    <TableCell>{p.nextDueDate ? new Date(p.nextDueDate).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>{p.status}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onDelete(p.id)}>
                          Delete
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Policy" : "Add Policy"}</DialogTitle>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={submitForm}>
            {!editing && (
              <div className="grid gap-1">
                <Label>Client ID</Label>
                <Input
                  value={form.clientId}
                  onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                  required
                />
              </div>
            )}
            <div className="grid gap-1">
              <Label>Insurer</Label>
              <Input
                value={form.insurer}
                onChange={(e) => setForm((f) => ({ ...f, insurer: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-1">
              <Label>Plan</Label>
              <Input value={form.planName} onChange={(e) => setForm((f) => ({ ...f, planName: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label>Policy Number</Label>
              <Input
                value={form.policyNumber}
                onChange={(e) => setForm((f) => ({ ...f, policyNumber: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-1">
              <Label>Premium Amount</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={form.premiumAmount}
                onChange={(e) => setForm((f) => ({ ...f, premiumAmount: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <Label>Premium Mode</Label>
              <Input
                value={form.premiumMode}
                onChange={(e) => setForm((f) => ({ ...f, premiumMode: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <Label>Next Due Date</Label>
              <Input
                type="date"
                value={form.nextDueDate}
                onChange={(e) => setForm((f) => ({ ...f, nextDueDate: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <Label>Status</Label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="LAPSED">LAPSED</option>
                <option value="MATURED">MATURED</option>
                <option value="SURRENDERED">SURRENDERED</option>
              </select>
            </div>
            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editing ? "Save changes" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
