import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReportsPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-balance">Reports</h1>
        <p className="text-sm text-muted-foreground">Monthly and yearly summaries</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">By Insurer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Pie/Bar charts coming soon...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">By Policy Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Bar chart coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
