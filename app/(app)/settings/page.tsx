import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-balance">Settings</h1>
        <p className="text-sm text-muted-foreground">Profile, workspace, notifications</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Forms coming soon...</p>
        </CardContent>
      </Card>
    </section>
  )
}
