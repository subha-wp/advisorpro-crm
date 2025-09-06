"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
}

interface LocationTrackerProps {
  onLocationUpdate?: (location: LocationData) => void
  autoRequest?: boolean
  children?: React.ReactNode
}

export function LocationTracker({ onLocationUpdate, autoRequest = false, children }: LocationTrackerProps) {
  const { toast } = useToast()
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        )
      })

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }

      setLocation(locationData)
      onLocationUpdate?.(locationData)
    } catch (err) {
      const error = err as GeolocationPositionError
      let errorMessage = "Failed to get location"
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access denied by user"
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable"
          break
        case error.TIMEOUT:
          errorMessage = "Location request timed out"
          break
      }
      
      setError(errorMessage)
      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoRequest) {
      requestLocation()
    }
  }, [autoRequest])

  if (children) {
    return (
      <div>
        {children}
        {/* Location state can be accessed via props */}
      </div>
    )
  }

  return null
}

export function useLocationTracker() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestLocation = async (): Promise<LocationData | null> => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        )
      })

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }

      setLocation(locationData)
      return locationData
    } catch (err) {
      const error = err as GeolocationPositionError
      let errorMessage = "Failed to get location"
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access denied"
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location unavailable"
          break
        case error.TIMEOUT:
          errorMessage = "Location request timed out"
          break
      }
      
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    location,
    loading,
    error,
    requestLocation
  }
}