"use client"

import { KpiCard } from "@/components/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

const data = [
  { month: "Jan", due: 120000, collected: 90000 },
  { month: "Feb", due: 130000, collected: 110000 },
  { month: "Mar", due: 150000, collected: 125000 },
  { month: "Apr", due: 140000, collected: 135000 },
]

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-balance">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Key metrics and recent activity</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Premiums Due (30d)" value="₹ 4.6L" hint="+8% vs last month" />
        <KpiCard title="Collected (30d)" value="₹ 3.6L" hint="+5% vs last month" />
        <KpiCard title="Overdue Policies" value="23" hint="-2 since yesterday" />
        <KpiCard title="Active Clients" value="312" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Due vs Collected</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
    
        </CardContent>
      </Card>
    </section>
  )
}
