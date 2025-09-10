// Later this can redirect based on auth state. For now, direct users to dashboard.
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/session"

export default async function Root() {
  // Optimized auth check for faster redirects
  const session = await getServerSession()
  
  if (session) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }
}