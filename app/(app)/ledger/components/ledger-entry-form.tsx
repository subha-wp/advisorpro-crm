"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface LedgerEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  entry: any | null;
}

type EntryType = "CASH_INFLOW" | "CASH_OUTFLOW";
type PaymentMode =
  | "CASH"
  | "CHEQUE"
  | "ONLINE_TRANSFER"
  | "UPI"
  | "DEBIT_CARD"
  | "CREDIT_CARD"
  | "NET_BANKING"
  | "OTHER";

const CATEGORIES = [
  "PREMIUM_COLLECTION",
  "COMMISSION_RECEIVED",
  "OFFICE_EXPENSES",
  "SALARY_PAYMENT",
  "UTILITY_BILLS",
  "OFFICE_RENT",
  "TRAVEL_EXPENSES",
  "MARKETING_EXPENSES",
  "OFFICE_SUPPLIES",
  "BANK_CHARGES",
  "TAX_PAYMENT",
  "OTHER_INCOME",
  "OTHER_EXPENSE",
] as const;

export function LedgerEntryForm({ isOpen, onClose, entry }: LedgerEntryFormProps) {
  const { toast } = useToast();
  const [entryType, setEntryType] = useState<EntryType>("CASH_INFLOW");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("PREMIUM_COLLECTION");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [chequeNumber, setChequeNumber] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [policyId, setPolicyId] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [attachments, setAttachments] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setEntryType((entry.entryType as EntryType) ?? "CASH_INFLOW");
      setCategory((entry.category as (typeof CATEGORIES)[number]) ?? "PREMIUM_COLLECTION");
      setAmount(entry.amount ? String(entry.amount) : "");
      setDescription(entry.description ?? "");
      setTransactionDate(
        entry.transactionDate ? new Date(entry.transactionDate).toISOString().slice(0, 16) : ""
      );
      setPaymentMode((entry.paymentMode as PaymentMode) ?? "CASH");
      setReferenceNumber(entry.referenceNumber ?? "");
      setBankName(entry.bankName ?? "");
      setChequeNumber(entry.chequeNumber ?? "");
      setTransactionId(entry.transactionId ?? "");
      setClientId(entry.clientId ?? "");
      setPolicyId(entry.policyId ?? "");
      setRemarks(entry.remarks ?? "");
      setAttachments(Array.isArray(entry.attachments) ? entry.attachments.join(", ") : "");
    } else {
      setEntryType("CASH_INFLOW");
      setCategory("PREMIUM_COLLECTION");
      setAmount("");
      setDescription("");
      setTransactionDate(new Date().toISOString().slice(0, 16));
      setPaymentMode("CASH");
      setReferenceNumber("");
      setBankName("");
      setChequeNumber("");
      setTransactionId("");
      setClientId("");
      setPolicyId("");
      setRemarks("");
      setAttachments("");
    }
  }, [entry]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        entryType,
        category,
        amount: Number(amount),
        description,
        transactionDate: new Date(transactionDate).toISOString(),
        paymentMode,
        referenceNumber: referenceNumber || undefined,
        bankName: bankName || undefined,
        chequeNumber: chequeNumber || undefined,
        transactionId: transactionId || undefined,
        clientId: clientId || undefined,
        policyId: policyId || undefined,
        remarks: remarks || undefined,
        attachments: attachments
          ? attachments
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      };

      // Basic validation for amount
      if (!payload.amount || isNaN(payload.amount) || payload.amount <= 0) {
        setSaving(false);
        toast({ title: "Amount is required", description: "Enter a valid amount greater than 0." });
        return;
      }

      const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to save" }));
        toast({ title: "Save failed", description: err?.error || "Unable to save entry" });
        setSaving(false);
        return;
      }

      setSaving(false);
      toast({ title: entry ? "Entry updated" : "Entry created", description: "Ledger entry saved successfully" });
      onClose();
    } catch (err) {
      setSaving(false);
      toast({ title: "Unexpected error", description: "Please try again later." });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit Ledger Entry" : "Add Ledger Entry"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={entryType} onValueChange={(v) => setEntryType(v as EntryType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH_INFLOW">Cash Inflow</SelectItem>
                  <SelectItem value="CASH_OUTFLOW">Cash Outflow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as (typeof CATEGORIES)[number])}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Payment Mode</Label>
              <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="ONLINE_TRANSFER">Online Transfer</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="NET_BANKING">Net Banking</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Reference Number</Label>
              <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Bank Name</Label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Cheque Number</Label>
              <Input value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Transaction ID</Label>
              <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Client ID</Label>
              <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="optional" />
            </div>
            <div className="grid gap-2">
              <Label>Policy ID</Label>
              <Input value={policyId} onChange={(e) => setPolicyId(e.target.value)} placeholder="optional" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this transaction"
            />
          </div>

          <div className="grid gap-2">
            <Label>Remarks</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="optional" />
          </div>

          <div className="grid gap-2">
            <Label>Attachments (comma-separated URLs)</Label>
            <Textarea value={attachments} onChange={(e) => setAttachments(e.target.value)} placeholder="https://..." />
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : entry ? "Save Changes" : "Create Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}