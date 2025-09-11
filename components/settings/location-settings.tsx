"use client"

import useSWR from "swr"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useLocationTracker } from "@/components/location/location-tracker"
import {
  MapPin,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Users,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

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
      toast({ title: "Error", description: "Coordinates are required", variant: "destructive" })
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
        toast({ title: "Saved", description: "Location updated successfully" })
        mutate()
      } else {
        toast({ title: "Error", description: responseData.error || "Failed to save", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" })
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
      toast({ title: "Location captured", description: "Set as office location" })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top App Bar */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b bg-background">
        <Link href="/settings">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold">Location Settings</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        {/* Status */}
        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Failed to load location settings.</AlertDescription>
          </Alert>
        ) : isConfigured ? (
          <Alert className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Office location set. Tracking is {form.trackingEnabled ? "enabled" : "disabled"}.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>Set your office location to enable tracking.</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <section className="space-y-6">
          <h2 className="text-base font-semibold">Office Location</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <form onSubmit={onSave} className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude" className="flex items-center gap-2">
                    <Navigation className="h-4 w-4" /> Latitude *
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
                <div>
                  <Label htmlFor="longitude">Longitude *</Label>
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

              <div>
                <Label htmlFor="address">Office Address (optional)</Label>
                <Input
                  id="address"
                  placeholder="123 Business Street, City"
                  value={form.address}
                  onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="tracking" className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> Employee Tracking
                  </Label>
                  <p className="text-xs text-muted-foreground">Track employee locations for attendance</p>
                </div>
                <Switch
                  id="tracking"
                  checked={form.trackingEnabled}
                  onCheckedChange={(checked) => setForm(f => ({ ...f, trackingEnabled: checked }))}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={useCurrentLocation}
                disabled={locationLoading}
                className="w-full rounded-xl"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {locationLoading ? "Getting location..." : "Use Current Location"}
              </Button>

              <div className="flex items-center justify-between border-t pt-4">
                <Badge variant={isConfigured ? "default" : "outline"}>
                  {isConfigured ? "Configured" : "Not Configured"}
                </Badge>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          )}
        </section>

        {/* Steps */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Quick Guide</h2>
          {[
            { label: "Set Office Location", desc: "Use current location or enter manually" },
            { label: "Enable Tracking", desc: "Turn on tracking for attendance" },
            { label: "Monitor Team", desc: "View employees in real-time" },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                {i + 1}
              </div>
              <div>
                <p className="font-medium">{step.label}</p>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Current Location */}
        {location && (
          <section className="space-y-2 border-t pt-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Your Current Location
            </h2>
            <div className="font-mono text-sm">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </div>
            {location.accuracy && (
              <p className="text-xs text-muted-foreground">
                Accuracy: ±{Math.round(location.accuracy)}m
              </p>
            )}
          </section>
        )}

        {/* Privacy */}
        <section className="space-y-2 border-t pt-4">
          <h2 className="text-base font-semibold">Privacy & Security</h2>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Location data is encrypted</li>
            <li>• Only workspace owners can view locations</li>
            <li>• Sharing can be disabled anytime</li>
            <li>• Used only for attendance tracking</li>
          </ul>
        </section>
      </main>
    </div>
  )
}
