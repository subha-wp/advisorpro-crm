"use client"

import type React from "react"

import useSWR from "swr"
import { useMemo, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EnhancedPolicyForm } from "./enhanced-policy-form"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import { Building2, Plus, Edit, Trash2, Download, Upload, Eye, Users } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

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
  const { toast } = useToast()
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

  // Enhanced form modal
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Policy | null>(null)
  const [preselectedClient, setPreselectedClient] = useState<any>(null)

  function openCreate() {
    setEditing(null)
    setPreselectedClient(null)
    setOpen(true)
  }

  function openCreateForClient(client: any) {
    setEditing(null)
    setPreselectedClient(client)
    setOpen(true)
  }

  function openEdit(p: Policy) {
    setEditing(p)
    setPreselectedClient(null)
    setOpen(true)
  }

  async function onDelete(id: string, policyNumber: string) {
    if (!confirm(`Are you sure you want to delete policy ${policyNumber}?`)) return
    
    try {
      const res = await fetch(`/api/policies/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Policy deleted", description: `Policy ${policyNumber} has been deleted` })
        mutate()
      } else {
        const data = await res.json()
        toast({ 
          title: "Error", 
          description: data.error || "Failed to delete policy",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Network error. Please try again.",
        variant: "destructive"
      })
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "ACTIVE": return "default"
      case "LAPSED": return "destructive"
      case "MATURED": return "secondary"
      case "SURRENDERED": return "outline"
      default: return "outline"
    }
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
    <Card className="shadow-sm">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-balance flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Insurance Policies
        </CardTitle>
        <div className="flex items-center gap-2">
          <Input 
            placeholder="Search policies..." 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            className="w-48" 
          />
          <select
            className="border rounded-md px-3 py-2 text-sm bg-background"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="LAPSED">LAPSED</option>
            <option value="MATURED">MATURED</option>
            <option value="SURRENDERED">SURRENDERED</option>
          </select>
          <Button variant="outline" onClick={triggerImport} className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
            onChange={handleFile}
          />
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Policy
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead role="button" onClick={() => toggleSort("policyNumber")} className="cursor-pointer hover:text-primary">
                  Policy # {sort === "policyNumber" ? (dir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead role="button" onClick={() => toggleSort("insurer")} className="cursor-pointer hover:text-primary">
                  Insurer {sort === "insurer" ? (dir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead role="button" onClick={() => toggleSort("planName")} className="cursor-pointer hover:text-primary">
                  Plan {sort === "planName" ? (dir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead role="button" onClick={() => toggleSort("premiumAmount")} className="cursor-pointer hover:text-primary">
                  Premium {sort === "premiumAmount" ? (dir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead role="button" onClick={() => toggleSort("nextDueDate")} className="cursor-pointer hover:text-primary">
                  Next Due {sort === "nextDueDate" ? (dir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead role="button" onClick={() => toggleSort("status")} className="cursor-pointer hover:text-primary">
                  Status {sort === "status" ? (dir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Loading policies...
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-8 w-8 text-muted-foreground/50" />
                      <span>No policies found</span>
                      <Button size="sm" onClick={openCreate} className="mt-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Policy
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.client ? (
                        <div>
                          <div className="font-medium">{p.client.name}</div>
                          {p.client.clientGroup && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              <Users className="h-3 w-3 mr-1" />
                              {p.client.clientGroup.name}
                            </Badge>
                          )}
                          {p.client.mobile && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {p.client.mobile}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unknown Client</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-medium">{p.policyNumber}</TableCell>
                    <TableCell className="font-medium">{p.insurer}</TableCell>
                    <TableCell>{p.planName || "-"}</TableCell>
                    <TableCell className="font-mono">
                      {p.premiumAmount ? `₹ ${parseFloat(p.premiumAmount.toString()).toLocaleString('en-IN')}` : "-"}
                    </TableCell>
                    <TableCell>
                      {p.nextDueDate ? (
                        <div className="flex items-center gap-2">
                          <span>{new Date(p.nextDueDate).toLocaleDateString('en-IN')}</span>
                          {new Date(p.nextDueDate) < new Date() && p.status === "ACTIVE" && (
                            <Badge variant="destructive" className="text-xs">Overdue</Badge>
                          )}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(p.status) as any}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="gap-1">
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => onDelete(p.id, p.policyNumber)}
                          className="gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
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

        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages} • {total} total policies
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>

      <EnhancedPolicyForm
        open={open}
        onOpenChange={setOpen}
        policy={editing}
        onSuccess={() => {
          mutate()
          setEditing(null)
          setPreselectedClient(null)
        }}
      />
    </Card>
  )
}