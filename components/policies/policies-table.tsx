"use client"

import { useState, useMemo, useRef } from "react"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Download, Upload, Users, Building2 } from "lucide-react"
import * as XLSX from "xlsx"


import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import { EnhancedPolicyForm } from "./EnhancedPolicyForm"

type Policy = {
  id: string
  clientId: string
  client?: {
    id: string
    name: string
    mobile?: string
    email?: string
    clientGroup?: {
      id: string
      name: string
    }
  }
  insurer: string
  planName?: string
  policyNumber: string
  premiumAmount?: number
  premiumMode?: string
  nextDueDate?: string | null
  status: "ACTIVE" | "LAPSED" | "MATURED" | "SURRENDERED"
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function PoliciesTableMobile() {
  const { toast } = useToast()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<string>("")
  const [page, setPage] = useState(1)
  const pageSize = 10

  const url = useMemo(() => {
    const params = new URLSearchParams({ q, page: String(page), pageSize: String(pageSize) })
    if (status) params.set("status", status)
    return `/api/policies?${params.toString()}`
  }, [q, page, pageSize, status])

  const { data, mutate, isLoading } = useSWR(url, fetcher)

  const items: Policy[] = data?.items ?? []
  const total = data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))

  // form modal
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Policy | null>(null)

  // delete drawer
  const [deleteTarget, setDeleteTarget] = useState<Policy | null>(null)

  function openCreate() {
    setEditing(null)
    setOpen(true)
  }
  function openEdit(p: Policy) {
    setEditing(p)
    setOpen(true)
  }
  function askDelete(p: Policy) {
    setDeleteTarget(p)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/policies/${deleteTarget.id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Deleted", description: `Policy ${deleteTarget.policyNumber} deleted` })
        mutate()
      } else {
        toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" })
    }
    setDeleteTarget(null)
  }

  // CSV Import/Export
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

  return (
    <div className="relative pb-20">
      {/* Sticky top bar */}
      <div className="sticky top-0 bg-background z-10 border-b p-2 flex gap-2 items-center">
        <Input
          placeholder="Search policies..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1"
        />
        <select
          className="border rounded-md px-2 py-1 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All</option>
          <option value="ACTIVE">Active</option>
          <option value="LAPSED">Lapsed</option>
          <option value="MATURED">Matured</option>
          <option value="SURRENDERED">Surrendered</option>
        </select>
        <Button variant="ghost" size="icon" onClick={triggerImport}>
          <Upload className="h-5 w-5" />
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          className="hidden"
          onChange={handleFile}
        />
        <Button variant="ghost" size="icon" onClick={exportCSV}>
          <Download className="h-5 w-5" />
        </Button>
      </div>

      {/* Policy cards */}
      <div className="p-2 space-y-3">
        {isLoading ? (
          <p className="text-center py-6 text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-10">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-2">No policies found</p>
            <Button className="mt-3" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> Add First Policy
            </Button>
          </div>
        ) : (
          items.map((p) => (
            <Card key={p.id} className="shadow-sm">
              <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{p.client?.name || "Unknown Client"}</div>
                    {p.client?.clientGroup && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        <Users className="h-3 w-3 mr-1" /> {p.client.clientGroup.name}
                      </Badge>
                    )}
                  </div>
                  <Badge>{p.status}</Badge>
                </div>
                <div className="text-sm">
                  <div><span className="font-medium">Policy #:</span> {p.policyNumber}</div>
                  <div><span className="font-medium">Insurer:</span> {p.insurer}</div>
                  <div><span className="font-medium">Plan:</span> {p.planName || "-"}</div>
                  <div><span className="font-medium">Premium:</span> {p.premiumAmount ? `₹ ${p.premiumAmount}` : "-"}</div>
                  <div><span className="font-medium">Next Due:</span> {p.nextDueDate ? new Date(p.nextDueDate).toLocaleDateString() : "-"}</div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => askDelete(p)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {items.length > 0 && (
        <div className="flex justify-between items-center p-3 text-sm text-muted-foreground">
          <span>Page {page} / {pages}</span>
          <div className="flex gap-2">
            <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Floating Add Button */}
      <Button
        className="fixed bottom-5 right-5 rounded-full h-14 w-14 shadow-lg"
        onClick={openCreate}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Delete Drawer */}
      <Drawer open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DrawerContent className="rounded-t-2xl p-4 space-y-4">
          <DrawerHeader>
            <DrawerTitle>Delete Policy</DrawerTitle>
            <DrawerDescription>
              Are you sure you want to delete policy{" "}
              <span className="font-mono">{deleteTarget?.policyNumber}</span>? This action cannot be undone.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Create/Edit Form */}
      <EnhancedPolicyForm
        open={open}
        onOpenChange={setOpen}
        policy={editing}
        onSuccess={() => { mutate(); setEditing(null) }}
      />
    </div>
  )
}
