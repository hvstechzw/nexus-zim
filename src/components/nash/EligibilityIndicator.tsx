import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type EligibilityStatus = "clear" | "pending" | "flagged" | "suspended";

interface Props {
  status: EligibilityStatus;
  reason?: string;
  className?: string;
}

const STATUS = {
  clear:     { label: "Clear",     Icon: CheckCircle2,   cls: "border-[hsl(var(--nash-success))]/50 text-[hsl(var(--nash-success))]" },
  pending:   { label: "Pending",   Icon: Clock,          cls: "border-[hsl(var(--nash-warning))]/50 text-[hsl(var(--nash-warning))]" },
  flagged:   { label: "Flagged",   Icon: AlertTriangle,  cls: "border-[hsl(var(--nash-error))]/50 text-[hsl(var(--nash-error))]" },
  suspended: { label: "Suspended", Icon: XCircle,        cls: "border-[hsl(var(--nash-error))]/70 bg-[hsl(var(--nash-error))]/10 text-[hsl(var(--nash-error))]" },
} as const;

/**
 * Green/Amber/Red eligibility chip used across roster views, athlete cards
 * and team sheets. Tooltip-friendly via `title`/`reason`.
 */
export function EligibilityIndicator({ status, reason, className }: Props) {
  const s = STATUS[status];
  const I = s.Icon;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 text-[10px] font-display tracking-wider", s.cls, className)}
      title={reason || s.label}
    >
      <I className="h-3 w-3" />
      {s.label}
    </Badge>
  );
}
