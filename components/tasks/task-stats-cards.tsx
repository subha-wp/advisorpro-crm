import { KpiCard } from "@/components/kpi-card"

interface TaskStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  myTasks: number
  overdue: number
  urgent: number
}

interface TaskStatsCardsProps {
  stats?: TaskStats
}

export function TaskStatsCards({ stats }: TaskStatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCard key={i} title="Loading..." value="0" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard 
        title="Total Activities" 
        value={stats.total.toString()} 
        hint={`${stats.completed} completed`}
      />
      <KpiCard 
        title="My Activities" 
        value={stats.myTasks.toString()} 
        hint="Assigned to me"
      />
      <KpiCard 
        title="Pending" 
        value={stats.pending.toString()} 
        hint={`${stats.inProgress} in progress`}
      />
      <KpiCard 
        title="Urgent & Overdue" 
        value={(stats.urgent + stats.overdue).toString()} 
        hint={`${stats.urgent} urgent, ${stats.overdue} overdue`}
      />
    </div>
  )
}