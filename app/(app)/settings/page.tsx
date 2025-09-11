import { getServerSession } from "@/lib/session";
import { getPrisma } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkspaceSettings } from "@/components/settings/workspace-settings";
import { WorkspaceDetails } from "@/components/settings/workspace-details";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { AuditLogs } from "@/components/settings/audit-logs";
import { EmailSettings } from "@/components/settings/email-settings";
import { LocationSettings } from "@/components/settings/location-settings";

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) return null;

  const prisma = await getPrisma();
  const membership = await prisma.membership.findFirst({
    where: { userId: session.sub, workspaceId: session.ws },
  });

  const isOwner = membership?.role === "OWNER";

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          {isOwner
            ? "Manage your profile, workspace, and security settings"
            : "Manage your profile settings"}
        </p>
      </header>

      {isOwner ? (
        <Tabs defaultValue="profile" className="space-y-6">
          {/* Tab list */}
          <TabsList
            className="
              flex w-full gap-2 overflow-x-auto rounded-lg border bg-muted/40 p-1
              scrollbar-hide snap-x snap-mandatory pl-76 md:pl-0
            "
          >
            <TabsTrigger value="profile" className="shrink-0 snap-start">
              Profile
            </TabsTrigger>
            <TabsTrigger value="workspace" className="shrink-0 snap-start">
              Workspace
            </TabsTrigger>
            <TabsTrigger value="details" className="shrink-0 snap-start">
              Office Details
            </TabsTrigger>
            <TabsTrigger value="email" className="shrink-0 snap-start">
              Email
            </TabsTrigger>
            <TabsTrigger value="location" className="shrink-0 snap-start">
              Location
            </TabsTrigger>
            <TabsTrigger value="security" className="shrink-0 snap-start">
              Security
            </TabsTrigger>
            <TabsTrigger value="audit" className="shrink-0 snap-start">
              Audit Logs
            </TabsTrigger>
          </TabsList>

          {/* Tab content */}
          <TabsContent value="profile">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <ProfileSettings />
            </div>
          </TabsContent>

          <TabsContent value="workspace">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <WorkspaceSettings />
            </div>
          </TabsContent>

          <TabsContent value="details">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <WorkspaceDetails />
            </div>
          </TabsContent>

          <TabsContent value="email">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <EmailSettings />
            </div>
          </TabsContent>

          <TabsContent value="location">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <LocationSettings />
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <SecuritySettings />
            </div>
          </TabsContent>

          <TabsContent value="audit">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <AuditLogs />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <div className="font-medium text-foreground">Team Member Access</div>
            <p className="mt-1 text-muted-foreground">
              You can only manage your profile settings. For workspace, email,
              and security changes, contact your workspace owner.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <ProfileSettings />
          </div>
        </div>
      )}
    </section>
  );
}
