import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Building2, Users, FileText, Target, TrendingUp } from "lucide-react"

export function DashboardLoader() {
  return (
    <section className="space-y-6 animate-in fade-in-0 duration-300">
      {/* Header with Gradient Skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Loading workspace...</h1>
                  <p className="text-blue-100">Getting ready...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, color: "blue" },
          { icon: FileText, color: "green" },
          { icon: Building2, color: "purple" },
          { icon: Target, color: "orange" }
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <Card key={i} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>


      {/* Loading Message */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-full">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
          <span className="text-sm font-medium text-primary">
            Loading workspace...
          </span>
        </div>
      </div>
    </section>
  )
}