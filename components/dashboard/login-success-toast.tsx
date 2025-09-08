// @ts-nocheck
"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, MapPin, Building2 } from "lucide-react"

interface LoginSuccessToastProps {
  user?: {
    name: string
    email: string
  }
  workspace?: {
    name: string
    plan: string
  }
  location?: {
    latitude: number
    longitude: number
    accuracy?: number
  }
}

export function LoginSuccessToast({ user, workspace, location }: LoginSuccessToastProps) {
  const { toast } = useToast()

  useEffect(() => {
    if (user && workspace) {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Welcome back, {user.name}!</span>
          </div>
        ),
        description: (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-3 w-3" />
              <span>{workspace.name} • {workspace.plan} Plan</span>
            </div>
            {location && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>Location verified (±{Math.round(location.accuracy || 0)}m)</span>
              </div>
            )}
          </div>
        ),
        duration: 4000,
      })
    }
  }, [user, workspace, location, toast])

  return null
}