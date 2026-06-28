import { PagePlaceholder } from "@/components/nash/PagePlaceholder";

export default function NashOrganisationsPage() {
  return (
    <PagePlaceholder
      title="NASH / NAPH Organisation Tree"
      tier="federation"
      routeHint="src/pages/admin/NashOrganisationsPage.tsx"
      description="National → provincial → district → zonal visual tree with member registry per organisation."
    />
  );
}
