"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLocationTracker } from "@/components/location/location-tracker"
import { MapPin, AlertTriangle, CheckCircle, RefreshCw} from "lucide-react"
import { Alert, AlertDescription } from "../ui/alert"

interface LocationStatusIndicatorProps {
  className?: string
  showDetails?: boolean
}

export function LocationStatusIndicator({ className, showDetails = false }: LocationStatusIndicatorProps) {
  const { location, requestLocation, loading, error } = useLocationTracker()
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    if (location) {
      setLastUpdate(new Date())
    }
  }, [location])

  const getStatusInfo = () => {
    if (loading) {
      return {
        icon: RefreshCw,
        label: "Requesting...",
        variant: "secondary" as const,
        color: "text-blue-600"
      }
    }
    
    if (location) {
      return {
        icon: CheckCircle,
        label: "Location Active",
        variant: "default" as const,
        color: "text-green-600"
      }
    }
    
    if (error) {
      return {
        icon: AlertTriangle,
        label: "Location Required",
        variant: "destructive" as const,
        color: "text-red-600"
      }
    }
    
    return {
      icon: MapPin,
      label: "Location Needed",
      variant: "outline" as const,
      color: "text-yellow-600"
    }
  }

  const status = getStatusInfo()
  const Icon = status.icon

  const indicator = (
    <Badge variant={status.variant} className={`flex items-center gap-1 ${className}`}>
      <Icon className={`h-3 w-3 ${loading ? "animate-spin" : ""} ${status.color}`} />
      {showDetails && <span className="text-xs">{status.label}</span>}
    </Badge>
  )

  if (!showDetails) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{status.label}</p>
            {location && (
              <>
                <p className="text-xs">
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </p>
                <p className="text-xs">
                  Accuracy: ±{Math.round(location.accuracy || 0)}m
                </p>
                {lastUpdate && (
                  <p className="text-xs">
                    Updated: {lastUpdate.toLocaleTimeString()}
                  </p>
                )}
              </>
            )}
            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {indicator}
      
      {location && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="font-mono">
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </div>
          <div>Accuracy: ±{Math.round(location.accuracy || 0)}m</div>
          {lastUpdate && (
            <div>Updated: {lastUpdate.toLocaleTimeString()}</div>
          )}
        </div>
      )}
      
      {error && (
        <div className="space-y-2">
          <Alert variant="destructive" className="p-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {error}
            </AlertDescription>
          </Alert>
          <Button size="sm" variant="outline" onClick={requestLocation} disabled={loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}