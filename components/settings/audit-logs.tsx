"use client"

import useSWR from "swr"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AuditLogs() {
  const [page, setPage] = useState(1)
  const [entity, setEntity] = useState("")
  const [action, setAction] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const pageSize = 50

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (entity) params.set("entity", entity)
  if (action) params.set("action", action)
  if (startDate) params.set("startDate", startDate)
  if (endDate) params.set("endDate", endDate)

  const { data, isLoading } = useSWR(`/api/audit?${params.toString()}`, fetcher)
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))

  function getActionColor(action: string) {
    switch (action) {
      case "CREATE": return "default"
      case "UPDATE": return "secondary"
      case "DELETE": return "destructive"
      case "LOGIN": case "SIGNUP": return "outline"
      default: return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>
          Track all activities and changes in your workspace (Owner only)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Entity</label>
            <select
              value={entity}
              onChange={(e) => {
                setEntity(e.target.value)
                setPage(1)
              }}
              className="border rounded px-3 py-2 text-sm w-full"
            >
              <option value="">All entities</option>
              <option value="USER">User</option>
              <option value="CLIENT">Client</option>
              <option value="POLICY">Policy</option>
              <option value="TEMPLATE">Template</option>
              <option value="WORKSPACE">Workspace</option>
              <option value="MEMBERSHIP">Membership</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Action</label>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value)
                setPage(1)
              }}
              className="border rounded px-3 py-2 text-sm w-full"
            >
              <option value="">All actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="SIGNUP">Signup</option>
              <option value="INVITE_USER">Invite User</option>
              <option value="REMOVE_USER">Remove User</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(1)
              }}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {log.user ? (
                        <div>
                          <div className="font-medium">{log.user.name}</div>
                          <div className="text-xs text-muted-foreground">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionColor(log.action) as any}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{log.entity}</span>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {log.diffJson && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View changes
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(log.diffJson, null, 2)}
                          </pre>
                        </details>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages} • {total} total logs
          </span>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              disabled={page <= 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              disabled={page >= pages} 
              onClick={() => setPage(p => Math.min(pages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}