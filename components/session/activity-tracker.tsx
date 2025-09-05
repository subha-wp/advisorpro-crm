"use client"

import { useEffect } from "react"

interface ActivityTrackerProps {
  onActivity?: () => void
}

export function ActivityTracker({ onActivity }: ActivityTrackerProps) {
  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus',
      'blur'
    ]

    let lastActivity = Date.now()
    const THROTTLE_TIME = 30000 // 30 seconds

    const handleActivity = () => {
      const now = Date.now()
      
      // Throttle activity updates to avoid excessive API calls
      if (now - lastActivity > THROTTLE_TIME) {
        lastActivity = now
        onActivity?.()
      }
    }

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [onActivity])

  return null // This component doesn't render anything
}