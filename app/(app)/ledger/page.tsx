import { requireRole } from "@/lib/session";
import { ROLES } from "@/lib/auth/roles";
import { LedgerPageClient } from "./ledger-page-client";

export default async function LedgerPage() {
  await requireRole(ROLES.ANY);
  return <LedgerPageClient />;
}