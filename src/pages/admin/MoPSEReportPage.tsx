import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NashHeader } from "@/components/nash/NashHeader";
import { StatCard } from "@/components/nash/StatCard";
import { SeasonSelector, type NashSeason } from "@/components/nash/SeasonSelector";
import { ZIM_PROVINCES } from "@/components/nash/ProvinceSelector";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Printer, Loader2, ShieldCheck, Trophy, Users, AlertTriangle } from "lucide-react";

interface ReportData {
  totalAthletes: number;
  athletesByGender: { male: number; female: number };
  athletesByProvince: Record<string, number>;
  totalCompetitions: number;
  competitionsByTier: Record<string, number>;
  competitionsBySport: Record<string, number>;
  champions: Array<{ name: string; tier: string | null; sport: string | null; winner: string | null; date: string | null }>;
  totalOfficials: number;
  officialsByGrade: Record<string, number>;
  totalFlags: number;
  flagsByType: Record<string, number>;
}

const EMPTY: ReportData = {
  totalAthletes: 0, athletesByGender: { male: 0, female: 0 }, athletesByProvince: {},
  totalCompetitions: 0, competitionsByTier: {}, competitionsBySport: {},
  champions: [], totalOfficials: 0, officialsByGrade: {},
  totalFlags: 0, flagsByType: {},
};

/**
 * MoPSE Annual Report — aggregates the entire season's NASH activity into a
 * printable, letterhead-styled report. Uses window.print() (with print-only
 * CSS) so we stay zero-dependency for PDF generation; the browser PDF is
 * suitable for ministerial submission.
 */
export default function MoPSEReportPage() {
  const [seasonId, setSeasonId] = useState("");
  const [season, setSeason] = useState<NashSeason | undefined>();
  const [data, setData] = useState<ReportData>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!seasonId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const sb = supabase as any;
      const [athletes, athletesByProv, comps, officials, flags, awards] = await Promise.all([
        sb.from("nash_athlete_registry").select("gender", { count: "exact" }),
        sb.from("nash_athlete_registry").select("province").not("province", "is", null),
        sb.from("competitions").select("id,tier,discipline,province,season_id,name").eq("season_id", seasonId),
        sb.from("nash_officials").select("grade", { count: "exact" }).eq("is_active", true),
        sb.from("nash_eligibility_flags").select("flag_type"),
        sb.from("nash_awards")
          .select("award_name,award_type,awarded_at,competition:competition_id(name,tier,discipline,province),team:school_team_id(name),athlete:nash_athlete_id(first_name,last_name)")
          .eq("season_id", seasonId)
          .in("award_type", ["champion", "runner_up", "third_place"])
          .order("awarded_at", { ascending: false }),
      ]);
      if (cancelled) return;

      const athleteRows: any[] = athletes.data || [];
      const byGender = { male: 0, female: 0 };
      athleteRows.forEach((a) => { if (a.gender === "male" || a.gender === "female") byGender[a.gender]++; });

      const byProv: Record<string, number> = {};
      ZIM_PROVINCES.forEach((p) => { byProv[p] = 0; });
      (athletesByProv.data || []).forEach((a: any) => { if (byProv[a.province] !== undefined) byProv[a.province]++; });

      const compRows: any[] = comps.data || [];
      const byTier: Record<string, number> = { zonal: 0, district: 0, provincial: 0, national: 0 };
      const bySport: Record<string, number> = {};
      compRows.forEach((c) => {
        if (c.tier) byTier[c.tier] = (byTier[c.tier] || 0) + 1;
        if (c.discipline) bySport[c.discipline] = (bySport[c.discipline] || 0) + 1;
      });

      const flagsByType: Record<string, number> = {};
      (flags.data || []).forEach((f: any) => { if (f.flag_type) flagsByType[f.flag_type] = (flagsByType[f.flag_type] || 0) + 1; });

      const officialsByGrade: Record<string, number> = {};
      (officials.data || []).forEach((o: any) => { if (o.grade) officialsByGrade[o.grade] = (officialsByGrade[o.grade] || 0) + 1; });

      const champs = (awards.data || []).filter((a: any) => a.award_type === "champion").slice(0, 100).map((a: any) => ({
        name: a.competition?.name ?? "—",
        tier: a.competition?.tier ?? null,
        sport: a.competition?.discipline ?? null,
        winner: a.team?.name ?? (a.athlete ? `${a.athlete.first_name} ${a.athlete.last_name}` : null),
        date: a.awarded_at,
      }));

      setData({
        totalAthletes: athletes.count ?? 0,
        athletesByGender: byGender,
        athletesByProvince: byProv,
        totalCompetitions: compRows.length,
        competitionsByTier: byTier,
        competitionsBySport: bySport,
        champions: champs,
        totalOfficials: officials.count ?? 0,
        officialsByGrade,
        totalFlags: (flags.data || []).length,
        flagsByType,
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [seasonId]);

  const totalProvinces = useMemo(() => Object.values(data.athletesByProvince).filter((n) => n > 0).length, [data]);

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden">
        <NashHeader />
      </div>

      <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="print:hidden flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Federation · MoPSE Reporting</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Annual Report Generator</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Compiles the season's full participation, competition, official deployment and disciplinary statistics for ministerial submission.</p>
          </div>
          <div className="flex items-end gap-2">
            <SeasonSelector value={seasonId} onChange={(id, s) => { setSeasonId(id); setSeason(s); }} className="h-9 w-56" />
            <Button onClick={() => window.print()} disabled={loading || !seasonId}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Printer className="h-4 w-4 mr-1" />}
              Print / Save as PDF
            </Button>
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded border border-border print:border-0 print:shadow-none p-8 md:p-12 print:p-8 space-y-6 print-document">
          {/* Letterhead */}
          <div className="text-center pb-6 border-b-2 border-accent">
            <p className="text-[10px] font-display tracking-[0.3em] uppercase text-accent">National Association of Secondary School Heads (NASH) &amp; National Association of Primary School Heads (NAPH)</p>
            <h1 className="text-3xl font-display font-bold mt-2">ZIMBABWE</h1>
            <p className="text-xs text-muted-foreground mt-1">Annual School Sport Report · {season?.name ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground mt-3 font-mono">Prepared for the Ministry of Primary and Secondary Education · {new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>

          <Section title="Executive Summary" icon={FileText}>
            <p className="text-sm leading-relaxed">
              During {season?.name ?? "this reporting period"}, NASH coordinated <strong>{data.totalCompetitions}</strong> sanctioned competitions across <strong>{totalProvinces}</strong> of Zimbabwe's 10 provinces, drawing participation from <strong>{data.totalAthletes}</strong> registered athletes ({data.athletesByGender.male} male, {data.athletesByGender.female} female). <strong>{data.totalOfficials}</strong> certified officials were deployed across all sports. <strong>{data.totalFlags}</strong> eligibility cases were registered, of which the full disposition appears in section 5.
            </p>
          </Section>

          <Section title="1. Participation" icon={Users}>
            <div className="grid grid-cols-3 gap-3 print:hidden">
              <StatCard label="Total Athletes" value={data.totalAthletes} icon={Users} tone="primary" />
              <StatCard label="Male" value={data.athletesByGender.male} icon={Users} tone="primary" />
              <StatCard label="Female" value={data.athletesByGender.female} icon={Users} tone="accent" />
            </div>
            <table className="w-full text-sm mt-3">
              <thead className="border-b border-border">
                <tr><th className="text-left py-1">Province</th><th className="text-right py-1">Registered Athletes</th></tr>
              </thead>
              <tbody>
                {ZIM_PROVINCES.map((p) => (
                  <tr key={p} className="border-b border-border/30">
                    <td className="py-1">{p}</td>
                    <td className="py-1 text-right tabular-nums">{data.athletesByProvince[p] ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="2. Competitions by Tier" icon={Trophy}>
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr><th className="text-left py-1">Tier</th><th className="text-right py-1">Competitions</th></tr>
              </thead>
              <tbody>
                {["zonal", "district", "provincial", "national"].map((t) => (
                  <tr key={t} className="border-b border-border/30">
                    <td className="py-1 capitalize">{t}</td>
                    <td className="py-1 text-right tabular-nums">{data.competitionsByTier[t] ?? 0}</td>
                  </tr>
                ))}
                <tr className="font-bold border-t-2 border-border"><td className="py-2">Total</td><td className="py-2 text-right tabular-nums">{data.totalCompetitions}</td></tr>
              </tbody>
            </table>
          </Section>

          <Section title="3. Competitions by Sport" icon={Trophy}>
            <table className="w-full text-sm">
              <thead className="border-b border-border"><tr><th className="text-left py-1">Sport</th><th className="text-right py-1">Competitions</th></tr></thead>
              <tbody>
                {Object.entries(data.competitionsBySport).sort((a, b) => b[1] - a[1]).map(([sport, n]) => (
                  <tr key={sport} className="border-b border-border/30"><td className="py-1">{sport}</td><td className="py-1 text-right tabular-nums">{n}</td></tr>
                ))}
                {Object.keys(data.competitionsBySport).length === 0 && <tr><td colSpan={2} className="py-3 text-center text-muted-foreground text-xs">No competitions recorded.</td></tr>}
              </tbody>
            </table>
          </Section>

          <Section title="4. National & Provincial Champions" icon={Trophy}>
            <table className="w-full text-sm">
              <thead className="border-b border-border"><tr><th className="text-left py-1">Competition</th><th className="text-left py-1">Tier</th><th className="text-left py-1">Champion</th></tr></thead>
              <tbody>
                {data.champions.length === 0 && <tr><td colSpan={3} className="py-3 text-center text-muted-foreground text-xs">No champions recorded for this season yet.</td></tr>}
                {data.champions.map((c, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="py-1">{c.name}</td>
                    <td className="py-1 capitalize text-xs">{c.tier ?? "—"}</td>
                    <td className="py-1">{c.winner ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="5. Disciplinary & Eligibility" icon={AlertTriangle}>
            <table className="w-full text-sm">
              <thead className="border-b border-border"><tr><th className="text-left py-1">Flag Type</th><th className="text-right py-1">Cases</th></tr></thead>
              <tbody>
                {Object.entries(data.flagsByType).map(([t, n]) => (
                  <tr key={t} className="border-b border-border/30"><td className="py-1 capitalize">{t.replace(/_/g, " ")}</td><td className="py-1 text-right tabular-nums">{n}</td></tr>
                ))}
                {Object.keys(data.flagsByType).length === 0 && <tr><td colSpan={2} className="py-3 text-center text-muted-foreground text-xs">No eligibility cases registered.</td></tr>}
                <tr className="font-bold border-t-2 border-border"><td className="py-2">Total</td><td className="py-2 text-right tabular-nums">{data.totalFlags}</td></tr>
              </tbody>
            </table>
          </Section>

          <Section title="6. Official Deployment" icon={ShieldCheck}>
            <p className="text-sm mb-2"><strong>{data.totalOfficials}</strong> active certified officials in the registry.</p>
            <table className="w-full text-sm">
              <thead className="border-b border-border"><tr><th className="text-left py-1">Grade</th><th className="text-right py-1">Officials</th></tr></thead>
              <tbody>
                {Object.entries(data.officialsByGrade).map(([g, n]) => (
                  <tr key={g} className="border-b border-border/30"><td className="py-1">Grade {g}</td><td className="py-1 text-right tabular-nums">{n}</td></tr>
                ))}
                {Object.keys(data.officialsByGrade).length === 0 && <tr><td colSpan={2} className="py-3 text-center text-muted-foreground text-xs">No graded officials in registry.</td></tr>}
              </tbody>
            </table>
          </Section>

          <div className="border-t-2 border-accent pt-4 text-center">
            <p className="text-xs">Submitted by the NASH Secretary General · {new Date().getFullYear()}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Produced by Nexus Zimbabwe · Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
            <Badge variant="outline" className="mt-2 text-[9px] font-mono">Report ID: MOPSE-{season?.academic_year ?? "----"}-T{season?.term ?? "-"}</Badge>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print-document { box-shadow: none !important; border: none !important; }
          .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 16mm; }
        }
      `}</style>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-display font-bold tracking-wide flex items-center gap-2 border-b border-border/60 pb-1">
        <Icon className="h-4 w-4 text-accent" /> {title}
      </h2>
      {children}
    </section>
  );
}
