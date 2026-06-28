import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NashHeader } from "@/components/nash/NashHeader";
import { AwardBadge } from "@/components/nash/AwardBadge";
import { SportBadge } from "@/components/nash/SportBadge";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Trophy } from "lucide-react";

interface Award {
  id: string; award_type: string | null; award_name: string | null;
  description: string | null; awarded_at: string | null;
  competition?: { name: string; tier: string | null; discipline: string | null; province: string | null } | null;
  athlete?: { first_name: string; last_name: string; nash_id: string } | null;
  team?: { name: string } | null;
}

export default function RecordsPage() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sb = supabase as any;
      const [aw, rec] = await Promise.all([
        sb.from("nash_awards").select("id,award_type,award_name,description,awarded_at,competition:competition_id(name,tier,discipline,province),athlete:nash_athlete_id(first_name,last_name,nash_id),team:school_team_id(name)").in("award_type", ["champion", "runner_up", "third_place"]).order("awarded_at", { ascending: false }).limit(200),
        sb.from("athletics_results").select("performance,position,is_record,record_type,event:event_id(event_name,age_group,gender,unit),athlete:nash_athlete_id(first_name,last_name,nash_id),team:school_team_id(name)").eq("is_record", true).order("created_at", { ascending: false }).limit(100),
      ]);
      if (!cancelled) {
        setAwards((aw.data || []) as Award[]);
        setRecords(rec.data || []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div>
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Public · Records</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">National Records &amp; Champions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">The historical registry NASH has never had — permanent record of champions, runners-up and athletic records.</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><Crown className="h-4 w-4 text-accent" /> Champions Registry</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Award</TableHead><TableHead>Competition</TableHead><TableHead>Sport</TableHead><TableHead>Recipient</TableHead><TableHead>Awarded</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={5} className="text-center py-6 text-sm text-muted-foreground">Loading…</TableCell></TableRow>}
                {!loading && awards.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">The records registry is empty. Champions are recorded automatically as competitions complete.</TableCell></TableRow>}
                {awards.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell><AwardBadge kind={a.award_type || "champion"} /></TableCell>
                    <TableCell className="text-sm">{a.competition?.name ?? "—"}{a.competition?.tier && <Badge variant="outline" className="ml-2 text-[9px] font-display">{a.competition.tier.toUpperCase()}</Badge>}</TableCell>
                    <TableCell>{a.competition?.discipline && <SportBadge code={a.competition.discipline.toUpperCase().slice(0, 2)} />}</TableCell>
                    <TableCell className="text-sm font-medium">{a.team?.name ?? (a.athlete ? `${a.athlete.first_name} ${a.athlete.last_name}` : "—")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.awarded_at ? new Date(a.awarded_at).toLocaleDateString() : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><Trophy className="h-4 w-4 text-accent" /> Athletic Records</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Age / Gender</TableHead><TableHead>Athlete</TableHead><TableHead>Performance</TableHead><TableHead>Record Type</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={5} className="text-center py-6 text-sm text-muted-foreground">Loading…</TableCell></TableRow>}
                {!loading && records.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">No athletics records yet.</TableCell></TableRow>}
                {records.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{r.event?.event_name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{r.event?.age_group} {r.event?.gender}</TableCell>
                    <TableCell className="text-sm font-medium">{r.athlete ? `${r.athlete.first_name} ${r.athlete.last_name}` : r.team?.name ?? "—"}</TableCell>
                    <TableCell className="font-mono tabular-nums text-sm text-accent">{r.performance} {r.event?.unit ? <span className="text-[10px] text-muted-foreground">{r.event.unit}</span> : null}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] font-display tracking-wider uppercase">{r.record_type}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}
