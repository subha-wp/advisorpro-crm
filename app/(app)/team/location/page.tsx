"use client"

import useSWR from "swr"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Users, 
  Building2, 
  AlertTriangle,
  CheckCircle,
  Filter,
  Calendar
} from "lucide-react"
import { format } from "date-fns"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function TeamLocationsPage() {
  const [viewType, setViewType] = useState<"current" | "history">("current")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [locationSource, setLocationSource] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 50

  // Fetch office location settings
  const { data: officeData } = useSWR("/api/workspace/location", fetcher)
  const officeLocation = officeData?.settings

  // Fetch team members
  const { data: teamData } = useSWR("/api/team", fetcher)
  const teamMembers = teamData?.items ?? []

  // Build URL for location data
  const locationUrl = (() => {
    const params = new URLSearchParams({
      type: viewType,
      page: String(page),
      pageSize: String(pageSize),
    })
    if (selectedUserId) params.set("userId", selectedUserId)
    if (startDate) params.set("startDate", startDate)
    if (endDate) params.set("endDate", endDate)
    if (locationSource) params.set("source", locationSource)
    return `/api/locations?${params.toString()}`
  })()

  const { data: locationData, isLoading } = useSWR(locationUrl, fetcher)
  const locations = locationData?.items ?? []
  const total = locationData?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))

  function getUserInitials(name?: string) {
    if (!name) return "U"
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  function getDistanceColor(distance?: number) {
    if (!distance) return "outline"
    if (distance <= 1) return "default" // Within 1km
    if (distance <= 5) return "secondary" // Within 5km
    return "destructive" // More than 5km
  }

  function getDistanceLabel(distance?: number) {
    if (!distance) return "Unknown"
    if (distance < 1) return `${Math.round(distance * 1000)}m`
    return `${distance.toFixed(1)}km`
  }

  function getLocationSourceIcon(source: string) {
    switch (source) {
      case "login": return <Clock className="h-3 w-3" />
      case "manual": return <MapPin className="h-3 w-3" />
      case "periodic": return <Navigation className="h-3 w-3" />
      default: return <MapPin className="h-3 w-3" />
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-balance flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Team Locations
          </h1>
          <p className="text-sm text-muted-foreground">
            Track employee locations and monitor attendance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewType === "current" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewType("current")}
          >
            Current Locations
          </Button>
          <Button
            variant={viewType === "history" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewType("history")}
          >
            Location History
          </Button>
        </div>
      </header>

      {/* Office Location Status */}
      {!officeLocation?.latitude || !officeLocation?.longitude ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Office location not configured. Please set up office location in{" "}
            <a href="/settings" className="underline">workspace settings</a> to enable distance calculations.
          </AlertDescription>
        </Alert>
      ) : !officeLocation.trackingEnabled ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Location tracking is disabled. Enable it in{" "}
            <a href="/settings" className="underline">workspace settings</a> to track employee locations.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Office location: {officeLocation.address || `${officeLocation.latitude}, ${officeLocation.longitude}`}
            </span>
            <Badge variant="default">Tracking Enabled</Badge>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters for History View */}
      {viewType === "history" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="grid gap-2">
                <Label>Team Member</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All members</SelectItem>
                    {teamMembers.map((member: any) => (
                      <SelectItem key={member.user.id} value={member.user.id}>
                        {member.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Source</Label>
                <Select value={locationSource} onValueChange={setLocationSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All sources</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="periodic">Periodic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedUserId("")
                    setStartDate("")
                    setEndDate("")
                    setLocationSource("")
                    setPage(1)
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            {viewType === "current" ? "Current Team Locations" : "Location History"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading locations...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Distance from Office</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Accuracy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {viewType === "current" 
                          ? "No recent location data found" 
                          : "No location history found"
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    locations.map((location: any) => (
                      <TableRow key={location.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getUserInitials(location.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{location.user.name}</div>
                              <div className="text-xs text-muted-foreground">{location.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-mono text-xs">
                              {Number(location.latitude).toFixed(6)}, {Number(location.longitude).toFixed(6)}
                            </div>
                            {location.address && (
                              <div className="text-xs text-muted-foreground max-w-xs truncate">
                                {location.address}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {location.distanceFromOffice ? (
                            <Badge variant={getDistanceColor(Number(location.distanceFromOffice)) as any}>
                              {getDistanceLabel(Number(location.distanceFromOffice))}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getLocationSourceIcon(location.locationSource)}
                            <span className="text-sm capitalize">{location.locationSource}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {format(new Date(location.createdAt), "dd MMM yyyy")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(location.createdAt), "HH:mm:ss")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {location.accuracy ? (
                            <span className="text-sm">±{Math.round(location.accuracy)}m</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination for History View */}
          {viewType === "history" && total > 0 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                Page {page} of {pages} • {total} total records
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
          )}
        </CardContent>
      </Card>

      {/* Office Location Info */}
      {officeLocation?.latitude && officeLocation?.longitude && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Office Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Coordinates</Label>
                <div className="font-mono text-sm">
                  {Number(officeLocation.latitude).toFixed(6)}, {Number(officeLocation.longitude).toFixed(6)}
                </div>
              </div>
              {officeLocation.address && (
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  <div className="text-sm">{officeLocation.address}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}