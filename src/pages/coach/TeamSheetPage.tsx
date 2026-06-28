import { PagePlaceholder } from "@/components/nash/PagePlaceholder";

export default function TeamSheetPage() {
  return (
    <PagePlaceholder
      title="Digital Team Sheet"
      tier="school"
      routeHint="src/pages/coach/TeamSheetPage.tsx"
      description="Generates the official PDF team sheet for a fixture with player list, jersey numbers, NASH IDs and eligibility status."
    />
  );
}
