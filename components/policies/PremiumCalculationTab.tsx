import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calculator, Plus, X, AlertCircle, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormState, LICProduct } from '@/lib/policy-form/types';


interface PremiumCalculationTabProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  isLIC: boolean;
  selectedLICProduct: LICProduct | null;
  getAllowedRiders: () => string[];
  addRider: () => void;
  removeRider: (index: number) => void;
  updateRider: (index: number, field: string, value: string) => void;
  errors: Record<string, string>;
}

// Premium mode mapping for LIC data
const premiumModeMap = {
  'Yearly': 'YEARLY',
  'Half-Yearly': 'HALF_YEARLY', 
  'Quarterly': 'QUARTERLY',
  'Monthly (NACH/Salary)': 'MONTHLY',
  'Monthly': 'MONTHLY',
  'Single': 'SINGLE',
  'Regular': 'YEARLY'
};

const premiumModes = [
  { value: "MONTHLY", label: "Monthly", factor: 12, licLabel: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly", factor: 4, licLabel: "Quarterly" },
  { value: "HALF_YEARLY", label: "Half Yearly", factor: 2, licLabel: "Half-Yearly" },
  { value: "YEARLY", label: "Yearly", factor: 1, licLabel: "Yearly" },
  { value: "SINGLE", label: "Single Premium", factor: 1, licLabel: "Single" },
];

export function PremiumCalculationTab({
  form,
  setForm,
  isLIC,
  selectedLICProduct,
  getAllowedRiders,
  addRider,
  removeRider,
  updateRider,
  errors
}: PremiumCalculationTabProps) {
  // Get available premium modes for LIC
  const getAvailablePremiumModes = () => {
    if (isLIC && selectedLICProduct) {
      return premiumModes.filter(mode => {
        return selectedLICProduct.premium.modes.some(licMode => {
          const normalizedLicMode = licMode.toLowerCase().replace(/[^a-z]/g, '');
          const normalizedModeLabel = mode.licLabel.toLowerCase().replace(/[^a-z]/g, '');
          return normalizedLicMode.includes(normalizedModeLabel) || 
                 normalizedModeLabel.includes(normalizedLicMode) ||
                 licMode === mode.licLabel;
        });
      });
    }
    return premiumModes;
  };

  const availableModes = getAvailablePremiumModes();

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-blue-100/30">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50 border-b border-blue-200">
          <CardTitle className="text-blue-900 flex items-center gap-2 text-lg font-semibold">
            <Calculator className="h-5 w-5" />
            Premium Calculation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Sum Assured */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Sum Assured *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={form.sumAssured}
                onChange={(e) => setForm(f => ({ ...f, sumAssured: e.target.value }))}
                placeholder="1000000"
                className={cn("pl-10 text-lg font-mono rounded-lg", errors.sumAssured && "border-red-500")}
              />
            </div>
            {form.sumAssured && (
              <p className="text-sm text-muted-foreground">
                ₹ {Number.parseFloat(form.sumAssured).toLocaleString("en-IN")}
              </p>
            )}
            {isLIC && selectedLICProduct && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedLICProduct.eligibility.min_sum_assured && (
                    <div>
                      <span className="text-blue-600 font-medium">Minimum:</span>
                      <p className="text-blue-900">₹{selectedLICProduct.eligibility.min_sum_assured.toLocaleString("en-IN")}</p>
                    </div>
                  )}
                  {selectedLICProduct.eligibility.max_sum_assured && (
                    <div>
                      <span className="text-blue-600 font-medium">Maximum:</span>
                      <p className="text-blue-900">₹{selectedLICProduct.eligibility.max_sum_assured.toLocaleString("en-IN")}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {errors.sumAssured && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.sumAssured}
              </p>
            )}
          </div>

          {/* Premium Mode */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Premium Payment Mode</Label>
            <Select
              value={form.premiumMode}
              onValueChange={(value) => setForm(f => ({ ...f, premiumMode: value }))}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                {availableModes.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    <div className="flex flex-col">
                      <span>{mode.label}</span>
                      {isLIC && selectedLICProduct && (
                        <span className="text-xs text-muted-foreground">
                          Available in selected LIC plan
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLIC && selectedLICProduct && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium mb-1">Available Payment Modes:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedLICProduct.premium.modes.map((mode, index) => (
                    <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {mode}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Annual Premium */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Annual Premium {isLIC && selectedLICProduct ? "(Estimated)" : ""}
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={form.annualPremium}
                onChange={(e) => setForm(f => ({ ...f, annualPremium: e.target.value }))}
                placeholder="50000"
                className="pl-10 text-lg font-mono rounded-lg"
                readOnly={isLIC && !!selectedLICProduct}
              />
            </div>
            {form.annualPremium && (
              <p className="text-sm text-muted-foreground">
                ₹ {Number.parseFloat(form.annualPremium).toLocaleString("en-IN")} per year
              </p>
            )}
            {isLIC && selectedLICProduct && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Premium is auto-calculated based on Sum Assured and plan type. 
                  Use official LIC calculator for exact rates.
                </p>
              </div>
            )}
          </div>

          {/* Calculated Premium Summary */}
          {form.annualPremium && form.premiumMode && (
            <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
              <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Premium Summary
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Installment Premium:</span>
                    <span className="font-mono font-semibold">
                      ₹ {form.installmentPremium
                        ? Number.parseFloat(form.installmentPremium).toLocaleString("en-IN")
                        : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Frequency:</span>
                    <span className="font-medium">
                      {availableModes.find((m) => m.value === form.premiumMode)?.label}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {form.policyTerm && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Premiums:</span>
                      <span className="font-mono font-semibold">
                        ₹ {(
                          Number.parseFloat(form.annualPremium) *
                          Number.parseInt(form.premiumPayingTerm || form.policyTerm || "1")
                        ).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  {selectedLICProduct?.premium.gst_applicable && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">GST:</span>
                      <span className="text-amber-600">Applicable</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Riders Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Riders</Label>
                {isLIC && selectedLICProduct && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {getAllowedRiders().length} rider(s)
                  </p>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addRider}
                disabled={isLIC && getAllowedRiders().length === 0}
                className="rounded-lg"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Rider
              </Button>
            </div>

            {isLIC && selectedLICProduct && getAllowedRiders().length > 0 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800 font-medium mb-2">Available Riders:</p>
                <div className="grid gap-1">
                  {getAllowedRiders().map((rider, index) => (
                    <span key={index} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded inline-block mr-1">
                      {rider}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {form.riders.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                <Calculator className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isLIC && selectedLICProduct ? "No allowed riders for this plan" : "No riders added"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {form.riders.map((rider, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-card space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Rider Name</Label>
                        {isLIC && selectedLICProduct ? (
                          <Select
                            value={rider.name}
                            onValueChange={(value) => updateRider(index, "name", value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select rider" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAllowedRiders().map((r) => (
                                <SelectItem key={r} value={r} className="text-sm">
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="Rider name"
                            value={rider.name}
                            onChange={(e) => updateRider(index, "name", e.target.value)}
                            className="text-sm"
                          />
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Sum Assured</Label>
                        <Input
                          type="number"
                          placeholder="100000"
                          value={rider.sumAssured}
                          onChange={(e) => updateRider(index, "sumAssured", e.target.value)}
                          className="text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Premium</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="5000"
                            value={rider.premium}
                            onChange={(e) => updateRider(index, "premium", e.target.value)}
                            className="text-sm font-mono flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeRider(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}