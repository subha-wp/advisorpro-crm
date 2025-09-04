import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { PoliciesTable } from "@/components/policies/policies-table"

export default function PoliciesPage() {
  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-balance">Policies</h1>
          <p className="text-sm text-muted-foreground">Manage policies across clients</p>
        </div>

      </header>

     <div>
          <PoliciesTable />
     </div>
     
 
    </section>
  )
}
