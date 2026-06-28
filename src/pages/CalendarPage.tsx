import { PagePlaceholder } from "@/components/nash/PagePlaceholder";

export default function CalendarPage() {
  return (
    <PagePlaceholder
      title="Competition Calendar"
      tier="public"
      routeHint="src/pages/CalendarPage.tsx"
      description="All NASH/NAPH competitions across provinces, sport-coloured and filterable; iCal subscribe."
    />
  );
}
