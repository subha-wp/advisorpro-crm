"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon, Calculator, FileText, User, Building2, CreditCard, Settings, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface EnhancedPolicyFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: any
  policy?: any
  onSuccess?: () => void
}

const insurers = [
  "LIC of India",
  "HDFC Life",
  "ICICI Prudential",
  "SBI Life",
  "Bajaj Allianz",
  "Max Life",
  "Tata AIA",
  "Kotak Life",
  "Aditya Birla Sun Life",
  "Canara HSBC OBC Life",
  "PNB MetLife",
  "Aegon Life",
  "Aviva Life",
  "Bharti AXA Life",
  "Future Generali",
  "IDBI Federal",
  "IndiaFirst Life",
  "Reliance Nippon Life",
  "Sahara Life",
  "Shriram Life",
  "Star Union Dai-ichi Life",
  "Other",
]

const premiumModes = [
  { value: "MONTHLY", label: "Monthly", factor: 12 },
  { value: "QUARTERLY", label: "Quarterly", factor: 4 },
  { value: "HALF_YEARLY", label: "Half Yearly", factor: 2 },
  { value: "YEARLY", label: "Yearly", factor: 1 },
  { value: "SINGLE", label: "Single Premium", factor: 1 },
]

const policyStatuses = [
  { value: "ACTIVE", label: "Active", color: "default" },
  { value: "LAPSED", label: "Lapsed", color: "destructive" },
  { value: "MATURED", label: "Matured", color: "secondary" },
  { value: "SURRENDERED", label: "Surrendered", color: "outline" },
]

export function EnhancedPolicyForm({ open, onOpenChange, client, policy, onSuccess }: EnhancedPolicyFormProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

  // Form state
  const [form, setForm] = useState({
    // Policy Holder Details
    clientId: "",

    // Policy Details
    policyNumber: "",
    insurer: "",
    planName: "",
    policyType: "",
    commencementDate: null as Date | null,
    maturityDate: null as Date | null,
    status: "ACTIVE",

    // Premium Calculation
    sumAssured: "",
    premiumAmount: "",
    annualPremium: "",
    premiumMode: "YEARLY",
    premiumPayingTerm: "",
    policyTerm: "",

    // Payment Details
    nextDueDate: null as Date | null,
    lastPaidDate: null as Date | null,
    installmentPremium: "",

    // Riders
    riders: [] as Array<{
      name: string
      sumAssured: string
      premium: string
    }>,

    // Advanced Options
    nomineeDetails: "",
    agentCode: "",
    branchCode: "",
    servicing: "",

    // Additional Information
    medicalRequired: false,
    proposalNumber: "",
    receiptNumber: "",
    chequeNumber: "",
    bankName: "",
    remarks: "",
  })

  // Auto-calculations
  useEffect(() => {
    if (form.annualPremium && form.premiumMode) {
      const mode = premiumModes.find((m) => m.value === form.premiumMode)
      if (mode) {
        const installment = Number.parseFloat(form.annualPremium) / mode.factor
        setForm((f) => ({ ...f, installmentPremium: installment.toFixed(2) }))
      }
    }
  }, [form.annualPremium, form.premiumMode])

  // Auto-calculate maturity date
  useEffect(() => {
    if (form.commencementDate && form.policyTerm) {
      const years = Number.parseInt(form.policyTerm)
      if (!isNaN(years)) {
        const maturity = new Date(form.commencementDate)
        maturity.setFullYear(maturity.getFullYear() + years)
        setForm((f) => ({ ...f, maturityDate: maturity }))
      }
    }
  }, [form.commencementDate, form.policyTerm])

  // Initialize form
  useEffect(() => {
    if (open) {
      if (policy) {
        // Edit mode
        setForm({
          clientId: policy.clientId,
          policyNumber: policy.policyNumber || "",
          insurer: policy.insurer || "",
          planName: policy.planName || "",
          policyType: "",
          commencementDate: policy.commencementDate ? new Date(policy.commencementDate) : null,
          maturityDate: policy.maturityDate ? new Date(policy.maturityDate) : null,
          status: policy.status || "ACTIVE",
          sumAssured: policy.sumAssured?.toString() || "",
          premiumAmount: policy.premiumAmount?.toString() || "",
          annualPremium: "",
          premiumMode: policy.premiumMode || "YEARLY",
          premiumPayingTerm: "",
          policyTerm: "",
          nextDueDate: policy.nextDueDate ? new Date(policy.nextDueDate) : null,
          lastPaidDate: policy.lastPaidDate ? new Date(policy.lastPaidDate) : null,
          installmentPremium: "",
          riders: [],
          nomineeDetails: "",
          agentCode: "",
          branchCode: "",
          servicing: "",
          medicalRequired: false,
          proposalNumber: "",
          receiptNumber: "",
          chequeNumber: "",
          bankName: "",
          remarks: "",
        })
      } else {
        // Create mode
        setForm({
          clientId: client?.id || "",
          policyNumber: "",
          insurer: "",
          planName: "",
          policyType: "",
          commencementDate: null,
          maturityDate: null,
          status: "ACTIVE",
          sumAssured: "",
          premiumAmount: "",
          annualPremium: "",
          premiumMode: "YEARLY",
          premiumPayingTerm: "",
          policyTerm: "",
          nextDueDate: null,
          lastPaidDate: null,
          installmentPremium: "",
          riders: [],
          nomineeDetails: "",
          agentCode: "",
          branchCode: "",
          servicing: "",
          medicalRequired: false,
          proposalNumber: "",
          receiptNumber: "",
          chequeNumber: "",
          bankName: "",
          remarks: "",
        })
      }
    }
  }, [open, policy, client])

  function addRider() {
    setForm((f) => ({
      ...f,
      riders: [...f.riders, { name: "", sumAssured: "", premium: "" }],
    }))
  }

  function removeRider(index: number) {
    setForm((f) => ({
      ...f,
      riders: f.riders.filter((_, i) => i !== index),
    }))
  }

  function updateRider(index: number, field: string, value: string) {
    setForm((f) => ({
      ...f,
      riders: f.riders.map((rider, i) => (i === index ? { ...rider, [field]: value } : rider)),
    }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        clientId: form.clientId,
        policyNumber: form.policyNumber.trim(),
        insurer: form.insurer,
        planName: form.planName.trim() || undefined,
        sumAssured: form.sumAssured ? Number.parseFloat(form.sumAssured) : undefined,
        premiumAmount: form.installmentPremium ? Number.parseFloat(form.installmentPremium) : undefined,
        premiumMode: form.premiumMode,
        nextDueDate: form.nextDueDate?.toISOString(),
        lastPaidDate: form.lastPaidDate?.toISOString(),
        maturityDate: form.maturityDate?.toISOString(),
        status: form.status,
        // Additional fields can be stored in a JSON field or separate table
        metadata: {
          policyType: form.policyType,
          premiumPayingTerm: form.premiumPayingTerm,
          policyTerm: form.policyTerm,
          annualPremium: form.annualPremium,
          riders: form.riders,
          nomineeDetails: form.nomineeDetails,
          agentCode: form.agentCode,
          branchCode: form.branchCode,
          servicing: form.servicing,
          medicalRequired: form.medicalRequired,
          proposalNumber: form.proposalNumber,
          receiptNumber: form.receiptNumber,
          chequeNumber: form.chequeNumber,
          bankName: form.bankName,
          remarks: form.remarks,
        },
      }

      const url = policy ? `/api/policies/${policy.id}` : "/api/policies"
      const method = policy ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast({
          title: policy ? "Policy updated" : "Policy created",
          description: `Policy ${form.policyNumber} has been ${policy ? "updated" : "created"} successfully`,
        })
        onSuccess?.()
        onOpenChange(false)
      } else {
        const data = await res.json()
        toast({
          title: "Error",
          description: data.error || "Failed to save policy",
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

  const tabs = [
    { id: "basic", label: "Basic Details", icon: FileText },
    { id: "premium", label: "Premium Calculation", icon: Calculator },
    { id: "payment", label: "Payment Details", icon: CreditCard },
    { id: "advanced", label: "Advanced Options", icon: Settings },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-fit max-h-[95vh] p-2 overflow-y-scroll">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-6 w-6 text-primary" />
            {policy ? "Edit Policy" : "LIC Policy Entry"}
            {client && (
              <Badge variant="outline" className="ml-2">
                <User className="h-3 w-3 mr-1" />
                {client.name}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="">
          {/* Tab Navigation */}
          <div className="w-48">
            <nav className="flex py-4">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left",
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={onSubmit} className="p-1 space-y-6">
              {/* Basic Details Tab */}
              {activeTab === "basic" && (
                <div className="space-y-6">
                  <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                    <CardHeader className="bg-orange-100 dark:bg-orange-900/30">
                      <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Policy Holder's Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Policy Holder</Label>
                          <div className="flex items-center gap-2 p-3 bg-background rounded-md border">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{client?.name || "Select Client"}</span>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label>Mobile</Label>
                          <div className="flex items-center gap-2 p-3 bg-background rounded-md border">
                            <span className="text-muted-foreground">{client?.mobile || "Not provided"}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                    <CardHeader className="bg-orange-100 dark:bg-orange-900/30">
                      <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Policy Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label>Policy Number *</Label>
                          <Input
                            value={form.policyNumber}
                            onChange={(e) => setForm((f) => ({ ...f, policyNumber: e.target.value }))}
                            placeholder="Enter policy number"
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Commencement Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "justify-start text-left font-normal",
                                  !form.commencementDate && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {form.commencementDate ? format(form.commencementDate, "dd/MM/yyyy") : "Select date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={form.commencementDate || undefined}
                                onSelect={(date) => setForm((f) => ({ ...f, commencementDate: date || null }))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="grid gap-2">
                          <Label>Maturity Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "justify-start text-left font-normal",
                                  !form.maturityDate && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {form.maturityDate ? format(form.maturityDate, "dd/MM/yyyy") : "Auto-calculated"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={form.maturityDate || undefined}
                                onSelect={(date) => setForm((f) => ({ ...f, maturityDate: date || null }))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label>Insurer *</Label>
                          <Select
                            value={form.insurer}
                            onValueChange={(value) => setForm((f) => ({ ...f, insurer: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select insurer" />
                            </SelectTrigger>
                            <SelectContent>
                              {insurers.map((insurer) => (
                                <SelectItem key={insurer} value={insurer}>
                                  {insurer}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Plan Name</Label>
                          <Input
                            value={form.planName}
                            onChange={(e) => setForm((f) => ({ ...f, planName: e.target.value }))}
                            placeholder="e.g., Jeevan Anand"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Policy Type</Label>
                          <Select
                            value={form.policyType}
                            onValueChange={(value) => setForm((f) => ({ ...f, policyType: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TERM">Term Life</SelectItem>
                              <SelectItem value="WHOLE_LIFE">Whole Life</SelectItem>
                              <SelectItem value="ENDOWMENT">Endowment</SelectItem>
                              <SelectItem value="ULIP">ULIP</SelectItem>
                              <SelectItem value="PENSION">Pension</SelectItem>
                              <SelectItem value="HEALTH">Health</SelectItem>
                              <SelectItem value="MOTOR">Motor</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label>Policy Term (Years)</Label>
                          <Input
                            type="number"
                            value={form.policyTerm}
                            onChange={(e) => setForm((f) => ({ ...f, policyTerm: e.target.value }))}
                            placeholder="20"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Premium Paying Term (Years)</Label>
                          <Input
                            type="number"
                            value={form.premiumPayingTerm}
                            onChange={(e) => setForm((f) => ({ ...f, premiumPayingTerm: e.target.value }))}
                            placeholder="15"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Status</Label>
                          <Select
                            value={form.status}
                            onValueChange={(value) => setForm((f) => ({ ...f, status: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {policyStatuses.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Premium Calculation Tab */}
              {activeTab === "premium" && (
                <div className="space-y-6">
                  <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                    <CardHeader className="bg-blue-100 dark:bg-blue-900/30">
                      <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Policy Premium Calculation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label>Sum Assured *</Label>
                            <Input
                              type="number"
                              value={form.sumAssured}
                              onChange={(e) => setForm((f) => ({ ...f, sumAssured: e.target.value }))}
                              placeholder="1000000"
                              className="text-lg font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                              {form.sumAssured && `₹ ${Number.parseFloat(form.sumAssured).toLocaleString("en-IN")}`}
                            </p>
                          </div>

                          <div className="grid gap-2">
                            <Label>Annual Premium</Label>
                            <Input
                              type="number"
                              value={form.annualPremium}
                              onChange={(e) => setForm((f) => ({ ...f, annualPremium: e.target.value }))}
                              placeholder="50000"
                              className="text-lg font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                              {form.annualPremium &&
                                `₹ ${Number.parseFloat(form.annualPremium).toLocaleString("en-IN")} per year`}
                            </p>
                          </div>

                          <div className="grid gap-2">
                            <Label>Premium Mode</Label>
                            <Select
                              value={form.premiumMode}
                              onValueChange={(value) => setForm((f) => ({ ...f, premiumMode: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {premiumModes.map((mode) => (
                                  <SelectItem key={mode.value} value={mode.value}>
                                    {mode.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                            <h4 className="font-medium text-primary mb-3">Calculated Premium</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Installment Premium:</span>
                                <span className="font-mono font-medium">
                                  ₹{" "}
                                  {form.installmentPremium
                                    ? Number.parseFloat(form.installmentPremium).toLocaleString("en-IN")
                                    : "0"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Frequency:</span>
                                <span className="text-sm">
                                  {premiumModes.find((m) => m.value === form.premiumMode)?.label}
                                </span>
                              </div>
                              {form.annualPremium && form.policyTerm && (
                                <div className="flex justify-between pt-2 border-t">
                                  <span className="text-sm font-medium">Total Premiums:</span>
                                  <span className="font-mono font-medium">
                                    ₹{" "}
                                    {(
                                      Number.parseFloat(form.annualPremium) *
                                      Number.parseInt(form.premiumPayingTerm || form.policyTerm || "1")
                                    ).toLocaleString("en-IN")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Riders Section */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Riders</Label>
                              <Button type="button" size="sm" variant="outline" onClick={addRider}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add Rider
                              </Button>
                            </div>

                            {form.riders.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                                No riders added
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {form.riders.map((rider, index) => (
                                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                                    <Input
                                      placeholder="Rider name"
                                      value={rider.name}
                                      onChange={(e) => updateRider(index, "name", e.target.value)}
                                      className="flex-1"
                                    />
                                    <Input
                                      placeholder="Sum assured"
                                      value={rider.sumAssured}
                                      onChange={(e) => updateRider(index, "sumAssured", e.target.value)}
                                      className="w-32"
                                    />
                                    <Input
                                      placeholder="Premium"
                                      value={rider.premium}
                                      onChange={(e) => updateRider(index, "premium", e.target.value)}
                                      className="w-32"
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => removeRider(index)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Payment Details Tab */}
              {activeTab === "payment" && (
                <div className="space-y-6">
                  <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                    <CardHeader className="bg-green-100 dark:bg-green-900/30">
                      <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment & Due Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label>Next Due Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "justify-start text-left font-normal",
                                    !form.nextDueDate && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {form.nextDueDate ? format(form.nextDueDate, "dd/MM/yyyy") : "Select date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={form.nextDueDate || undefined}
                                  onSelect={(date) => setForm((f) => ({ ...f, nextDueDate: date || null }))}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="grid gap-2">
                            <Label>Last Paid Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "justify-start text-left font-normal",
                                    !form.lastPaidDate && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {form.lastPaidDate ? format(form.lastPaidDate, "dd/MM/yyyy") : "Select date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={form.lastPaidDate || undefined}
                                  onSelect={(date) => setForm((f) => ({ ...f, lastPaidDate: date || null }))}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label>Receipt Number</Label>
                            <Input
                              value={form.receiptNumber}
                              onChange={(e) => setForm((f) => ({ ...f, receiptNumber: e.target.value }))}
                              placeholder="Receipt number"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Cheque Number</Label>
                            <Input
                              value={form.chequeNumber}
                              onChange={(e) => setForm((f) => ({ ...f, chequeNumber: e.target.value }))}
                              placeholder="Cheque number"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Bank Name</Label>
                            <Input
                              value={form.bankName}
                              onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                              placeholder="Bank name"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Advanced Options Tab */}
              {activeTab === "advanced" && (
                <div className="space-y-6">
                  <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
                    <CardHeader className="bg-purple-100 dark:bg-purple-900/30">
                      <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Advanced Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label>Nominee Details</Label>
                            <Textarea
                              value={form.nomineeDetails}
                              onChange={(e) => setForm((f) => ({ ...f, nomineeDetails: e.target.value }))}
                              placeholder="Nominee name, relationship, age..."
                              rows={3}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Agent Code</Label>
                            <Input
                              value={form.agentCode}
                              onChange={(e) => setForm((f) => ({ ...f, agentCode: e.target.value }))}
                              placeholder="Agent code"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Branch Code</Label>
                            <Input
                              value={form.branchCode}
                              onChange={(e) => setForm((f) => ({ ...f, branchCode: e.target.value }))}
                              placeholder="Branch code"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label>Proposal Number</Label>
                            <Input
                              value={form.proposalNumber}
                              onChange={(e) => setForm((f) => ({ ...f, proposalNumber: e.target.value }))}
                              placeholder="Proposal number"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Servicing Details</Label>
                            <Input
                              value={form.servicing}
                              onChange={(e) => setForm((f) => ({ ...f, servicing: e.target.value }))}
                              placeholder="Servicing branch/agent"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="medical"
                              checked={form.medicalRequired}
                              onCheckedChange={(checked) => setForm((f) => ({ ...f, medicalRequired: checked }))}
                            />
                            <Label htmlFor="medical">Medical Required</Label>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label>Remarks</Label>
                        <Textarea
                          value={form.remarks}
                          onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                          placeholder="Additional notes, special conditions, or remarks..."
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {activeTab === "basic" && "1/4 - Basic policy information"}
                    {activeTab === "premium" && "2/4 - Premium calculations"}
                    {activeTab === "payment" && "3/4 - Payment details"}
                    {activeTab === "advanced" && "4/4 - Additional options"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>

                  {activeTab !== "advanced" ? (
                    <Button
                      type="button"
                      onClick={() => {
                        const currentIndex = tabs.findIndex((t) => t.id === activeTab)
                        if (currentIndex < tabs.length - 1) {
                          setActiveTab(tabs[currentIndex + 1].id)
                        }
                      }}
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button type="submit" disabled={submitting} className="bg-primary">
                      {submitting ? "Saving..." : policy ? "Update Policy" : "Create Policy"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
