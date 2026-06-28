import { PagePlaceholder } from "@/components/nash/PagePlaceholder";

export default function AthleteDashboard() {
  return (
    <PagePlaceholder
      title="Athlete Profile"
      tier="athlete"
      routeHint="src/pages/athlete/AthleteDashboard.tsx"
      description="Career stats by sport, this season's competition history, achievements, eligibility status and Scholastic Card QR."
    />
  );
}
