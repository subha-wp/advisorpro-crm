"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { appNav } from "@/lib/nav"
import { cn } from "@/lib/utils"
import { Grid } from "lucide-react" // ✅ Better icon for "More"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useState } from "react"

export function MobileBottomNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Show first 2, then More, then next 2
  const firstPart = appNav.slice(0, 2)
  const secondPart = appNav.slice(2, 4)
  const extraNav = appNav.slice(4)

  return (
    <>
      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur md:hidden"
        role="navigation"
        aria-label="Primary"
      >
        <ul className="grid grid-cols-5 gap-0">
          {/* First 2 nav items */}
          {firstPart.map((item) => {
            const Icon = item.icon
            const active = pathname?.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2 text-xs font-semibold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}

          {/* More button in middle */}
          <li>
            <button
              onClick={() => setOpen(true)}
              className="flex flex-col items-center justify-center gap-1 py-2 text-xs font-semibold text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-full"
            >
              <Grid className="h-5 w-5" aria-hidden="true" />
              <span>More</span>
            </button>
          </li>

          {/* Last 2 nav items */}
          {secondPart.map((item) => {
            const Icon = item.icon
            const active = pathname?.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2 text-xs font-semibold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Drawer for extra nav items */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="p-4 space-y-4 rounded-t-2xl">
          <DrawerHeader>
            <DrawerTitle className="text-base">More Options</DrawerTitle>
          </DrawerHeader>

          <ul className="grid grid-cols-3 gap-4">
            {extraNav.map((item) => {
              const Icon = item.icon
              const active = pathname?.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-lg border p-3 text-xs font-medium transition-colors",
                      active
                        ? "border-primary text-primary bg-primary/5"
                        : "border-muted text-muted-foreground hover:bg-muted/10",
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </DrawerContent>
      </Drawer>
    </>
  )
}
