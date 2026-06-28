import { PagePlaceholder } from "@/components/nash/PagePlaceholder";

export default function ResultsPage() {
  return (
    <PagePlaceholder
      title="Latest Results"
      tier="public"
      routeHint="src/pages/ResultsPage.tsx"
      description="Latest match results across every sport and every level, with filters by sport, province and tier."
    />
  );
}
