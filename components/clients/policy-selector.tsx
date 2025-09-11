"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FileText, Calendar, IndianRupee, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Policy {
  id: string
  policyNumber: string
  insurer: string
  planName?: string
  status: string
  nextDueDate?: string
  premiumAmount?: number
}

interface PolicySelectorProps {
  policies: Policy[]
  selectedPolicyId?: string
  onPolicySelect: (policy: Policy) => void
  className?: string
}

export function PolicySelector({ policies, selectedPolicyId, onPolicySelect, className }: PolicySelectorProps) {
  const [selectedPolicy, setSelectedPolicy] = useState<string>(selectedPolicyId || "")

  const handlePolicyChange = (policyId: string) => {
    setSelectedPolicy(policyId)
    const policy = policies.find((p) => p.id === policyId)
    if (policy) {
      onPolicySelect(policy)
    }
  }

  if (policies.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium text-muted-foreground">No policies found</p>
        <p className="text-sm text-muted-foreground mt-1">This client doesn't have any policies yet</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <Label className="text-lg font-semibold mb-4 block">Select Policy</Label>
      <RadioGroup value={selectedPolicy} onValueChange={handlePolicyChange} className="space-y-4">
        {policies.map((policy) => (
          <div key={policy.id} className="relative">
            <div className="flex items-start space-x-4">
              <RadioGroupItem value={policy.id} id={policy.id} className="mt-6 h-5 w-5" />
              <Card
                className={cn(
                  "flex-1 cursor-pointer transition-all duration-200 hover:shadow-md border-2 rounded-2xl overflow-hidden",
                  selectedPolicy === policy.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50",
                )}
                onClick={() => handlePolicyChange(policy.id)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="p-2 bg-primary/10 rounded-xl">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{policy.policyNumber}</h3>
                          <p className="text-sm text-muted-foreground">{policy.insurer}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={policy.status === "ACTIVE" ? "default" : "secondary"}
                          className="text-xs font-medium"
                        >
                          {policy.status}
                        </Badge>
                        {selectedPolicy === policy.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </div>
                    </div>

                    {/* Plan Name */}
                    {policy.planName && (
                      <div className="p-3 bg-muted/30 rounded-xl">
                        <p className="font-medium text-sm">{policy.planName}</p>
                      </div>
                    )}

                    {/* Policy Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {policy.nextDueDate && (
                        <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-xl">
                          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Next Due</p>
                            <p className="text-sm font-semibold">
                              {format(new Date(policy.nextDueDate), "dd MMM yyyy")}
                            </p>
                          </div>
                        </div>
                      )}

                      {policy.premiumAmount && (
                        <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-xl">
                          <IndianRupee className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Premium</p>
                            <p className="text-sm font-semibold">₹{policy.premiumAmount.toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}
