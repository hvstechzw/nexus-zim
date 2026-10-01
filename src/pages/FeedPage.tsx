// NASH multi-sport public landing — replaces the legacy handball+netball feed.
// Public (no auth needed), pulls live from the new nash_* tables, sport/
// province/tier filters across every NASH sport. Keeps the legacy feed_items
// realtime subscription as the "Latest Activity" rail.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/nash/StatCard";
import { CompetitionCard, type Competition } from "@/components/nash/CompetitionCard";
import { SportSelector } from "@/components/nash/SportSelector";
import { ProvinceSelector } from "@/components/nash/ProvinceSelector";
import { TierBadge, type CompetitionTier } from "@/components/nash/TierBadge";
import { SportBadge, sportName } from "@/components/nash/SportBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useScholasticAutoSync } from "@/hooks/useScholasticAutoSync";
import {
  Trophy, Users, Activity, Calendar, MapPin, ShieldCheck,
  GraduationCap, Sparkles, ArrowRight, Tv, Radio,
} from "lucide-react";

interface FeedItem {
  id: string; kind: string; title: string; body: string | null;
  fixture_id: string | null; competition_id: string | null;
  athlete_id: string | null; created_at: string;
}

const KIND_TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  match_result: "default", badge: "secondary", milestone: "secondary",
  mvp: "default", highlight: "default", announcement: "outline",
};

interface LiveFixture {
  id: string;
  home_name: string | null;
  away_name: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  discipline: string | null;
  competition_id: string | null;
  competition_name: string | null;
  competition_tier: string | null;
}

export default function FeedPage() {
  useScholasticAutoSync();
  const { user } = useAuth();

  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [live, setLive] = useState<LiveFixture[]>([]);
  const [upcoming, setUpcoming] = useState<Competition[]>([]);
  const [recent, setRecent] = useState<Competition[]>([]);
  const [stats, setStats] = useState({ athletes: 0, schools: 0, liveCount: 0, weekCount: 0 });
  const [sport, setSport] = useState("");
  const [province, setProvince] = useState("");
  const [tier, setTier] = useState("");
  const [loading, setLoading] = useState(true);

  // Initial data load — runs once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sb = supabase as any;
      const [feedRes, fixturesRes, upcomingRes, recentRes, athletesC, schoolsC] = await Promise.all([
        sb.from("feed_items").select("*").order("created_at", { ascending: false }).limit(40),
        sb.from("fixtures")
          .select("id,home_score,away_score,status,competition:competition_id(id,name,discipline,tier,province),home_team:home_school_team_id(name),away_team:away_school_team_id(name)")
          .in("status", ["in_progress", "live", "active"])
          .order("scheduled_at", { ascending: false }).limit(8),
        sb.from("competitions")
          .select("id,name,discipline,province,tier,age_group,gender,start_date,end_date,host_school_name,total_entries,status,is_nash_sanctioned")
          .gte("start_date", new Date().toISOString().slice(0, 10))
          .order("start_date", { ascending: true }).limit(12),
        sb.from("competitions")
          .select("id,name,discipline,province,tier,age_group,gender,start_date,end_date,host_school_name,total_entries,status,is_nash_sanctioned")
          .in("status", ["completed", "final"])
          .order("end_date", { ascending: false }).limit(6),
        sb.from("nash_athlete_registry").select("id", { count: "exact", head: true }),
        sb.from("teams").select("id", { count: "exact", head: true }),
      ]);
      if (cancelled) return;
      setFeed((feedRes.data || []) as FeedItem[]);
      const liveRows = ((fixturesRes.data || []) as any[]).map((f) => ({
        id: f.id,
        home_name: f.home_team?.name ?? null,
        away_name: f.away_team?.name ?? null,
        home_score: f.home_score, away_score: f.away_score, status: f.status,
        discipline: f.competition?.discipline ?? null,
        competition_id: f.competition?.id ?? null,
        competition_name: f.competition?.name ?? null,
        competition_tier: f.competition?.tier ?? null,
      }));
      setLive(liveRows);
      setUpcoming((upcomingRes.data || []) as Competition[]);
      setRecent((recentRes.data || []) as Competition[]);
      // Week count = competitions with start in next 7 days
      const weekFrom = new Date().toISOString().slice(0, 10);
      const weekTo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const weekRows = (upcomingRes.data || []).filter((c: any) => c.start_date && c.start_date >= weekFrom && c.start_date <= weekTo);
      setStats({
        athletes: athletesC.count ?? 0,
        schools: schoolsC.count ?? 0,
        liveCount: liveRows.length,
        weekCount: weekRows.length,
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Realtime feed_items subscription preserved from the legacy page
  useEffect(() => {
    const channel = supabase
      .channel("feed-items-nash")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "feed_items" },
        (p) => setFeed((prev) => [p.new as any, ...prev].slice(0, 40)))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Client-side filtering (server fetches are unfiltered to keep the hero stats stable)
  const filterFn = (c: Competition) =>
    (!sport || (c.discipline || "").toLowerCase().includes(sportName(sport).toLowerCase())) &&
    (!province || c.province === province) &&
    (!tier || c.tier === tier);

  const upcomingFiltered = useMemo(() => upcoming.filter(filterFn), [upcoming, sport, province, tier]);
  const recentFiltered = useMemo(() => recent.filter(filterFn), [recent, sport, province, tier]);
  const liveFiltered = useMemo(() => live.filter((f) =>
    (!sport || (f.discipline || "").toLowerCase().includes(sportName(sport).toLowerCase())) &&
    (!tier || f.competition_tier === tier)
  ), [live, sport, tier]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Helmet>
        <title>Nexus Zimbabwe | Powered by NASH & NAPH — Official School Sport Network</title>
        <meta name="description" content="Live results, competitions, and rankings across all 15 sports under NASH and NAPH. Zimbabwe's official school sport network — powered by Scholastic Services, built by Aetheris." />
        <link rel="canonical" href="https://nexuszw.online/" />
      </Helmet>
      <main className="flex-1">
        {/* Lead with the literal product (§11.5): what Nexus is, what it covers, where to go next */}
        <section data-sly="hero" className="border-b border-border">
          <div className="rail py-10 md:py-14">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="flex items-center gap-2 text-sm font-medium text-supporting">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" /> NASH and NAPH · Zimbabwe
                </p>
                <h1 className="font-display text-3xl font-bold md:text-4xl">
                  Fixtures, live scores and results for Zimbabwean school sport
                </h1>
                <p className="max-w-xl text-base text-supporting">
                  The official competition platform for inter-school sport under NASH and NAPH, covering handball, netball, football, athletics, cricket, rugby and every other sanctioned sport.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="outline">15 sports</Badge>
                  <Badge variant="outline">10 provinces</Badge>
                  <Badge variant="outline">Linked to Scholastic Services</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild><Link to="/live"><Radio className="mr-1 h-4 w-4" aria-hidden="true" /> See live matches</Link></Button>
                {!user && <Button asChild variant="outline"><Link to="/login">Sign in</Link></Button>}
              </div>
            </div>
          </div>
        </section>

        {/* Live stats strip */}
        <section data-sly="stats" className="rail pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Registered Athletes" value={stats.athletes} icon={Users} tone="primary" loading={loading} />
            <StatCard label="Schools" value={stats.schools} icon={GraduationCap} tone="accent" loading={loading} />
            <StatCard label="Live Right Now" value={stats.liveCount} icon={Activity} tone={stats.liveCount > 0 ? "error" : "muted"} hint={stats.liveCount > 0 ? "Click LIVE NOW to watch" : "No fixtures live"} loading={loading} />
            <StatCard label="This Week" value={stats.weekCount} icon={Calendar} tone="accent" loading={loading} />
          </div>
        </section>

        {/* Filters */}
        <section data-sly="filters" className="rail pt-8">
          <Card>
            <CardContent className="p-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-display tracking-widest uppercase text-muted-foreground mr-2">Filter</span>
              <SportSelector value={sport} onChange={setSport} allOption className="min-h-11 w-44" />
              <ProvinceSelector value={province} onChange={setProvince} allOption className="min-h-11 w-48" />
              <Select value={tier || "__all__"} onValueChange={(v) => setTier(v === "__all__" ? "" : v)}>
                <SelectTrigger className="min-h-11 w-36"><SelectValue placeholder="All Tiers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Tiers</SelectItem>
                  <SelectItem value="zonal">Zonal</SelectItem>
                  <SelectItem value="district">District</SelectItem>
                  <SelectItem value="provincial">Provincial</SelectItem>
                  <SelectItem value="national">National</SelectItem>
                </SelectContent>
              </Select>
              {(sport || province || tier) && (
                <Button variant="ghost" size="sm" onClick={() => { setSport(""); setProvince(""); setTier(""); }}>Clear</Button>
              )}
              <div className="flex-1" />
              <Link to="/calendar" className="text-xs text-foreground underline underline-offset-4">Full calendar →</Link>
            </CardContent>
          </Card>
        </section>

        {/* Live now */}
        {liveFiltered.length > 0 && (
          <section data-sly="live" className="rail pt-6">
            <h2 className="text-base font-display tracking-wide flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-info" aria-hidden="true" />
              <span className="inline-flex items-center gap-1.5 text-[hsl(var(--nash-error))]">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--nash-error))] " />
                LIVE NOW
              </span>
              <Badge variant="secondary" className="ml-1 font-mono text-xs">{liveFiltered.length}</Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveFiltered.map((f) => (
                <Link key={f.id} to={`/live/${f.id}`}>
                  <Card className="border-[hsl(var(--nash-error))]/30 hover:border-[hsl(var(--nash-error))] transition-colors">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        {f.competition_tier && <TierBadge tier={f.competition_tier as CompetitionTier} />}
                        {f.discipline && <SportBadge code={f.discipline.toUpperCase().slice(0, 2)} />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{f.competition_name ?? "Live fixture"}</p>
                      <div className="flex items-center justify-between gap-3 py-1">
                        <span className="text-sm font-medium truncate">{f.home_name ?? "Home"}</span>
                        <span className="font-display font-bold text-2xl tabular-nums text-foreground">{f.home_score ?? 0} – {f.away_score ?? 0}</span>
                        <span className="text-sm font-medium truncate">{f.away_name ?? "Away"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming */}
        <section data-sly="upcoming" className="rail pt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-display tracking-wide flex items-center gap-2"><Calendar className="h-4 w-4 text-foreground" /> Upcoming Competitions</h2>
            <Link to="/calendar" className="text-xs text-foreground underline underline-offset-4">All →</Link>
          </div>
          {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
          {!loading && upcomingFiltered.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">
              No upcoming competitions match your filters. The platform populates as zones, districts and provinces create their season fixtures.
            </CardContent></Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingFiltered.slice(0, 9).map((c) => <CompetitionCard key={c.id} comp={c} />)}
          </div>
        </section>

        {/* Recent results */}
        {recentFiltered.length > 0 && (
          <section data-sly="results" className="rail pt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-display tracking-wide flex items-center gap-2"><Trophy className="h-4 w-4 text-foreground" /> Latest Results</h2>
              <Link to="/results" className="text-xs text-foreground underline underline-offset-4">All →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentFiltered.slice(0, 6).map((c) => <CompetitionCard key={c.id} comp={c} />)}
            </div>
          </section>
        )}

        {/* Activity feed + feature tiles */}
        <section className="rail py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><Sparkles className="h-4 w-4 text-foreground" /> Latest Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {feed.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Results, milestones and highlights will appear here as they happen.</p>}
              <ul className="divide-y divide-border/40">
                {feed.slice(0, 12).map((it) => {
                  const href = it.fixture_id ? `/live/${it.fixture_id}`
                    : it.athlete_id ? `/players/${it.athlete_id}`
                    : it.competition_id ? `/competition/${it.competition_id}` : "#";
                  return (
                    <li key={it.id} className="py-2 first:pt-0 last:pb-0">
                      <Link to={href} className="flex items-start gap-3 hover:bg-accent/5 rounded p-1.5 transition-colors">
                        <Badge variant={KIND_TONE[it.kind] ?? "outline"} className="text-xs font-display tracking-wider uppercase shrink-0">{it.kind.replace("_", " ")}</Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{it.title}</p>
                          {it.body && <p className="text-xs text-muted-foreground truncate">{it.body}</p>}
                        </div>
                        <time className="text-xs text-muted-foreground font-mono shrink-0 mt-0.5">{new Date(it.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</time>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          {/* Quick access */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><MapPin className="h-4 w-4 text-foreground" /> Explore</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Tile to="/federation/nash" title="NASH National" body="Federation command centre" icon={ShieldCheck} />
              <Tile to="/admin/competitions/new" title="Create Competition" body="11-step tournament wizard" icon={Trophy} />
              <Tile to="/admin/athletes" title="Athlete Registry" body="Search the national NASH ID database" icon={Users} />
              <Tile to="/admin/eligibility" title="Eligibility Engine" body="Review open flags" icon={ShieldCheck} />
              <Tile to="/records" title="Records & Champions" body="Historical registry" icon={Trophy} />
              <Tile to="/broadcast" title="Broadcast Graphics" body="NASH-themed CG preview" icon={Tv} />
            </CardContent>
          </Card>
        </section>

      </main>
    </div>
  );
}

function Tile({ to, title, body, icon: Icon }: { to: string; title: string; body: string; icon: any }) {
  return (
    <Link to={to} className="flex items-center gap-3 p-2 rounded border border-border hover:border-primary/50 transition-colors group">
      <Icon className="h-4 w-4 text-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{body}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}
