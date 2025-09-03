"use client"

import type React from "react"

export type SessionValue = {
  userId: string
  workspaceId: string
  role: "OWNER" | "AGENT" | "VIEWER"
}

export function SessionProvider({
  value,
  children,
}: {
  value: SessionValue
  children: React.ReactNode
}) {
  // This can be expanded to use Context if needed later
  return <>{children}</>
}
