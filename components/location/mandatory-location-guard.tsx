"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLocationTracker } from "@/components/location/location-tracker"
import { MapPin, AlertTriangle, Shield, Navigation } from "lucide-react"

interface MandatoryLocationGuardProps {
  children: React.ReactNode
  onLocationGranted?: (location: any) => void
  onLocationDenied?: () => void
}

export function MandatoryLocationGuard({ 
  children, 
  onLocationGranted, 
  onLocationDenied 
}: MandatoryLocationGuardProps) {
  const { location, requestLocation, loading, error } = useLocationTracker()
  const [hasRequested, setHasRequested] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!hasRequested) {
      requestLocation()
      setHasRequested(true)
    }
  }, [hasRequested, requestLocation])

  useEffect(() => {
    if (location) {
      onLocationGranted?.(location)
    } else if (error && hasRequested) {
      onLocationDenied?.()
    }
  }, [location, error, hasRequested, onLocationGranted, onLocationDenied])

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1)
    await requestLocation()
  }

  // Show location request screen if location is not available
  if (!location && hasRequested) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Location Access Required
            </h1>
            <p className="text-muted-foreground">
              AdvisorPro requires location access for security and attendance tracking
            </p>
          </div>

          <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Enable Location Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <Alert>
                  <Navigation className="h-4 w-4 animate-pulse" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>Requesting location access...</span>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p className="font-medium">Location access failed</p>
                      <p className="text-sm">{error}</p>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">To fix this:</p>
                        <ul className="text-sm space-y-1 ml-4">
                          <li>• Click the location icon in your browser's address bar</li>
                          <li>• Select "Allow" when prompted for location access</li>
                          <li>• Refresh the page if needed</li>
                          <li>• Ensure location services are enabled on your device</li>
                        </ul>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-3">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Why we need location:</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Verify employee attendance and work location</li>
                    <li>• Enhance security by tracking login locations</li>
                    <li>• Calculate distance from office for reporting</li>
                    <li>• Comply with workplace monitoring policies</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Your privacy:</h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Location data is encrypted and secure</li>
                    <li>• Only used for business purposes</li>
                    <li>• Not shared with third parties</li>
                    <li>• Stored securely in your workspace</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={handleRetry} className="w-full" disabled={loading}>
                  <MapPin className="h-4 w-4 mr-2" />
                  {retryCount === 0 ? "Grant Location Access" : `Retry Location Access (${retryCount})`}
                </Button>
                
                {retryCount > 2 && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">
                      Still having trouble? Contact your administrator for help.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                      Refresh Page
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show loading state while requesting location
  if (loading && !hasRequested) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Requesting location access...</p>
        </div>
      </div>
    )
  }

  // Render children when location is available
  return <>{children}</>
}