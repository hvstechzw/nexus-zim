import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Construction } from "lucide-react";
import type { RoleTier } from "@/lib/nashRoles";

interface Props {
  title: string;
  /** What this page will do once fleshed out. */
  description?: string;
  tier?: RoleTier | "public" | "admin";
  /** Route this shell exists at — surfaced for QA / status. */
  routeHint?: string;
}

const TIER_LABEL: Record<string, string> = {
  platform: "Platform", federation: "Federation", provincial: "Provincial",
  district: "District", zonal: "Zonal", school: "School", officials: "Officials",
  athlete: "Athlete / Public", operations: "Operations", legacy: "Legacy",
  public: "Public", admin: "Admin",
};

/**
 * Renders a consistent "scaffolded but not built yet" surface for new NASH
 * routes. Replaced piece-by-piece in subsequent sessions; the shells exist so
 * the route tree, nav, and role-gated redirects are all wired and testable now.
 */
export function PagePlaceholder({ title, description, tier, routeHint }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Nexus Zimbabwe
        </Link>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-2xl font-display tracking-wide">{title}</CardTitle>
              {tier && <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">{TIER_LABEL[tier] || tier}</Badge>}
            </div>
            {routeHint && <p className="text-[11px] font-mono text-muted-foreground">{routeHint}</p>}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded border border-accent/30 bg-accent/5">
              <Construction className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                {description || "This NASH module is scaffolded. Functionality lands in a later overhaul session."}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Powered by NASH · Built by Aetheris Innovative Enterprises</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PagePlaceholder;
