import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "champion" | "runner_up" | "third_place" | "best_player" | "top_scorer" | "fair_play" | "outstanding_official" | string;

const KIND: Record<string, { label: string; Icon: typeof Trophy; cls: string }> = {
  champion:             { label: "Champion",      Icon: Trophy, cls: "border-accent bg-accent/15 text-accent" },
  runner_up:            { label: "Runner-up",     Icon: Medal,  cls: "border-muted-foreground/50 text-muted-foreground" },
  third_place:          { label: "3rd Place",     Icon: Medal,  cls: "border-orange-500/40 text-orange-500" },
  best_player:          { label: "Best Player",   Icon: Award,  cls: "border-accent/60 text-accent" },
  top_scorer:           { label: "Top Scorer",    Icon: Award,  cls: "border-primary/60 text-primary" },
  fair_play:            { label: "Fair Play",     Icon: Award,  cls: "border-[hsl(var(--nash-success))]/50 text-[hsl(var(--nash-success))]" },
  outstanding_official: { label: "Outstanding Official", Icon: Award, cls: "border-[hsl(var(--nash-info))]/60 text-[hsl(var(--nash-info))]" },
};

export function AwardBadge({ kind, label, className }: { kind: Kind; label?: string; className?: string }) {
  const cfg = KIND[kind] ?? { label: label ?? kind, Icon: Award, cls: "border-muted-foreground/40 text-muted-foreground" };
  const I = cfg.Icon;
  return (
    <Badge variant="outline" className={cn("gap-1 text-[10px] font-display tracking-wider", cfg.cls, className)}>
      <I className="h-3 w-3" />
      {label ?? cfg.label}
    </Badge>
  );
}
