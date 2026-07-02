import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NashHeader } from "@/components/nash/NashHeader";
import { StatCard } from "@/components/nash/StatCard";
import { CompetitionCard, type Competition } from "@/components/nash/CompetitionCard";
import { SeasonSelector, type NashSeason } from "@/components/nash/SeasonSelector";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Users, AlertTriangle, ShieldCheck, Plus, FileText, Activity } from "lucide-react";

interface Props {
  tier: "provincial" | "district" | "zonal";
  tierLabel: string;
  /** The /scope param key carried in the URL (provinceId / districtId / zoneId). */
  scopeParam?: string;
  /** Subtitle for the dashboard header. */
  description: string;
}

/**
 * Shared chrome for provincial / district / zonal dashboards. They all do the
 * same thing — show a scoped slice of the federation surface — so they share
 * a single implementation and differ only in the database tier filter and
 * the labels they render.
 */
export function TierDashboard({ tier, tierLabel, description }: Props) {
  const params = useParams<Record<string, string>>();
  const scope = params.provinceId || params.districtId || params.zoneId || "";
  const [seasonId, setSeasonId] = useState("");
  const [season, setSeason] = useState<NashSeason | undefined>();
  const [stats, setStats] = useState({ competitions: 0, athletes: 0, officials: 0, openFlags: 0 });
  const [comps, setComps] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!seasonId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const sb = supabase as any;
      let compQ = sb.from("competitions")
        .select("id,name,discipline,province,tier,age_group,gender,start_date,end_date,host_school_name,total_entries,status,is_nash_sanctioned")
        .eq("season_id", seasonId)
        .eq("tier", tier)
        .order("start_date", { ascending: false }).limit(50);
      // District/zonal competitions don't carry a flat district/zone column
      // (only organisation_id, which isn't resolvable from the URL scope
      // param), so only provincial-tier scoping is precise here.
      if (scope && tier === "provincial") compQ = compQ.eq("province", scope);

      let athleteQ = sb.from("nash_athlete_registry").select("id", { count: "exact", head: true });
      let officialQ = sb.from("nash_officials").select("id", { count: "exact", head: true }).eq("is_active", true);
      if (scope && tier === "provincial") {
        athleteQ = athleteQ.eq("province", scope);
        officialQ = officialQ.eq("province", scope);
      }

      const [comps, athletes, officials, flags] = await Promise.all([
        compQ,
        athleteQ,
        officialQ,
        sb.from("nash_eligibility_flags").select("id", { count: "exact", head: true }).eq("status", "open"),
      ]);
      if (cancelled) return;
      setComps((comps.data || []) as Competition[]);
      setStats({
        competitions: (comps.data || []).length,
        athletes: athletes.count ?? 0,
        officials: officials.count ?? 0,
        openFlags: flags.count ?? 0,
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [seasonId, tier, scope]);

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">{tierLabel}</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">{scope || `${tierLabel} Dashboard`}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{description}{season?.name ? ` · ${season.name}` : ""}</p>
          </div>
          <div className="flex items-end gap-2">
            <SeasonSelector value={seasonId} onChange={(id, s) => { setSeasonId(id); setSeason(s); }} className="h-9 w-56" />
            <Button asChild><Link to="/admin/competitions/new"><Plus className="h-4 w-4 mr-1" /> Create Competition</Link></Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label={`${tierLabel} Competitions`} value={stats.competitions} icon={Activity} tone="primary" loading={loading} />
          <StatCard label="Athletes in Scope" value={stats.athletes} icon={Users} tone="accent" loading={loading} />
          <StatCard label="Available Officials" value={stats.officials} icon={ShieldCheck} tone="success" loading={loading} />
          <StatCard label="Open Flags" value={stats.openFlags} icon={AlertTriangle} tone={stats.openFlags > 0 ? "error" : "muted"} loading={loading} />
        </div>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><Trophy className="h-4 w-4 text-accent" /> {tierLabel} Competitions</CardTitle>
            <Link to="/admin/competitions" className="text-xs text-accent hover:underline">View all →</Link>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
            {!loading && comps.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">No {tier} competitions for this season yet. <Link to="/admin/competitions/new" className="text-accent hover:underline">Create one →</Link></p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {comps.map((c) => <CompetitionCard key={c.id} comp={c} />)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><FileText className="h-4 w-4 text-accent" /> Operations</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button asChild variant="outline" className="justify-start h-10"><Link to="/admin/eligibility"><AlertTriangle className="h-4 w-4 mr-2 text-accent" />Eligibility flags</Link></Button>
            <Button asChild variant="outline" className="justify-start h-10"><Link to="/admin/officials"><ShieldCheck className="h-4 w-4 mr-2 text-accent" />Officials registry</Link></Button>
            <Button asChild variant="outline" className="justify-start h-10"><Link to="/admin/finances"><Trophy className="h-4 w-4 mr-2 text-accent" />Finances &amp; entry fees</Link></Button>
            <Button asChild variant="outline" className="justify-start h-10"><Link to="/admin/sync"><FileText className="h-4 w-4 mr-2 text-accent" />Scholastic Services sync</Link></Button>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}
