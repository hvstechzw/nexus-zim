import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { SportBadge } from "./SportBadge";

interface Props {
  nashOfficialId: string;
  firstName: string;
  lastName: string;
  primaryRole?: string | null;
  grade?: string | null;
  sports?: string[] | null;
  province?: string | null;
  totalMatches?: number | null;
  performanceRating?: number | null;
}

/** Compact official profile card — used in rosters, assignments, and search. */
export function OfficialCard({ nashOfficialId, firstName, lastName, primaryRole, grade, sports, province, totalMatches, performanceRating }: Props) {
  return (
    <Card className="border-border">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{firstName} {lastName}</div>
            <div className="text-[10px] font-mono text-accent">{nashOfficialId}</div>
          </div>
          {grade && <Badge variant="outline" className="text-[10px] font-display tracking-wider">{grade}</Badge>}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
          <ShieldCheck className="h-3 w-3 text-accent" />
          {primaryRole?.replace(/_/g, " ") ?? "Official"}
        </div>
        <div className="flex flex-wrap gap-1">
          {(sports || []).map((c) => <SportBadge key={c} code={c} />)}
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground border-t border-border/40 pt-2">
          <div><div className="text-foreground tabular-nums font-medium">{totalMatches ?? 0}</div>Matches</div>
          <div><div className="text-foreground tabular-nums font-medium">{performanceRating ?? "—"}</div>Rating</div>
          <div><div className="text-foreground font-medium truncate">{province ?? "—"}</div>Province</div>
        </div>
      </CardContent>
    </Card>
  );
}
