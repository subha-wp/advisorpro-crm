"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ClientRef = { id: string; name?: string | null } | null;
type PolicyRef = { id: string; policyNumber?: string | null; planName?: string | null } | null;

type LedgerEntry = {
  id: string;
  transactionDate?: string;
  entryType?: "CASH_INFLOW" | "CASH_OUTFLOW";
  amount?: number;
  category?: string;
  description?: string;
  client?: ClientRef;
  policy?: PolicyRef;
};

type Pagination = {
  page?: number;
  pageSize?: number;
  total?: number;
};

interface LedgerEntryListProps {
  entries: LedgerEntry[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onEdit?: (entry: LedgerEntry) => void;
  onDeleteSuccess?: () => void; // reserved for future use
  loading?: boolean;
}

export function LedgerEntryList({ entries = [], pagination, onPageChange, onEdit, loading }: LedgerEntryListProps) {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 20;
  const total = pagination?.total ?? entries.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ledger Entries</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading entries…</div>
        ) : entries.length === 0 ? (
          <div className="text-sm text-muted-foreground">No entries found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Policy</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    {e.transactionDate ? new Date(e.transactionDate).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    {e.entryType ? (
                      <Badge variant={e.entryType === "CASH_INFLOW" ? "default" : "secondary"}>
                        {e.entryType === "CASH_INFLOW" ? "Inflow" : "Outflow"}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {e.amount != null && !isNaN(Number(e.amount))
                      ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(e.amount))
                      : "-"}
                  </TableCell>
                  <TableCell>{e.category ?? "-"}</TableCell>
                  <TableCell>{e.client?.name ?? "-"}</TableCell>
                  <TableCell>{e.policy?.policyNumber ?? e.policy?.planName ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => onEdit?.(e)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Page {page} of {totalPages} • {total} total
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1 || !onPageChange}
              onClick={() => onPageChange?.(Math.max(1, page - 1))}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages || !onPageChange}
              onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}