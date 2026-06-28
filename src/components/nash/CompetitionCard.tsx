import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { TierBadge, type CompetitionTier } from "./TierBadge";
import { SportBadge, sportName } from "./SportBadge";
import { Calendar, MapPin, Users } from "lucide-react";

export interface Competition {
  id: string;
  name: string;
  discipline?: string | null;
  sport_code?: string | null;
  tier?: string | null;
  age_group?: string | null;
  gender?: string | null;
  province?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  host_school_name?: string | null;
  total_entries?: number | null;
  status?: string | null;
  is_nash_sanctioned?: boolean | null;
}

function fmtDate(s?: string | null) {
  if (!s) return null;
  try { return new Date(s).toLocaleDateString(undefined, { day: "numeric", month: "short" }); } catch { return s; }
}

export function CompetitionCard({ comp }: { comp: Competition }) {
  const code = comp.sport_code || comp.discipline?.toUpperCase().slice(0, 2) || "";
  const dateRange = [fmtDate(comp.start_date), fmtDate(comp.end_date)].filter(Boolean).join(" – ");
  return (
    <Link to={`/competition/${comp.id}`} className="block">
      <Card className="border-border hover:border-primary/50 transition-colors">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-sm truncate">{comp.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {code ? sportName(code) : comp.discipline}
                {comp.age_group ? ` · ${comp.age_group}` : ""}
                {comp.gender ? ` · ${comp.gender}` : ""}
              </p>
            </div>
            {comp.tier && <TierBadge tier={comp.tier as CompetitionTier} />}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {code && <SportBadge code={code} />}
            {dateRange && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{dateRange}</span>}
            {comp.province && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{comp.province}</span>}
            {typeof comp.total_entries === "number" && comp.total_entries > 0 && (
              <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{comp.total_entries}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
