import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NashHeader } from "@/components/nash/NashHeader";
import { LiveScoreBug } from "@/components/nash/LiveScoreBug";
import { TierBadge } from "@/components/nash/TierBadge";
import { SportBadge } from "@/components/nash/SportBadge";
import { AwardBadge } from "@/components/nash/AwardBadge";
import { Trophy, Tv, Star, Award, Sparkles, MapPin, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Broadcast Graphics Gallery — pulls the most recent real fixtures and MVPs
 * so producers can preview the NASH-branded CG stack against live data. Every
 * card links straight into /broadcast/:fixtureId for OBS capture.
 */
interface FixtureRow {
  id: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  round_label: string | null;
  scheduled_at: string | null;
  competition: { name: string; discipline: string; level: string } | null;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
}

function periodFor(f: FixtureRow) {
  if (f.status === "completed") return "FT";
  return f.round_label || "LIVE";
}

function statusFor(f: FixtureRow): "live" | "ht" | "ft" | "scheduled" {
  if (f.status === "completed") return "ft";
  if (f.status === "live") return "live";
  return "scheduled";
}

export default function BroadcastGalleryPage() {
  const qc = useQueryClient();

  // Realtime: refresh whenever any fixture/match_state changes
  useEffect(() => {
    const ch = supabase.channel("bcast-gallery")
      .on("postgres_changes", { event: "*", schema: "public", table: "fixtures" }, () => {
        qc.invalidateQueries({ queryKey: ["bcast-fixtures"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "match_state" }, () => {
        qc.invalidateQueries({ queryKey: ["bcast-fixtures"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ["bcast-fixtures"],
    queryFn: async () => {
      const { data } = await supabase
        .from("fixtures")
        .select(`id,status,home_score,away_score,round_label,scheduled_at,
                 competition:competition_id(name,discipline,level),
                 home_team:home_team_id(name),
                 away_team:away_team_id(name)`)
        .in("status", ["live", "completed", "scheduled"])
        .order("scheduled_at", { ascending: false })
        .limit(8);
      return (data || []) as unknown as FixtureRow[];
    },
    refetchInterval: 15000,
  });

  const { data: momFeed = [] } = useQuery({
    queryKey: ["bcast-mom"],
    queryFn: async () => {
      const { data } = await supabase
        .from("feed_items")
        .select("id,title,body,payload,created_at,fixture_id,athlete_id")
        .eq("kind", "mvp")
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    refetchInterval: 30000,
  });

  const { data: sponsors = [] } = useQuery({
    queryKey: ["bcast-sponsors"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("sponsorships")
        .select("sponsor_name, sponsor_logo")
        .limit(4);
      return (data || []) as { sponsor_name: string; sponsor_logo: string | null }[];
    },
  });

  const live = fixtures.filter(f => f.status === "live").slice(0, 4);
  const recent = fixtures.filter(f => f.status === "completed").slice(0, 4);
  const upcoming = fixtures.filter(f => f.status === "scheduled").slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div>
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Broadcast · Live CG Feed</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">On-Air Graphics — Live Data</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real fixtures from the database. Tap any card to open the transparent overlay at{" "}
            <code className="text-[10px] bg-muted px-1 rounded">/broadcast/:id</code> for OBS Browser Source.
          </p>
        </div>

        {/* Live Score Bug */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display tracking-wide flex items-center gap-2">
              <Tv className="h-4 w-4 text-accent" /> Score Bug
              <Badge variant="outline" className="ml-2 text-[9px]">{live.length} live</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <p className="text-xs text-muted-foreground">Loading fixtures…</p>}
            {!isLoading && live.length === 0 && recent.length === 0 && (
              <p className="text-xs text-muted-foreground">No live or completed fixtures yet. Once scoring starts, real bugs will appear here.</p>
            )}
            <div className="grid gap-3">
              {[...live, ...recent].map(f => (
                <Link key={f.id} to={`/broadcast/${f.id}`} className="block hover:opacity-90 transition-opacity">
                  <LiveScoreBug
                    homeName={f.home_team?.name || "Home"}
                    awayName={f.away_team?.name || "Away"}
                    homeScore={f.home_score ?? 0}
                    awayScore={f.away_score ?? 0}
                    period={periodFor(f)}
                    status={statusFor(f)}
                  />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Player of the Match — real feed_items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display tracking-wide flex items-center gap-2">
              <Award className="h-4 w-4 text-accent" /> Player of the Match
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {momFeed.length === 0 ? (
              <p className="text-xs text-muted-foreground">No MoM awards recorded yet.</p>
            ) : momFeed.map((m: any) => (
              <MoMCard key={m.id} title={m.title} sub={m.body} />
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Fixture Reveal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display tracking-wide flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" /> Fixture Reveal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground">No upcoming fixtures scheduled.</p>
            ) : upcoming.map(f => (
              <BracketRevealCard key={f.id}
                tier={(f.competition?.level?.toLowerCase().includes("nation") ? "national"
                     : f.competition?.level?.toLowerCase().includes("prov") ? "provincial"
                     : f.competition?.level?.toLowerCase().includes("dist") ? "district" : "zonal")}
                sport={(f.competition?.discipline?.startsWith("H") ? "HB" : "NB")}
                name={f.competition?.name || "Competition"}
                sub={`${f.home_team?.name || "TBD"} vs ${f.away_team?.name || "TBD"}${f.scheduled_at ? " · " + new Date(f.scheduled_at).toLocaleString() : ""}`}
              />
            ))}
          </CardContent>
        </Card>

        {/* Sponsor billboard */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display tracking-wide flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" /> Sponsor Billboard
              <Badge variant="outline" className="ml-2 text-[9px]">{sponsors.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sponsors.length === 0 ? (
              <p className="text-xs text-muted-foreground">No sponsors configured yet. Add them under Admin → Sponsorships.</p>
            ) : sponsors.map((s, i) => (
              <SponsorBillboard key={i} name={s.sponsor_name} tagline={s.notes || "Official partner"} logo={s.sponsor_logo} />
            ))}
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center pt-2">
          <Sparkles className="h-3 w-3 inline mr-1 text-accent" />
          Powered by NASH & NAPH · Real-time from Nexus scoring consoles
        </p>
      </div>
    </div>
  );
}

function MoMCard({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="bg-gradient-to-br from-accent to-[hsl(var(--nash-gold-light))] text-accent-foreground border-2 border-accent rounded p-6 text-center">
      <AwardBadge kind="best_player" className="bg-primary text-primary-foreground border-primary" />
      <div className="font-display font-black text-2xl mt-3 leading-none uppercase">{title}</div>
      {sub && <div className="text-xs mt-2 font-mono opacity-80">{sub}</div>}
    </div>
  );
}

function BracketRevealCard({ tier, sport, name, sub }: { tier: "national" | "provincial" | "district" | "zonal"; sport: string; name: string; sub?: string }) {
  return (
    <div className="bg-primary text-primary-foreground border-2 border-accent rounded p-6">
      <div className="flex items-center justify-between mb-2">
        <TierBadge tier={tier} />
        <SportBadge code={sport} />
      </div>
      <div className="font-display font-bold text-xl mt-2">{name}</div>
      {sub && <div className="text-xs text-accent mt-1">{sub}</div>}
    </div>
  );
}

function SponsorBillboard({ name, tagline, logo }: { name: string; tagline: string; logo: string | null }) {
  return (
    <div className="bg-card border-2 border-border rounded p-6 flex items-center gap-6">
      <div className="text-center px-4 border-r-2 border-accent/30 pr-6">
        <p className="text-[9px] font-display tracking-[0.3em] uppercase text-accent">NASH</p>
        <p className="font-display font-bold">NEXUS</p>
      </div>
      {logo && <img src={logo} alt={name} className="w-14 h-14 rounded bg-white p-1 object-contain" />}
      <div className="flex-1">
        <div className="text-[10px] font-display tracking-wider uppercase text-muted-foreground">Official Partner</div>
        <div className="font-display font-bold text-xl">{name}</div>
        <div className="text-xs text-muted-foreground">{tagline}</div>
      </div>
    </div>
  );
}
