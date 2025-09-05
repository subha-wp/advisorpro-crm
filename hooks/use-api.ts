"use client"

import useSWR from "swr"
import { swrFetcher } from "@/lib/auth/api-client"

// Enhanced SWR hook with automatic token refresh
export function useApi<T = any>(url: string | null, options?: any) {
  return useSWR<T>(url, swrFetcher, {
    errorRetryCount: 3,
    errorRetryInterval: 1000,
    shouldRetryOnError: (error) => {
      // Don't retry on auth errors
      return error?.status !== 401 && error?.status !== 403
    },
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