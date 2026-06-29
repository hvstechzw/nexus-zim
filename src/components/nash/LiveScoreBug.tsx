import { Badge } from "@/components/ui/badge";

interface Props {
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  period?: string;
  clock?: string;
  status?: "live" | "ht" | "ft" | "scheduled";
  compact?: boolean;
}

/**
 * Broadcast-quality score bug for the bottom-of-screen overlay or thumbnail
 * cards. NASH green / gold styling; large tabular score readable from across
 * a hall. The `compact` variant trims chrome for inline cards.
 */
export function LiveScoreBug({ homeName, awayName, homeScore, awayScore, period, clock, status = "live", compact }: Props) {
  return (
    <div className={`inline-flex items-stretch overflow-hidden border-2 border-accent rounded ${compact ? "text-sm" : "text-base"}`}
         style={{ background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 30%, hsl(var(--card)) 30%, hsl(var(--card)) 70%, hsl(var(--primary)) 70%, hsl(var(--primary)) 100%)" }}>
      {/* Home side */}
      <div className="flex items-center gap-2 px-3 py-1.5 text-primary-foreground">
        <span className="font-display tracking-wide uppercase truncate max-w-[140px]">{homeName}</span>
        <span className="font-mono tabular-nums font-bold text-accent text-2xl leading-none">{homeScore}</span>
      </div>
      {/* Period / clock */}
      <div className="flex flex-col items-center justify-center px-3 py-1 text-center border-x border-accent/60">
        {status === "live" && <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase text-[hsl(var(--nash-error))]">
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--nash-error))] animate-pulse" /> LIVE
        </span>}
        {status === "ht" && <Badge variant="outline" className="text-[9px]">HALF TIME</Badge>}
        {status === "ft" && <Badge variant="outline" className="text-[9px] border-accent text-accent">FULL TIME</Badge>}
        {status === "scheduled" && <Badge variant="secondary" className="text-[9px]">SCHEDULED</Badge>}
        <span className="font-mono text-[10px] mt-0.5">{period}{clock ? ` · ${clock}` : ""}</span>
      </div>
      {/* Away side */}
      <div className="flex items-center gap-2 px-3 py-1.5 text-primary-foreground">
        <span className="font-mono tabular-nums font-bold text-accent text-2xl leading-none">{awayScore}</span>
        <span className="font-display tracking-wide uppercase truncate max-w-[140px]">{awayName}</span>
      </div>
    </div>
  );
}
