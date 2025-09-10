"use client"

import { Suspense } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts"
import { DashboardLoader } from "@/components/dashboard/dashboard-loader"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import {
  TrendingUp,
  Users,
  Building2,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  IndianRupee,
  FileText,
  Activity,
  Target,
  Zap,
  Star,
  ArrowUpRight,
  PieChartIcon,
  TrendingDown,
} from "lucide-react"
import { format, subDays, isAfter, isBefore, addDays } from "date-fns"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Chart configurations
const insurerChartConfig = {
  lic: { label: "LIC", color: "hsl(var(--chart-1))" },
  hdfc: { label: "HDFC Life", color: "hsl(var(--chart-2))" },
  icici: { label: "ICICI Prudential", color: "hsl(var(--chart-3))" },
  sbi: { label: "SBI Life", color: "hsl(var(--chart-4))" },
  others: { label: "Others", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig

const statusChartConfig = {
  active: { label: "Active", color: "hsl(142, 76%, 36%)" },
  lapsed: { label: "Lapsed", color: "hsl(0, 84%, 60%)" },
  matured: { label: "Matured", color: "hsl(217, 91%, 60%)" },
  surrendered: { label: "Surrendered", color: "hsl(43, 96%, 56%)" },
} satisfies ChartConfig

export default function DashboardPage() {
  // Use SWR with optimized settings for faster loading
  const { data: statsData } = useSWR("/api/workspace/stats", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000
  })
  const { data: planData } = useSWR("/api/plan", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000
  })
  const { data: taskStatsData } = useSWR("/api/tasks/stats", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000
  })
  const { data: teamData } = useSWR("/api/team", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000
  })
  const { data: premiumsData } = useSWR("/api/premiums", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 45000
  })
  const { data: policiesData } = useSWR("/api/policies?pageSize=50", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000
  })
  const { data: clientsData } = useSWR("/api/clients?pageSize=30", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000
  })
  const { data: auditData } = useSWR("/api/audit?pageSize=5", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 120000
  })
  const { data: locationsData } = useSWR("/api/locations?type=current", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000
  })

  // Show loading state for critical data
  const isLoadingCritical = !statsData || !planData
  
  if (isLoadingCritical) {
    return (
      <Suspense fallback={<DashboardLoader />}>
        <DashboardLoader />
      </Suspense>
    )
  }

  // Data processing
  const stats = statsData?.stats
  const plan = planData?.plan
  const taskStats = taskStatsData?.stats || { total: 0, pending: 0, inProgress: 0, completed: 0, urgent: 0, overdue: 0 }
  const teamMembers = teamData?.items ?? []
  const premiumsSummary = premiumsData?.summary
  const policies = policiesData?.items ?? []
  const clients = clientsData?.items ?? []
  const recentActivities = auditData?.items ?? []
  const currentLocations = locationsData?.items ?? []

  // Process data for charts
  const insurerData = policies.reduce((acc: any, policy: any) => {
    const insurer = policy.insurer.toLowerCase()
    const key = insurer.includes("lic")
      ? "lic"
      : insurer.includes("hdfc")
        ? "hdfc"
        : insurer.includes("icici")
          ? "icici"
          : insurer.includes("sbi")
            ? "sbi"
            : "others"
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const insurerChartData = Object.entries(insurerData).map(([key, value]) => ({
    insurer: key,
    count: value,
    fill: insurerChartConfig[key as keyof typeof insurerChartConfig]?.color || "hsl(var(--chart-5))",
  }))

  const statusData = policies.reduce((acc: any, policy: any) => {
    const status = policy.status.toLowerCase()
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const statusChartData = Object.entries(statusData).map(([key, value]) => ({
    status: key,
    count: value,
    fill: statusChartConfig[key as keyof typeof statusChartConfig]?.color || "hsl(var(--muted))",
  }))

  // Premium trend data (mock data for demonstration)
  const premiumTrendData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    return {
      date: format(date, "dd MMM"),
      collected: Math.floor(Math.random() * 50000) + 20000,
      due: Math.floor(Math.random() * 30000) + 15000,
    }
  })

  // Upcoming premiums (next 7 days)
  const upcomingPremiums = policies
    .filter((policy: any) => {
      if (!policy.nextDueDate) return false
      const dueDate = new Date(policy.nextDueDate)
      const today = new Date()
      const nextWeek = addDays(today, 7)
      return isAfter(dueDate, today) && isBefore(dueDate, nextWeek)
    })
    .sort((a: any, b: any) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
    .slice(0, 5)

  // Recent client additions
  const recentClients = clients
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  function getUserInitials(name?: string) {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  function getActivityIcon(action: string) {
    switch (action) {
      case "CREATE":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "UPDATE":
        return <Activity className="h-4 w-4 text-blue-600" />
      case "DELETE":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "LOGIN":
        return <MapPin className="h-4 w-4 text-purple-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  function getTaskPriorityColor(priority: string) {
    switch (priority) {
      case "URGENT":
        return "bg-red-500"
      case "HIGH":
        return "bg-orange-500"
      case "MEDIUM":
        return "bg-yellow-500"
      case "LOW":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  // Component for loading states of individual sections
  function SectionLoader({ title, className = "" }: { title: string, className?: string }) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="space-y-8">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
              <p className="text-blue-100 text-lg">Your workspace is ready - here's today's overview</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Current Plan</div>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
                {plan || "FREE"}
              </Badge>
            </div>
          </div>

          {plan === "FREE" && (
            <Alert className="mt-6 bg-white/10 border-white/20 text-white">
              <Star className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between text-white">
                <span>Unlock premium features like automations and unlimited users</span>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/billing">Upgrade Now</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* KPI Cards with Enhanced Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Active Clients</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {stats?.clients?.active?.toString() || "0"}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {stats?.clients?.total || 0} total •{" "}
                  {(((stats?.clients?.active || 0) / Math.max(1, stats?.clients?.total || 1)) * 100).toFixed(0)}% active
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Active Policies</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {stats?.policies?.active?.toString() || "0"}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {stats?.policies?.total || 0} total • ₹{((stats?.policies?.active || 0) * 50000).toLocaleString()}{" "}
                  est. value
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <FileText className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Team Members</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {stats?.members?.toString() || "0"}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {currentLocations.length} online • {plan === "FREE" ? "3 max on Free" : "50 max on Premium"}
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Pending Tasks</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                  {taskStats?.pending?.toString() || "0"}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  {taskStats?.urgent || 0} urgent • {taskStats?.overdue || 0} overdue
                </p>
              </div>
              <div className="p-3 bg-orange-500 rounded-full">
                <Target className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Policy Distribution by Insurer */}
        {!policiesData ? (
          <SectionLoader title="Policy Distribution" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50" />
        ) : (
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-blue-600" />
                Policy Distribution
              </CardTitle>
              <p className="text-sm text-muted-foreground">By Insurance Company</p>
            </div>
            <Badge variant="outline" className="bg-white/50">
              {policies.length} Total
            </Badge>
          </CardHeader>
          <CardContent>
            {insurerChartData.length > 0 ? (
              <ChartContainer config={insurerChartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={insurerChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="count"
                      label={({ insurer, count }) => `${insurer.toUpperCase()}: ${count}`}
                    >
                      {insurerChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No policy data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Premium Collection Trend */}
        {!premiumsData ? (
          <SectionLoader title="Premium Trends" className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/50 dark:to-emerald-800/50" />
        ) : (
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/50 dark:to-emerald-800/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Premium Trends
              </CardTitle>
              <p className="text-sm text-muted-foreground">Last 7 Days Collection</p>
            </div>
            <Badge variant="outline" className="bg-white/50">
              ₹{premiumsSummary?.totalAmount?.toLocaleString() || "0"}
            </Badge>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={premiumTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: any) => [`₹${value.toLocaleString()}`, ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    stroke="hsl(142, 76%, 36%)"
                    fill="hsl(142, 76%, 36%)"
                    fillOpacity={0.3}
                    strokeWidth={3}
                  />
                  <Area
                    type="monotone"
                    dataKey="due"
                    stroke="hsl(0, 84%, 60%)"
                    fill="hsl(0, 84%, 60%)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Tasks & Activities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Overview */}
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/50 dark:to-indigo-800/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-600" />
                  Team Activities Overview
                </CardTitle>
                <p className="text-sm text-muted-foreground">Current task distribution and progress</p>
              </div>
              <Button asChild size="sm" variant="outline" className="bg-white/50">
                <Link href="/tasks">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-white/50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{taskStats?.pending || 0}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{taskStats?.inProgress || 0}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{taskStats?.completed || 0}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{taskStats?.urgent || 0}</div>
                  <div className="text-sm text-muted-foreground">Urgent</div>
                </div>
              </div>

              {/* Task Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>
                    {taskStats?.total ? Math.round(((taskStats.completed || 0) / taskStats.total) * 100) : 0}%
                  </span>
                </div>
                <Progress
                  value={taskStats?.total ? ((taskStats.completed || 0) / taskStats.total) * 100 : 0}
                  className="h-3"
                />
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-gray-600" />
                  Recent Activities
                </CardTitle>
                <p className="text-sm text-muted-foreground">Latest workspace activities and changes</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/settings?tab=audit">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activities</p>
                  </div>
                ) : (
                  recentActivities.slice(0, 6).map((activity: any) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      {getActivityIcon(activity.action)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{activity.action}</span>
                          <Badge variant="outline" className="text-xs">
                            {activity.entity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {activity.user?.name || "System"} • {format(new Date(activity.createdAt), "MMM dd, HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-6">
          {/* Upcoming Premiums */}
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/50 dark:to-amber-800/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  Due This Week
                </CardTitle>
                <p className="text-sm text-muted-foreground">Next 7 days</p>
              </div>
              <Button asChild size="sm" variant="outline" className="bg-white/50">
                <Link href="/premiums">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingPremiums.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No premiums due this week</p>
                  </div>
                ) : (
                  upcomingPremiums.map((policy: any) => (
                    <div key={policy.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{policy.client?.name}</div>
                        <div className="text-xs text-muted-foreground">{policy.policyNumber}</div>
                        <div className="text-xs text-amber-600">
                          Due: {format(new Date(policy.nextDueDate), "dd MMM")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">₹{policy.premiumAmount?.toLocaleString()}</div>
                        <Badge variant="outline" className="text-xs">
                          {policy.insurer}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Status */}
          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/50 dark:to-cyan-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-cyan-600" />
                Team Status
              </CardTitle>
              <p className="text-sm text-muted-foreground">Current locations & activity</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMembers.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No team members yet</p>
                  </div>
                ) : (
                  teamMembers.slice(0, 5).map((member: any) => {
                    const location = currentLocations.find((loc: any) => loc.userId === member.user.id)
                    return (
                      <div key={member.id} className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={member.user.avatarUrl || undefined} 
                            alt={`${member.user.name}'s avatar`}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-cyan-500 text-white text-sm">
                            {getUserInitials(member.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{member.user.name}</div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {member.role}
                            </Badge>
                            {location ? (
                              <Badge variant="default" className="text-xs bg-green-500">
                                <MapPin className="h-3 w-3 mr-1" />
                                Online
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Offline
                              </Badge>
                            )}
                          </div>
                        </div>
                        {location?.distanceFromOffice && (
                          <div className="text-xs text-muted-foreground">
                            {Number(location.distanceFromOffice) < 1
                              ? `${Math.round(Number(location.distanceFromOffice) * 1000)}m`
                              : `${Number(location.distanceFromOffice).toFixed(1)}km`}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Clients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-600" />
                  Recent Clients
                </CardTitle>
                <p className="text-sm text-muted-foreground">Latest additions</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/clients">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentClients.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No clients added yet</p>
                  </div>
                ) : (
                  recentClients.map((client: any) => (
                    <div key={client.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={client.avatarUrl || undefined} 
                          alt={`${client.name}'s avatar`}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getUserInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{client.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {client.mobile || client.email || "No contact"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Added {format(new Date(client.createdAt), "dd MMM")}
                        </div>
                      </div>
                      {client.clientGroup && (
                        <Badge variant="secondary" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          Family
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Premium Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Overdue</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">{premiumsSummary?.overdue || 0}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Due Soon</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {premiumsSummary?.upcoming || 0}
                </p>
              </div>
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Paid</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{premiumsSummary?.paid || 0}</p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Value</p>
                <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                  ₹{(premiumsSummary?.totalAmount || 0).toLocaleString()}
                </p>
              </div>
              <IndianRupee className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions with Enhanced Design */}
      <Card className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 dark:from-slate-900/50 dark:via-gray-900/50 dark:to-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
          <p className="text-sm text-muted-foreground">Frequently used features for faster workflow</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              asChild
              variant="outline"
              className="h-24 flex-col gap-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Link href="/clients">
                <div className="p-2 bg-white/20 rounded-full">
                  <Users className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <div className="font-semibold">Add Client</div>
                  <div className="text-xs opacity-90">New customer</div>
                </div>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-24 flex-col gap-3 bg-gradient-to-br from-green-500 to-green-600 text-white border-green-600 hover:from-green-600 hover:to-green-700"
            >
              <Link href="/policies">
                <div className="p-2 bg-white/20 rounded-full">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <div className="font-semibold">Add Policy</div>
                  <div className="text-xs opacity-90">New insurance</div>
                </div>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-24 flex-col gap-3 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              <Link href="/tasks">
                <div className="p-2 bg-white/20 rounded-full">
                  <Target className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <div className="font-semibold">Create Task</div>
                  <div className="text-xs opacity-90">Follow-up activity</div>
                </div>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-24 flex-col gap-3 bg-gradient-to-br from-orange-500 to-orange-600 text-white border-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Link href="/premiums">
                <div className="p-2 bg-white/20 rounded-full">
                  <IndianRupee className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <div className="font-semibold">Record Payment</div>
                  <div className="text-xs opacity-90">Premium collection</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/50 dark:to-emerald-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              This Month's Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">New Clients</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">
                    {
                      clients.filter((c: any) => {
                        const created = new Date(c.createdAt)
                        const monthStart = new Date()
                        monthStart.setDate(1)
                        return created >= monthStart
                      }).length
                    }
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">New Policies</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">
                    {
                      policies.filter((p: any) => {
                        const created = new Date(p.createdAt)
                        const monthStart = new Date()
                        monthStart.setDate(1)
                        return created >= monthStart
                      }).length
                    }
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Tasks Completed</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{taskStats?.completed || 0}</span>
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Premium Collection</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">₹{(premiumsSummary?.totalAmount || 0).toLocaleString()}</span>
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/50 dark:to-rose-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Overdue Premiums</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-600">{premiumsSummary?.overdue || 0}</span>
                  {(premiumsSummary?.overdue || 0) > 0 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Urgent Tasks</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-orange-600">{taskStats?.urgent || 0}</span>
                  {(taskStats?.urgent || 0) > 0 && <Clock className="h-4 w-4 text-orange-500" />}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Lapsed Policies</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-600">
                    {policies.filter((p: any) => p.status === "LAPSED").length}
                  </span>
                  {policies.filter((p: any) => p.status === "LAPSED").length > 0 && (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Offline Team Members</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-600">{teamMembers.length - currentLocations.length}</span>
                  <MapPin className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
