"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FileText, Calendar, IndianRupee } from "lucide-react"
import { format } from "date-fns"

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
    return <div className="text-center py-8 text-muted-foreground">No policies found for this client</div>
  }

  return (
    <div className={className}>
      <Label className="text-base font-medium">Select Policy</Label>
      <RadioGroup value={selectedPolicy} onValueChange={handlePolicyChange} className="mt-3">
        <div className="space-y-3">
          {policies.map((policy) => (
            <div key={policy.id} className="flex items-center space-x-3">
              <RadioGroupItem value={policy.id} id={policy.id} />
              <Card className="flex-1 cursor-pointer" onClick={() => handlePolicyChange(policy.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{policy.policyNumber}</span>
                        <Badge variant={policy.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                          {policy.status}
                        </Badge>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <div>{policy.insurer}</div>
                        {policy.planName && <div>{policy.planName}</div>}
                      </div>

                      <div className="flex items-center space-x-4 text-sm">
                        {policy.nextDueDate && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {format(new Date(policy.nextDueDate), "dd MMM yyyy")}</span>
                          </div>
                        )}
                        {policy.premiumAmount && (
                          <div className="flex items-center space-x-1">
                            <IndianRupee className="h-3 w-3" />
                            <span>₹{policy.premiumAmount.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  )
}
