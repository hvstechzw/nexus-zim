import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { detectSport as detectSportKey, SPORT_LIST } from "@/lib/sports/registry";
import type { SportKey } from "@/lib/sports/types";

type Sport = "all" | SportKey;

interface FixtureRow {
  id: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  round_label: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  home_team: { name: string | null; sport: string | null } | null;
  away_team: { name: string | null; sport: string | null } | null;
  competition: { name: string | null; discipline: string | null } | null;
  venue: { name: string | null; city: string | null } | null;
}

function detectSport(f: FixtureRow): SportKey {
  const blob = [
    f.competition?.discipline,
    f.home_team?.sport,
    f.away_team?.sport,
    f.competition?.name,
  ].filter(Boolean).join(" ");
  return detectSportKey(blob);
}

export default function LivePage() {
  const [sport, setSport] = useState<Sport>("all");

  const { data: fixtures = [], refetch } = useQuery({
    queryKey: ["live-page-fixtures"],
    queryFn: async () => {
      const { data } = await supabase
        .from("fixtures")
        .select(`
          id, status, home_score, away_score, round_label, scheduled_at, started_at,
          home_team:home_team_id(name, sport),
          away_team:away_team_id(name, sport),
          competition:competition_id(name, discipline),
          venue:venue_id(name, city)
        `)
        .in("status", ["live", "scheduled", "completed"])
        .order("started_at", { ascending: false, nullsFirst: false })
        .limit(60);
      return (data || []) as unknown as FixtureRow[];
    },
    refetchInterval: 8000,
  });

  useEffect(() => {
    const ch = supabase
      .channel("live-page-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "fixtures" }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "scores" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const filtered = useMemo(() => {
    if (sport === "all") return fixtures;
    return fixtures.filter((f) => detectSport(f) === sport);
  }, [fixtures, sport]);

  const liveOnes = filtered.filter((f) => f.status === "live");
  const upcoming = filtered.filter((f) => f.status === "scheduled");
  const recent = filtered.filter((f) => f.status === "completed");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[10px] mono tracking-[0.2em] uppercase text-nexus-muted">Realtime</p>
            <h1 className="text-display-lg display-font font-semibold mt-1">Live matches</h1>
            <p className="text-sm text-nexus-muted mt-1">
              All 15 NASH &amp; NAPH sports across Nexus, updating in realtime.
            </p>
          </div>
          <div className="flex hairline rounded-lg overflow-x-auto scrollbar-hide self-start max-w-full">
            {(["all", ...SPORT_LIST.map((s) => s.key)] as Sport[]).map((s) => (
              <button
                key={s}
                onClick={() => setSport(s)}
                className={`px-3 py-2 text-[10px] mono font-semibold tracking-widest uppercase transition-colors whitespace-nowrap ${
                  sport === s ? "bg-foreground text-primary-foreground" : "bg-background text-nexus-muted hover:text-foreground"
                }`}
              >
                {s === "all" ? "all" : SPORT_LIST.find((x) => x.key === s)?.label ?? s}
              </button>
            ))}
          </div>
        </header>

        <Section title="Live now" count={liveOnes.length} rows={liveOnes} empty="No matches are live right now." live />
        <Section title="Upcoming" count={upcoming.length} rows={upcoming} empty="No upcoming fixtures." />
        <Section title="Recent results" count={recent.length} rows={recent} empty="No completed matches yet." />
      </main>
      <NexusFooter />
    </div>
  );
}

function Section({
  title, count, rows, empty, live,
}: { title: string; count: number; rows: FixtureRow[]; empty: string; live?: boolean }) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {live && count > 0 && <span className="w-2 h-2 rounded-full bg-nexus-live animate-pulse" />}
          <h2 className="text-sm display-font font-semibold uppercase tracking-widest text-foreground">{title}</h2>
          <span className="text-[10px] mono text-nexus-muted">{count}</span>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="hairline rounded-xl p-6 text-center text-xs text-nexus-muted">{empty}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map((f) => <FixtureCard key={f.id} f={f} />)}
        </div>
      )}
    </section>
  );
}

function FixtureCard({ f }: { f: FixtureRow }) {
  const sport = detectSport(f);
  const when = f.started_at || f.scheduled_at;
  return (
    <Link
      to={`/broadcast/${f.id}`}
      className="hairline rounded-xl p-4 bg-background hover:bg-nexus-surface/60 transition-colors card-shadow block"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="pill-sport" data-sport={(sport as string) === "other" ? undefined : sport}>
          {(sport as string) === "other" ? (f.competition?.discipline || "match") : sport}
        </span>
        {f.status === "live" ? (
          <span className="flex items-center gap-1.5 text-[9px] mono uppercase tracking-widest text-nexus-live">
            <span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse" /> Live
          </span>
        ) : f.status === "completed" ? (
          <span className="text-[9px] mono uppercase tracking-widest text-nexus-muted">FT</span>
        ) : (
          <span className="text-[9px] mono uppercase tracking-widest text-nexus-muted">
            {when ? new Date(when).toLocaleString("en-ZW", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "TBD"}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm display-font font-semibold truncate">{f.home_team?.name || "TBD"}</p>
          <p className="text-sm display-font font-semibold truncate text-nexus-muted">{f.away_team?.name || "TBD"}</p>
        </div>
        <div className="text-right">
          <p className="score-display text-xl">{f.home_score ?? 0}</p>
          <p className="score-display text-xl text-nexus-muted">{f.away_score ?? 0}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] mono text-nexus-muted">
        <span className="truncate">{f.competition?.name || ""}</span>
        <span className="truncate">{f.venue?.name ? `${f.venue.name}${f.venue.city ? ` · ${f.venue.city}` : ""}` : ""}</span>
      </div>
    </Link>
  );
}
