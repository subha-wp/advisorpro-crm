"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ClientSearch } from "@/components/clients/client-search"
import { PolicySelector } from "@/components/clients/policy-selector"
import { IndianRupee, Save, Calculator, Calendar, AlertCircle, X } from "lucide-react"
import { format, addMonths } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { PREMIUM_MODES } from "@/lib/premium-utils"

interface Client {
  id: string
  name: string
  mobile?: string
  panNo?: string
  aadhaarNo?: string
  email?: string
  clientGroup?: {
    id: string
    name: string
  }
  policies: Policy[]
}

interface Policy {
  id: string
  policyNumber: string
  insurer: string
  planName?: string
  status: string
  nextDueDate?: string
  premiumAmount?: number
  premiumMode?: string
}

interface PaymentFormData {
  paymentDate: string
  amountPaid: string
  paymentMode: string
  receiptNumber: string
  chequeNumber: string
  bankName: string
  transactionId: string
  lateFee: string
  discount: string
  remarks: string
}

interface PremiumPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentSuccess: () => void
  preSelectedPolicy?: {
    id: string
    policyNumber: string
    insurer: string
    planName?: string
    status: string
    nextDueDate?: string
    premiumAmount?: number
    premiumMode?: string
    client: {
      id: string
      name: string
      mobile?: string
      panNo?: string
      aadhaarNo?: string
      email?: string
      clientGroup?: {
        id: string
        name: string
      }
    }
  }
}

const paymentModes = [
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "ONLINE", label: "Online Transfer" },
  { value: "UPI", label: "UPI" },
  { value: "NEFT", label: "NEFT" },
  { value: "RTGS", label: "RTGS" },
  { value: "CARD", label: "Debit/Credit Card" },
]

export function PremiumPaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  preSelectedPolicy,
}: PremiumPaymentModalProps) {
  const { toast } = useToast()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dueDatePreview, setDueDatePreview] = useState<{
    current: string
    next: string
    isFullPayment: boolean
  } | null>(null)

  const [formData, setFormData] = useState<PaymentFormData>({
    paymentDate: format(new Date(), "yyyy-MM-dd"),
    amountPaid: "",
    paymentMode: "",
    receiptNumber: "",
    chequeNumber: "",
    bankName: "",
    transactionId: "",
    lateFee: "0",
    discount: "0",
    remarks: "",
  })

  useEffect(() => {
    if (preSelectedPolicy && isOpen) {
      const client: Client = {
        id: preSelectedPolicy.client.id,
        name: preSelectedPolicy.client.name,
        mobile: preSelectedPolicy.client.mobile,
        panNo: preSelectedPolicy.client.panNo,
        aadhaarNo: preSelectedPolicy.client.aadhaarNo,
        email: preSelectedPolicy.client.email,
        clientGroup: preSelectedPolicy.client.clientGroup,
        policies: [
          {
            id: preSelectedPolicy.id,
            policyNumber: preSelectedPolicy.policyNumber,
            insurer: preSelectedPolicy.insurer,
            planName: preSelectedPolicy.planName,
            status: preSelectedPolicy.status,
            nextDueDate: preSelectedPolicy.nextDueDate,
            premiumAmount: preSelectedPolicy.premiumAmount,
            premiumMode: preSelectedPolicy.premiumMode,
          },
        ],
      }

      const policy: Policy = {
        id: preSelectedPolicy.id,
        policyNumber: preSelectedPolicy.policyNumber,
        insurer: preSelectedPolicy.insurer,
        planName: preSelectedPolicy.planName,
        status: preSelectedPolicy.status,
        nextDueDate: preSelectedPolicy.nextDueDate,
        premiumAmount: preSelectedPolicy.premiumAmount,
        premiumMode: preSelectedPolicy.premiumMode,
      }

      setSelectedClient(client)
      setSelectedPolicy(policy)

      if (preSelectedPolicy.premiumAmount) {
        setFormData((prev) => ({
          ...prev,
          amountPaid: preSelectedPolicy.premiumAmount!.toString(),
        }))
      }
    }
  }, [preSelectedPolicy, isOpen])

  const resetForm = () => {
    setSelectedClient(null)
    setSelectedPolicy(null)
    setDueDatePreview(null)
    setFormData({
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      amountPaid: "",
      paymentMode: "",
      receiptNumber: "",
      chequeNumber: "",
      bankName: "",
      transactionId: "",
      lateFee: "0",
      discount: "0",
      remarks: "",
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "amountPaid" || field === "lateFee" || field === "discount") {
      updateDueDatePreview()
    }
  }

  const updateDueDatePreview = () => {
    if (!selectedPolicy || !selectedPolicy.nextDueDate || !selectedPolicy.premiumMode) {
      setDueDatePreview(null)
      return
    }

    const totalPaid = calculateTotalAmount()
    const expectedAmount = selectedPolicy.premiumAmount || 0
    const isFullPayment = totalPaid >= expectedAmount

    const currentDueDate = new Date(selectedPolicy.nextDueDate)
    let nextDueDate = currentDueDate

    if (isFullPayment && selectedPolicy.premiumMode) {
      const premiumConfig = PREMIUM_MODES[selectedPolicy.premiumMode]
      if (premiumConfig) {
        nextDueDate = addMonths(currentDueDate, premiumConfig.months)
      }
    }

    setDueDatePreview({
      current: format(currentDueDate, "dd MMM yyyy"),
      next: format(nextDueDate, "dd MMM yyyy"),
      isFullPayment,
    })
  }

  const calculateTotalAmount = () => {
    const amount = Number.parseFloat(formData.amountPaid) || 0
    const lateFee = Number.parseFloat(formData.lateFee) || 0
    const discount = Number.parseFloat(formData.discount) || 0
    return amount + lateFee - discount
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClient || !selectedPolicy) {
      toast({
        title: "Error",
        description: "Please select a client and policy",
        variant: "destructive",
      })
      return
    }

    if (!formData.paymentMode || !formData.amountPaid) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/premiums/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: selectedClient.id,
          policyId: selectedPolicy.id,
          ...formData,
          amountPaid: Number.parseFloat(formData.amountPaid),
          lateFee: Number.parseFloat(formData.lateFee) || 0,
          discount: Number.parseFloat(formData.discount) || 0,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        toast({
          title: "Success",
          description: result.message || "Premium payment recorded successfully",
        })

        onPaymentSuccess()
        handleClose()
      } else {
        const error = await response.json()
        throw new Error(error.details || "Failed to record payment")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record premium payment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = selectedClient && selectedPolicy && formData.paymentMode && formData.amountPaid

  const showClientSelection = !preSelectedPolicy
  const showPolicySelection = !preSelectedPolicy && selectedClient

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {preSelectedPolicy ? `Payment for Policy ${preSelectedPolicy.policyNumber}` : "Add Premium Payment"}
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            {preSelectedPolicy
              ? `Recording payment for ${preSelectedPolicy.client.name} - ${preSelectedPolicy.policyNumber}`
              : "Search for the client and policy, then enter payment information"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {showClientSelection && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Select Client</CardTitle>
                <CardDescription>Search and select the client for this premium payment</CardDescription>
              </CardHeader>
              <CardContent>
                <ClientSearch onClientSelect={setSelectedClient} selectedClient={selectedClient} />
              </CardContent>
            </Card>
          )}

          {showPolicySelection && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2. Select Policy</CardTitle>
                <CardDescription>Choose the policy for which the premium is being paid</CardDescription>
              </CardHeader>
              <CardContent>
                <PolicySelector
                  policies={selectedClient.policies}
                  selectedPolicyId={selectedPolicy?.id}
                  onPolicySelect={(policy) => {
                    setSelectedPolicy(policy)
                    if (policy.premiumAmount) {
                      setFormData((prev) => ({ ...prev, amountPaid: policy.premiumAmount!.toString() }))
                    }
                  }}
                />
              </CardContent>
            </Card>
          )}

          {selectedPolicy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {preSelectedPolicy ? "Payment Details" : "3. Payment Details"}
                </CardTitle>
                <CardDescription>Enter the premium payment information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Payment Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Client Name:</span>
                      <span className="ml-2 font-medium">{selectedClient?.name}</span>
                    </div>
                    {selectedClient?.mobile && (
                      <div>
                        <span className="text-muted-foreground">Mobile:</span>
                        <span className="ml-2">{selectedClient.mobile}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Policy Number:</span>
                      <span className="ml-2 font-medium">{selectedPolicy.policyNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Insurer:</span>
                      <span className="ml-2">{selectedPolicy.insurer}</span>
                    </div>
                    {selectedPolicy.planName && (
                      <div>
                        <span className="text-muted-foreground">Plan:</span>
                        <span className="ml-2">{selectedPolicy.planName}</span>
                      </div>
                    )}
                    {selectedPolicy.nextDueDate && (
                      <div>
                        <span className="text-muted-foreground">Current Due Date:</span>
                        <span className="ml-2">{format(new Date(selectedPolicy.nextDueDate), "dd MMM yyyy")}</span>
                      </div>
                    )}
                    {selectedPolicy.premiumAmount && (
                      <div>
                        <span className="text-muted-foreground">Premium Amount:</span>
                        <span className="ml-2 font-medium">₹{selectedPolicy.premiumAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {dueDatePreview && (
                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {dueDatePreview.isFullPayment
                            ? "Full Payment - Due Date Will Be Updated"
                            : "Partial Payment - Due Date Unchanged"}
                        </div>
                        <div className="text-sm">
                          Current Due: {dueDatePreview.current} → Next Due: {dueDatePreview.next}
                        </div>
                        {!dueDatePreview.isFullPayment && (
                          <div className="text-sm text-muted-foreground flex items-center space-x-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>Pay full amount to update due date automatically</span>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Payment Date *</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => handleInputChange("paymentDate", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amountPaid">Amount Paid *</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="amountPaid"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amountPaid}
                        onChange={(e) => handleInputChange("amountPaid", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMode">Payment Mode *</Label>
                    <Select
                      value={formData.paymentMode}
                      onValueChange={(value) => handleInputChange("paymentMode", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentModes.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receiptNumber">Receipt Number</Label>
                    <Input
                      id="receiptNumber"
                      placeholder="Receipt number"
                      value={formData.receiptNumber}
                      onChange={(e) => handleInputChange("receiptNumber", e.target.value)}
                    />
                  </div>
                </div>

                {formData.paymentMode === "CHEQUE" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="chequeNumber">Cheque Number</Label>
                      <Input
                        id="chequeNumber"
                        placeholder="Cheque number"
                        value={formData.chequeNumber}
                        onChange={(e) => handleInputChange("chequeNumber", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        placeholder="Bank name"
                        value={formData.bankName}
                        onChange={(e) => handleInputChange("bankName", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {(formData.paymentMode === "ONLINE" ||
                  formData.paymentMode === "UPI" ||
                  formData.paymentMode === "NEFT" ||
                  formData.paymentMode === "RTGS") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="transactionId">Transaction ID</Label>
                      <Input
                        id="transactionId"
                        placeholder="Transaction ID"
                        value={formData.transactionId}
                        onChange={(e) => handleInputChange("transactionId", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        placeholder="Bank name"
                        value={formData.bankName}
                        onChange={(e) => handleInputChange("bankName", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Additional Charges & Adjustments</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="lateFee">Late Fee</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="lateFee"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.lateFee}
                          onChange={(e) => handleInputChange("lateFee", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount">Discount</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="discount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.discount}
                          onChange={(e) => handleInputChange("discount", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Amount:</span>
                      <div className="flex items-center space-x-2">
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-bold">₹{calculateTotalAmount().toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Amount Paid + Late Fee - Discount = ₹{formData.amountPaid || 0} + ₹{formData.lateFee || 0} - ₹
                      {formData.discount || 0}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Additional notes or comments about this payment..."
                    value={formData.remarks}
                    onChange={(e) => handleInputChange("remarks", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {selectedPolicy && (
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isFormValid || isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Recording Payment..." : "Record Payment"}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
