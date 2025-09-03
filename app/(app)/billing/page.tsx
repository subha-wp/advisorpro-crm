import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { UpgradePrompt } from "@/components/upgrade-modal"

export default function BillingPage() {
  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-balance">Billing</h1>
          <p className="text-sm text-muted-foreground">Manage your subscription</p>
        </div>
        <Badge variant="outline">FREE</Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You are on the Free plan. Upgrade to unlock premium features.
        </CardContent>
        <CardFooter className="gap-2">
          <UpgradePrompt />
        </CardFooter>
      </Card>
    </section>
  )
}
