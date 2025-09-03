import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkspaceSettings } from "@/components/settings/workspace-settings"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { SecuritySettings } from "@/components/settings/security-settings"
import { AuditLogs } from "@/components/settings/audit-logs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-balance">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, workspace, and security settings</p>
      </header>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>
        
        <TabsContent value="workspace">
          <WorkspaceSettings />
        </TabsContent>
        
        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
        
        <TabsContent value="audit">
          <AuditLogs />
        </TabsContent>
      </Tabs>
    </section>
  )
}
