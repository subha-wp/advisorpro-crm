import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ClientsTable } from "@/components/clients/clients-table"
import { ImportCsvHint } from "@/components/clients/import-csv-hint"

export default function ClientsPage() {
  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-balance">Clients</h1>
          <p className="text-sm text-muted-foreground">Manage clients and policies</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="#">Add Client</Link>
          </Button>
          <Button variant="secondary">Import</Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Client List</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientsTable />
          <div className="mt-3">
            <ImportCsvHint />
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
