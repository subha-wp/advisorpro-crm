import type React from "react"
import { LayoutDashboard, Users, Bell, BarChart3, Settings, IndianRupee, Contact, FileText, CheckSquare, Group, Calculator, MapPin, Monitor, BookOpen } from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export const appNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/clients", label: "Clients", icon: Contact },
  { href: "/premiums", label: "Premiums", icon: Calculator },
  { href: "/policies", label: "Policies", icon: FileText },
  { href: "/family", label: "Family", icon: Group },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/ledger", label: "Ledger", icon: BookOpen },
  { href: "/presentations", label: "Presentations", icon: Monitor },
  { href: "/team", label: "Team", icon: Users },
  { href: "/team/locations", label: "Locations", icon: MapPin },
  { href: "/billing", label: "Billing", icon: IndianRupee },
  { href: "/settings", label: "Settings", icon: Settings },
]
