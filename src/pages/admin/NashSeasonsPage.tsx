import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NashHeader } from "@/components/nash/NashHeader";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "lucide-react";

interface Season {
  id: string; academic_year: string; term: number; name: string | null;
  start_date: string | null; end_date: string | null; registration_deadline: string | null;
  is_active: boolean | null; is_current: boolean | null;
}

function fmt(d: string | null) { return d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"; }

export default function NashSeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any).from("nash_seasons").select("*")
        .order("academic_year", { ascending: false }).order("term", { ascending: false });
      if (error) console.error("NashSeasonsPage: failed to load nash_seasons", error.message, error);
      setSeasons((data || []) as Season[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div>
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Federation · Seasons</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">NASH Seasons</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Academic year / term seasons govern every competition window and registration deadline.</p>
        </div>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" /> All Seasons</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Season</TableHead><TableHead>Year</TableHead><TableHead>Term</TableHead>
                  <TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Registration Deadline</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">Loading…</TableCell></TableRow>}
                {!loading && seasons.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">No seasons yet.</TableCell></TableRow>
                )}
                {seasons.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name ?? `${s.academic_year} Term ${s.term}`}</TableCell>
                    <TableCell className="tabular-nums">{s.academic_year}</TableCell>
                    <TableCell className="tabular-nums">Term {s.term}</TableCell>
                    <TableCell className="text-xs">{fmt(s.start_date)}</TableCell>
                    <TableCell className="text-xs">{fmt(s.end_date)}</TableCell>
                    <TableCell className="text-xs">{fmt(s.registration_deadline)}</TableCell>
                    <TableCell className="space-x-1">
                      {s.is_current && <Badge className="bg-accent text-accent-foreground hover:bg-accent text-[10px] font-display tracking-wider">CURRENT</Badge>}
                      {s.is_active && !s.is_current && <Badge variant="outline" className="text-[10px] border-[hsl(var(--nash-success))]/50 text-[hsl(var(--nash-success))]">Active</Badge>}
                      {!s.is_active && !s.is_current && <Badge variant="secondary" className="text-[10px]">Archived</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}
