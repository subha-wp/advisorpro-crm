"use client"

import { useState } from "react"
import { useSessionManager } from "@/lib/auth/session-manager"
import { SessionWarningDialog } from "@/components/session/session-warning-dialog"

import { useToast } from "@/hooks/use-toast"
import { ActivityTracker } from "./activity-tracker"

interface SessionProviderProps {
  children: React.ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { toast } = useToast()
  const [showWarning, setShowWarning] = useState(false)

  const { extendSession } = useSessionManager({
    onWarning: () => {
      setShowWarning(true)
      toast({
        title: "Session expiring soon",
        description: "Your session will expire in 5 minutes due to inactivity",
        variant: "destructive"
      })
    },
    onLogout: () => {
      toast({
        title: "Session expired",
        description: "You have been logged out due to inactivity",
        variant: "destructive"
      })
    }
  })

  function handleExtendSession() {
    setShowWarning(false)
    extendSession()
    toast({
      title: "Session extended",
      description: "Your session has been extended for another 30 minutes"
    })
  }

  function handleLogout() {
    setShowWarning(false)
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => {
        window.location.href = '/login'
      })
      .catch(() => {
        window.location.href = '/login'
      })
  }

  return (
    <>
      <ActivityTracker onActivity={extendSession} />
      {children}
      <SessionWarningDialog
        open={showWarning}
        onExtend={handleExtendSession}
        onLogout={handleLogout}
      />
    </>
  )
}