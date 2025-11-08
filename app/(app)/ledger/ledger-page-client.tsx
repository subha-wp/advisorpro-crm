// @ts-nocheck
// @ts-nocheck
"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LedgerEntryList } from "./components/ledger-entry-list";
import { LedgerBalanceCard } from "./components/ledger-balance-card";
import { PlusCircle } from "lucide-react";
import { LedgerEntryForm } from "./components/ledger-entry-form";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function LedgerPageClient() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [range, setRange] = useState<"today" | "7d" | "30d">("today");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const query = new URLSearchParams({
    page: page.toString(),
    ...filters,
  }).toString();

  const { data, error, mutate, isLoading } = useSWR(`/api/ledger?${query}`, fetcher);

  // Compute ISO date range for filters
  const computeRange = (r: "today" | "7d" | "30d") => {
    const now = new Date();
    const end = now; // up to current time
    const start = new Date(now);
    if (r === "today") {
      start.setHours(0, 0, 0, 0);
    } else if (r === "7d") {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else {
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    }
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  // Initialize and update filters when range changes
  useEffect(() => {
    const { startDate, endDate } = computeRange(range);
    setFilters({ startDate, endDate });
    setPage(1);
  }, [range]);

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingEntry(null);
    setIsFormOpen(false);
    mutate();
  };
  
  const openNewEntryForm = () => {
    setEditingEntry(null);
    setIsFormOpen(true);
  }

  // Derived totals from items (API returns currentBalance only)
  const items = data?.items ?? [];
  const inflowTotal = Array.isArray(items)
    ? items.reduce((sum: number, e: any) => sum + (e.entryType === "CASH_INFLOW" ? Number(e.amount ?? 0) : 0), 0)
    : 0;
  const outflowTotal = Array.isArray(items)
    ? items.reduce((sum: number, e: any) => sum + (e.entryType === "CASH_OUTFLOW" ? Number(e.amount ?? 0) : 0), 0)
    : 0;

  const pagination = {
    page: data?.page ?? page,
    pageSize: data?.pageSize ?? 20,
    total: data?.total ?? items.length,
  };

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-balance">Ledger Book</h1>
          <p className="text-sm text-muted-foreground">
            Track cash flow and manage office accounts.
          </p>
        </div>
        <Button onClick={openNewEntryForm}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <LedgerBalanceCard title="Current Balance" amount={Number(data?.currentBalance ?? 0)} />
        <LedgerBalanceCard title="Total Inflow" amount={inflowTotal} />
        <LedgerBalanceCard title="Total Outflow" amount={outflowTotal} />
      </div>

      {/* Date range selector */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing: {range === "today" ? "Today" : range === "7d" ? "Last 7 Days" : "Last 30 Days"}
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as any)}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
            <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div>
        <LedgerEntryList
          entries={items}
          pagination={pagination}
          onPageChange={setPage}
          onEdit={handleEdit}
          onDeleteSuccess={mutate}
          loading={isLoading}
        />
      </div>

      <LedgerEntryForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        entry={editingEntry}
      />
    </section>
  );
}