import { Button } from "@/components/ui/button"
import { TemplatesManager } from "@/components/reminders/templates-manager"
import { QuickSend } from "@/components/reminders/quick-send"
import { LogsTable } from "@/components/reminders/logs-table"
import { AutomationsPanel } from "@/components/reminders/automations-panel"

export default function RemindersPage() {
  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-balance">Reminders</h1>
          <p className="text-sm text-muted-foreground">Templates, quick send, and logs</p>
        </div>
        <Button>Create Template</Button>
      </header>

      {/* Management + Send */}
      <div className="grid gap-6 md:grid-cols-2">
        <TemplatesManager />
        <QuickSend />
      </div>

      {/* Logs */}
      <LogsTable />

      {/* Premium Automations */}
      <AutomationsPanel />
    </section>
  )
}
