"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { appNav } from "@/lib/nav"
import { cn } from "@/lib/utils"

export function DesktopSidebar() {
  const pathname = usePathname()
  return (
    <aside
      className="hidden md:flex md:flex-col md:w-64 md:shrink-0 border-r bg-sidebar min-h-svh"
      aria-label="Sidebar"
    >
      <div className="p-4 border-b">
        <Link href="/dashboard" className="font-semibold">
          AdvisorPro CRM
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Insurance Advisors</p>
      </div>
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {appNav.map((item) => {
            const Icon = item.icon
            const active = pathname?.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="text-pretty">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="p-3 text-xs text-muted-foreground">
        <span className="sr-only">Plan</span>
        Free plan
      </div>
    </aside>
  )
}
