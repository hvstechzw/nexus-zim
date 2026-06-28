import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CompetitionTier = "zonal" | "district" | "provincial" | "national";

const TIER_STYLE: Record<CompetitionTier, { label: string; className: string }> = {
  zonal:      { label: "ZONAL",      className: "border-muted-foreground/40 text-muted-foreground" },
  district:   { label: "DISTRICT",   className: "border-primary/60 text-primary" },
  provincial: { label: "PROVINCIAL", className: "border-accent/60 text-accent" },
  national:   { label: "NATIONAL",   className: "border-accent bg-accent/15 text-accent" },
};

export function TierBadge({ tier, className }: { tier: CompetitionTier | string; className?: string }) {
  const t = (tier in TIER_STYLE ? tier : "zonal") as CompetitionTier;
  const s = TIER_STYLE[t];
  return (
    <Badge variant="outline" className={cn("font-display tracking-wider text-[10px]", s.className, className)}>
      {s.label}
    </Badge>
  );
}
