import { PagePlaceholder } from "@/components/nash/PagePlaceholder";

export default function CoachDashboard() {
  return (
    <PagePlaceholder
      title="Coach Dashboard"
      tier="school"
      routeHint="src/pages/coach/CoachDashboard.tsx"
      description="Squad eligibility status, upcoming fixtures, season results, player stats and registration deadlines for this coach's sport(s)."
    />
  );
}
