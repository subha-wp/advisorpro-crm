"use client"

// Enhanced API client with automatic token refresh
class ApiClient {
  private refreshPromise: Promise<boolean> | null = null

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      credentials: 'include'
    })

    // Check if token refresh is needed
    const refreshNeeded = response.headers.get('x-token-refresh-needed') === 'true'
    
    if (response.status === 401 || refreshNeeded) {
      // Try to refresh token
      const refreshed = await this.refreshToken()
      
      if (refreshed) {
        // Retry the original request
        return fetch(url, {
          ...options,
          credentials: 'include'
        })
      } else {
        // Refresh failed, redirect to login
        window.location.href = '/login'
        throw new Error('Authentication failed')
      }
    }

    return response
  }

  private async refreshToken(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.performRefresh()
    const result = await this.refreshPromise
    this.refreshPromise = null
    
    return result
  }

  private async performRefresh(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      })

      return response.ok
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  // Convenience methods
  async get(url: string, options?: RequestInit) {
    return this.fetch(url, { ...options, method: 'GET' })
  }

  async post(url: string, data?: any, options?: RequestInit) {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async patch(url: string, data?: any, options?: RequestInit) {
    return this.fetch(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete(url: string, options?: RequestInit) {
    return this.fetch(url, { ...options, method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()

// SWR fetcher that uses the enhanced API client
export const swrFetcher = async (url: string) => {
  const response = await apiClient.get(url)
  
  if (!response.ok) {
    const error = new Error('API request failed')
    ;(error as any).status = response.status
    throw error
  }
  
  return response.json()
}