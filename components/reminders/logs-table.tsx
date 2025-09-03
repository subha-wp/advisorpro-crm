"use client"

import useSWR from "swr"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function LogsTable() {
  const [channel, setChannel] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 20
  const url = `/api/reminders/logs?page=${page}&pageSize=${pageSize}${channel ? `&channel=${channel}` : ""}`
  const { data, isLoading } = useSWR(url, fetcher)

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-balance">Reminder Logs</CardTitle>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={channel}
          onChange={(e) => {
            setChannel(e.target.value)
            setPage(1)
          }}
          aria-label="Filter by channel"
        >
          <option value="">All channels</option>
          <option value="email">email</option>
          <option value="whatsapp">whatsapp</option>
        </select>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}>Loading...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>No logs</TableCell>
                </TableRow>
              ) : (
                items.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="uppercase">{l.channel}</TableCell>
                    <TableCell>{l.to}</TableCell>
                    <TableCell>{l.status}</TableCell>
                    <TableCell>{new Date(l.sentAt).toLocaleString()}</TableCell>
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
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <Button variant="outline" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
