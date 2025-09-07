"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Calendar, 
  AlertTriangle, 
  Clock, 
  IndianRupee,
  ArrowRight,
  Building2,
  User,
  CheckCircle2
} from "lucide-react"
import { format, isAfter, isBefore, addDays } from "date-fns"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function PremiumAlerts() {
  const { data: policiesData } = useSWR("/api/policies?pageSize=100", fetcher)
  const policies = policiesData?.items ?? []

  // Filter policies by due date categories
  const today = new Date()
  const nextWeek = addDays(today, 7)
  const next30Days = addDays(today, 30)

  const overduePolicies = policies.filter((policy: any) => {
    if (!policy.nextDueDate || policy.status !== "ACTIVE") return false
    return isBefore(new Date(policy.nextDueDate), today)
  })

  const dueThisWeek = policies.filter((policy: any) => {
    if (!policy.nextDueDate || policy.status !== "ACTIVE") return false
    const dueDate = new Date(policy.nextDueDate)
    return isAfter(dueDate, today) && isBefore(dueDate, nextWeek)
  })

  const dueNext30Days = policies.filter((policy: any) => {
    if (!policy.nextDueDate || policy.status !== "ACTIVE") return false
    const dueDate = new Date(policy.nextDueDate)
    return isAfter(dueDate, nextWeek) && isBefore(dueDate, next30Days)
  })

  const totalOverdueAmount = overduePolicies.reduce((sum: number, policy: any) => 
    sum + (policy.premiumAmount || 0), 0
  )

  const totalUpcomingAmount = dueThisWeek.reduce((sum: number, policy: any) => 
    sum + (policy.premiumAmount || 0), 0
  )

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Alert variant={overduePolicies.length > 0 ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{overduePolicies.length} Overdue</div>
                <div className="text-xs">₹{totalOverdueAmount.toLocaleString()} pending</div>
              </div>
              {overduePolicies.length > 0 && (
                <Button asChild size="sm" variant="outline">
                  <Link href="/premiums?status=OVERDUE">Action Required</Link>
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>

        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{dueThisWeek.length} Due This Week</div>
                <div className="text-xs">₹{totalUpcomingAmount.toLocaleString()} expected</div>
              </div>
              {dueThisWeek.length > 0 && (
                <Button asChild size="sm" variant="outline">
                  <Link href="/premiums?status=UPCOMING">View Details</Link>
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>

        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{dueNext30Days.length} Due Next 30 Days</div>
                <div className="text-xs">Plan ahead</div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/premiums">View Calendar</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>

      {/* Detailed Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue Premiums */}
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
              Overdue Premiums ({overduePolicies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overduePolicies.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">No overdue premiums! 🎉</p>
                </div>
              ) : (
                overduePolicies.slice(0, 5).map((policy: any) => (
                  <div key={policy.id} className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-red-200">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{policy.client?.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{policy.policyNumber}</div>
                      <div className="text-xs text-red-600 font-medium">
                        Due: {format(new Date(policy.nextDueDate), "dd MMM yyyy")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-700">₹{policy.premiumAmount?.toLocaleString()}</div>
                      <Badge variant="destructive" className="text-xs">
                        {Math.ceil((today.getTime() - new Date(policy.nextDueDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </Badge>
                    </div>
                  </div>
                ))
              )}
              {overduePolicies.length > 5 && (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/premiums?status=OVERDUE">
                    View All {overduePolicies.length} Overdue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming This Week */}
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <Clock className="h-5 w-5" />
              Due This Week ({dueThisWeek.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dueThisWeek.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No premiums due this week</p>
                </div>
              ) : (
                dueThisWeek.slice(0, 5).map((policy: any) => (
                  <div key={policy.id} className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-yellow-200">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{policy.client?.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{policy.policyNumber}</div>
                      <div className="text-xs text-yellow-600 font-medium">
                        Due: {format(new Date(policy.nextDueDate), "dd MMM yyyy")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-yellow-700">₹{policy.premiumAmount?.toLocaleString()}</div>
                      <Badge variant="outline" className="text-xs border-yellow-300">
                        {Math.ceil((new Date(policy.nextDueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days
                      </Badge>
                    </div>
                  </div>
                ))
              )}
              {dueThisWeek.length > 5 && (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/premiums?status=UPCOMING">
                    View All {dueThisWeek.length} Upcoming
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}