"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LocationMap } from "@/components/location/location-map"
import { 
  MapPin, 
  Building2, 
  Users, 
  Clock, 
  Navigation,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { format } from "date-fns"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function LocationDashboard() {
  // Fetch office location settings
  const { data: officeData } = useSWR("/api/workspace/location", fetcher)
  const officeLocation = officeData?.settings

  // Fetch current team locations
  const { data: currentLocationsData, isLoading } = useSWR(
    officeLocation?.trackingEnabled ? "/api/locations?type=current" : null,
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  )
  const currentLocations = currentLocationsData?.items ?? []

  // Fetch team members for reference
  const { data: teamData } = useSWR("/api/team", fetcher)
  const teamMembers = teamData?.items ?? []

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
    if (distance <= 1) return "default" // Within 1km - green
    if (distance <= 5) return "secondary" // Within 5km - blue
    return "destructive" // More than 5km - red
  }

  function getDistanceLabel(distance?: number) {
    if (!distance) return "Unknown"
    if (distance < 1) return `${Math.round(distance * 1000)}m`
    return `${distance.toFixed(1)}km`
  }

  // Prepare data for map component
  const mapLocations = currentLocations.map((loc: any) => ({
    id: loc.id,
    latitude: Number(loc.latitude),
    longitude: Number(loc.longitude),
    label: loc.user.name,
    type: "employee" as const,
    distance: loc.distanceFromOffice ? Number(loc.distanceFromOffice) : undefined,
    timestamp: loc.createdAt,
    user: loc.user,
  }))

  const officeMapLocation = officeLocation?.latitude && officeLocation?.longitude ? {
    latitude: Number(officeLocation.latitude),
    longitude: Number(officeLocation.longitude),
    address: officeLocation.address,
  } : undefined

  // Calculate statistics
  const stats = {
    totalMembers: teamMembers.length,
    membersWithLocation: currentLocations.length,
    membersNearOffice: currentLocations.filter((loc: any) => 
      loc.distanceFromOffice && Number(loc.distanceFromOffice) <= 1
    ).length,
    averageDistance: currentLocations.length > 0 
      ? currentLocations
          .filter((loc: any) => loc.distanceFromOffice)
          .reduce((sum: number, loc: any) => sum + Number(loc.distanceFromOffice), 0) / 
        currentLocations.filter((loc: any) => loc.distanceFromOffice).length
      : 0,
  }

  if (!officeLocation?.trackingEnabled) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Location tracking is not enabled. Configure office location and enable tracking in{" "}
          <a href="/settings" className="underline">workspace settings</a> to view team locations.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Team</p>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Location</p>
                <p className="text-2xl font-bold">{stats.membersWithLocation}</p>
              </div>
              <MapPin className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Near Office</p>
                <p className="text-2xl font-bold text-green-600">{stats.membersNearOffice}</p>
              </div>
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Distance</p>
                <p className="text-2xl font-bold">
                  {stats.averageDistance > 0 ? `${stats.averageDistance.toFixed(1)}km` : "-"}
                </p>
              </div>
              <Navigation className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Team Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading current locations...</p>
            </div>
          ) : currentLocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent location data from team members</p>
              <p className="text-xs mt-1">Locations are captured during login</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentLocations.map((location: any) => (
                <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getUserInitials(location.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{location.user.name}</div>
                      <div className="text-sm text-muted-foreground">{location.user.email}</div>
                      <div className="text-xs text-muted-foreground">
                        Last seen: {format(new Date(location.createdAt), "dd MMM yyyy, HH:mm")}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-2">
                    {location.distanceFromOffice && (
                      <Badge variant={getDistanceColor(Number(location.distanceFromOffice)) as any}>
                        {getDistanceLabel(Number(location.distanceFromOffice))} from office
                      </Badge>
                    )}
                    <div className="text-xs text-muted-foreground font-mono">
                      {Number(location.latitude).toFixed(4)}, {Number(location.longitude).toFixed(4)}
                    </div>
                    {location.accuracy && (
                      <div className="text-xs text-muted-foreground">
                        ±{Math.round(location.accuracy)}m accuracy
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Component */}
      <LocationMap 
        locations={mapLocations}
        officeLocation={officeMapLocation}
      />
    </div>
  )
}