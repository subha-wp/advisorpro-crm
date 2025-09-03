import { NextRequest } from "next/server"

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export function rateLimit({
  interval = 60 * 1000, // 1 minute
  uniqueTokenPerInterval = 500, // max 500 unique tokens per interval
}: {
  interval?: number
  uniqueTokenPerInterval?: number
} = {}) {
  return {
    check: (request: NextRequest, limit: number, token: string) => {
      const now = Date.now()
      const tokenKey = `${token}_${Math.floor(now / interval)}`
      
      // Clean up old entries
      Object.keys(store).forEach(key => {
        if (store[key].resetTime < now) {
          delete store[key]
        }
      })
      
      // Check if we have too many unique tokens
      if (Object.keys(store).length >= uniqueTokenPerInterval) {
        return { success: false, limit, remaining: 0, reset: new Date(now + interval) }
      }
      
      const record = store[tokenKey] || { count: 0, resetTime: now + interval }
      
      if (record.count >= limit) {
        return { success: false, limit, remaining: 0, reset: new Date(record.resetTime) }
      }
      
      record.count++
      store[tokenKey] = record
      
      return {
        success: true,
        limit,
        remaining: limit - record.count,
        reset: new Date(record.resetTime)
      }
    }
  }
}

// Common rate limiters
export const authLimiter = rateLimit({ interval: 15 * 60 * 1000 }) // 15 minutes
export const apiLimiter = rateLimit({ interval: 60 * 1000 }) // 1 minute
export const emailLimiter = rateLimit({ interval: 60 * 60 * 1000 }) // 1 hour