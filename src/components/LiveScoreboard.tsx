import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Match {
  id: string;
  sport: string;
  level: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  time: string;
  venue: string;
  isLive: boolean;
}

const LIVE_MATCHES: Match[] = [
  { id: "1", sport: "Football", level: "National League", homeTeam: "Dynamos FC", awayTeam: "Highlanders", homeScore: 2, awayScore: 1, status: "4th Quarter", time: "72:14", venue: "National Sports Stadium, Harare", isLive: true },
  { id: "2", sport: "Rugby", level: "Secondary Schools", homeTeam: "Prince Edward", awayTeam: "St George's", homeScore: 17, awayScore: 12, status: "2nd Half", time: "54:30", venue: "Old Hararians Sports Club", isLive: true },
  { id: "3", sport: "Chess", level: "Primary Schools", homeTeam: "Roosevelt Prim.", awayTeam: "Avondale Prim.", homeScore: 3, awayScore: 2, status: "Round 5", time: "—", venue: "Harare Chess Club", isLive: true },
  { id: "4", sport: "Athletics", level: "Club Level", homeTeam: "Harare AC", awayTeam: "Bulawayo AC", homeScore: 8, awayScore: 5, status: "Event 6 / 12", time: "—", venue: "Gwanzura Stadium", isLive: false },
  { id: "5", sport: "Debate", level: "National League", homeTeam: "University of Zim", awayTeam: "MSU Gweru", homeScore: 2, awayScore: 3, status: "3rd Motion", time: "38:00", venue: "HICC, Harare", isLive: true },
  { id: "6", sport: "Basketball", level: "Club Level", homeTeam: "Suns BC", awayTeam: "Eagles BC", homeScore: 64, awayScore: 58, status: "3rd Quarter", time: "04:22", venue: "YMCA, Harare", isLive: true },
];

export function LiveScoreboard() {
  const [activeMatch, setActiveMatch] = useState<string>("1");
  const [scores, setScores] = useState<Record<string, [number, number]>>(
    Object.fromEntries(LIVE_MATCHES.map((m) => [m.id, [m.homeScore, m.awayScore]]))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const liveMatches = LIVE_MATCHES.filter((m) => m.isLive);
      const randMatch = liveMatches[Math.floor(Math.random() * liveMatches.length)];
      const side = Math.random() > 0.5 ? 0 : 1;
      if (Math.random() > 0.7) {
        setScores((prev) => {
          const newScore = [...prev[randMatch.id]] as [number, number];
          newScore[side] += 1;
          return { ...prev, [randMatch.id]: newScore };
        });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const featured = LIVE_MATCHES.find((m) => m.id === activeMatch)!;
  const featuredScores = scores[featured.id];

  return (
    <section id="live" className="hairline-b">
      {/* Section header */}
      <div className="px-8 py-5 hairline-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-nexus-live animate-pulse" />
          <span className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">
            Live Scores
          </span>
        </div>
        <span className="text-xs mono text-nexus-muted bg-nexus-surface px-3 py-1.5 rounded-full">
          {LIVE_MATCHES.filter((m) => m.isLive).length} LIVE NOW
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px]">
        {/* Featured scoreboard */}
        <div className="p-8 md:p-12 hairline-r flex flex-col justify-between min-h-[440px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMatch}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="h-full flex flex-col gap-8"
            >
              {/* Meta */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  {featured.isLive && (
                    <span className="flex items-center gap-1.5 text-xs mono tracking-widest uppercase text-nexus-live bg-nexus-surface px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse" />
                      Live
                    </span>
                  )}
                  <span className="text-xs mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-3 py-1.5 rounded-full">
                    {featured.sport}
                  </span>
                  <span className="text-xs mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-3 py-1.5 rounded-full">
                    {featured.level}
                  </span>
                </div>
                <span className="text-xs mono text-nexus-muted hidden md:block">{featured.venue}</span>
              </div>

              {/* Main Score Display */}
              <div className="hairline rounded-xl overflow-hidden flex items-stretch">
                {/* Home */}
                <div className="flex-1 p-8 text-center hairline-r bg-background">
                  <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted mb-4">
                    {featured.homeTeam}
                  </p>
                  <motion.p
                    key={featuredScores[0]}
                    className="score-display text-score-lg text-foreground"
                    animate={{ opacity: [0.3, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    {featuredScores[0]}
                  </motion.p>
                </div>

                {/* Separator */}
                <div className="px-6 flex flex-col items-center justify-center gap-2 bg-nexus-surface/50">
                  <span className="score-display text-2xl text-nexus-muted">:</span>
                  <span className="text-xs mono text-nexus-muted text-center">{featured.status}</span>
                  {featured.time !== "—" && (
                    <span className="text-xs mono text-foreground hairline px-2.5 py-1 rounded-md">
                      {featured.time}
                    </span>
                  )}
                </div>

                {/* Away */}
                <div className="flex-1 p-8 text-center hairline-l bg-background">
                  <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted mb-4">
                    {featured.awayTeam}
                  </p>
                  <motion.p
                    key={featuredScores[1]}
                    className="score-display text-score-lg text-foreground"
                    animate={{ opacity: [0.3, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    {featuredScores[1]}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Match list */}
        <div className="flex flex-col divide-y" style={{ borderColor: "hsl(var(--silver-line))" }}>
          {LIVE_MATCHES.map((match) => (
            <button
              key={match.id}
              onClick={() => setActiveMatch(match.id)}
              className={`px-6 py-5 text-left flex items-center justify-between transition-colors duration-200 btn-click ${
                activeMatch === match.id
                  ? "bg-nexus-surface"
                  : "bg-background hover:bg-nexus-surface/60"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {match.isLive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-nexus-live flex-shrink-0 animate-pulse" />
                  )}
                  <span className="text-[10px] mono tracking-widest uppercase text-nexus-muted truncate">
                    {match.sport} · {match.level}
                  </span>
                </div>
                <p className="text-sm display-font font-semibold text-foreground">
                  {match.homeTeam}
                  <span className="mx-1.5 text-nexus-muted font-normal text-xs">vs</span>
                  {match.awayTeam}
                </p>
                <p className="text-xs mono text-nexus-muted mt-0.5">{match.status}</p>
              </div>
              <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                <span className="score-display text-xl text-foreground">{scores[match.id][0]}</span>
                <span className="score-display text-sm text-nexus-muted">–</span>
                <span className="score-display text-xl text-foreground">{scores[match.id][1]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
