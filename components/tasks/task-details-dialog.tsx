"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, User, Building2, FileText, Clock, CheckCircle, Star, AlertTriangle, Phone, Mail, Users } from "lucide-react"

interface TaskDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: any
}

export function TaskDetailsDialog({ open, onOpenChange, task }: TaskDetailsDialogProps) {
  if (!task) return null

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "URGENT": return "destructive"
      case "HIGH": return "default"
      case "MEDIUM": return "secondary"
      case "LOW": return "outline"
      default: return "outline"
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "COMPLETED": return "default"
      case "IN_PROGRESS": return "secondary"
      case "PENDING": return "outline"
      case "CANCELLED": return "destructive"
      default: return "outline"
    }
  }

  function formatTaskType(type: string) {
    return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  function getOutcomeColor(outcome: string) {
    switch (outcome) {
      case "SUCCESSFUL": return "text-green-600 dark:text-green-400"
      case "PARTIALLY_SUCCESSFUL": return "text-yellow-600 dark:text-yellow-400"
      case "UNSUCCESSFUL": return "text-red-600 dark:text-red-400"
      case "RESCHEDULED": return "text-blue-600 dark:text-blue-400"
      case "CLIENT_UNAVAILABLE": return "text-gray-600 dark:text-gray-400"
      default: return ""
    }
  }

  function getSatisfactionStars(satisfaction: string) {
    const levels = {
      "VERY_SATISFIED": 5,
      "SATISFIED": 4,
      "NEUTRAL": 3,
      "DISSATISFIED": 2,
      "VERY_DISSATISFIED": 1,
    }
    return levels[satisfaction as keyof typeof levels] || 0
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Activity Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{task.title}</h3>
              {task.description && (
                <p className="text-muted-foreground mt-2">{task.description}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={getPriorityColor(task.priority) as any}>
                {task.priority} Priority
              </Badge>
              <Badge variant={getStatusColor(task.status) as any}>
                {task.status.replace("_", " ")}
              </Badge>
              <Badge variant="outline">
                {formatTaskType(task.type)}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Assignment & Dates */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Created By</span>
              </div>
              <div className="ml-6">
                <div className="font-medium">{task.createdBy.name}</div>
                <div className="text-sm text-muted-foreground">{task.createdBy.email}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Assigned To</span>
              </div>
              <div className="ml-6">
                {task.assignedTo ? (
                  <>
                    <div className="font-medium">{task.assignedTo.name}</div>
                    <div className="text-sm text-muted-foreground">{task.assignedTo.email}</div>
                  </>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Created</span>
              </div>
              <div className="ml-6 text-sm">
                {new Date(task.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Due Date</span>
              </div>
              <div className="ml-6 text-sm">
                {task.dueDate ? (
                  <span className={new Date(task.dueDate) < new Date() && task.status !== "COMPLETED" ? "text-destructive font-medium" : ""}>
                    {new Date(task.dueDate).toLocaleDateString()}
                    {new Date(task.dueDate) < new Date() && task.status !== "COMPLETED" && " (Overdue)"}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No due date</span>
                )}
              </div>
            </div>
          </div>

          {/* Related Records */}
          {(task.client || task.policy) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Related Records</h4>
                
                {task.client && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Client: <strong>{task.client.name}</strong></span>
                  </div>
                )}
                
                {task.policy && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Policy: <strong>{task.policy.policyNumber}</strong> ({task.policy.insurer})
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Completion Details */}
          {task.status === "COMPLETED" && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium">Activity Completion Report</h4>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Completed:</strong> {new Date(task.completedAt).toLocaleString()}
                  </div>
                  
                  {task.completionRemarks && (
                    <>
                      <div className="text-sm">
                        <strong>Summary & Remarks:</strong>
                      </div>
                      <div className="bg-muted p-3 rounded-md text-sm">
                        {task.completionRemarks}
                      </div>
                    </>
                  )}
                  
                  {task.completionData && (
                    <div className="grid gap-4 mt-4">
                      {/* Outcome & Satisfaction */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {task.completionData.activityOutcome && (
                          <div>
                            <strong className="text-sm">Outcome:</strong>
                            <div className={`text-sm mt-1 ${getOutcomeColor(task.completionData.activityOutcome)}`}>
                              {task.completionData.activityOutcome.replace(/_/g, " ")}
                            </div>
                          </div>
                        )}
                        
                        {task.completionData.clientSatisfaction && (
                          <div>
                            <strong className="text-sm">Client Satisfaction:</strong>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${
                                      i < getSatisfactionStars(task.completionData.clientSatisfaction) 
                                        ? "text-yellow-400 fill-current" 
                                        : "text-gray-300"
                                    }`} 
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {task.completionData.clientSatisfaction.replace(/_/g, " ")}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Activity Metrics */}
                      {(task.completionData.meetingDuration || task.completionData.callDuration || task.completionData.emailsSent) && (
                        <div>
                          <strong className="text-sm">Activity Metrics:</strong>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm">
                            {task.completionData.meetingDuration && (
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{task.completionData.meetingDuration} min meeting</span>
                              </div>
                            )}
                            {task.completionData.callDuration && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{task.completionData.callDuration} min call</span>
                              </div>
                            )}
                            {task.completionData.emailsSent && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{task.completionData.emailsSent} emails sent</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Documents */}
                      {(task.completionData.documentsCollected?.length > 0 || task.completionData.documentsRequired?.length > 0) && (
                        <div>
                          <strong className="text-sm">Document Status:</strong>
                          <div className="grid md:grid-cols-2 gap-4 mt-2">
                            {task.completionData.documentsCollected?.length > 0 && (
                              <div>
                                <div className="text-sm text-green-600 dark:text-green-400 font-medium">✓ Collected:</div>
                                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                                  {task.completionData.documentsCollected.map((doc: string, i: number) => (
                                    <li key={i}>• {doc}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {task.completionData.documentsRequired?.length > 0 && (
                              <div>
                                <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">⏳ Still Required:</div>
                                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                                  {task.completionData.documentsRequired.map((doc: string, i: number) => (
                                    <li key={i}>• {doc}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Client Feedback */}
                      {task.completionData.clientFeedback && (
                        <div>
                          <strong className="text-sm">Client Feedback:</strong>
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md text-sm mt-2">
                            {task.completionData.clientFeedback}
                          </div>
                        </div>
                      )}

                      {/* Issues & Resolution */}
                      {(task.completionData.issuesEncountered || task.completionData.resolutionProvided) && (
                        <div className="space-y-3">
                          {task.completionData.issuesEncountered && (
                            <div>
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                <strong className="text-sm">Issues Encountered:</strong>
                              </div>
                              <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-md text-sm mt-2">
                                {task.completionData.issuesEncountered}
                              </div>
                            </div>
                          )}
                          
                          {task.completionData.resolutionProvided && (
                            <div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <strong className="text-sm">Resolution Provided:</strong>
                              </div>
                              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-md text-sm mt-2">
                                {task.completionData.resolutionProvided}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Next Steps */}
                      {task.completionData.nextSteps && (
                        <div>
                          <strong className="text-sm">Next Steps & Recommendations:</strong>
                          <div className="bg-muted p-3 rounded-md text-sm mt-2">
                            {task.completionData.nextSteps}
                          </div>
                        </div>
                      )}

                      {/* Follow-up Info */}
                      {task.completionData.followUpRequired && (
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                            <Clock className="h-4 w-4" />
                            <strong className="text-sm">Follow-up Required</strong>
                          </div>
                          <div className="mt-2 text-sm">
                            <div><strong>Date:</strong> {task.completionData.followUpDate ? new Date(task.completionData.followUpDate).toLocaleDateString() : "TBD"}</div>
                            <div><strong>Type:</strong> {task.completionData.followUpType?.replace(/_/g, " ") || "General Follow Up"}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}