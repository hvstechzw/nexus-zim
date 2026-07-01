import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NashHeader } from "@/components/nash/NashHeader";
import { StatCard } from "@/components/nash/StatCard";
import { CompetitionCard, type Competition } from "@/components/nash/CompetitionCard";
import { SeasonSelector, type NashSeason } from "@/components/nash/SeasonSelector";
import { ZIM_PROVINCES, provinceCode } from "@/components/nash/ProvinceSelector";
import { supabase } from "@/integrations/supabase/client";
import {
  Trophy, Users, ShieldCheck, AlertTriangle, MapPin, FileText, Activity,
  Globe2, Settings, ArrowRight, ListChecks,
} from "lucide-react";

interface Stats {
  registeredAthletes: number;
  activeCompetitions: number;
  upcomingCompetitions: number;
  openFlags: number;
  totalOfficials: number;
  schoolsParticipating: number;
}

interface ProvinceRow {
  province: string;
  competitions: number;
  athletes: number;
}

/**
 * NASH National Command Centre — the federation's top-level surface.
 * Aggregates across all provinces; pulls live from the new nash_* tables.
 *
 * Note: nash_* tables aren't in the generated `types.ts` yet (Lovable
 * regenerates types after this branch merges). We cast supabase calls to
 * `any` for those specifically; runtime is unchanged.
 *
 * `federation` prop swaps the brand text only — both federations operate
 * over the same competition/athlete tables; tier filtering happens at the
 * organisation level, not here.
 */
export default function NashNationalDashboard({ federation = "NASH" }: { federation?: "NASH" | "NAPH" } = {}) {
  const [seasonId, setSeasonId] = useState<string>("");
  const [season, setSeason] = useState<NashSeason | undefined>();
  const [stats, setStats] = useState<Stats>({
    registeredAthletes: 0, activeCompetitions: 0, upcomingCompetitions: 0,
    openFlags: 0, totalOfficials: 0, schoolsParticipating: 0,
  });
  const [recentComps, setRecentComps] = useState<Competition[]>([]);
  const [provinceBreakdown, setProvinceBreakdown] = useState<ProvinceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!seasonId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const sb = supabase as any;
      const [athletes, openFlags, officials, comps, schools] = await Promise.all([
        sb.from("nash_athlete_registry").select("id", { count: "exact", head: true }),
        sb.from("nash_eligibility_flags").select("id", { count: "exact", head: true }).eq("status", "open"),
        sb.from("nash_officials").select("id", { count: "exact", head: true }).eq("is_active", true),
        sb.from("competitions")
          .select("id,name,discipline,province,tier,age_group,gender,start_date,end_date,host_school_name,total_entries,status,is_nash_sanctioned,season_id")
          .eq("season_id", seasonId)
          .order("start_date", { ascending: false })
          .limit(50),
        sb.from("teams").select("id", { count: "exact", head: true }),
      ]);

      if (cancelled) return;
      const compRows: any[] = comps.data || [];
      const activeCount = compRows.filter((c) => c.status === "active" || c.status === "in_progress").length;
      const upcomingCount = compRows.filter((c) => {
        if (!c.start_date) return false;
        return new Date(c.start_date) > new Date();
      }).length;

      setStats({
        registeredAthletes: athletes.count ?? 0,
        activeCompetitions: activeCount,
        upcomingCompetitions: upcomingCount,
        openFlags: openFlags.count ?? 0,
        totalOfficials: officials.count ?? 0,
        schoolsParticipating: schools.count ?? 0,
      });

      setRecentComps(compRows.slice(0, 6));

      // Per-province participation breakdown
      const byProv: Record<string, ProvinceRow> = {};
      ZIM_PROVINCES.forEach((p) => { byProv[p] = { province: p, competitions: 0, athletes: 0 }; });
      compRows.forEach((c: any) => {
        if (c.province && byProv[c.province]) byProv[c.province].competitions += 1;
      });
      const { data: athleteByProv } = await sb
        .from("nash_athlete_registry")
        .select("province")
        .not("province", "is", null);
      (athleteByProv || []).forEach((r: any) => {
        if (r.province && byProv[r.province]) byProv[r.province].athletes += 1;
      });
      if (!cancelled) setProvinceBreakdown(Object.values(byProv));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [seasonId]);

  const seasonLabel = season?.name ?? "Current Season";

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header band */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">{federation}</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
              National Command Centre
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{seasonLabel} · All sports, all provinces</p>
          </div>
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Season</p>
              <SeasonSelector value={seasonId} onChange={(id, s) => { setSeasonId(id); setSeason(s); }} className="h-9 w-56" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Registered Athletes" value={stats.registeredAthletes} icon={Users} tone="primary" loading={loading} />
          <StatCard label="Schools" value={stats.schoolsParticipating} icon={Trophy} tone="accent" loading={loading} />
          <StatCard label="Active Competitions" value={stats.activeCompetitions} icon={Activity} tone="success" loading={loading} />
          <StatCard label="Upcoming" value={stats.upcomingCompetitions} icon={ArrowRight} tone="primary" loading={loading} />
          <StatCard label="Officials Deployed" value={stats.totalOfficials} icon={ShieldCheck} tone="accent" loading={loading} />
          <StatCard
            label="Eligibility Flags"
            value={stats.openFlags}
            icon={AlertTriangle}
            tone={stats.openFlags > 0 ? "error" : "muted"}
            hint={stats.openFlags > 0 ? "Open cases require review" : "All clear"}
            loading={loading}
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Province breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 font-display tracking-wide">
                <Globe2 className="h-4 w-4 text-accent" /> Province Participation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {provinceBreakdown.length === 0 && (
                <p className="text-xs text-muted-foreground">Loading provinces…</p>
              )}
              {provinceBreakdown.map((row) => {
                const max = Math.max(...provinceBreakdown.map((r) => r.athletes), 1);
                const pct = Math.max(2, (row.athletes / max) * 100);
                return (
                  <div key={row.province} className="grid grid-cols-[1fr_auto] gap-3 items-center py-1.5 border-b border-border/40 last:border-0">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium">{row.province}</span>
                        <Badge variant="outline" className="font-mono text-[9px] text-accent">{provinceCode(row.province)}</Badge>
                      </div>
                      <div className="h-1.5 rounded bg-muted overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right text-xs tabular-nums">
                      <div className="font-bold">{row.athletes}</div>
                      <div className="text-[10px] text-muted-foreground">{row.competitions} comp{row.competitions === 1 ? "" : "s"}</div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 font-display tracking-wide">
                <ListChecks className="h-4 w-4 text-accent" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickAction to="/admin/competitions/new" label="Create Competition" icon={Trophy} />
              <QuickAction to="/admin/eligibility" label="Review Eligibility Flags" icon={AlertTriangle} badge={stats.openFlags > 0 ? String(stats.openFlags) : undefined} />
              <QuickAction to="/admin/athletes" label="Athlete Registry" icon={Users} />
              <QuickAction to="/admin/officials" label="Officials Registry" icon={ShieldCheck} />
              <QuickAction to="/admin/organisations" label="Organisation Tree" icon={Globe2} />
              <QuickAction to="/admin/reports" label="Generate MoPSE Report" icon={FileText} />
              <QuickAction to="/admin/sync" label="Scholastic Services Sync" icon={Settings} />
            </CardContent>
          </Card>
        </div>

        {/* Recent competitions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2 font-display tracking-wide">
                <MapPin className="h-4 w-4 text-accent" /> Recent &amp; Upcoming Competitions
              </CardTitle>
              <Link to="/admin/competitions" className="text-xs text-accent hover:underline">View all →</Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-xs text-muted-foreground">Loading competitions…</p>}
            {!loading && recentComps.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No competitions for this season yet. <Link to="/admin/competitions/new" className="text-accent hover:underline">Create one →</Link>
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentComps.map((c) => <CompetitionCard key={c.id} comp={c} />)}
            </div>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center pt-2">
          Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises
        </p>
      </div>
    </div>
  );
}

function QuickAction({ to, label, icon: Icon, badge }: { to: string; label: string; icon: any; badge?: string }) {
  return (
    <Link to={to}>
      <Button variant="outline" className="w-full justify-start h-10 font-normal">
        <Icon className="h-4 w-4 mr-2 text-accent" />
        <span className="flex-1 text-left text-sm">{label}</span>
        {badge && <Badge variant="destructive" className="ml-auto h-5 text-[10px]">{badge}</Badge>}
        <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-50" />
      </Button>
    </Link>
  );
}
