"use client"

import useSWR from "swr"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useLocationTracker } from "@/components/location/location-tracker"
import { MapPin, Building2, CheckCircle, AlertTriangle, Navigation, Users } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function LocationSettings() {
  const { toast } = useToast()
  const { data, isLoading, mutate, error } = useSWR("/api/workspace/location", fetcher)
  const { location, requestLocation, loading: locationLoading } = useLocationTracker()
  
  const [form, setForm] = useState({
    latitude: "",
    longitude: "",
    address: "",
    trackingEnabled: false,
  })
  const [saving, setSaving] = useState(false)

  // Update form when data loads
  useEffect(() => {
    if (data?.settings) {
      setForm({
        latitude: data.settings.latitude?.toString() || "",
        longitude: data.settings.longitude?.toString() || "",
        address: data.settings.address || "",
        trackingEnabled: data.settings.trackingEnabled || false,
      })
    }
  }, [data])

  const isConfigured = !!(data?.settings?.latitude && data?.settings?.longitude)

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    
    if (!form.latitude || !form.longitude) {
      toast({
        title: "Error",
        description: "Office coordinates are required",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    
    try {
      const res = await fetch("/api/workspace/location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          address: form.address.trim() || undefined,
          trackingEnabled: form.trackingEnabled,
        }),
      })
      
      const responseData = await res.json()
      
      if (res.ok) {
        toast({ 
          title: "Location settings saved", 
          description: "Office location has been updated successfully" 
        })
        mutate() // Refresh the data
      } else {
        toast({ 
          title: "Error", 
          description: responseData.error || "Failed to save location settings",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Network error. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  async function useCurrentLocation() {
    const currentLocation = await requestLocation()
    if (currentLocation) {
      setForm(f => ({
        ...f,
        latitude: currentLocation.latitude.toString(),
        longitude: currentLocation.longitude.toString(),
      }))
      toast({
        title: "Location captured",
        description: "Current location has been set as office location"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Alert */}
      {error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load location settings. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      ) : isConfigured ? (
        <Alert className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-white">
            Office location is configured. Employee location tracking is {form.trackingEnabled ? "enabled" : "disabled"}.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            Set your office location to enable employee location tracking and distance calculations.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Office Location Settings
            </CardTitle>
            <CardDescription>
              Configure your office location for employee tracking and distance calculations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              </div>
            ) : (
              <form onSubmit={onSave} className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="latitude" className="flex items-center gap-2">
                        <Navigation className="h-4 w-4" />
                        Latitude *
                      </Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        placeholder="28.6139"
                        value={form.latitude}
                        onChange={(e) => setForm(f => ({ ...f, latitude: e.target.value }))}
                        required
                        className="font-mono"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="longitude">
                        Longitude *
                      </Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        placeholder="77.2090"
                        value={form.longitude}
                        onChange={(e) => setForm(f => ({ ...f, longitude: e.target.value }))}
                        required
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="address">
                      Office Address (Optional)
                    </Label>
                    <Input 
                      id="address"
                      placeholder="123 Business Street, City, State" 
                      value={form.address} 
                      onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} 
                    />
                    <p className="text-xs text-muted-foreground">
                      Will be auto-filled if not provided
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="tracking" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Enable Employee Location Tracking
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Track employee locations during login for attendance monitoring
                      </p>
                    </div>
                    <Switch
                      id="tracking"
                      checked={form.trackingEnabled}
                      onCheckedChange={(checked) => setForm(f => ({ ...f, trackingEnabled: checked }))}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={useCurrentLocation}
                      disabled={locationLoading}
                      className="flex-1"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {locationLoading ? "Getting Location..." : "Use Current Location"}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Badge variant={isConfigured ? "default" : "outline"}>
                      {isConfigured ? "Configured" : "Not Configured"}
                    </Badge>
                    {data?.settings?.address && (
                      <span className="text-sm text-muted-foreground">
                        {data.settings.address}
                      </span>
                    )}
                  </div>
                  
                  <Button type="submit" disabled={saving || !form.latitude || !form.longitude}>
                    {saving ? "Saving..." : "Save Location Settings"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Current Location Display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Set Office Location</p>
                  <p className="text-sm text-muted-foreground">
                    Use current location or enter coordinates manually
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Enable Tracking</p>
                  <p className="text-sm text-muted-foreground">
                    Turn on location tracking for employee attendance
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Monitor Team</p>
                  <p className="text-sm text-muted-foreground">
                    View employee locations and distances in real-time
                  </p>
                </div>
              </div>
            </div>

            {/* Current Location Info */}
            {location && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Your Current Location
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="font-mono">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </div>
                  {location.accuracy && (
                    <div className="text-muted-foreground">
                      Accuracy: ±{Math.round(location.accuracy)}m
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Privacy Notice */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Privacy & Security</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Location data is encrypted and secure</li>
                <li>• Only workspace owners can view team locations</li>
                <li>• Location sharing can be disabled anytime</li>
                <li>• Data is used only for attendance tracking</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}