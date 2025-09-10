"use client"

import useSWR from "swr"
import { swrFetcher } from "@/lib/auth/api-client"

// Enhanced SWR hook with automatic token refresh
export function useApi<T = any>(url: string | null, options?: any) {
  return useSWR<T>(url, swrFetcher, {
    errorRetryCount: 1,
    errorRetryInterval: 1000,
    dedupingInterval: 30000, // Reduce duplicate requests more aggressively
    focusThrottleInterval: 30000, // Throttle refetch on focus more
    revalidateOnFocus: false, // Disable auto-refetch on focus for better performance
    revalidateOnReconnect: true,
    shouldRetryOnError: (error) => {
      // Don't retry on auth errors
      return error?.status !== 401 && error?.status !== 403
    },
    // Optimized for faster initial load
    refreshInterval: 0, // Disable auto-refresh by default
    loadingTimeout: 5000, // 5 second timeout
    ...options
  })
}

// Mutation hook with enhanced error handling
export function useApiMutation() {
  const { apiClient } = require("@/lib/auth/api-client")
  
  return {
    post: apiClient.post.bind(apiClient),
    patch: apiClient.patch.bind(apiClient),
    delete: apiClient.delete.bind(apiClient),
  }
}