// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ClientSearchSelect } from './client-search-select';
import { FormState, LICProduct } from '@/lib/policy-form/types';
import { insurers, policyStatuses } from '@/lib/policy-form/constants';



interface BasicDetailsTabProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  selectedClient: any;
  handleClientSelect: (client: any) => void;
  isLIC: boolean;
  selectedLICProduct: LICProduct | null;
  handlePlanChange: (planName: string) => void;
  licPlans: LICProduct[];
  errors: Record<string, string>;
}

export function BasicDetailsTab({
  form,
  setForm,
  selectedClient,
  handleClientSelect,
  isLIC,
  selectedLICProduct,
  handlePlanChange,
  licPlans,
  errors
}: BasicDetailsTabProps) {
  return (
    <div className="space-y-6">
      {/* Client Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Select Client *</Label>
        <ClientSearchSelect
          selectedClientId={form.clientId}
          onClientSelect={handleClientSelect}
        />
        {errors.clientId && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.clientId}
          </p>
        )}
      </div>

      {/* Policy Information Card */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50/50 to-orange-100/30">
        <CardHeader className="bg-gradient-to-r from-orange-100 to-orange-50 border-b border-orange-200">
          <CardTitle className="text-orange-900 flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5" />
            Policy Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Policy Number and Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Policy Number *</Label>
              <Input
                value={form.policyNumber}
                onChange={(e) => setForm((f: any) => ({ ...f, policyNumber: e.target.value }))}
                placeholder="Enter policy number"
                className={cn("rounded-lg", errors.policyNumber && "border-red-500")}
              />
              {errors.policyNumber && (
                <p className="text-xs text-red-600">{errors.policyNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Commencement Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-lg",
                      !form.commencementDate && "text-muted-foreground",
                      errors.commencementDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.commencementDate ? format(form.commencementDate, "dd/MM/yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.commencementDate || undefined}
                    onSelect={(date) => setForm((f: any) => ({ ...f, commencementDate: date || null }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.commencementDate && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  {errors.commencementDate}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Maturity Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-lg",
                      !form.maturityDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.maturityDate ? format(form.maturityDate, "dd/MM/yyyy") : "Auto-calculated"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.maturityDate || undefined}
                    onSelect={(date) => setForm((f: any) => ({ ...f, maturityDate: date || null }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Insurer and Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Insurance Company *</Label>
              <Select
                value={form.insurer}
                onValueChange={(value) => setForm((f: any) => ({ ...f, insurer: value }))}
              >
                <SelectTrigger className={cn("rounded-lg", errors.insurer && "border-red-500")}>
                  <SelectValue placeholder="Select insurance company" />
                </SelectTrigger>
                <SelectContent>
                  {insurers.map((insurer: boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | React.Key | null | undefined) => (
                    <SelectItem key={insurer} value={insurer}>
                      {insurer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.insurer && (
                <p className="text-xs text-red-600">{errors.insurer}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {isLIC ? "LIC Plan *" : "Plan Name"}
              </Label>
              {isLIC ? (
                <Select
                  value={form.planName}
                  onValueChange={handlePlanChange}
                >
                  <SelectTrigger className={cn("rounded-lg", errors.planName && "border-red-500")}>
                    <SelectValue placeholder="Select LIC plan" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {licPlans.map((plan) => (
                      <SelectItem key={plan.plan_name} value={plan.plan_name}>
                        <div className="flex flex-col">
                          <span className="font-medium">{plan.plan_name}</span>
                          <span className="text-xs text-muted-foreground">
                            Plan No: {plan.plan_no || "N/A"} | Category: {plan.category}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.planName}
                  onChange={(e) => setForm((f: any) => ({ ...f, planName: e.target.value }))}
                  placeholder="Enter plan name"
                  className={cn("rounded-lg", errors.planName && "border-red-500")}
                />
              )}
              {errors.planName && (
                <p className="text-xs text-red-600">{errors.planName}</p>
              )}
            </div>
          </div>

          {/* Policy Type and Terms */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Policy Type</Label>
              {isLIC && selectedLICProduct ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">{selectedLICProduct.category}</p>
                  <p className="text-xs text-blue-600">{selectedLICProduct.nature.type}</p>
                </div>
              ) : (
                <Select
                  value={form.policyType}
                  onValueChange={(value) => setForm((f: any) => ({ ...f, policyType: value }))}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select policy type" />
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
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Policy Term (Years)</Label>
              <Input
                type="number"
                value={form.policyTerm}
                onChange={(e) => setForm((f: any) => ({ ...f, policyTerm: e.target.value }))}
                placeholder="20"
                className="rounded-lg"
              />
              {errors.policyTerm && (
                <p className="text-xs text-red-600">{errors.policyTerm}</p>
              )}
              {isLIC && selectedLICProduct && selectedLICProduct.eligibility.term_range_years && (
                <p className="text-xs text-blue-600">
                  Available: {selectedLICProduct.eligibility.term_range_years}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Premium Paying Term (Years)</Label>
              <Input
                type="number"
                value={form.premiumPayingTerm}
                onChange={(e) => setForm((f: any) => ({ ...f, premiumPayingTerm: e.target.value }))}
                placeholder="15"
                className="rounded-lg"
              />
              {isLIC && selectedLICProduct && selectedLICProduct.eligibility.ppt_options && (
                <p className="text-xs text-blue-600">
                  Options: {Array.isArray(selectedLICProduct.eligibility.ppt_options) 
                    ? selectedLICProduct.eligibility.ppt_options.join(", ") 
                    : selectedLICProduct.eligibility.ppt_options}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Policy Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm((f: any) => ({ ...f, status: value }))}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {policyStatuses.map((status: { value: React.Key | null | undefined; label: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          status.value === "ACTIVE" && "bg-green-500",
                          status.value === "LAPSED" && "bg-red-500",
                          status.value === "MATURED" && "bg-blue-500",
                          status.value === "SURRENDERED" && "bg-gray-500"
                        )} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}