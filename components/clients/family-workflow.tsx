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
import { Users, Plus, Check, ArrowRight, ArrowLeft, UserPlus, Home, X } from "lucide-react"

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
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col rounded-3xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Users className="h-6 w-6 text-primary" />
            </div>
            Create Family Group
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span>
                  Step {currentStep} of {steps.length}
                </span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-3 rounded-full" />
              <div className="grid grid-cols-4 gap-2 text-xs">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`text-center p-2 rounded-xl transition-colors ${
                      currentStep >= step.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                    }`}
                  >
                    <div className="font-medium">{step.title}</div>
                    <div className="text-xs opacity-75">{step.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-h-[500px]">
              {currentStep === 1 && (
                <Card className="border-2 rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Home className="h-5 w-5 text-blue-600" />
                      </div>
                      Family Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Family Name *</Label>
                      <Input
                        value={familyGroup.name}
                        onChange={(e) => setFamilyGroup((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Smith Family, Johnson Household"
                        className="h-14 text-base rounded-2xl border-2 focus:border-primary"
                      />
                      <p className="text-sm text-muted-foreground">
                        This will be used to identify the family group in your system
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">Description (Optional)</Label>
                      <Textarea
                        value={familyGroup.description}
                        onChange={(e) => setFamilyGroup((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Any additional notes about this family..."
                        rows={4}
                        className="text-base rounded-2xl border-2 focus:border-primary resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 2 && (
                <Card className="border-2 rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-green-100 rounded-xl">
                        <UserPlus className="h-5 w-5 text-green-600" />
                      </div>
                      Head of Family
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Full Name *</Label>
                        <Input
                          value={currentMember.name}
                          onChange={(e) => setCurrentMember((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter full name"
                          className="h-12 rounded-xl border-2 focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Mobile Number</Label>
                        <Input
                          value={currentMember.mobile}
                          onChange={(e) => setCurrentMember((prev) => ({ ...prev, mobile: e.target.value }))}
                          placeholder="+91 9876543210"
                          className="h-12 rounded-xl border-2 focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Email Address</Label>
                        <Input
                          type="email"
                          value={currentMember.email}
                          onChange={(e) => setCurrentMember((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="email@example.com"
                          className="h-12 rounded-xl border-2 focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Date of Birth</Label>
                        <Input
                          type="date"
                          value={currentMember.dob}
                          onChange={(e) => setCurrentMember((prev) => ({ ...prev, dob: e.target.value }))}
                          className="h-12 rounded-xl border-2 focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Address</Label>
                      <Textarea
                        value={currentMember.address}
                        onChange={(e) => setCurrentMember((prev) => ({ ...prev, address: e.target.value }))}
                        placeholder="Complete address..."
                        rows={3}
                        className="rounded-xl border-2 focus:border-primary resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">PAN Number</Label>
                        <Input
                          value={currentMember.panNo || ""}
                          onChange={(e) =>
                            setCurrentMember((prev) => ({ ...prev, panNo: e.target.value.toUpperCase() }))
                          }
                          placeholder="ABCDE1234F"
                          maxLength={10}
                          className="h-12 rounded-xl border-2 focus:border-primary font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tags</Label>
                        <Input
                          value={memberTags}
                          onChange={(e) => setMemberTags(e.target.value)}
                          placeholder="VIP, High Value, Referral Source"
                          className="h-12 rounded-xl border-2 focus:border-primary"
                        />
                      </div>
                    </div>

                    {canProceedStep2 && (
                      <Button onClick={addMember} className="w-full h-12 rounded-2xl text-base font-medium">
                        <Check className="h-5 w-5 mr-2" />
                        Add as Head of Family
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <Card className="border-2 rounded-2xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="p-2 bg-blue-100 rounded-xl">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
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
                                {member.mobile && (
                                  <span className="text-sm text-muted-foreground">{member.mobile}</span>
                                )}
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

                  <Card className="border-2 rounded-2xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Add Family Member</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Full Name *</Label>
                          <Input
                            value={currentMember.name}
                            onChange={(e) => setCurrentMember((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter full name"
                            className="h-12 rounded-xl border-2 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Relationship *</Label>
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Mobile Number</Label>
                          <Input
                            value={currentMember.mobile}
                            onChange={(e) => setCurrentMember((prev) => ({ ...prev, mobile: e.target.value }))}
                            placeholder="+91 9876543210"
                            className="h-12 rounded-xl border-2 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Email Address</Label>
                          <Input
                            type="email"
                            value={currentMember.email}
                            onChange={(e) => setCurrentMember((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="email@example.com"
                            className="h-12 rounded-xl border-2 focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Date of Birth</Label>
                          <Input
                            type="date"
                            value={currentMember.dob}
                            onChange={(e) => setCurrentMember((prev) => ({ ...prev, dob: e.target.value }))}
                            className="h-12 rounded-xl border-2 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Tags</Label>
                          <Input
                            value={memberTags}
                            onChange={(e) => setMemberTags(e.target.value)}
                            placeholder="Student, Dependent"
                            className="h-12 rounded-xl border-2 focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">PAN Number</Label>
                          <Input
                            value={currentMember.panNo || ""}
                            onChange={(e) =>
                              setCurrentMember((prev) => ({ ...prev, panNo: e.target.value.toUpperCase() }))
                            }
                            placeholder="ABCDE1234F"
                            maxLength={10}
                            className="h-12 rounded-xl border-2 focus:border-primary font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Aadhaar Number</Label>
                          <Input
                            value={currentMember.aadhaarNo || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "").slice(0, 12)
                              setCurrentMember((prev) => ({ ...prev, aadhaarNo: value }))
                            }}
                            placeholder="1234 5678 9012"
                            maxLength={12}
                            className="h-12 rounded-xl border-2 focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Address (Optional)</Label>
                        <Input
                          value={currentMember.address}
                          onChange={(e) => setCurrentMember((prev) => ({ ...prev, address: e.target.value }))}
                          placeholder="Same as family address or different"
                          className="rounded-xl border-2 focus:border-primary"
                        />
                      </div>

                      <Button
                        onClick={addMember}
                        disabled={!currentMember.name.trim()}
                        className="w-full h-12 rounded-2xl text-base font-medium bg-transparent"
                        variant="outline"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Family Member
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {currentStep === 4 && (
                <Card className="border-2 rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-green-100 rounded-xl">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
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

                    <Button
                      onClick={submitFamily}
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-2xl text-base font-medium"
                    >
                      {isSubmitting ? "Creating Family..." : "Create Family Group"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-muted/20">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="rounded-2xl h-12 px-6 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleClose} className="rounded-2xl h-12 px-6">
                <X className="h-4 w-4 mr-2" />
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
                  className="rounded-2xl h-12 px-6"
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
