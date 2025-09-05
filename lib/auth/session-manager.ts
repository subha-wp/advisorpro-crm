"use client"

import { useEffect, useRef, useCallback } from "react"

const ACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const REFRESH_INTERVAL = 10 * 60 * 1000 // 10 minutes
const WARNING_TIME = 5 * 60 * 1000 // 5 minutes before timeout

export class SessionManager {
  private lastActivity: number = Date.now()
  private refreshTimer: NodeJS.Timeout | null = null
  private warningTimer: NodeJS.Timeout | null = null
  private logoutTimer: NodeJS.Timeout | null = null
  private onWarning?: () => void
  private onLogout?: () => void

  constructor(options?: {
    onWarning?: () => void
    onLogout?: () => void
  }) {
    this.onWarning = options?.onWarning
    this.onLogout = options?.onLogout
    this.setupActivityListeners()
    this.startRefreshTimer()
    this.resetInactivityTimer()
  }

  private setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const updateActivity = () => {
      this.lastActivity = Date.now()
      this.resetInactivityTimer()
    }

    events.forEach(event => {
      document.addEventListener(event, updateActivity, true)
    })
  }

  private resetInactivityTimer() {
    // Clear existing timers
    if (this.warningTimer) clearTimeout(this.warningTimer)
    if (this.logoutTimer) clearTimeout(this.logoutTimer)

    // Set warning timer (25 minutes)
    this.warningTimer = setTimeout(() => {
      this.onWarning?.()
    }, ACTIVITY_TIMEOUT - WARNING_TIME)

    // Set logout timer (30 minutes)
    this.logoutTimer = setTimeout(() => {
      this.logout()
    }, ACTIVITY_TIMEOUT)
  }

  private startRefreshTimer() {
    // Refresh token every 10 minutes if user is active
    this.refreshTimer = setInterval(async () => {
      const timeSinceActivity = Date.now() - this.lastActivity
      
      // Only refresh if user was active in the last 25 minutes
      if (timeSinceActivity < ACTIVITY_TIMEOUT - WARNING_TIME) {
        await this.refreshToken()
      }
    }, REFRESH_INTERVAL)
  }

  private async refreshToken() {
    try {
      const response = await fetch('/api/auth/extend-session', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (!response.ok) {
        console.warn('Token refresh failed')
        if (response.status === 401) {
          this.logout()
        }
        return false
      }
      
      return true
    } catch (error) {
      console.error('Token refresh error:', error)
      return false
    }
  }

  private logout() {
    this.cleanup()
    this.onLogout?.()
    
    // Perform logout
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => {
        window.location.href = '/login'
      })
      .catch(() => {
        window.location.href = '/login'
      })
  }

  public extendSession() {
    this.lastActivity = Date.now()
    this.resetInactivityTimer()
  }

  public cleanup() {
    if (this.refreshTimer) clearInterval(this.refreshTimer)
    if (this.warningTimer) clearTimeout(this.warningTimer)
    if (this.logoutTimer) clearTimeout(this.logoutTimer)
  }
}

// React hook for session management
export function useSessionManager(options?: {
  onWarning?: () => void
  onLogout?: () => void
}) {
  const sessionManagerRef = useRef<SessionManager | null>(null)

  useEffect(() => {
    sessionManagerRef.current = new SessionManager(options)

    return () => {
      sessionManagerRef.current?.cleanup()
    }
  }, [])

  const extendSession = useCallback(() => {
    sessionManagerRef.current?.extendSession()
  }, [])

  return { extendSession }
}