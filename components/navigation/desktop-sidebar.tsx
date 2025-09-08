"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import useSWR from "swr"
import { appNav } from "@/lib/nav"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AvatarMenu } from "@/components/ui/avatar-menu"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { 
  Building2,
  ChevronLeft, 
  ChevronRight
} from "lucide-react"
import { LocationStatusIndicator } from "@/components/location/location-status-indicator"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function DesktopSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  
  // Optimize data fetching with better error handling and caching
  const { data: profileData } = useSWR("/api/user/profile", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000 // Cache for 1 minute
  })
  const { data: workspaceData } = useSWR("/api/workspace", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000
  })
  const { data: planData } = useSWR("/api/plan", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000 // Cache plan for 5 minutes
  })
  const { data: teamData } = useSWR("/api/team", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 120000 // Cache team for 2 minutes
  })
  
  const user = profileData?.item
  const workspace = workspaceData?.item
  const plan = planData?.plan
  
  // Get current user's role from team data
  const currentUserMembership = teamData?.items?.find((member: any) => member.user.id === user?.id)
  const userRole = currentUserMembership?.role || "VIEWER"

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          // layout + size + responsive + sticky
          "hidden md:flex md:flex-col fixed left-0 top-0 h-screen z-30 transition-all duration-400 ease-in-out select-none",
          // glassmorphism background + border + shadow
          "bg-white/6 backdrop-blur-md border border-white/8 shadow-[0_10px_30px_rgba(12,15,30,0.35)]",
          "rounded-tr-2xl rounded-br-2xl overflow-hidden",
          // width for collapsed / expanded
          collapsed ? "md:w-16" : "md:w-64"
        )}
        aria-label="Sidebar"
      >
        {/* animated gradient overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 animated-gradient"
        />

        {/* subtle vignette */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.02),_transparent_30%)]" />

        {/* Header - Fixed */}
        <div
          className={cn(
            "p-4 flex items-center transition-all duration-300 border-b border-white/6 bg-white/2",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-3">
              {workspace?.logoUrl ? (
                <div className="rounded-lg p-1 bg-white/8 border border-white/6 shadow-sm">
                  <img 
                    src={workspace.logoUrl} 
                    alt="Workspace Logo" 
                    className="h-8 w-8 object-contain rounded"
                  />
                </div>
              ) : (
                <div className="rounded-lg p-2 bg-white/8 border border-white/6 shadow-sm">
                  <Building2 className="h-6 w-6 text-gradient-primary" />
                </div>
              )}

              <div>
                <Link
                  href="/dashboard"
                  className="block text-lg font-semibold tracking-tight leading-tight text-foreground/95 hover:text-primary transition-colors"
                >
                  {workspace?.name || "AdvisorPro"}
                </Link>
                <p className="text-xs text-muted-foreground/90 tracking-wide">
                  Advisor WorkSpace
                </p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 shrink-0 rounded-lg hover:bg-white/8 transition-transform duration-200"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1">
            {appNav.map((item) => {
              const Icon = item.icon
              const active = pathname?.startsWith(item.href)
              
              const navItem = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    // glass accent hover + subtle scale
                    active
                      ? "bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] text-sidebar-accent-foreground shadow-sm transform-gpu"
                      : "text-sidebar-foreground/85 hover:text-sidebar-foreground hover:scale-[1.01] hover:bg-white/4",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center h-7 w-7 rounded-md",
                      active ? "bg-gradient-to-br from-indigo-500/20 to-pink-400/20" : "bg-transparent"
                    )}
                    aria-hidden
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  </div>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )

              return (
                <li key={item.href}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {navItem}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    navItem
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Profile Section - Fixed */}
        <div className="border-t border-white/6 p-3">
          {/* Location Status */}
          {!collapsed && (
            <div className="mb-3 px-3">
              <LocationStatusIndicator showDetails className="w-full" />
            </div>
          )}
          
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <AvatarMenu
                    user={user}
                    workspace={workspace}
                    userRole={userRole}
                    onLogout={handleLogout}
                    collapsed={true}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="text-center">
                  <p className="font-medium">{user?.name || "User"}</p>
                  <p className="text-xs opacity-70">{userRole}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <AvatarMenu
              user={user}
              workspace={{ name: workspace?.name, plan: plan }}
              userRole={userRole}
              onLogout={handleLogout}
              collapsed={false}
            />
          )}
        </div>

        {/* Local styles for gradient animation and glass dropdown styling */}
        <style jsx>{`
          /* animated gradient (very subtle) */
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          .animated-gradient {
            /* multi-stop gradient blended softly */
            background: linear-gradient(
              90deg,
              rgba(99,102,241,0.14) 0%,
              rgba(236,72,153,0.12) 30%,
              rgba(245,158,11,0.10) 60%,
              rgba(99,102,241,0.08) 100%
            );
            background-size: 200% 200%;
            animation: gradientShift 10s ease-in-out infinite;
            opacity: 0.9;
            filter: blur(20px);
            mix-blend-mode: overlay;
          }

          /* Dropdown content glass style */
          :global(.glass-dropdown) {
            background: rgba(255,255,255,0.04);
            backdrop-filter: blur(8px) saturate(120%);
            border: 1px solid rgba(255,255,255,0.06);
            box-shadow: 0 6px 20px rgba(8,10,25,0.5);
            border-radius: 0.5rem;
            padding: 0.25rem;
          }

          /* Gradient icon color helper (used for logo) */
          :global(.text-gradient-primary) {
            background: linear-gradient(90deg, #6366F1, #EC4899);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
        `}</style>
      </aside>
    </TooltipProvider>
  )
}
