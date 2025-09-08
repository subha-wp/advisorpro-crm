"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useLocationTracker } from "@/components/location/location-tracker"
import { MapPin, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loginStep, setLoginStep] = useState<"idle" | "authenticating" | "redirecting" | "success">("idle")
  const [progress, setProgress] = useState(0)
  const [locationStatus, setLocationStatus] = useState<"requesting" | "granted" | "denied" | "error">("requesting")
  const router = useRouter()
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

  // Simulate progress for better UX
  useEffect(() => {
    if (loginStep === "authenticating") {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 70) return prev // Stop at 70% until actual response
          return prev + Math.random() * 15
        })
      }, 200)
      return () => clearInterval(interval)
    } else if (loginStep === "redirecting") {
      setProgress(85)
      const timeout = setTimeout(() => setProgress(100), 500)
      return () => clearTimeout(timeout)
    } else if (loginStep === "success") {
      setProgress(100)
    }
  }, [loginStep])

  const handleSuccessfulLogin = useCallback(() => {
    setLoginStep("redirecting")
    setProgress(85)
    
    // Optimistic navigation with immediate feedback
    setTimeout(() => {
      setLoginStep("success")
      setProgress(100)
      router.push("/dashboard")
    }, 800) // Small delay for smooth UX
  }, [router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
    // Block login if location is not available
    if (!location) {
      setError("Location access is required to sign in. Please enable location and try again.")
      return
    }
    
    setLoading(true)
    setLoginStep("authenticating")
    setProgress(10)
    
    try {
      const loginData = { 
        identifier, 
        password,
        location // Always include location (mandatory)
      }
      
      setProgress(40)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      })
      
      setProgress(70)
      
      if (res.ok) {
        setProgress(80)
        handleSuccessfulLogin()
      } else {
        setLoginStep("idle")
        setProgress(0)
        const { error } = await res.json()
        setError(error ?? "Login failed")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
      if (loginStep !== "redirecting" && loginStep !== "success") {
        setLoginStep("idle")
        setProgress(0)
      }
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="text-muted-foreground">
            Sign in to your AdvisorPro account
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label htmlFor="identifier" className="text-sm font-medium text-foreground">
                  Email or Phone
                </label>
                <Input
                  id="identifier"
                  placeholder="Enter your email or phone number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Link 
                    href="/auth/forgot" 
                    className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}

              {/* Login Progress */}
              {(loading || loginStep !== "idle") && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {loginStep === "authenticating" && "Authenticating..."}
                      {loginStep === "redirecting" && "Preparing dashboard..."}
                      {loginStep === "success" && "Login successful!"}
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {loginStep === "authenticating" && (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                        <span>Verifying credentials and location...</span>
                      </>
                    )}
                    {loginStep === "redirecting" && (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Loading your workspace...</span>
                      </>
                    )}
                    {loginStep === "success" && (
                      <>
                        <ArrowRight className="h-3 w-3 text-primary animate-pulse" />
                        <span>Redirecting to dashboard...</span>
                      </>
                    )}
                  </div>
                </div>
              )}

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
                        Location tracking is mandatory for security and attendance. Please enable location access and try again.
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

              <Button 
                type="submit" 
                className="w-full h-11 font-medium" 
                disabled={loading || !location}
                aria-busy={loading}
              >
                {loginStep === "authenticating" ? "Authenticating..." : 
                 loginStep === "redirecting" ? "Loading dashboard..." :
                 loginStep === "success" ? "Success! Redirecting..." :
                 loading ? "Signing in..." : 
                 locationStatus === "requesting" ? "Waiting for location..." : "Sign in"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  New to AdvisorPro?
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link 
                  href="/auth/signup" 
                  className="text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  Create account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            By signing in, you agree to our{" "}
            <Link href="#" className="hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}