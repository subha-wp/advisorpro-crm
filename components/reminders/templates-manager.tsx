"use client"

import type React from "react"

import useSWR from "swr"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Template = {
  id: string
  name: string
  channel: "email" | "whatsapp"
  subject?: string | null
  body: string
  variables: string[]
}

export function TemplatesManager() {
  const { data, mutate } = useSWR("/api/templates", fetcher)
  const items: Template[] = data?.items ?? []

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [form, setForm] = useState({ name: "", channel: "email", subject: "", body: "", variables: "" })

  useEffect(() => {
    if (!open) setEditing(null)
  }, [open])

  function openCreate() {
    setEditing(null)
    setForm({ name: "", channel: "email", subject: "", body: "", variables: "" })
    setOpen(true)
  }
  function openEdit(t: Template) {
    setEditing(t)
    setForm({
      name: t.name,
      channel: t.channel,
      subject: t.subject ?? "",
      body: t.body,
      variables: (t.variables ?? []).join(","),
    } as any)
    setOpen(true)
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    const payload: any = {
      name: form.name.trim(),
      channel: form.channel,
      subject: form.subject.trim() || undefined,
      body: form.body,
      variables: form.variables
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    }
    const res = await fetch(editing ? `/api/templates/${editing.id}` : "/api/templates", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setOpen(false)
      mutate()
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this template?")) return
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" })
    if (res.ok) mutate()
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-balance">Reminder Templates</CardTitle>
        <Button onClick={openCreate}>New Template</Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>No templates yet</TableCell>
                </TableRow>
              ) : (
                items.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.name}</TableCell>
                    <TableCell className="uppercase">{t.channel}</TableCell>
                    <TableCell>{(t.variables ?? []).join(", ")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onDelete(t.id)}>
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
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Template" : "New Template"}</DialogTitle>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={submitForm}>
            <div className="grid gap-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="grid gap-1">
              <Label>Channel</Label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={form.channel}
                onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }) as any)}
              >
                <option value="email">email</option>
                <option value="whatsapp">whatsapp</option>
              </select>
            </div>
            <div className="grid gap-1">
              <Label>Subject (email only)</Label>
              <Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label>Body</Label>
              <Textarea
                rows={6}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Dear {{client_name}}, policy {{policy_no}} premium ₹{{premium_amount}} is due on {{due_date}}."
              />
            </div>
            <div className="grid gap-1">
              <Label>Variables (comma separated)</Label>
              <Input
                value={form.variables}
                onChange={(e) => setForm((f) => ({ ...f, variables: e.target.value }))}
                placeholder="client_name, policy_no, premium_amount, due_date"
              />
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
