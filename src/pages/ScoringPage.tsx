import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { useAuth } from "@/context/AuthContext";

// Sport-specific scoring modules
const SCORING_MODULES = [
  {
    id: "football", label: "Football / Soccer",
    events: ["Goal", "Yellow Card", "Red Card", "Substitution", "Penalty", "Own Goal", "Offside"],
    periods: ["1st Half", "2nd Half", "Extra Time", "Penalties"],
  },
  {
    id: "rugby", label: "Rugby Union",
    events: ["Try (5pts)", "Conversion (2pts)", "Penalty (3pts)", "Drop Goal (3pts)", "Yellow Card", "Red Card"],
    periods: ["1st Half", "2nd Half", "Extra Time"],
  },
  {
    id: "cricket", label: "Cricket",
    events: ["Wicket", "No Ball", "Wide", "Boundary 4", "Six", "Dot Ball", "LBW", "Catch Out"],
    periods: ["1st Innings", "2nd Innings"],
  },
  {
    id: "basketball", label: "Basketball",
    events: ["2-Point Field Goal", "3-Point Field Goal", "Free Throw (1pt)", "Foul", "Technical Foul", "Timeout"],
    periods: ["Q1", "Q2", "Q3", "Q4", "OT"],
  },
  {
    id: "quiz", label: "Quiz / Academic",
    events: ["Correct Answer (+10)", "Buzzer First (+5)", "Wrong Answer (−5)", "Bonus Question (+20)", "Timeout"],
    periods: ["Round 1", "Round 2", "Round 3", "Final Round", "Tie-breaker"],
  },
  {
    id: "debate", label: "Debate",
    events: ["Point Awarded", "POI Accepted", "POI Rejected", "Time Warning", "Motion Win"],
    periods: ["Opening", "Rebuttal", "Summary", "Floor Questions"],
  },
  {
    id: "athletics", label: "Athletics",
    events: ["False Start", "DNS", "DNF", "Record Set", "Lane Violation", "Finish Recorded"],
    periods: ["Heat 1", "Heat 2", "Semi-Final", "Final"],
  },
  {
    id: "chess", label: "Chess",
    events: ["Win (1pt)", "Draw (0.5pt)", "Loss (0pt)", "Time Forfeit", "Illegal Move"],
    periods: ["Round 1","Round 2","Round 3","Round 4","Round 5","Final Round"],
  },
];

interface ScoreLog {
  id: number;
  event: string;
  team: "home" | "away";
  period: string;
  minute?: number;
  time: string;
}

export default function ScoringPage() {
  const { user } = useAuth();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [activeTeam, setActiveTeam] = useState<"home" | "away">("home");
  const [log, setLog] = useState<ScoreLog[]>([]);
  const [matchTime, setMatchTime] = useState(0);
  const [homeTeam, setHomeTeam] = useState("Home Team");
  const [awayTeam, setAwayTeam] = useState("Away Team");

  const module = SCORING_MODULES.find(m => m.id === selectedModule);

  const SCORE_EVENTS: Record<string, Record<string, number>> = {
    football: { "Goal": 1, "Penalty": 1 },
    rugby: { "Try (5pts)": 5, "Conversion (2pts)": 2, "Penalty (3pts)": 3, "Drop Goal (3pts)": 3 },
    cricket: { "Boundary 4": 4, "Six": 6 },
    basketball: { "2-Point Field Goal": 2, "3-Point Field Goal": 3, "Free Throw (1pt)": 1 },
    quiz: { "Correct Answer (+10)": 10, "Buzzer First (+5)": 5, "Wrong Answer (−5)": -5, "Bonus Question (+20)": 20 },
    debate: { "Point Awarded": 1, "Motion Win": 3 },
    chess: { "Win (1pt)": 1, "Draw (0.5pt)": 0.5 },
    athletics: {},
  };

  const logEvent = (event: string) => {
    const pts = SCORE_EVENTS[selectedModule!]?.[event] || 0;
    if (pts !== 0) {
      if (activeTeam === "home") setHomeScore(s => Math.max(0, s + pts));
      else setAwayScore(s => Math.max(0, s + pts));
    }
    const now = new Date();
    setLog(prev => [{
      id: Date.now(),
      event,
      team: activeTeam,
      period: module!.periods[currentPeriod],
      minute: matchTime,
      time: now.toLocaleTimeString("en-ZW", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    }, ...prev].slice(0, 50));
  };

  const reset = () => { setHomeScore(0); setAwayScore(0); setLog([]); setCurrentPeriod(0); setMatchTime(0); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />
      <div className="max-w-[1400px] mx-auto pt-20">
        {/* Page Header */}
        <div className="px-8 py-10 hairline-b">
          <p className="text-[10px] mono tracking-[0.25em] uppercase text-nexus-muted">Officials Portal</p>
          <h1 className="display-font text-display-lg font-bold text-foreground mt-1">Live Scoring Engine</h1>
          <p className="text-sm text-nexus-muted mt-2">Select a discipline module and start entering scores in real-time.</p>
          {!user && <p className="text-xs mono text-nexus-muted bg-nexus-surface hairline rounded-lg px-4 py-2.5 inline-block mt-3">⚠ Sign in as a scorer to submit official scores to the database</p>}
        </div>

        {!selectedModule ? (
          /* Module picker */
          <div className="p-8">
            <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted mb-5">Select Scoring Module</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SCORING_MODULES.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModule(mod.id)}
                  className="hairline rounded-xl p-5 text-left flex flex-col gap-2 hover:bg-nexus-surface/70 transition-colors btn-click card-shadow bg-background"
                >
                  <span className="display-font text-sm font-semibold text-foreground">{mod.label}</span>
                  <span className="text-[11px] mono text-nexus-muted">{mod.events.length} event types</span>
                  <span className="text-[10px] mono text-nexus-muted">{mod.periods.length} periods</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
            {/* Main scoring panel */}
            <div className="p-8 hairline-r">
              {/* Module header + back */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <button
                    onClick={() => { setSelectedModule(null); reset(); }}
                    className="text-xs mono text-nexus-muted hover:text-foreground flex items-center gap-1.5 mb-2 transition-colors"
                  >
                    ← Change Module
                  </button>
                  <p className="display-font text-xl font-bold text-foreground">{module?.label}</p>
                </div>
                <button onClick={reset} className="text-xs mono text-nexus-muted hover:text-foreground hairline px-3 py-1.5 rounded-md transition-colors">
                  Reset Match
                </button>
              </div>

              {/* Team name inputs */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <input
                  value={homeTeam}
                  onChange={e => setHomeTeam(e.target.value)}
                  className="bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all text-center"
                />
                <input
                  value={awayTeam}
                  onChange={e => setAwayTeam(e.target.value)}
                  className="bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all text-center"
                />
              </div>

              {/* Scoreboard */}
              <div className="hairline rounded-xl overflow-hidden mb-6">
                <div className="grid grid-cols-[1fr_auto_1fr]">
                  <button
                    onClick={() => setActiveTeam("home")}
                    className={`p-8 text-center transition-all duration-200 ${activeTeam === "home" ? "bg-foreground" : "bg-background hover:bg-nexus-surface/50"}`}
                  >
                    <p className={`text-[10px] mono tracking-[0.18em] uppercase mb-3 ${activeTeam === "home" ? "text-primary-foreground/60" : "text-nexus-muted"}`}>
                      {homeTeam}
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={homeScore}
                        className={`score-display text-score-lg ${activeTeam === "home" ? "text-primary-foreground" : "text-foreground"}`}
                        animate={{ opacity: [0.4, 1] }}
                        transition={{ duration: 0.25 }}
                      >
                        {homeScore}
                      </motion.p>
                    </AnimatePresence>
                    {activeTeam === "home" && <p className={`text-[10px] mono mt-3 text-primary-foreground/50`}>Active</p>}
                  </button>

                  <div className="px-6 flex flex-col items-center justify-center bg-nexus-surface/50 gap-2">
                    <span className="score-display text-2xl text-nexus-muted">:</span>
                    <span className="text-[10px] mono text-nexus-muted text-center">{module?.periods[currentPeriod]}</span>
                  </div>

                  <button
                    onClick={() => setActiveTeam("away")}
                    className={`p-8 text-center transition-all duration-200 ${activeTeam === "away" ? "bg-foreground" : "bg-background hover:bg-nexus-surface/50"}`}
                  >
                    <p className={`text-[10px] mono tracking-[0.18em] uppercase mb-3 ${activeTeam === "away" ? "text-primary-foreground/60" : "text-nexus-muted"}`}>
                      {awayTeam}
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={awayScore}
                        className={`score-display text-score-lg ${activeTeam === "away" ? "text-primary-foreground" : "text-foreground"}`}
                        animate={{ opacity: [0.4, 1] }}
                        transition={{ duration: 0.25 }}
                      >
                        {awayScore}
                      </motion.p>
                    </AnimatePresence>
                    {activeTeam === "away" && <p className={`text-[10px] mono mt-3 text-primary-foreground/50`}>Active</p>}
                  </button>
                </div>
              </div>

              {/* Period selector */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {module?.periods.map((period, i) => (
                  <button
                    key={period}
                    onClick={() => setCurrentPeriod(i)}
                    className={`px-4 py-2 text-xs font-semibold tracking-wide rounded-lg whitespace-nowrap flex-shrink-0 btn-click transition-all
                      ${currentPeriod === i ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              {/* Team selector */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setActiveTeam("home")}
                  className={`flex-1 py-3 text-sm font-semibold rounded-xl btn-click transition-all ${activeTeam === "home" ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}
                >
                  {homeTeam}
                </button>
                <button
                  onClick={() => setActiveTeam("away")}
                  className={`flex-1 py-3 text-sm font-semibold rounded-xl btn-click transition-all ${activeTeam === "away" ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}
                >
                  {awayTeam}
                </button>
              </div>

              {/* Event buttons */}
              <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted mb-3">Log Event for {activeTeam === "home" ? homeTeam : awayTeam}</p>
              <div className="flex flex-wrap gap-2">
                {module?.events.map((event) => {
                  const pts = SCORE_EVENTS[selectedModule]?.[event];
                  return (
                    <button
                      key={event}
                      onClick={() => logEvent(event)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-wide rounded-xl bg-nexus-surface hover:bg-foreground hover:text-primary-foreground text-foreground transition-all duration-200 btn-click hairline"
                    >
                      {event}
                      {pts !== undefined && pts !== 0 && (
                        <span className={`text-[10px] mono rounded-md px-1.5 py-0.5 ${pts > 0 ? "bg-foreground/10 text-foreground" : "bg-foreground text-primary-foreground"}`}>
                          {pts > 0 ? `+${pts}` : pts}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event log */}
            <div className="flex flex-col">
              <div className="px-6 py-5 hairline-b">
                <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">Event Log</p>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[600px]">
                {log.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-xs mono text-nexus-muted">Events will appear here as you score.</p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y" style={{ borderColor: "hsl(var(--silver-line))" }}>
                    {log.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.18 }}
                        className="px-6 py-4 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{entry.event}</p>
                          <p className="text-[10px] mono text-nexus-muted mt-0.5">
                            {entry.team === "home" ? homeTeam : awayTeam} · {entry.period}
                          </p>
                        </div>
                        <span className="text-[10px] mono text-nexus-muted flex-shrink-0">{entry.time}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Export summary */}
              {log.length > 0 && (
                <div className="p-5 hairline-t">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs mono text-nexus-muted">{log.length} events logged</p>
                    <button
                      onClick={() => {
                        const csv = ["Time,Team,Event,Period", ...log.map(e => `${e.time},${e.team === "home" ? homeTeam : awayTeam},${e.event},${e.period}`)].join("\n");
                        const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv])); a.download = "match_log.csv"; a.click();
                      }}
                      className="text-xs mono text-nexus-muted hover:text-foreground hairline px-3 py-1.5 rounded-md transition-colors"
                    >
                      Export CSV
                    </button>
                  </div>
                  <div className="hairline rounded-lg p-4 bg-nexus-surface/50 text-center">
                    <p className="score-display text-score-md text-foreground">{homeScore} — {awayScore}</p>
                    <p className="text-xs mono text-nexus-muted mt-1">{homeTeam} vs {awayTeam}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <NexusFooter />
    </div>
  );
}
