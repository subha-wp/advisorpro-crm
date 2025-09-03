import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UpgradePrompt } from "@/components/upgrade-modal"

export default function BillingPage() {
  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-balance">Billing</h1>
          <p className="text-sm text-muted-foreground">Manage your subscription and billing</p>
        </div>
        <Badge variant="outline">FREE</Badge>
      </header>

      <Alert>
        <AlertDescription>
          <strong>Multi-tenant SaaS Platform:</strong> Each workspace is isolated with its own data, users, and billing.
          Perfect for insurance offices that want to manage multiple teams or branches independently.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Free Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Free Plan</CardTitle>
            <div className="text-2xl font-bold">
              ₹0<span className="text-sm font-normal text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-500" aria-hidden>
                  ✓
                </span>
                Up to 3 team members (Owner + 2 employees)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500" aria-hidden>
                  ✓
                </span>
                100 clients maximum
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500" aria-hidden>
                  ✓
                </span>
                500 policies maximum
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500" aria-hidden>
                  ✓
                </span>
                5 reminder templates
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500" aria-hidden>
                  ✓
                </span>
                Basic reporting
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500" aria-hidden>
                  ✗
                </span>
                <span className="text-muted-foreground">No automations</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500" aria-hidden>
                  ✗
                </span>
                <span className="text-muted-foreground">No bulk operations</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Badge variant="default" className="w-full justify-center">
              Current Plan
            </Badge>
          </CardFooter>
        </Card>

        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Premium Plan</CardTitle>
            <div className="text-2xl font-bold">
              ₹2,999<span className="text-sm font-normal text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-500" aria-hidden>
                  ✓
                </span>
                Up to 50 team members
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500" aria-hidden>
                  ✓
                </span>
                10,000 clients maximum
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500" aria-hidden>
                  ✓
                </span>
                50,000 policies maximum
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500" aria-hidden>
                  ✓
                </span>
                100 reminder templates
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500" aria-hidden>
                  ✓
                </span>
                Advanced reporting & analytics
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500" aria-hidden>
                  ✓
                </span>
                Automated reminders
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500" aria-hidden>
                  ✓
                </span>
                Bulk WhatsApp & Email
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500" aria-hidden>
                  ✓
                </span>
                API access
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500" aria-hidden>
                  ✓
                </span>
                Priority support
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <UpgradePrompt trigger={<Button className="w-full">Upgrade to Premium</Button>} />
          </CardFooter>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No billing history yet. Upgrade to Premium to see payment records.
            </p>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle>Data Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export all your workspace data including clients, policies, and activity logs.
            </p>
            <Button asChild variant="outline">
              <Link href="/api/workspace/export">Download Workspace Data</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-red-200 p-4 space-y-2">
              <h4 className="font-medium text-red-600">Delete Workspace</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete this workspace and all associated data. This action cannot be undone.
              </p>
              <Button variant="destructive" disabled>
                Delete Workspace (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
