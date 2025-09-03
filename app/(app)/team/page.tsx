"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UpgradePrompt } from "@/components/upgrade-modal"
import { useState } from "react"

export default function TeamPage() {
  // NOTE: This will be wired to plan state later
  const [reachedLimit] = useState(true)

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-balance">Team</h1>
          <p className="text-sm text-muted-foreground">Invite and manage staff</p>
        </div>
        {reachedLimit ? <UpgradePrompt trigger={<Button>Upgrade to add more</Button>} /> : <Button>Add Member</Button>}
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Member list coming soon...</p>
        </CardContent>
      </Card>
    </section>
  )
}
