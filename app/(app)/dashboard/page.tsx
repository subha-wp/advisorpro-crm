"use client"

import useSWR from "swr"
import { KpiCard } from "@/components/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DashboardPage() {
  const { data: statsData } = useSWR("/api/workspace/stats", fetcher)
  const { data: planData } = useSWR("/api/plan", fetcher)
  const stats = statsData?.stats
  const plan = planData?.plan

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-balance">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Key metrics and recent activity</p>
      </header>

      {plan === "FREE" && (
        <Alert>
          <AlertDescription className="flex items-center justify-between">
            <span>
              You're on the Free plan. Upgrade to unlock advanced features like automations and unlimited users.
            </span>
            <Button asChild size="sm">
              <Link href="/billing">Upgrade</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Active Clients" 
          value={stats?.clients?.active?.toString() || "0"} 
          hint={`${stats?.clients?.total || 0} total`}
        />
        <KpiCard 
          title="Active Policies" 
          value={stats?.policies?.active?.toString() || "0"} 
          hint={`${stats?.policies?.total || 0} total`}
        />
        <KpiCard 
          title="Team Members" 
          value={stats?.members?.toString() || "0"} 
          hint={plan === "FREE" ? "3 max on Free plan" : "Unlimited on Premium"}
        />
        <KpiCard 
          title="Reminder Templates" 
          value={stats?.templates?.toString() || "0"} 
          hint={plan === "FREE" ? "5 max on Free plan" : "100 max on Premium"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="h-20 flex-col gap-2">
              <Link href="/clients">
                <span className="text-lg">👥</span>
                <span>Add Client</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2">
              <Link href="/policies">
                <span className="text-lg">📋</span>
                <span>Add Policy</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2">
              <Link href="/reminders">
                <span className="text-lg">📧</span>
                <span>Send Reminder</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2">
              <Link href="/team">
                <span className="text-lg">👨‍💼</span>
                <span>Invite Team</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
