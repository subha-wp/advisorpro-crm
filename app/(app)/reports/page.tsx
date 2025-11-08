"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarDaysIcon, DownloadIcon, RefreshCwIcon, FileText, IndianRupee } from "lucide-react"
import { ChartContainer,  ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis, Cell, Line, LineChart } from "recharts"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ReportsPage() {
  const [from, setFrom] = useState<Date | undefined>(undefined)
  const [to, setTo] = useState<Date | undefined>(undefined)
  const [period, setPeriod] = useState<string>("last_12_months")

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (from) params.set("from", from.toISOString())
    if (to) params.set("to", to.toISOString())
    return params.toString() ? `?${params.toString()}` : ""
  }, [from, to])

  const { data, isLoading, mutate } = useSWR(`/api/reports${query}`, fetcher)

  useEffect(() => {
    if (period === "last_12_months") {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 11)
      start.setDate(1)
      setFrom(start)
      setTo(end)
    }
    if (period === "ytd") {
      const now = new Date()
      const start = new Date(now.getFullYear(), 0, 1)
      setFrom(start)
      setTo(now)
    }
  }, [period])

  const kpis = data?.kpis || { totalPolicies: 0, activePolicies: 0, totalPremiumsPaid: 0 }
  const byInsurer = data?.breakdowns?.byInsurer || []
  const byStatus = data?.breakdowns?.byStatus || []
  const monthlyPremiums = data?.trends?.monthlyPremiums || []

  const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#84cc16", "#f97316"]

  return (
    <section className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-col sm:flex-row">
        <div>
          <h1 className="text-xl font-semibold text-balance">Reports</h1>
          <p className="text-sm text-muted-foreground">Workspace analytics and trends</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_12_months">Last 12 months</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          {period === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarDaysIcon className="size-4" />
                  {from && to ? `${from.toLocaleDateString()} - ${to.toLocaleDateString()}` : "Pick range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-auto">
                <Calendar
                  mode="range"
                  selected={{ from, to }}
                  onSelect={(range: any) => {
                    setFrom(range?.from)
                    setTo(range?.to)
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCwIcon className="size-4" /> Refresh
          </Button>
          <Button size="sm" onClick={() => window.open(`/api/reports?from=${from?.toISOString() || ""}&to=${to?.toISOString() || ""}`, "_blank")}> 
            <DownloadIcon className="size-4" /> Export
          </Button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 hover:shadow-lg transition">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-blue-700">Total Policies</p>
                <p className="text-2xl font-bold">{kpis.totalPolicies.toLocaleString()}</p>
              </div>
              <div className="bg-blue-600 text-white p-2 rounded-full">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 hover:shadow-lg transition">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-green-700">Active Policies</p>
                <p className="text-2xl font-bold">{kpis.activePolicies.toLocaleString()}</p>
              </div>
              <div className="bg-green-600 text-white p-2 rounded-full">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 hover:shadow-lg transition">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-purple-700">Premiums Paid</p>
                <p className="text-2xl font-bold">₹{kpis.totalPremiumsPaid.toLocaleString()}</p>
              </div>
              <div className="bg-purple-600 text-white p-2 rounded-full">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">By Insurer</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : byInsurer.length === 0 ? (
              <div className="text-sm text-muted-foreground">No data</div>
            ) : (
              <ChartContainer config={{}} className="aspect-[16/10]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={byInsurer} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80}>
                    {byInsurer.map((item: any, idx: number) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">By Policy Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : byStatus.length === 0 ? (
              <div className="text-sm text-muted-foreground">No data</div>
            ) : (
              <ChartContainer config={{}} className="aspect-[16/10]">
                <BarChart data={byStatus} barSize={28}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {byStatus.map((_: any, idx: number) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Monthly Premiums</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : monthlyPremiums.length === 0 ? (
              <div className="text-sm text-muted-foreground">No transactions in range</div>
            ) : (
              <ChartContainer config={{}} className="aspect-[16/6]">
                <LineChart data={monthlyPremiums}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
