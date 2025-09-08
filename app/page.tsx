// Later this can redirect based on auth state. For now, direct users to dashboard.
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/session"

export default async function Root() {
  // Check if user is already authenticated for faster redirect
  const session = await getServerSession()
  
  if (session) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }
}