import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Building2, User, AlertCircle, ChevronRight, ChevronLeft, FileText, Calculator, CreditCard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BasicDetailsTab } from './BasicDetailsTab';
import { PremiumCalculationTab } from './PremiumCalculationTab';
import { PaymentDetailsTab } from './PaymentDetailsTab';
import { AdvancedOptionsTab } from './AdvancedOptionsTab';



import { FormState, LICProduct } from '@/lib/policy-form/types';
import { premiumModes } from '@/lib/policy-form/constants';
import { lic_products } from '@/lib/lic-products';

interface EnhancedPolicyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy?: any;
  onSuccess?: () => void;
}

export function EnhancedPolicyForm({
  open,
  onOpenChange,
  policy,
  onSuccess,
}: EnhancedPolicyFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedLICProduct, setSelectedLICProduct] = useState<LICProduct | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [form, setForm] = useState<FormState>({
    clientId: "",
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
  });

  // Auto-calculate installment premium
  useEffect(() => {
    if (form.annualPremium && form.premiumMode) {
      const mode = premiumModes.find((m) => m.value === form.premiumMode);
      if (mode) {
        const installment = Number.parseFloat(form.annualPremium) / mode.factor;
        setForm((f) => ({ ...f, installmentPremium: installment.toFixed(2) }));
      }
    }
  }, [form.annualPremium, form.premiumMode]);

  // Auto-calculate maturity date
  useEffect(() => {
    if (form.commencementDate && form.policyTerm) {
      const years = Number.parseInt(form.policyTerm);
      if (!isNaN(years)) {
        const maturity = new Date(form.commencementDate);
        maturity.setFullYear(maturity.getFullYear() + years);
        setForm((f) => ({ ...f, maturityDate: maturity }));
      }
    }
  }, [form.commencementDate, form.policyTerm]);

  // Handle insurer change
  useEffect(() => {
    if (form.insurer === "LIC of India") {
      setForm((f) => ({ ...f, planName: "", policyType: "" }));
      setSelectedLICProduct(null);
    } else {
      setForm((f) => ({ ...f, planName: "", policyType: "" }));
      setSelectedLICProduct(null);
    }
  }, [form.insurer]);

  // Handle plan selection for LIC
  const handlePlanChange = (planName: string) => {
    setForm((f) => ({ ...f, planName }));
    if (form.insurer === "LIC of India") {
      const product = lic_products.find((p) => p.plan_name === planName);
      if (product) {
        setSelectedLICProduct(product);
        
        // Auto-populate fields based on LIC product data
        const updates: Partial<FormState> = {
          planName,
          policyType: product.category,
        };

        // Set policy term
        if (typeof product.eligibility.term_range_years === "string") {
          const termMatch = product.eligibility.term_range_years.match(/(\d+)/);
          if (termMatch) {
            updates.policyTerm = termMatch[1];
          }
        } else if (typeof product.eligibility.term_range_years === "number") {
          updates.policyTerm = product.eligibility.term_range_years.toString();
        }

        // Set premium paying term
        if (Array.isArray(product.eligibility.ppt_options)) {
          updates.premiumPayingTerm = product.eligibility.ppt_options[0]?.toString() || "";
        } else if (product.eligibility.ppt_options) {
          updates.premiumPayingTerm = product.eligibility.ppt_options.toString();
        }

        // Set appropriate premium mode based on available modes
        const availableMode = premiumModes.find(mode => {
          return product.premium.modes.some(licMode => {
            const normalizedLicMode = licMode.toLowerCase().replace(/[^a-z]/g, '');
            const normalizedModeLabel = mode.label.toLowerCase().replace(/[^a-z]/g, '');
            return normalizedLicMode.includes(normalizedModeLabel) || 
                   normalizedModeLabel.includes(normalizedLicMode);
          });
        });
        
        if (availableMode) {
          updates.premiumMode = availableMode.value;
        }

        setForm(f => ({ ...f, ...updates }));

        // Validate sum assured
        if (form.sumAssured && product.eligibility.min_sum_assured) {
          const sa = Number.parseFloat(form.sumAssured);
          if (sa < (product.eligibility.min_sum_assured || 0)) {
            toast({
              title: "Sum Assured Updated",
              description: `Minimum Sum Assured for ${planName} is ₹${product.eligibility.min_sum_assured?.toLocaleString("en-IN")}`,
            });
            setForm(f => ({ 
              ...f, 
              ...updates,
              sumAssured: product.eligibility.min_sum_assured?.toString() || form.sumAssured 
            }));
          } else {
            setForm(f => ({ ...f, ...updates }));
          }
        } else {
          setForm(f => ({ ...f, ...updates }));
        }
      }
    }
  };

  // Auto-calculate premium for LIC products
  useEffect(() => {
    if (selectedLICProduct && form.sumAssured) {
      const sa = Number.parseFloat(form.sumAssured);
      if (!isNaN(sa) && sa > 0) {
        // Simplified premium calculation
        let baseRate = 0.03; // 3% default
        if (selectedLICProduct.category === "Term") baseRate = 0.015;
        if (selectedLICProduct.category === "Whole Life") baseRate = 0.045;
        if (selectedLICProduct.nature.linked) baseRate = 0.025;

        const term = Number.parseInt(form.policyTerm) || 20;
        const ageAdjustment = 1 + (term / 100);
        
        const calculatedAnnual = sa * baseRate * ageAdjustment;
        setForm((f) => ({ ...f, annualPremium: Math.round(calculatedAnnual).toString() }));
      }
    }
  }, [form.sumAssured, selectedLICProduct, form.policyTerm]);

  // Get allowed riders for selected LIC product
  const getAllowedRiders = () => {
    return selectedLICProduct ? selectedLICProduct.riders_allowed : [];
  };

  const addRider = () => {
    const allowedRiders = getAllowedRiders();
    const defaultRider = allowedRiders.length > 0 ? allowedRiders[0] : "";
    setForm((f) => ({
      ...f,
      riders: [...f.riders, { name: defaultRider, sumAssured: "", premium: "" }],
    }));
  };

  const removeRider = (index: number) => {
    setForm((f) => ({
      ...f,
      riders: f.riders.filter((_, i) => i !== index),
    }));
  };

  const updateRider = (index: number, field: string, value: string) => {
    setForm((f) => ({
      ...f,
      riders: f.riders.map((rider, i) =>
        i === index ? { ...rider, [field]: value } : rider
      ),
    }));
  };

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    setForm((f) => ({ ...f, clientId: client.id }));
    setErrors(prev => ({ ...prev, clientId: "" }));
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.clientId) newErrors.clientId = "Please select a client";
    if (!form.policyNumber.trim()) newErrors.policyNumber = "Policy number is required";
    if (!form.insurer) newErrors.insurer = "Please select an insurance company";
    if (!form.planName.trim()) newErrors.planName = "Plan name is required";
    if (!form.sumAssured) newErrors.sumAssured = "Sum assured is required";

    // LIC specific validations
    if (selectedLICProduct && form.sumAssured) {
      const sa = Number.parseFloat(form.sumAssured);
      if (selectedLICProduct.eligibility.min_sum_assured && sa < selectedLICProduct.eligibility.min_sum_assured) {
        newErrors.sumAssured = `Minimum sum assured is ₹${selectedLICProduct.eligibility.min_sum_assured.toLocaleString("en-IN")}`;
      }
      if (selectedLICProduct.eligibility.max_sum_assured && sa > selectedLICProduct.eligibility.max_sum_assured) {
        newErrors.sumAssured = `Maximum sum assured is ₹${selectedLICProduct.eligibility.max_sum_assured.toLocaleString("en-IN")}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Initialize form for edit mode
  useEffect(() => {
    if (open && policy) {
      const initialForm: FormState = {
        clientId: policy.clientId || "",
        policyNumber: policy.policyNumber || "",
        insurer: policy.insurer || "",
        planName: policy.planName || "",
        policyType: policy.metadata?.policyType || "",
        commencementDate: policy.commencementDate ? new Date(policy.commencementDate) : null,
        maturityDate: policy.maturityDate ? new Date(policy.maturityDate) : null,
        status: policy.status || "ACTIVE",
        sumAssured: policy.sumAssured?.toString() || "",
        premiumAmount: policy.premiumAmount?.toString() || "",
        annualPremium: policy.metadata?.annualPremium || "",
        premiumMode: policy.premiumMode || "YEARLY",
        premiumPayingTerm: policy.metadata?.premiumPayingTerm || "",
        policyTerm: policy.metadata?.policyTerm || "",
        nextDueDate: policy.nextDueDate ? new Date(policy.nextDueDate) : null,
        lastPaidDate: policy.lastPaidDate ? new Date(policy.lastPaidDate) : null,
        installmentPremium: "",
        riders: policy.metadata?.riders || [],
        nomineeDetails: policy.metadata?.nomineeDetails || "",
        agentCode: policy.metadata?.agentCode || "",
        branchCode: policy.metadata?.branchCode || "",
        servicing: policy.metadata?.servicing || "",
        medicalRequired: policy.metadata?.medicalRequired || false,
        proposalNumber: policy.metadata?.proposalNumber || "",
        receiptNumber: policy.metadata?.receiptNumber || "",
        chequeNumber: policy.metadata?.chequeNumber || "",
        bankName: policy.metadata?.bankName || "",
        remarks: policy.metadata?.remarks || "",
      };
      setForm(initialForm);

      if (policy.insurer === "LIC of India" && policy.planName) {
        const product = lic_products.find((p) => p.plan_name === policy.planName);
        if (product) setSelectedLICProduct(product);
      }
    } else if (open && !policy) {
      // Reset for new policy
      setForm({
        clientId: "",
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
      });
      setSelectedClient(null);
      setSelectedLICProduct(null);
      setErrors({});
    }
  }, [open, policy]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

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
        commencementDate: form.commencementDate?.toISOString(),
        maturityDate: form.maturityDate?.toISOString(),
        status: form.status,
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
          licProduct: selectedLICProduct ? {
            planNo: selectedLICProduct.plan_no,
            uin: selectedLICProduct.uin,
            category: selectedLICProduct.category,
          } : undefined,
        },
      };

      const url = policy ? `/api/policies/${policy.id}` : "/api/policies";
      const method = policy ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({
          title: policy ? "Policy Updated" : "Policy Created",
          description: `Policy ${form.policyNumber} has been ${policy ? "updated" : "created"} successfully`,
        });
        onSuccess?.();
        onOpenChange(false);
      } else {
        const data = await res.json();
        toast({
          title: "Error",
          description: data.error || "Failed to save policy",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Basic Details", icon: FileText },
    { id: "premium", label: "Premium", icon: Calculator },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "advanced", label: "Advanced", icon: Settings },
  ];

  const isLIC = form.insurer === "LIC of India";
  const licPlans = lic_products.filter((p:any) => p.status === "Active");

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
        return (
          <BasicDetailsTab
            form={form}
            setForm={setForm}
            selectedClient={selectedClient}
            handleClientSelect={handleClientSelect}
            isLIC={isLIC}
            selectedLICProduct={selectedLICProduct}
            handlePlanChange={handlePlanChange}
            licPlans={licPlans}
            errors={errors}
          />
        );
      case "premium":
        return (
          <PremiumCalculationTab
            form={form}
            setForm={setForm}
            isLIC={isLIC}
            selectedLICProduct={selectedLICProduct}
            getAllowedRiders={getAllowedRiders}
            addRider={addRider}
            removeRider={removeRider}
            updateRider={updateRider}
            errors={errors}
          />
        );
      case "payment":
        return <PaymentDetailsTab form={form} setForm={setForm} errors={errors} />;
      case "advanced":
        return (
          <AdvancedOptionsTab
            form={form}
            setForm={setForm}
            isLIC={isLIC}
            selectedLICProduct={selectedLICProduct}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  const canProceedToNext = () => {
    switch (activeTab) {
      case "basic":
        return form.clientId && form.policyNumber && form.insurer;
      case "premium":
        return form.sumAssured;
      case "payment":
        return true;
      case "advanced":
        return true;
      default:
        return false;
    }
  };

  const nextTab = () => {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const prevTab = () => {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] p-0 overflow-y-scroll max-w-[90vw] ">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Building2 className="h-6 w-6 text-primary" />
              {policy ? "Edit Policy" : "Create New Policy"}
              
              <div className="flex gap-2 ml-4">
                {selectedClient && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <User className="h-3 w-3 mr-1" />
                    {selectedClient.name}
                  </Badge>
                )}
                {isLIC && selectedLICProduct && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {selectedLICProduct.category} Plan
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Navigation Tabs */}
          <div className="px-6 py-3 border-b bg-muted/30">
            <nav className="flex gap-1">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isCompleted = tabs.findIndex(t => t.id === activeTab) > index;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : isCompleted
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {isCompleted && <span className="text-xs">✓</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={onSubmit} className="space-y-6">
              {renderTabContent()}
            </form>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Step {tabs.findIndex(t => t.id === activeTab) + 1} of {tabs.length}
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>

                {activeTab !== "basic" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevTab}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                )}

                {activeTab !== "advanced" ? (
                  <Button
                    type="button"
                    onClick={nextTab}
                    disabled={!canProceedToNext()}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitting || !canProceedToNext()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {submitting ? "Saving..." : policy ? "Update Policy" : "Create Policy"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}