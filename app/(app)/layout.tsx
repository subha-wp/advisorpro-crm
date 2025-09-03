import type { ReactNode } from "react"
import { DesktopSidebar } from "@/components/navigation/desktop-sidebar"
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav"
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession()
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-svh md:flex">
      <DesktopSidebar />
      <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      <MobileBottomNav />
    </div>
  )
}
