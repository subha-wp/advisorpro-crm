import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Settings, User, Building, FileText, Shield } from 'lucide-react';
import { FormState, LICProduct } from '@/lib/policy-form/types';


interface AdvancedOptionsTabProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  isLIC: boolean;
  selectedLICProduct: LICProduct | null;
  errors: Record<string, string>;
}

export function AdvancedOptionsTab({
  form,
  setForm,
  isLIC,
  selectedLICProduct,
  errors
}: AdvancedOptionsTabProps) {
  return (
    <div className="space-y-6">
      {/* Nominee and Agent Details */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-purple-100/30">
        <CardHeader className="bg-gradient-to-r from-purple-100 to-purple-50 border-b border-purple-200">
          <CardTitle className="text-purple-900 flex items-center gap-2 text-lg font-semibold">
            <User className="h-5 w-5" />
            Nominee & Agent Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nominee Details</Label>
            <Textarea
              value={form.nomineeDetails}
              onChange={(e) => setForm(f => ({ ...f, nomineeDetails: e.target.value }))}
              placeholder="Nominee name, relationship, age, and contact details..."
              rows={3}
              className="rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Agent Code</Label>
              <Input
                value={form.agentCode}
                onChange={(e) => setForm(f => ({ ...f, agentCode: e.target.value }))}
                placeholder="Enter agent code"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Branch Code</Label>
              <Input
                value={form.branchCode}
                onChange={(e) => setForm(f => ({ ...f, branchCode: e.target.value }))}
                placeholder="Enter branch code"
                className="rounded-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposal and Processing Details */}
      <Card className="border-slate-200 bg-gradient-to-br from-slate-50/50 to-slate-100/30">
        <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
          <CardTitle className="text-slate-900 flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5" />
            Proposal & Processing
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Proposal Number</Label>
              <Input
                value={form.proposalNumber}
                onChange={(e) => setForm(f => ({ ...f, proposalNumber: e.target.value }))}
                placeholder="Enter proposal number"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Servicing Details</Label>
              <Input
                value={form.servicing}
                onChange={(e) => setForm(f => ({ ...f, servicing: e.target.value }))}
                placeholder="Servicing branch or agent details"
                className="rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border rounded-lg bg-background">
            <Switch
              id="medical"
              checked={form.medicalRequired}
              onCheckedChange={(checked) => setForm(f => ({ ...f, medicalRequired: checked }))}
            />
            <div className="flex-1">
              <Label htmlFor="medical" className="text-sm font-medium cursor-pointer">
                Medical Examination Required
              </Label>
              <p className="text-xs text-muted-foreground">
                Check if medical examination is required for this policy
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LIC Plan Benefits (if applicable) */}
      {isLIC && selectedLICProduct && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-blue-100/30">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50 border-b border-blue-200">
            <CardTitle className="text-blue-900 flex items-center gap-2 text-lg font-semibold">
              <Shield className="h-5 w-5" />
              Plan Benefits Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold text-blue-800">Death Benefit</Label>
                  <p className="text-sm text-slate-700 mt-1 p-2 bg-blue-50 rounded border">
                    {selectedLICProduct.benefits.death_benefit || "As per policy terms"}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-blue-800">Maturity Benefit</Label>
                  <p className="text-sm text-slate-700 mt-1 p-2 bg-blue-50 rounded border">
                    {selectedLICProduct.benefits.maturity_benefit || "As per policy terms"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedLICProduct.benefits.survival_benefit && (
                  <div>
                    <Label className="text-sm font-semibold text-blue-800">Survival Benefit</Label>
                    <p className="text-sm text-slate-700 mt-1 p-2 bg-blue-50 rounded border">
                      {selectedLICProduct.benefits.survival_benefit}
                    </p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-semibold text-blue-800">Bonus Type</Label>
                  <p className="text-sm text-slate-700 mt-1 p-2 bg-blue-50 rounded border">
                    {selectedLICProduct.benefits.bonus_type || "As per policy terms"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-medium text-amber-800">Surrender:</span>
                  <span className="ml-1 text-amber-700">{selectedLICProduct.surrender_loan.surrender}</span>
                </div>
                <div>
                  <span className="font-medium text-amber-800">Loan:</span>
                  <span className="ml-1 text-amber-700">{selectedLICProduct.surrender_loan.loan}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Notes */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-indigo-100/30">
        <CardHeader className="bg-gradient-to-r from-indigo-100 to-indigo-50 border-b border-indigo-200">
          <CardTitle className="text-indigo-900 flex items-center gap-2 text-lg font-semibold">
            <Settings className="h-5 w-5" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Remarks & Special Instructions</Label>
            <Textarea
              value={form.remarks}
              onChange={(e) => setForm(f => ({ ...f, remarks: e.target.value }))}
              placeholder="Add any special instructions, conditions, or notes about this policy..."
              rows={4}
              className="rounded-lg"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}