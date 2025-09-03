// Later this can redirect based on auth state. For now, direct users to dashboard.
import { redirect } from "next/navigation"

export default function Root() {
  redirect("/dashboard")
}
