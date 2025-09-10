import type { ReactNode } from "react"
import { DesktopSidebar } from "@/components/navigation/desktop-sidebar"
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav"
import { SessionProvider } from "@/components/session/session-provider"
import { Toaster } from "@/components/ui/toaster"
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession()
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-svh">
      <SessionProvider>
        <DesktopSidebar />
        <main className="md:ml-64 p-4 md:p-6 pb-20 md:pb-6 transition-all duration-400">
            {children}
        </main>
        <MobileBottomNav />
        <Toaster />
      </SessionProvider>
    </div>
  )
}
