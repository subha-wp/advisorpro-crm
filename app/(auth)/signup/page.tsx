"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useLocationTracker } from "@/components/location/location-tracker"
import { MapPin, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [workspaceName, setWorkspaceName] = useState("My Workspace")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [locationStatus, setLocationStatus] = useState<"requesting" | "granted" | "denied" | "error">("requesting")
  const { location, requestLocation } = useLocationTracker()

  // Request location immediately when component mounts
  useEffect(() => {
    const getLocation = async () => {
      const locationData = await requestLocation()
      if (locationData) {
        setLocationStatus("granted")
      } else {
        setLocationStatus("denied")
      }
    }
    getLocation()
  }, [requestLocation])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
    // Block signup if location is not available
    if (!location) {
      setError("Location access is required to create an account. Please enable location and try again.")
      return
    }
    
    setLoading(true)
    try {
      const signupData = { 
        name, 
        email, 
        phone, 
        password, 
        workspaceName,
        location // Always include location (mandatory)
      }
      
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      })
      if (res.ok) {
        router.push("/dashboard")
      } else {
        const data = await res.json().catch(() => ({ error: "Signup failed" }))
        setError(data?.error ?? "Signup failed")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function retryLocation() {
    setLocationStatus("requesting")
    const locationData = await requestLocation()
    if (locationData) {
      setLocationStatus("granted")
    } else {
      setLocationStatus("denied")
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">Create your account</h1>
          <p className="text-muted-foreground">Start with a free plan. Upgrade anytime.</p>
        </div>

        {/* Signup Card */}
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold">Sign up</CardTitle>
            <CardDescription>It only takes a minute to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Full name
                </label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Phone
                </label>
                <Input
                  id="phone"
                  placeholder="+91 1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="workspace" className="text-sm font-medium text-foreground">
                  Workspace name
                </label>
                <Input
                  id="workspace"
                  placeholder="e.g., AdvisorPro HQ"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {/* Mandatory Location Status */}
              {locationStatus === "requesting" && (
                <Alert>
                  <MapPin className="h-4 w-4 animate-pulse" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>Requesting location access...</span>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {locationStatus === "granted" && location && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">Location verified ✓</span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Accuracy: ±{Math.round(location.accuracy || 0)}m
                  </p>
                </div>
              )}

              {locationStatus === "denied" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Location access required</p>
                      <p className="text-sm">
                        Location tracking is mandatory for security and attendance. Please enable location access to continue.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={retryLocation}
                        className="mt-2"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Retry Location Access
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <div
                  role="alert"
                  className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
                >
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 font-medium" 
                disabled={loading || !location} 
                aria-busy={loading}
              >
                {loading ? "Creating..." : locationStatus === "requesting" ? "Waiting for location..." : "Create account"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Already have an account?</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                You can{" "}
                <Link
                  href="/auth/login"
                  className="text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  sign in here
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            By creating an account, you agree to our{" "}
            <Link href="#" className="hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
