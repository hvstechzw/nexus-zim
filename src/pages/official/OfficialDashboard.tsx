import { PagePlaceholder } from "@/components/nash/PagePlaceholder";

export default function OfficialDashboard() {
  return (
    <PagePlaceholder
      title="Official Dashboard"
      tier="officials"
      routeHint="src/pages/official/OfficialDashboard.tsx"
      description="Upcoming assignments, assignment history, pending stipend payments and certification status."
    />
  );
}
