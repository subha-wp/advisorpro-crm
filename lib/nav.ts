import type React from "react"
import { LayoutDashboard, Users, Bell, BarChart3, Settings, IndianRupee, Contact, FileText, CheckSquare, Group } from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export const appNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/family", label: "Family", icon: Group },
  { href: "/clients", label: "Clients", icon: Contact },
  { href: "/policies", label: "Policies", icon: FileText },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/team", label: "Team", icon: Users },
  { href: "/billing", label: "Billing", icon: IndianRupee },
  { href: "/settings", label: "Settings", icon: Settings },
]
