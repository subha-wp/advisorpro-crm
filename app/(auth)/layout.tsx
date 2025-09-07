import { MandatoryLocationGuard } from "@/components/location/mandatory-location-guard"
import type { ReactNode } from "react"


export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <MandatoryLocationGuard>
      {children}
    </MandatoryLocationGuard>
  )
}