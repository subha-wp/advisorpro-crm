"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { appNav } from "@/lib/nav"
import { cn } from "@/lib/utils"

export function MobileBottomNav() {
  const pathname = usePathname()
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur md:hidden"
      role="navigation"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5 gap-0">
        {appNav.slice(0, 5).map((item) => {
          const Icon = item.icon
          const active = pathname?.startsWith(item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 text-xs",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
