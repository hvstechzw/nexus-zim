import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number | null | undefined;
  icon?: LucideIcon;
  hint?: string;
  /** Accent tone — defaults to primary (NASH green). */
  tone?: "primary" | "accent" | "success" | "warning" | "error" | "muted";
  className?: string;
  loading?: boolean;
}

const TONE_BG: Record<NonNullable<Props["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  accent:  "bg-accent/15 text-accent",
  success: "bg-[hsl(var(--nash-success))]/15 text-[hsl(var(--nash-success))]",
  warning: "bg-[hsl(var(--nash-warning))]/15 text-[hsl(var(--nash-warning))]",
  error:   "bg-[hsl(var(--nash-error))]/15 text-[hsl(var(--nash-error))]",
  muted:   "bg-muted text-muted-foreground",
};

export function StatCard({ label, value, icon: Icon, hint, tone = "primary", className, loading }: Props) {
  return (
    <Card className={cn("border-border", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">{label}</p>
            <p className="text-2xl font-display font-bold tabular-nums">
              {loading ? <span className="inline-block w-12 h-7 rounded bg-muted animate-pulse" /> : (value ?? "—")}
            </p>
            {hint && <p className="text-[11px] text-muted-foreground truncate">{hint}</p>}
          </div>
          {Icon && (
            <div className={cn("rounded p-2 shrink-0", TONE_BG[tone])}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
