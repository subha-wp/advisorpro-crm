import { PoliciesTable } from "@/components/policies/policies-table";
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
          <p className="text-muted-foreground mt-1">
            Comprehensive policy management with automated calculations and
            professional tracking
          </p>
        </div>
      </header>

      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertDescription>
          <strong>Professional Policy Management:</strong> Track premiums,
          calculate due dates automatically, manage riders, and maintain
          comprehensive policy records with integrated client relationships.
        </AlertDescription>
      </Alert>
      <PoliciesTable />
    </section>
  );
}
