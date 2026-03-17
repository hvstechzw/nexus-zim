import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface LiveFixture {
  id: string;
  competition_id: string;
  home_score: number;
  away_score: number;
  status: string;
  round_label: string | null;
  started_at: string | null;
  home_team: { name: string; discipline?: string } | null;
  away_team: { name: string } | null;
  competition: { name: string; level: string; discipline: string } | null;
  venue: { name: string; city: string } | null;
}

export function LiveScoreboard() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: fixtures = [], refetch } = useQuery({
    queryKey: ["live-fixtures"],
    queryFn: async () => {
      const { data } = await supabase
        .from("fixtures")
        .select(`
          id, home_score, away_score, status, round_label, started_at, competition_id,
          home_team:home_team_id(name),
          away_team:away_team_id(name),
          competition:competition_id(name, level, discipline),
          venue:venue_id(name, city)
        `)
        .in("status", ["live", "scheduled"])
        .order("started_at", { ascending: false })
        .limit(12);
      return (data || []) as unknown as LiveFixture[];
    },
    refetchInterval: 8000,
  });

  useEffect(() => {
    if (fixtures.length && !activeId) setActiveId(fixtures[0].id);
  }, [fixtures, activeId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("live-fixtures-rt")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "fixtures" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const featured = fixtures.find(f => f.id === activeId) || fixtures[0];
  const liveCount = fixtures.filter(f => f.status === "live").length;

  if (!fixtures.length) {
    return (
      <section id="live" className="hairline-b">
        <div className="px-8 py-5 hairline-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-nexus-live" />
            <span className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">Live Scores</span>
          </div>
          <span className="text-xs mono text-nexus-muted bg-nexus-surface px-3 py-1.5 rounded-full">0 LIVE NOW</span>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center px-8">
          <p className="text-nexus-muted mono text-sm">No live or scheduled fixtures at this time.</p>
          <p className="text-nexus-muted mono text-xs mt-2">Fixtures will appear here once competitions and matches are created.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="live" className="hairline-b">
      <div className="px-8 py-5 hairline-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-nexus-live animate-pulse" />
          <span className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">Live Scores</span>
        </div>
        <span className="text-xs mono text-nexus-muted bg-nexus-surface px-3 py-1.5 rounded-full">
          {liveCount} LIVE NOW
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px]">
        {/* Featured scoreboard */}
        <div className="p-8 md:p-12 hairline-r flex flex-col justify-between min-h-[440px]">
          <AnimatePresence mode="wait">
            {featured && (
              <motion.div
                key={activeId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="h-full flex flex-col gap-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    {featured.status === "live" && (
                      <span className="flex items-center gap-1.5 text-xs mono tracking-widest uppercase text-nexus-live bg-nexus-surface px-3 py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse" />Live
                      </span>
                    )}
                    <span className="text-xs mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-3 py-1.5 rounded-full">
                      {featured.competition?.discipline}
                    </span>
                    <span className="text-xs mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-3 py-1.5 rounded-full">
                      {featured.competition?.level?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className="text-xs mono text-nexus-muted hidden md:block">
                    {featured.venue ? `${featured.venue.name}, ${featured.venue.city}` : "TBD"}
                  </span>
                </div>

                <div className="hairline rounded-xl overflow-hidden flex items-stretch">
                  <div className="flex-1 p-8 text-center hairline-r bg-background">
                    <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted mb-4">
                      {featured.home_team?.name || "Home"}
                    </p>
                    <motion.p
                      key={featured.home_score}
                      className="score-display text-score-lg text-foreground"
                      animate={{ opacity: [0.3, 1] }}
                      transition={{ duration: 0.3 }}
                    >
                      {featured.home_score ?? 0}
                    </motion.p>
                  </div>
                  <div className="px-6 flex flex-col items-center justify-center gap-2 bg-nexus-surface/50">
                    <span className="score-display text-2xl text-nexus-muted">:</span>
                    <span className="text-xs mono text-nexus-muted text-center">{featured.round_label || featured.status}</span>
                  </div>
                  <div className="flex-1 p-8 text-center hairline-l bg-background">
                    <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted mb-4">
                      {featured.away_team?.name || "Away"}
                    </p>
                    <motion.p
                      key={featured.away_score}
                      className="score-display text-score-lg text-foreground"
                      animate={{ opacity: [0.3, 1] }}
                      transition={{ duration: 0.3 }}
                    >
                      {featured.away_score ?? 0}
                    </motion.p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs mono text-nexus-muted">{featured.competition?.name}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Match list */}
        <div className="flex flex-col divide-y" style={{ borderColor: "hsl(var(--silver-line))" }}>
          {fixtures.map((match) => (
            <button
              key={match.id}
              onClick={() => setActiveId(match.id)}
              className={`px-6 py-5 text-left flex items-center justify-between transition-colors duration-200 btn-click ${
                activeId === match.id ? "bg-nexus-surface" : "bg-background hover:bg-nexus-surface/60"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {match.status === "live" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-nexus-live flex-shrink-0 animate-pulse" />
                  )}
                  <span className="text-[10px] mono tracking-widest uppercase text-nexus-muted truncate">
                    {match.competition?.discipline} · {match.competition?.level?.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-sm display-font font-semibold text-foreground">
                  {match.home_team?.name || "TBD"}
                  <span className="mx-1.5 text-nexus-muted font-normal text-xs">vs</span>
                  {match.away_team?.name || "TBD"}
                </p>
                <p className="text-xs mono text-nexus-muted mt-0.5">{match.round_label || match.status}</p>
              </div>
              <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                <span className="score-display text-xl text-foreground">{match.home_score ?? 0}</span>
                <span className="score-display text-sm text-nexus-muted">–</span>
                <span className="score-display text-xl text-foreground">{match.away_score ?? 0}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
