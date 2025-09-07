import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkspaceSettings } from "@/components/settings/workspace-settings"
import { WorkspaceDetails } from "@/components/settings/workspace-details"

export default function WorkspaceSettingsPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-balance">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your workspace configuration, office details, and file uploads
        </p>
      </header>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="details">Office Details & Assets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <WorkspaceSettings />
        </TabsContent>
        
        <TabsContent value="details">
          <WorkspaceDetails />
        </TabsContent>
      </Tabs>
    </section>
  )
}