export type Role = "OWNER" | "AGENT" | "VIEWER"

export function canAccess(userRole: Role, allowed: Role[]) {
  return allowed.includes(userRole)
}

// Useful role groups
export const ROLES = {
  ANY: ["OWNER", "AGENT", "VIEWER"] as Role[],
  STAFF: ["OWNER", "AGENT"] as Role[],
  OWNER: ["OWNER"] as Role[],
}
