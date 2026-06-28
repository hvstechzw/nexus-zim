import { PagePlaceholder } from "@/components/nash/PagePlaceholder";

export default function FinancesPage() {
  return (
    <PagePlaceholder
      title="Finances"
      tier="federation"
      routeHint="src/pages/admin/FinancesPage.tsx"
      description="Entry fees, budgets, sponsorships and stipend tracking with the 15% Nexus / 85% organiser split."
    />
  );
}
