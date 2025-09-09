import { getServerSession } from "@/lib/session"
import { getPrisma } from "@/lib/db"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkspaceSettings } from "@/components/settings/workspace-settings"
import { WorkspaceDetails } from "@/components/settings/workspace-details"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { SecuritySettings } from "@/components/settings/security-settings"
import { AuditLogs } from "@/components/settings/audit-logs"
import { EmailSettings } from "@/components/settings/email-settings"
import { LocationSettings } from "@/components/settings/location-settings"

export default async function SettingsPage() {
  const session = await getServerSession()
  if (!session) return null

  const prisma = await getPrisma()
  const membership = await prisma.membership.findFirst({
    where: { userId: session.sub, workspaceId: session.ws }
  })
  
  const isOwner = membership?.role === "OWNER"

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-balance">Settings</h1>
        <p className="text-sm text-muted-foreground">
          {isOwner 
            ? "Manage your profile, workspace, and security settings" 
            : "Manage your profile settings"
          }
        </p>
      </header>

      {isOwner ? (
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
            <TabsTrigger value="details">Office Details</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>
          
          <TabsContent value="workspace">
            <WorkspaceSettings />
          </TabsContent>
          
          <TabsContent value="details">
            <WorkspaceDetails />
          </TabsContent>
          
          <TabsContent value="email">
            <EmailSettings />
          </TabsContent>
          
          <TabsContent value="location">
            <LocationSettings />
          </TabsContent>
          
          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>
          
          <TabsContent value="audit">
            <AuditLogs />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-6">
          <div className="bg-muted/50 border border-muted rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Team Member Access:</span>
              <span className="font-medium">Profile settings only</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Contact your workspace owner for workspace, email, and security settings
            </p>
          </div>
          <ProfileSettings />
        </div>
      )}
    </section>
  )
}
