"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LocationTracker, useLocationTracker } from "@/components/location/location-tracker"
import { MapPin } from "lucide-react"

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const router = useRouter()
  const { location, requestLocation } = useLocationTracker()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      const loginData: any = { identifier, password }
      
      // Include location if available and enabled
      if (locationEnabled && location) {
        loginData.location = location
      }
      
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      })
      
      if (res.ok) {
        router.push("/dashboard")
      } else {
        const { error } = await res.json()
        setError(error ?? "Login failed")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleLocationToggle() {
    if (!locationEnabled) {
      const locationData = await requestLocation()
      if (locationData) {
        setLocationEnabled(true)
      }
    } else {
      setLocationEnabled(false)
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

              {/* Location Sharing Option */}
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Share location</p>
                    <p className="text-xs text-muted-foreground">
                      Help your team track attendance
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant={locationEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={handleLocationToggle}
                >
                  {locationEnabled ? "Enabled" : "Enable"}
                </Button>
              </div>

              {location && locationEnabled && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">Location captured</span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Accuracy: ±{Math.round(location.accuracy || 0)}m
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 font-medium" 
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
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