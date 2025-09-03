"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export function UpgradePrompt({
  trigger,
}: {
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="default">Upgrade</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade to Premium</DialogTitle>
          <DialogDescription>
            You&apos;ve reached the free plan limit (2 staff users). Upgrade to Premium for unlimited team members and
            advanced features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge>FREE</Badge>
            <span className="text-sm text-muted-foreground">Current plan</span>
          </div>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            <li>Unlimited staff users</li>
            <li>Automated reminders & bulk WhatsApp</li>
            <li>Advanced reports & RBAC</li>
          </ul>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button className="w-full sm:w-auto">Upgrade Online</Button>
          <Button variant="secondary" className="w-full sm:w-auto">
            Contact Sales
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
