import { PremiumList } from "@/components/premiums/premium-list"

export default function PremiumsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Premium Management</h1>
          <p className="text-muted-foreground">Manage premium payments and schedules</p>
        </div>
      </div>

      <PremiumList />
    </div>
  )
}
