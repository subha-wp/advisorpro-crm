"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Building2, Users } from "lucide-react"

interface LocationPoint {
  id: string
  latitude: number
  longitude: number
  label: string
  type: "office" | "employee"
  distance?: number
  timestamp?: string
  user?: {
    name: string
    email: string
  }
}

interface LocationMapProps {
  locations: LocationPoint[]
  officeLocation?: {
    latitude: number
    longitude: number
    address?: string
  }
  className?: string
}

export function LocationMap({ locations, officeLocation, className }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  // For now, we'll show a simple coordinate list
  // In production, integrate with Google Maps, Mapbox, or OpenStreetMap
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Office Location */}
          {officeLocation && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">Office Location</span>
              </div>
              <div className="text-sm space-y-1">
                <div className="font-mono">
                  {officeLocation.latitude.toFixed(6)}, {officeLocation.longitude.toFixed(6)}
                </div>
                {officeLocation.address && (
                  <div className="text-muted-foreground">{officeLocation.address}</div>
                )}
              </div>
            </div>
          )}

          {/* Employee Locations */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Team Locations ({locations.length})</span>
            </div>
            
            {locations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No location data available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {locations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <div>
                        <div className="font-medium">{location.label}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </div>
                        {location.timestamp && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(location.timestamp).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {location.distance !== undefined && (
                      <Badge variant={location.distance <= 1 ? "default" : location.distance <= 5 ? "secondary" : "destructive"}>
                        {location.distance < 1 
                          ? `${Math.round(location.distance * 1000)}m` 
                          : `${location.distance.toFixed(1)}km`
                        }
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map Placeholder */}
          <div className="mt-6 p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Interactive map integration coming soon
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Will show office and employee locations on a visual map
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}