import { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LedgerBalanceCardProps {
  title: string
  amount: number
  icon?: LucideIcon
  className?: string
}

export function LedgerBalanceCard({ title, amount, icon: Icon, className = "" }: LedgerBalanceCardProps) {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(Number(amount)))

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {/* Optional icon
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null} */}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedAmount}</div>
        <p className="text-xs text-muted-foreground">
          {Number(amount) >= 0 ? "Positive balance" : "Negative balance"}
        </p>
      </CardContent>
    </Card>
  )
}