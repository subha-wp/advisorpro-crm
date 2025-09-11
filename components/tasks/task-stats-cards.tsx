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
  const loading = !stats

  const cards = loading
    ? Array.from({ length: 4 }).map((_, i) => ({
        key: i,
        title: "Loading...",
        value: "0",
        hint: "",
        color: "from-gray-400 to-gray-500",
      }))
    : [
        {
          key: "total",
          title: "Total Activities",
          value: stats.total.toString(),
          hint: `${stats.completed} completed`,
          color: "from-blue-500 to-indigo-500",
        },
        {
          key: "my",
          title: "My Activities",
          value: stats.myTasks.toString(),
          hint: "Assigned to me",
          color: "from-purple-500 to-pink-500",
        },
        {
          key: "pending",
          title: "Pending",
          value: stats.pending.toString(),
          hint: `${stats.inProgress} in progress`,
          color: "from-amber-500 to-orange-500",
        },
        {
          key: "urgent",
          title: "Urgent & Overdue",
          value: (stats.urgent + stats.overdue).toString(),
          hint: `${stats.urgent} urgent, ${stats.overdue} overdue`,
          color: "from-red-500 to-pink-600",
        },
      ]

  return (
    <div className="flex gap-4 overflow-x-auto px-1 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {cards.map((card) => (
        <div
          key={card.key}
          className="snap-start shrink-0 w-[72%] max-w-[240px]"
        >
          <div
            className={`rounded-2xl p-4 text-white shadow-md bg-gradient-to-r ${card.color}`}
          >
            <div className="text-sm opacity-90">{card.title}</div>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.hint && (
              <div className="text-xs opacity-75 mt-1">{card.hint}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
