// @ts-nocheck
"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface CompleteTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: any
  onSuccess?: () => void
}

export function CompleteTaskDialog({ open, onOpenChange, task, onSuccess }: CompleteTaskDialogProps) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    completionRemarks: "",
    activityOutcome: "SUCCESSFUL",
    clientSatisfaction: "",
    documentsCollected: [] as string[],
    documentsRequired: [] as string[],
    nextSteps: "",
    followUpRequired: false,
    followUpDate: "",
    followUpType: "FOLLOW_UP",
    meetingDuration: "",
    callDuration: "",
    emailsSent: "",
    clientFeedback: "",
    issuesEncountered: "",
    resolutionProvided: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const documentTypes = [
    "ID Proof",
    "Address Proof",
    "Income Proof",
    "Bank Statement",
    "Medical Reports",
    "Proposal Form",
    "Premium Receipt",
    "Policy Document",
    "Claim Form",
    "Death Certificate",
    "Discharge Summary",
    "Other",
  ]

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!task || !form.completionRemarks.trim()) return

    setSubmitting(true)

    try {
      const completionData = {
        activityOutcome: form.activityOutcome,
        clientSatisfaction:
          form.clientSatisfaction && form.clientSatisfaction !== "NOT_APPLICABLE" ? form.clientSatisfaction : undefined,
        documentsCollected: form.documentsCollected.length > 0 ? form.documentsCollected : undefined,
        documentsRequired: form.documentsRequired.length > 0 ? form.documentsRequired : undefined,
        nextSteps: form.nextSteps.trim() || undefined,
        followUpRequired: form.followUpRequired,
        followUpDate: form.followUpDate || undefined,
        followUpType: form.followUpRequired ? form.followUpType : undefined,
        meetingDuration: form.meetingDuration || undefined,
        callDuration: form.callDuration || undefined,
        emailsSent: form.emailsSent || undefined,
        clientFeedback: form.clientFeedback.trim() || undefined,
        issuesEncountered: form.issuesEncountered.trim() || undefined,
        resolutionProvided: form.resolutionProvided.trim() || undefined,
      }

      const res = await fetch(`/api/tasks/${task.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completionRemarks: form.completionRemarks.trim(),
          completionData,
        }),
      })

      if (res.ok) {
        toast({
          title: "Activity completed",
          description: "Activity has been marked as completed with detailed tracking",
        })
        setForm({
          completionRemarks: "",
          activityOutcome: "SUCCESSFUL",
          clientSatisfaction: "",
          documentsCollected: [],
          documentsRequired: [],
          nextSteps: "",
          followUpRequired: false,
          followUpDate: "",
          followUpType: "FOLLOW_UP",
          meetingDuration: "",
          callDuration: "",
          emailsSent: "",
          clientFeedback: "",
          issuesEncountered: "",
          resolutionProvided: "",
        })
        onSuccess?.()
      } else {
        const data = await res.json()
        toast({
          title: "Error",
          description: data.error || "Failed to complete activity",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  function toggleDocument(docType: string, isCollected: boolean) {
    const field = isCollected ? "documentsCollected" : "documentsRequired"
    setForm((f) => ({
      ...f,
      [field]: f[field as keyof typeof f].includes(docType)
        ? (f[field as keyof typeof f] as string[]).filter((d) => d !== docType)
        : [...(f[field as keyof typeof f] as string[]), docType],
    }))
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Activity: {task.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Basic Completion Info */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="remarks">Activity Summary & Remarks *</Label>
                <Textarea
                  id="remarks"
                  value={form.completionRemarks}
                  onChange={(e) => setForm((f) => ({ ...f, completionRemarks: e.target.value }))}
                  placeholder="Describe what was accomplished, client interaction details, outcomes achieved..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Activity Outcome</Label>
                  <Select
                    value={form.activityOutcome}
                    onValueChange={(value) => setForm((f) => ({ ...f, activityOutcome: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUCCESSFUL">Successful</SelectItem>
                      <SelectItem value="PARTIALLY_SUCCESSFUL">Partially Successful</SelectItem>
                      <SelectItem value="UNSUCCESSFUL">Unsuccessful</SelectItem>
                      <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
                      <SelectItem value="CLIENT_UNAVAILABLE">Client Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Client Satisfaction</Label>
                  <Select
                    value={form.clientSatisfaction}
                    onValueChange={(value) => setForm((f) => ({ ...f, clientSatisfaction: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rate satisfaction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_APPLICABLE">Not applicable</SelectItem>
                      <SelectItem value="VERY_SATISFIED">Very Satisfied</SelectItem>
                      <SelectItem value="SATISFIED">Satisfied</SelectItem>
                      <SelectItem value="NEUTRAL">Neutral</SelectItem>
                      <SelectItem value="DISSATISFIED">Dissatisfied</SelectItem>
                      <SelectItem value="VERY_DISSATISFIED">Very Dissatisfied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Metrics */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h4 className="font-medium">Activity Metrics</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Meeting Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={form.meetingDuration}
                    onChange={(e) => setForm((f) => ({ ...f, meetingDuration: e.target.value }))}
                    placeholder="30"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Call Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={form.callDuration}
                    onChange={(e) => setForm((f) => ({ ...f, callDuration: e.target.value }))}
                    placeholder="15"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Emails Sent</Label>
                  <Input
                    type="number"
                    value={form.emailsSent}
                    onChange={(e) => setForm((f) => ({ ...f, emailsSent: e.target.value }))}
                    placeholder="2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Management */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h4 className="font-medium">Document Management</h4>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-green-700 dark:text-green-400">
                    Documents Collected ✓
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {documentTypes.map((docType) => (
                      <label key={`collected-${docType}`} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.documentsCollected.includes(docType)}
                          onChange={(e) => toggleDocument(docType, true)}
                          className="rounded"
                        />
                        <span>{docType}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-orange-700 dark:text-orange-400">
                    Documents Still Required ⏳
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {documentTypes.map((docType) => (
                      <label key={`required-${docType}`} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.documentsRequired.includes(docType)}
                          onChange={(e) => toggleDocument(docType, false)}
                          className="rounded"
                        />
                        <span>{docType}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Feedback & Issues */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Client Feedback</Label>
                  <Textarea
                    value={form.clientFeedback}
                    onChange={(e) => setForm((f) => ({ ...f, clientFeedback: e.target.value }))}
                    placeholder="Any specific feedback or concerns raised by the client..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Issues Encountered</Label>
                  <Textarea
                    value={form.issuesEncountered}
                    onChange={(e) => setForm((f) => ({ ...f, issuesEncountered: e.target.value }))}
                    placeholder="Any challenges, obstacles, or problems faced during this activity..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Resolution Provided</Label>
                  <Textarea
                    value={form.resolutionProvided}
                    onChange={(e) => setForm((f) => ({ ...f, resolutionProvided: e.target.value }))}
                    placeholder="How were the issues resolved or what solutions were provided..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps & Follow-up */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="nextSteps">Next Steps / Recommendations</Label>
                <Textarea
                  id="nextSteps"
                  value={form.nextSteps}
                  onChange={(e) => setForm((f) => ({ ...f, nextSteps: e.target.value }))}
                  placeholder="Recommended next actions, policy suggestions, or client guidance..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="followUp"
                    checked={form.followUpRequired}
                    onCheckedChange={(checked) => setForm((f) => ({ ...f, followUpRequired: checked }))}
                  />
                  <Label htmlFor="followUp">Follow-up activity required</Label>
                </div>

                {form.followUpRequired && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="grid gap-2">
                      <Label>Follow-up Date</Label>
                      <Input
                        type="date"
                        value={form.followUpDate}
                        onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Follow-up Type</Label>
                      <Select
                        value={form.followUpType}
                        onValueChange={(value) => setForm((f) => ({ ...f, followUpType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FOLLOW_UP">General Follow Up</SelectItem>
                          <SelectItem value="POLICY_RENEWAL">Policy Renewal</SelectItem>
                          <SelectItem value="CLAIM_ASSISTANCE">Claim Assistance</SelectItem>
                          <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                          <SelectItem value="MEETING">Meeting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Completing..." : "Complete Activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
