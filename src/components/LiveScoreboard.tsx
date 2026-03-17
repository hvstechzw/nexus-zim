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
  home_team: { name: string } | null;
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

  useEffect(() => {
    const channel = supabase
      .channel("live-fixtures-rt")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "fixtures" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const featured = fixtures.find((f) => f.id === activeId) || fixtures[0];
  const liveCount = fixtures.filter((f) => f.status === "live").length;

  if (!fixtures.length) {
    return (
      <section id="live" className="hairline-b">
        <div className="px-4 sm:px-8 py-4 sm:py-5 hairline-b flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="w-2 h-2 rounded-full bg-nexus-live" />
            <span className="text-[10px] sm:text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">Live Scores</span>
          </div>
          <span className="text-[10px] sm:text-xs mono text-nexus-muted bg-nexus-surface px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">0 LIVE</span>
        </div>
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-6 sm:px-8">
          <div className="w-12 h-12 rounded-full bg-nexus-surface flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-nexus-muted">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>
            </svg>
          </div>
          <p className="text-nexus-muted text-sm font-medium">No live fixtures right now</p>
          <p className="text-nexus-muted text-xs mt-1 max-w-[32ch]">Matches will appear here once competitions and fixtures are created.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="live" className="hairline-b">
      <div className="px-4 sm:px-8 py-4 sm:py-5 hairline-b flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="w-2 h-2 rounded-full bg-nexus-live animate-pulse" />
          <span className="text-[10px] sm:text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">Live Scores</span>
        </div>
        <span className="text-[10px] sm:text-xs mono text-nexus-muted bg-nexus-surface px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">
          {liveCount} LIVE NOW
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
        {/* Featured */}
        <div className="p-5 sm:p-8 md:p-12 lg:hairline-r flex flex-col justify-between min-h-[320px] sm:min-h-[440px]">
          <AnimatePresence mode="wait">
            {featured && (
              <motion.div key={activeId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }} className="h-full flex flex-col gap-5 sm:gap-8">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {featured.status === "live" && (
                      <span className="flex items-center gap-1.5 text-[10px] sm:text-xs mono tracking-widest uppercase text-nexus-live bg-nexus-surface px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse" />Live
                      </span>
                    )}
                    <span className="text-[10px] sm:text-xs mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">
                      {featured.competition?.discipline}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs mono text-nexus-muted hidden sm:block">
                    {featured.venue ? `${featured.venue.name}, ${featured.venue.city}` : "TBD"}
                  </span>
                </div>

                <div className="hairline rounded-xl overflow-hidden flex items-stretch">
                  <div className="flex-1 p-5 sm:p-8 text-center hairline-r bg-background">
                    <p className="text-[10px] sm:text-xs mono tracking-[0.18em] uppercase text-nexus-muted mb-3 sm:mb-4 truncate">
                      {featured.home_team?.name || "Home"}
                    </p>
                    <motion.p key={featured.home_score} className="score-display text-4xl sm:text-score-lg text-foreground" animate={{ opacity: [0.3, 1] }} transition={{ duration: 0.3 }}>
                      {featured.home_score ?? 0}
                    </motion.p>
                  </div>
                  <div className="px-3 sm:px-6 flex flex-col items-center justify-center gap-1 sm:gap-2 bg-nexus-surface/50">
                    <span className="score-display text-xl sm:text-2xl text-nexus-muted">:</span>
                    <span className="text-[9px] sm:text-xs mono text-nexus-muted text-center">{featured.round_label || featured.status}</span>
                  </div>
                  <div className="flex-1 p-5 sm:p-8 text-center hairline-l bg-background">
                    <p className="text-[10px] sm:text-xs mono tracking-[0.18em] uppercase text-nexus-muted mb-3 sm:mb-4 truncate">
                      {featured.away_team?.name || "Away"}
                    </p>
                    <motion.p key={featured.away_score} className="score-display text-4xl sm:text-score-lg text-foreground" animate={{ opacity: [0.3, 1] }} transition={{ duration: 0.3 }}>
                      {featured.away_score ?? 0}
                    </motion.p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[10px] sm:text-xs mono text-nexus-muted">{featured.competition?.name}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Match list */}
        <div className="flex flex-col divide-y max-h-[440px] overflow-y-auto" style={{ borderColor: "hsl(var(--silver-line))" }}>
          {fixtures.map((match) => (
            <button
              key={match.id}
              onClick={() => setActiveId(match.id)}
              className={`px-4 sm:px-6 py-3 sm:py-5 text-left flex items-center justify-between transition-colors duration-200 btn-click ${
                activeId === match.id ? "bg-nexus-surface" : "bg-background hover:bg-nexus-surface/60"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                  {match.status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-nexus-live flex-shrink-0 animate-pulse" />}
                  <span className="text-[9px] sm:text-[10px] mono tracking-widest uppercase text-nexus-muted truncate">
                    {match.competition?.discipline}
                  </span>
                </div>
                <p className="text-xs sm:text-sm display-font font-semibold text-foreground truncate">
                  {match.home_team?.name || "TBD"}
                  <span className="mx-1 sm:mx-1.5 text-nexus-muted font-normal text-[10px] sm:text-xs">vs</span>
                  {match.away_team?.name || "TBD"}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                <span className="score-display text-lg sm:text-xl text-foreground">{match.home_score ?? 0}</span>
                <span className="score-display text-xs sm:text-sm text-nexus-muted">–</span>
                <span className="score-display text-lg sm:text-xl text-foreground">{match.away_score ?? 0}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
