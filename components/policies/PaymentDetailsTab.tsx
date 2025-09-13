import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, CreditCard, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { FormState } from '@/lib/policy-form/types';


interface PaymentDetailsTabProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  errors: Record<string, string>;
}

export function PaymentDetailsTab({ form, setForm, errors }: PaymentDetailsTabProps) {
  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-green-100/30">
        <CardHeader className="bg-gradient-to-r from-green-100 to-green-50 border-b border-green-200">
          <CardTitle className="text-green-900 flex items-center gap-2 text-lg font-semibold">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Due Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Next Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-lg",
                      !form.nextDueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.nextDueDate ? format(form.nextDueDate, "dd/MM/yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.nextDueDate || undefined}
                    onSelect={(date) => setForm(f => ({ ...f, nextDueDate: date || null }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Last Paid Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-lg",
                      !form.lastPaidDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.lastPaidDate ? format(form.lastPaidDate, "dd/MM/yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.lastPaidDate || undefined}
                    onSelect={(date) => setForm(f => ({ ...f, lastPaidDate: date || null }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Payment Reference Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-4 w-4 text-green-600" />
              <Label className="text-base font-medium text-green-900">Payment References</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Receipt Number</Label>
                <Input
                  value={form.receiptNumber}
                  onChange={(e) => setForm(f => ({ ...f, receiptNumber: e.target.value }))}
                  placeholder="Enter receipt number"
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Cheque Number</Label>
                <Input
                  value={form.chequeNumber}
                  onChange={(e) => setForm(f => ({ ...f, chequeNumber: e.target.value }))}
                  placeholder="Enter cheque number"
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Bank Name</Label>
              <Input
                value={form.bankName}
                onChange={(e) => setForm(f => ({ ...f, bankName: e.target.value }))}
                placeholder="Enter bank name"
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Payment Summary */}
          {form.installmentPremium && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-3">Payment Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-green-700">Installment Premium:</span>
                    <span className="font-mono font-semibold text-green-900">
                      ₹ {Number.parseFloat(form.installmentPremium).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Payment Mode:</span>
                    <span className="font-medium text-green-900">{form.premiumMode}</span>
                  </div>
                </div>
                {form.nextDueDate && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-700">Next Due:</span>
                      <span className="font-medium text-green-900">
                        {format(form.nextDueDate, "dd MMM yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Days Remaining:</span>
                      <span className="font-medium text-green-900">
                        {Math.ceil((form.nextDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}