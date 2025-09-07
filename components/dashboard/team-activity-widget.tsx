"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Users,
  Activity,
  Target,
  ArrowRight
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function TeamActivityWidget() {
  const { data: teamData } = useSWR("/api/team", fetcher)
  const { data: tasksData } = useSWR("/api/tasks?pageSize=20&sort=updatedAt", fetcher)
  const { data: locationsData } = useSWR("/api/locations?type=current", fetcher)

  const teamMembers = teamData?.items ?? []
  const recentTasks = tasksData?.items ?? []
  const currentLocations = locationsData?.items ?? []

  function getUserInitials(name?: string) {
    if (!name) return "U"
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  function getTaskStatusColor(status: string) {
    switch (status) {
      case "COMPLETED": return "text-green-600"
      case "IN_PROGRESS": return "text-blue-600"
      case "PENDING": return "text-yellow-600"
      case "CANCELLED": return "text-red-600"
      default: return "text-gray-600"
    }
  }

  function getTaskStatusIcon(status: string) {
    switch (status) {
      case "COMPLETED": return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "IN_PROGRESS": return <Activity className="h-4 w-4 text-blue-600" />
      case "PENDING": return <Clock className="h-4 w-4 text-yellow-600" />
      case "CANCELLED": return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Target className="h-4 w-4 text-gray-600" />
    }
  }

  function getDistanceColor(distance?: number) {
    if (!distance) return "outline"
    if (distance <= 1) return "default" // Within 1km
    if (distance <= 5) return "secondary" // Within 5km
    return "destructive" // More than 5km
  }

  function getDistanceLabel(distance?: number) {
    if (!distance) return "Unknown"
    if (distance < 1) return `${Math.round(distance * 1000)}m`
    return `${distance.toFixed(1)}km`
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Team Status */}
      <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/50 dark:to-cyan-800/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-600" />
              Team Status
            </CardTitle>
            <p className="text-sm text-muted-foreground">Current locations & activity</p>
          </div>
          <Button asChild size="sm" variant="outline" className="bg-white/50">
            <Link href="/team">
              Manage Team
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Team Summary */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <div className="text-lg font-bold text-cyan-600">{teamMembers.length}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{currentLocations.length}</div>
                <div className="text-xs text-muted-foreground">Online</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <div className="text-lg font-bold text-gray-600">{teamMembers.length - currentLocations.length}</div>
                <div className="text-xs text-muted-foreground">Offline</div>
              </div>
            </div>

            {/* Team Members List */}
            <div className="space-y-2">
              {teamMembers.slice(0, 4).map((member: any) => {
                const location = currentLocations.find((loc: any) => loc.userId === member.user.id)
                return (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-cyan-500 text-white text-xs">
                        {getUserInitials(member.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{member.user.name}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{member.role}</Badge>
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
                      <Badge variant={getDistanceColor(Number(location.distanceFromOffice)) as any} className="text-xs">
                        {getDistanceLabel(Number(location.distanceFromOffice))}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/50 dark:to-indigo-800/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              Recent Activities
            </CardTitle>
            <p className="text-sm text-muted-foreground">Latest team tasks & updates</p>
          </div>
          <Button asChild size="sm" variant="outline" className="bg-white/50">
            <Link href="/tasks">
              View All Tasks
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent tasks</p>
              </div>
            ) : (
              recentTasks.slice(0, 5).map((task: any) => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                  <div className="flex-shrink-0">
                    {getTaskStatusIcon(task.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{task.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{task.priority}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {task.assignedTo?.name || "Unassigned"}
                      </span>
                    </div>
                    {task.client && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Client: {task.client.name}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                      {task.status.replace("_", " ")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(task.updatedAt), "MMM dd")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}