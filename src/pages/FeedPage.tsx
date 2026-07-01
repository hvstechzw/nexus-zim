// NASH multi-sport public landing — replaces the legacy handball+netball feed.
// Public (no auth needed), pulls live from the new nash_* tables, sport/
// province/tier filters across every NASH sport. Keeps the legacy feed_items
// realtime subscription as the "Latest Activity" rail.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { NashHeader } from "@/components/nash/NashHeader";
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
      <NashHeader />

      <main className="flex-1">
        {/* Hero band */}
        <section className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground border-b-4 border-accent">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-10 md:py-14">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <p className="text-[10px] font-display tracking-[0.3em] uppercase text-accent flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" /> NASH · NAPH · Zimbabwe
                </p>
                <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
                  Every sport. Every school.<br /><span className="text-accent">One national network.</span>
                </h1>
                <p className="text-sm md:text-base opacity-90 max-w-xl">
                  The official competition platform for Zimbabwean inter-school sport — handball, netball, football, athletics, cricket, rugby, and every other sport under NASH & NAPH jurisdiction.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Badge variant="outline" className="border-accent text-accent bg-transparent text-[10px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mr-1 animate-pulse" /> LIVE NETWORK
                  </Badge>
                  <Badge variant="outline" className="border-accent/40 text-primary-foreground bg-transparent text-[10px] font-mono">15 SPORTS</Badge>
                  <Badge variant="outline" className="border-accent/40 text-primary-foreground bg-transparent text-[10px] font-mono">10 PROVINCES</Badge>
                  <Badge variant="outline" className="border-accent/40 text-primary-foreground bg-transparent text-[10px] font-mono">SS-LINKED</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/live"><Radio className="h-4 w-4 mr-1" /> Live now</Link></Button>
                <Button asChild variant="outline" className="border-accent/40 text-primary-foreground hover:bg-primary-foreground/10"><Link to="/dashboard">Sign in</Link></Button>
              </div>
            </div>
          </div>
        </section>

        {/* Live stats strip */}
        <section className="max-w-[1400px] mx-auto px-4 md:px-6 -mt-6 md:-mt-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Registered Athletes" value={stats.athletes} icon={Users} tone="primary" loading={loading} />
            <StatCard label="Schools" value={stats.schools} icon={GraduationCap} tone="accent" loading={loading} />
            <StatCard label="Live Right Now" value={stats.liveCount} icon={Activity} tone={stats.liveCount > 0 ? "error" : "muted"} hint={stats.liveCount > 0 ? "Click LIVE NOW to watch" : "No fixtures live"} loading={loading} />
            <StatCard label="This Week" value={stats.weekCount} icon={Calendar} tone="accent" loading={loading} />
          </div>
        </section>

        {/* Filters */}
        <section className="max-w-[1400px] mx-auto px-4 md:px-6 pt-8">
          <Card>
            <CardContent className="p-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-display tracking-widest uppercase text-muted-foreground mr-2">Filter</span>
              <SportSelector value={sport} onChange={setSport} allOption className="h-9 w-44" />
              <ProvinceSelector value={province} onChange={setProvince} allOption className="h-9 w-48" />
              <Select value={tier || "__all__"} onValueChange={(v) => setTier(v === "__all__" ? "" : v)}>
                <SelectTrigger className="h-9 w-36"><SelectValue placeholder="All Tiers" /></SelectTrigger>
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
              <Link to="/calendar" className="text-xs text-accent hover:underline">Full calendar →</Link>
            </CardContent>
          </Card>
        </section>

        {/* Live now */}
        {liveFiltered.length > 0 && (
          <section className="max-w-[1400px] mx-auto px-4 md:px-6 pt-6">
            <h2 className="text-base font-display tracking-wide flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-[hsl(var(--nash-error))]" />
              <span className="inline-flex items-center gap-1.5 text-[hsl(var(--nash-error))]">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--nash-error))] animate-pulse" />
                LIVE NOW
              </span>
              <Badge variant="secondary" className="ml-1 font-mono text-[10px]">{liveFiltered.length}</Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveFiltered.map((f) => (
                <Link key={f.id} to={`/live/${f.id}`}>
                  <Card className="border-[hsl(var(--nash-error))]/30 hover:border-[hsl(var(--nash-error))] transition-colors">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        {f.competition_tier && <TierBadge tier={f.competition_tier as CompetitionTier} />}
                        {f.discipline && <SportBadge code={f.discipline.toUpperCase().slice(0, 2)} />}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{f.competition_name ?? "Live fixture"}</p>
                      <div className="flex items-center justify-between gap-3 py-1">
                        <span className="text-sm font-medium truncate">{f.home_name ?? "Home"}</span>
                        <span className="font-display font-bold text-2xl tabular-nums text-accent">{f.home_score ?? 0} – {f.away_score ?? 0}</span>
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
        <section className="max-w-[1400px] mx-auto px-4 md:px-6 pt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-display tracking-wide flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" /> Upcoming Competitions</h2>
            <Link to="/calendar" className="text-xs text-accent hover:underline">All →</Link>
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
          <section className="max-w-[1400px] mx-auto px-4 md:px-6 pt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-display tracking-wide flex items-center gap-2"><Trophy className="h-4 w-4 text-accent" /> Latest Results</h2>
              <Link to="/results" className="text-xs text-accent hover:underline">All →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentFiltered.slice(0, 6).map((c) => <CompetitionCard key={c.id} comp={c} />)}
            </div>
          </section>
        )}

        {/* Activity feed + feature tiles */}
        <section className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> Latest Activity</CardTitle>
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
                        <Badge variant={KIND_TONE[it.kind] ?? "outline"} className="text-[9px] font-display tracking-wider uppercase shrink-0">{it.kind.replace("_", " ")}</Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{it.title}</p>
                          {it.body && <p className="text-xs text-muted-foreground truncate">{it.body}</p>}
                        </div>
                        <time className="text-[10px] text-muted-foreground font-mono shrink-0 mt-0.5">{new Date(it.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</time>
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
              <CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> Explore</CardTitle>
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

        {/* Footer band */}
        <footer className="border-t border-border bg-primary/5 mt-auto">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 text-center space-y-1">
            <p className="text-xs font-display tracking-wider uppercase">Nexus Zimbabwe</p>
            <p className="text-[10px] text-muted-foreground">Powered by NASH & NAPH · Integrated with Scholastic Services · Built by Aetheris Innovative Enterprises</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Tile({ to, title, body, icon: Icon }: { to: string; title: string; body: string; icon: any }) {
  return (
    <Link to={to} className="flex items-center gap-3 p-2 rounded border border-border hover:border-primary/50 transition-colors group">
      <Icon className="h-4 w-4 text-accent shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-[10px] text-muted-foreground truncate">{body}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}
