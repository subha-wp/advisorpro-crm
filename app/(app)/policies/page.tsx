
import { PoliciesTableMobile } from "@/components/policies/policies-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, TrendingUp, Users, FileText } from "lucide-react";

export default function PoliciesPage() {
  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-balance flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Insurance Policies
          </h1>

        </div>
      </header>
      <PoliciesTableMobile />
    </section>
  );
}
