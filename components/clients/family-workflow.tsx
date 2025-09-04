"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Users, Plus, Check, ArrowRight, ArrowLeft, UserPlus, Home } from "lucide-react"

type FamilyMember = {
  name: string
  mobile: string
  email: string
  address: string
  dob: string
  relationshipToHead: string
  tags: string[]
  panNo?: string
  aadhaarNo?: string
}

type FamilyGroup = {
  name: string
  description: string
  members: FamilyMember[]
}

const relationshipOptions = ["Head", "Spouse", "Son", "Daughter", "Father", "Mother", "Brother", "Sister", "Other"]

const steps = [
  { id: 1, title: "Family Details", description: "Basic family information" },
  { id: 2, title: "Head of Family", description: "Primary family member" },
  { id: 3, title: "Family Members", description: "Add additional members" },
  { id: 4, title: "Review & Create", description: "Confirm and save" },
]

interface FamilyWorkflowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

export function FamilyWorkflow({ open, onOpenChange, onComplete }: FamilyWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [familyGroup, setFamilyGroup] = useState<FamilyGroup>({
    name: "",
    description: "",
    members: [],
  })

  const [currentMember, setCurrentMember] = useState<FamilyMember>({
    name: "",
    mobile: "",
    email: "",
    address: "",
    dob: "",
    panNo: "",
    aadhaarNo: "",
    relationshipToHead: "Head",
    tags: [],
  })

  const [memberTags, setMemberTags] = useState("")

  const progress = (currentStep / steps.length) * 100

  function resetWorkflow() {
    setCurrentStep(1)
    setFamilyGroup({ name: "", description: "", members: [] })
    setCurrentMember({
      name: "",
      mobile: "",
      email: "",
      address: "",
      dob: "",
      panNo: "",
      aadhaarNo: "",
      relationshipToHead: "Head",
      tags: [],
    })
    setMemberTags("")
    setIsSubmitting(false)
  }

  function handleClose() {
    resetWorkflow()
    onOpenChange(false)
  }

  function nextStep() {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  function addMember() {
    const member = {
      ...currentMember,
      tags: memberTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    }

    setFamilyGroup((prev) => ({
      ...prev,
      members: [...prev.members, member],
    }))

    // Reset form for next member
    setCurrentMember({
      name: "",
      mobile: "",
      email: "",
      address: "",
      dob: "",
      panNo: "",
      aadhaarNo: "",
      relationshipToHead: familyGroup.members.length === 0 ? "Spouse" : "Son", // Smart default
      tags: [],
    })
    setMemberTags("")
  }

  function removeMember(index: number) {
    setFamilyGroup((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
    }))
  }

  async function submitFamily() {
    setIsSubmitting(true)
    try {
      // Create the family group first
      const groupRes = await fetch("/api/client-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: familyGroup.name,
          description: familyGroup.description,
        }),
      })

      if (!groupRes.ok) throw new Error("Failed to create family group")

      const { item: group } = await groupRes.json()

      // Create each family member
      for (const member of familyGroup.members) {
        const clientRes = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: member.name,
            mobile: member.mobile || undefined,
            email: member.email || undefined,
            address: member.address || undefined,
            dob: member.dob || undefined,
            panNo: member.panNo || undefined,
            aadhaarNo: member.aadhaarNo || undefined,
            tags: member.tags,
            clientGroupId: group.id,
            relationshipToHead: member.relationshipToHead,
          }),
        })

        if (!clientRes.ok) {
          console.error("Failed to create client:", member.name)
        }
      }

      // Success!
      onComplete?.()
      handleClose()
    } catch (error) {
      console.error("Error creating family:", error)
      // You could show a toast notification here
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceedStep1 = familyGroup.name.trim().length > 0
  const canProceedStep2 = currentMember.name.trim().length > 0 && currentMember.relationshipToHead === "Head"
  const canProceedStep3 = familyGroup.members.length > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Family Group
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Step {currentStep} of {steps.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {steps.map((step) => (
                <span key={step.id} className={currentStep >= step.id ? "text-primary" : ""}>
                  {step.title}
                </span>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Family Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Family Name *</Label>
                    <Input
                      value={familyGroup.name}
                      onChange={(e) => setFamilyGroup((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Smith Family, Johnson Household"
                      className="text-lg"
                    />
                    <p className="text-sm text-muted-foreground">
                      This will be used to identify the family group in your system
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      value={familyGroup.description}
                      onChange={(e) => setFamilyGroup((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Any additional notes about this family..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Head of Family
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Full Name *</Label>
                      <Input
                        value={currentMember.name}
                        onChange={(e) => setCurrentMember((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Mobile Number</Label>
                      <Input
                        value={currentMember.mobile}
                        onChange={(e) => setCurrentMember((prev) => ({ ...prev, mobile: e.target.value }))}
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        value={currentMember.email}
                        onChange={(e) => setCurrentMember((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={currentMember.dob}
                        onChange={(e) => setCurrentMember((prev) => ({ ...prev, dob: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Address</Label>
                      <Textarea
                        value={currentMember.address}
                        onChange={(e) => setCurrentMember((prev) => ({ ...prev, address: e.target.value }))}
                        placeholder="Complete address..."
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Tags (comma separated)</Label>
                      <Input
                        value={memberTags}
                        onChange={(e) => setMemberTags(e.target.value)}
                        placeholder="VIP, High Value, Referral Source"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>PAN Number</Label>
                      <Input
                        value={currentMember.panNo || ""}
                        onChange={(e) => setCurrentMember((prev) => ({ ...prev, panNo: e.target.value.toUpperCase() }))}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                      />
                      <p className="text-xs text-muted-foreground">Format: ABCDE1234F</p>
                    </div>
                    <div className="grid gap-2">
                      <Label>Aadhaar Number</Label>
                      <Input
                        value={currentMember.aadhaarNo || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 12)
                          setCurrentMember((prev) => ({ ...prev, aadhaarNo: value }))
                        }}
                        placeholder="1234 5678 9012"
                        maxLength={12}
                      />
                      <p className="text-xs text-muted-foreground">12-digit number</p>
                    </div>
                  </div>

                  {canProceedStep2 && (
                    <Button onClick={addMember} className="w-full">
                      <Check className="h-4 w-4 mr-2" />
                      Add as Head of Family
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Family Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {familyGroup.members.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No family members added yet. Add the head of family first.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {familyGroup.members.map((member, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{member.name}</span>
                              <Badge variant={member.relationshipToHead === "Head" ? "default" : "secondary"}>
                                {member.relationshipToHead}
                              </Badge>
                              {member.mobile && <span className="text-sm text-muted-foreground">{member.mobile}</span>}
                            </div>
                            <Button size="sm" variant="outline" onClick={() => removeMember(index)}>
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Add Family Member</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Full Name *</Label>
                        <Input
                          value={currentMember.name}
                          onChange={(e) => setCurrentMember((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter full name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Relationship *</Label>
                        <Select
                          value={currentMember.relationshipToHead}
                          onValueChange={(value) =>
                            setCurrentMember((prev) => ({ ...prev, relationshipToHead: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {relationshipOptions
                              .filter((rel) => rel !== "Head") // Can't add another head
                              .map((rel) => (
                                <SelectItem key={rel} value={rel}>
                                  {rel}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Mobile Number</Label>
                        <Input
                          value={currentMember.mobile}
                          onChange={(e) => setCurrentMember((prev) => ({ ...prev, mobile: e.target.value }))}
                          placeholder="+91 9876543210"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Email Address</Label>
                        <Input
                          type="email"
                          value={currentMember.email}
                          onChange={(e) => setCurrentMember((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Date of Birth</Label>
                        <Input
                          type="date"
                          value={currentMember.dob}
                          onChange={(e) => setCurrentMember((prev) => ({ ...prev, dob: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Tags</Label>
                        <Input
                          value={memberTags}
                          onChange={(e) => setMemberTags(e.target.value)}
                          placeholder="Student, Dependent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>PAN Number</Label>
                        <Input
                          value={currentMember.panNo || ""}
                          onChange={(e) =>
                            setCurrentMember((prev) => ({ ...prev, panNo: e.target.value.toUpperCase() }))
                          }
                          placeholder="ABCDE1234F"
                          maxLength={10}
                          pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                        />
                        <p className="text-xs text-muted-foreground">Optional - Format: ABCDE1234F</p>
                      </div>
                      <div className="grid gap-2">
                        <Label>Aadhaar Number</Label>
                        <Input
                          value={currentMember.aadhaarNo || ""}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 12)
                            setCurrentMember((prev) => ({ ...prev, aadhaarNo: value }))
                          }}
                          placeholder="1234 5678 9012"
                          maxLength={12}
                        />
                        <p className="text-xs text-muted-foreground">Optional - 12-digit number</p>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Address (Optional)</Label>
                      <Input
                        value={currentMember.address}
                        onChange={(e) => setCurrentMember((prev) => ({ ...prev, address: e.target.value }))}
                        placeholder="Same as family address or different"
                      />
                    </div>

                    <Button
                      onClick={addMember}
                      disabled={!currentMember.name.trim()}
                      className="w-full bg-transparent"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Family Member
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Review & Create
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Family Group</h4>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="font-medium">{familyGroup.name}</div>
                      {familyGroup.description && (
                        <div className="text-sm text-muted-foreground mt-1">{familyGroup.description}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Family Members ({familyGroup.members.length})</h4>
                    <div className="space-y-2">
                      {familyGroup.members.map((member, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{member.name}</span>
                              <Badge variant={member.relationshipToHead === "Head" ? "default" : "secondary"}>
                                {member.relationshipToHead}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {[member.mobile, member.email].filter(Boolean).join(" • ")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={submitFamily} disabled={isSubmitting} className="w-full" size="lg">
                    {isSubmitting ? "Creating Family..." : "Create Family Group"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {currentStep < steps.length && (
                <Button
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !canProceedStep1) ||
                    (currentStep === 2 && !canProceedStep2) ||
                    (currentStep === 3 && !canProceedStep3)
                  }
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
