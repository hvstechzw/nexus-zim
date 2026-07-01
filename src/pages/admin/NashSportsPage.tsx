import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NashHeader } from "@/components/nash/NashHeader";
import { SportBadge } from "@/components/nash/SportBadge";
import { supabase } from "@/integrations/supabase/client";

interface Sport {
  id: string; code: string; name: string; full_name: string | null;
  gender: string | null; scoring_type: string | null;
  periods: number | null; period_duration_minutes: number | null;
  has_extra_time: boolean | null; has_penalties: boolean | null;
  age_groups: string[] | null; primary_term: number | null;
  min_squad_size: number | null; max_squad_size: number | null;
  players_on_field: number | null; is_active: boolean | null;
}

const TERM_NAME = (n: number | null) => n ? `Term ${n}` : "Year-round";

export default function NashSportsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("nash_sports").select("*").order("name");
      setSports((data || []) as Sport[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div>
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Federation · Sports</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">NASH Sports Registry</h1>
          <p className="text-xs text-muted-foreground mt-0.5">All sports governed by NASH/NAPH with their scoring, age groups and squad rules.</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display tracking-wide">15 Sports</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Primary Term</TableHead>
                    <TableHead>Scoring</TableHead>
                    <TableHead>Periods</TableHead>
                    <TableHead>Age Groups</TableHead>
                    <TableHead>Squad</TableHead>
                    <TableHead>On Field</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && <TableRow><TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">Loading…</TableCell></TableRow>}
                  {!loading && sports.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">No sports found. Seed migration may not have run yet.</TableCell></TableRow>
                  )}
                  {sports.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell><SportBadge code={s.code} /></TableCell>
                      <TableCell className="text-sm font-medium">{s.name}<div className="text-[11px] text-muted-foreground">{s.full_name}</div></TableCell>
                      <TableCell className="text-xs capitalize">{s.gender}</TableCell>
                      <TableCell className="text-xs">{TERM_NAME(s.primary_term)}</TableCell>
                      <TableCell className="text-xs"><code className="text-[10px] bg-muted px-1 py-0.5 rounded">{s.scoring_type}</code></TableCell>
                      <TableCell className="text-xs tabular-nums">
                        {s.periods ? `${s.periods} × ${s.period_duration_minutes ?? "?"}'` : "—"}
                        {s.has_extra_time && <Badge variant="outline" className="ml-1 text-[9px]">ET</Badge>}
                        {s.has_penalties && <Badge variant="outline" className="ml-1 text-[9px]">PEN</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(s.age_groups || []).map((g) => <Badge key={g} variant="secondary" className="text-[9px] font-mono">{g}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs tabular-nums">{s.min_squad_size && s.max_squad_size ? `${s.min_squad_size}–${s.max_squad_size}` : "—"}</TableCell>
                      <TableCell className="text-xs tabular-nums">{s.players_on_field ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}
