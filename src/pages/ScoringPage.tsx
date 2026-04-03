import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const SCORING_MODULES = [
  { id: "football", label: "Football", sub: "Soccer", events: ["Goal","Yellow Card","Red Card","Substitution","Penalty","Own Goal","Corner","Offside"], periods: ["1st Half","2nd Half","Extra Time AET","Penalties"] },
  { id: "rugby", label: "Rugby Union", sub: "", events: ["Try (5pts)","Conversion (2pts)","Penalty Kick (3pts)","Drop Goal (3pts)","Yellow Card","Red Card"], periods: ["1st Half","2nd Half","Extra Time"] },
  { id: "cricket", label: "Cricket", sub: "", events: ["Wicket","No Ball","Wide","Boundary 4","Six","Dot Ball","LBW","Run Out","Catch Out"], periods: ["1st Innings","2nd Innings","Super Over"] },
  { id: "basketball", label: "Basketball", sub: "", events: ["2-Point Field Goal","3-Point Field Goal","Free Throw (1pt)","Foul","Technical Foul","Timeout","Substitution"], periods: ["Q1","Q2","Q3","Q4","OT"] },
  { id: "volleyball", label: "Volleyball", sub: "", events: ["Point","Ace (Service Point)","Attack Kill","Block Kill","Opponent Error","Substitution","Timeout","Set Won"], periods: ["Set 1","Set 2","Set 3","Set 4","Set 5 (Tie-break)"] },
  { id: "netball", label: "Netball", sub: "", events: ["Goal","Turnover","Foul","Obstruction","Substitution","Penalty"], periods: ["Q1","Q2","Q3","Q4"] },
  { id: "quiz", label: "Quiz", sub: "Academic", events: ["Correct Answer (+10)","Buzzer First (+5)","Wrong Answer (-5)","Bonus Question (+20)","Pass","Timeout"], periods: ["Round 1","Round 2","Round 3","Final Round","Tie-breaker"] },
  { id: "debate", label: "Debate", sub: "Arts", events: ["Point Awarded","POI Accepted","POI Rejected","Time Warning","Motion Win","Style Mark","Substance Mark"], periods: ["Opening","Rebuttal","Summary","Floor Questions"] },
  { id: "athletics", label: "Athletics", sub: "Track & Field", events: ["False Start","DNS","DNF","Record Set","Lane Violation","Finish Recorded","DQ"], periods: ["Heat 1","Heat 2","Semi-Final","Final"] },
  { id: "chess", label: "Chess", sub: "", events: ["Win (1pt)","Draw (0.5pt)","Loss (0pt)","Time Forfeit","Illegal Move","Resignation"], periods: ["Round 1","Round 2","Round 3","Round 4","Round 5","Final Round"] },
  { id: "swimming", label: "Swimming", sub: "", events: ["False Start","DQ","DNS","DNF","Record Set","Finish Recorded"], periods: ["Heat","Semi-Final","Final"] },
  { id: "hockey", label: "Field Hockey", sub: "", events: ["Goal","Penalty Corner","Penalty Stroke","Yellow Card","Red Card","Green Card","Substitution"], periods: ["1st Half","2nd Half","Extra Time","Shootout"] },
];

const SCORE_EVENTS: Record<string, Record<string, number>> = {
  football: { "Goal": 1, "Penalty": 1, "Own Goal": 1 },
  rugby: { "Try (5pts)": 5, "Conversion (2pts)": 2, "Penalty Kick (3pts)": 3, "Drop Goal (3pts)": 3 },
  cricket: { "Boundary 4": 4, "Six": 6, "Wicket": 0, "No Ball": 1, "Wide": 1 },
  basketball: { "2-Point Field Goal": 2, "3-Point Field Goal": 3, "Free Throw (1pt)": 1 },
  volleyball: { "Point": 1, "Ace (Service Point)": 1, "Attack Kill": 1, "Block Kill": 1, "Opponent Error": 1, "Set Won": 0 },
  netball: { "Goal": 1 },
  quiz: { "Correct Answer (+10)": 10, "Buzzer First (+5)": 5, "Wrong Answer (-5)": -5, "Bonus Question (+20)": 20 },
  debate: { "Point Awarded": 1, "Motion Win": 3, "Style Mark": 1, "Substance Mark": 1 },
  chess: { "Win (1pt)": 1, "Draw (0.5pt)": 0.5 },
  athletics: {}, swimming: {},
  hockey: { "Goal": 1, "Penalty Stroke": 1 },
};

const SPORT_ICONS: Record<string, string> = {
  football: "M12 2a10 10 0 100 20 10 10 0 000-20z",
  rugby: "M12 2c-2 0-6 4-6 10s4 10 6 10 6-4 6-10-4-10-6-10z",
  cricket: "M12 2a10 10 0 100 20 10 10 0 000-20z",
  basketball: "M12 2a10 10 0 100 20 10 10 0 000-20z",
  volleyball: "M12 2a10 10 0 100 20 10 10 0 000-20z",
  netball: "M12 2a10 10 0 100 20 10 10 0 000-20z",
  quiz: "M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01",
  debate: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  athletics: "M13 4h-2l-1 7h4l-1-7zM9 20l3-7 3 7",
  chess: "M12 2l2 7h-4l2-7zM8 22h8l-1-5H9l-1 5z",
  swimming: "M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0",
  hockey: "M2 22L12 2l2 8h8",
};

interface ScoreLog { id: number; event: string; team: "home"|"away"; period: string; minute?: number; time: string; }

export default function ScoringPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedModule, setSelectedModule] = useState<string|null>(null);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string|null>(null);
  const [currentPeriod, setCurrentPeriod] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [activeTeam, setActiveTeam] = useState<"home"|"away">("home");
  const [log, setLog] = useState<ScoreLog[]>([]);
  const [matchStarted, setMatchStarted] = useState(false);
  const [matchTime, setMatchTime] = useState(0);
  const [homeTeam, setHomeTeam] = useState("Home");
  const [awayTeam, setAwayTeam] = useState("Away");
  const [sessionMode, setSessionMode] = useState<"official"|"friendly"|"local">("official");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const module = SCORING_MODULES.find(m => m.id === selectedModule);

  useEffect(() => {
    if (matchStarted) {
      timerRef.current = setInterval(() => setMatchTime(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [matchStarted]);

  const mins = Math.floor(matchTime / 60);
  const secs = matchTime % 60;
  const timeDisplay = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const { data: competitions = [] } = useQuery({
    queryKey: ["scoring-competitions"],
    queryFn: async () => {
      const { data } = await supabase.from("competitions").select("id, name, discipline, level")
        .in("status", ["ongoing","registration_closed"]).order("name").limit(50);
      return data || [];
    },
    enabled: !!selectedModule && sessionMode === "official",
  });

  const [selectedCompId, setSelectedCompId] = useState<string>("");

  const { data: fixtures = [] } = useQuery({
    queryKey: ["scoring-fixtures", selectedCompId],
    queryFn: async () => {
      if (!selectedCompId) return [];
      const { data } = await supabase.from("fixtures")
        .select(`id, round_label, status, home_score, away_score,
          home_team:home_team_id(name), away_team:away_team_id(name)`)
        .eq("competition_id", selectedCompId)
        .in("status", ["scheduled","live"])
        .order("scheduled_at");
      return data || [];
    },
    enabled: !!selectedCompId && sessionMode === "official",
  });

  const isDbMode = sessionMode === "official" && user && selectedFixtureId;

  const startMatch = async () => {
    setMatchStarted(true);
    if (isDbMode) {
      await supabase.from("fixtures").update({ status: "live", started_at: new Date().toISOString() }).eq("id", selectedFixtureId);
      toast({ title: "Match started", description: "Timer running. Events are now logged live." });
    } else {
      toast({ title: "Match started", description: sessionMode === "official" ? "Local mode — not saving to database." : `${sessionMode === "friendly" ? "Friendly" : "Local"} session started.` });
    }
  };

  const logEvent = async (event: string) => {
    const pts = SCORE_EVENTS[selectedModule!]?.[event] || 0;
    if (pts !== 0) {
      if (activeTeam === "home") setHomeScore(s => Math.max(0, s + pts));
      else setAwayScore(s => Math.max(0, s + pts));
    }
    const now = new Date();
    const entry: ScoreLog = {
      id: Date.now(), event, team: activeTeam,
      period: module!.periods[currentPeriod], minute: mins,
      time: now.toLocaleTimeString("en-ZW", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    setLog(prev => [entry, ...prev].slice(0, 50));

    if (isDbMode) {
      try {
        const newHome = activeTeam === "home" ? homeScore + pts : homeScore;
        const newAway = activeTeam === "away" ? awayScore + pts : awayScore;
        await Promise.all([
          supabase.from("score_entries").insert({
            fixture_id: selectedFixtureId!,
            event_type: event,
            team_id: null,
            value: pts || null,
            period: module!.periods[currentPeriod],
            minute: mins,
            scorer_id: user!.id,
            metadata: { team: activeTeam },
          }),
          supabase.from("fixtures").update({
            home_score: newHome,
            away_score: newAway,
            status: "live",
          }).eq("id", selectedFixtureId!),
        ]);
      } catch {}
    }
  };

  const reset = () => {
    setHomeScore(0); setAwayScore(0); setLog([]); setCurrentPeriod(0);
    setMatchTime(0); setMatchStarted(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const finalizeMatch = async () => {
    setMatchStarted(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (isDbMode) {
      await supabase.from("fixtures").update({
        status: "completed", home_score: homeScore, away_score: awayScore,
        ended_at: new Date().toISOString()
      }).eq("id", selectedFixtureId!);
    }
    toast({ title: "Match finalized", description: `Final score: ${homeScore} - ${awayScore}` });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />
      <div className="max-w-[1400px] mx-auto pt-16 sm:pt-20">
        <div className="px-4 sm:px-8 py-6 sm:py-10 hairline-b">
          <p className="text-[10px] mono tracking-[0.25em] uppercase text-nexus-muted">Officials Portal</p>
          <h1 className="display-font text-xl sm:text-3xl font-bold text-foreground mt-1">Live Scoring Engine</h1>
          <p className="text-xs sm:text-sm text-nexus-muted mt-2 max-w-[60ch]">Select a discipline, choose your session mode, and log events in real-time.</p>

          {/* Session Mode Selector */}
          <div className="flex gap-1.5 p-1.5 bg-nexus-surface rounded-xl mt-4 w-fit">
            {([
              { id: "official" as const, label: "Official", desc: "Saves to database" },
              { id: "friendly" as const, label: "Friendly", desc: "Not recorded" },
              { id: "local" as const, label: "Local Use", desc: "Offline mode" },
            ]).map(m => (
              <button key={m.id} onClick={() => setSessionMode(m.id)}
                className={`px-3 sm:px-4 py-2 text-xs tracking-wide font-semibold rounded-lg transition-all duration-200 btn-click
                  ${sessionMode === m.id ? "bg-background text-foreground shadow-sm" : "text-nexus-muted hover:text-foreground"}`}
                title={m.desc}>
                {m.label}
              </button>
            ))}
          </div>

          {sessionMode !== "official" && (
            <div className="mt-3 inline-flex items-center gap-2 text-xs mono text-nexus-muted bg-nexus-surface hairline rounded-lg px-4 py-2.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {sessionMode === "friendly" ? "Friendly match — scores will not be recorded in the database or affect standings." : "Local session — everything stays on your device. No sign-in needed."}
            </div>
          )}

          {sessionMode === "official" && !user && (
            <p className="text-xs mono text-nexus-muted bg-nexus-surface hairline rounded-lg px-4 py-2.5 inline-block mt-3">
              Sign in as a scorer or referee to submit official scores to the database
            </p>
          )}
        </div>

        {!selectedModule ? (
          <div className="p-4 sm:p-8">
            <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted mb-5">Select Scoring Module</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
              {SCORING_MODULES.map((mod, i) => (
                <motion.button
                  key={mod.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                  onClick={() => setSelectedModule(mod.id)}
                  className="hairline rounded-2xl p-4 sm:p-5 text-left flex flex-col gap-2 sm:gap-3 hover:bg-nexus-surface/70 hover:scale-[1.02] transition-all duration-200 btn-click card-shadow bg-background group"
                >
                  <div className="w-8 h-8 rounded-lg bg-nexus-surface flex items-center justify-center flex-shrink-0 group-hover:bg-foreground transition-colors duration-200">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-nexus-muted group-hover:text-primary-foreground transition-colors">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <div>
                    <span className="display-font text-xs sm:text-sm font-bold text-foreground leading-tight block">{mod.label}</span>
                    {mod.sub && <span className="text-[10px] mono text-nexus-muted">{mod.sub}</span>}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] mono text-nexus-muted">{mod.events.length} events</span>
                    <span className="text-[10px] mono text-nexus-muted">{mod.periods.length} periods</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px]">
            {/* Main scoring panel */}
            <div className="p-4 sm:p-8 lg:hairline-r">
              <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
                <div>
                  <button onClick={() => { setSelectedModule(null); reset(); }} className="text-xs mono text-nexus-muted hover:text-foreground flex items-center gap-1.5 mb-1 transition-colors">
                    ← Change Module
                  </button>
                  <div className="flex items-center gap-2">
                    <p className="display-font text-lg sm:text-xl font-bold text-foreground">{module?.label}</p>
                    {sessionMode !== "official" && (
                      <span className="text-[9px] mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-nexus-surface text-nexus-muted">
                        {sessionMode}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={finalizeMatch} className="h-8 sm:h-9 px-3 sm:px-4 text-xs font-semibold tracking-wide rounded-lg bg-nexus-surface text-foreground hover:bg-nexus-silver transition-colors btn-click">
                    Finalize
                  </button>
                  <button onClick={reset} className="text-xs mono text-nexus-muted hover:text-foreground hairline px-3 py-1.5 rounded-md transition-colors">Reset</button>
                </div>
              </div>

              {/* Fixture selector — only in official mode */}
              {sessionMode === "official" && user && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 sm:mb-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold">Competition</label>
                    <select value={selectedCompId} onChange={e => { setSelectedCompId(e.target.value); setSelectedFixtureId(null); }}
                      className="bg-nexus-surface hairline rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none cursor-pointer">
                      <option value="">-- Select --</option>
                      {(competitions as any[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold">Fixture</label>
                    <select value={selectedFixtureId || ""} onChange={e => {
                        const f = (fixtures as any[]).find(x => x.id === e.target.value);
                        setSelectedFixtureId(e.target.value);
                        if (f) {
                          setHomeTeam(f.home_team?.name || "Home");
                          setAwayTeam(f.away_team?.name || "Away");
                          setHomeScore(f.home_score || 0);
                          setAwayScore(f.away_score || 0);
                        }
                      }}
                      className="bg-nexus-surface hairline rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none cursor-pointer">
                      <option value="">-- Select --</option>
                      {(fixtures as any[]).map(f => (
                        <option key={f.id} value={f.id}>{f.home_team?.name || "TBD"} vs {f.away_team?.name || "TBD"} ({f.round_label || f.status})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Team name inputs */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                <input value={homeTeam} onChange={e => setHomeTeam(e.target.value)}
                  className="bg-nexus-surface hairline rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-foreground focus:outline-none text-center" />
                <input value={awayTeam} onChange={e => setAwayTeam(e.target.value)}
                  className="bg-nexus-surface hairline rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-foreground focus:outline-none text-center" />
              </div>

              {/* Scoreboard + Timer */}
              <div className="hairline rounded-xl overflow-hidden mb-3 sm:mb-4">
                <div className="grid grid-cols-[1fr_auto_1fr]">
                  <button onClick={() => setActiveTeam("home")}
                    className={`p-4 sm:p-8 text-center transition-all duration-200 ${activeTeam === "home" ? "bg-foreground" : "bg-background hover:bg-nexus-surface/50"}`}>
                    <p className={`text-[9px] sm:text-[10px] mono tracking-[0.18em] uppercase mb-2 sm:mb-3 truncate ${activeTeam === "home" ? "text-primary-foreground/60" : "text-nexus-muted"}`}>{homeTeam}</p>
                    <motion.p key={homeScore} className={`score-display text-3xl sm:text-score-lg ${activeTeam === "home" ? "text-primary-foreground" : "text-foreground"}`} animate={{ scale: [1.15, 1] }} transition={{ duration: 0.2 }}>
                      {homeScore}
                    </motion.p>
                    {activeTeam === "home" && <p className="text-[9px] sm:text-[10px] mono mt-2 sm:mt-3 text-primary-foreground/50">Active</p>}
                  </button>
                  <div className="px-3 sm:px-6 flex flex-col items-center justify-center bg-nexus-surface/50 gap-1 sm:gap-2 min-w-[60px] sm:min-w-[80px]">
                    <span className="score-display text-xl sm:text-2xl text-nexus-muted">:</span>
                    <div className={`px-2 py-1 rounded-md text-center ${matchStarted ? "bg-foreground" : "bg-nexus-surface"}`}>
                      <span className={`text-[10px] sm:text-[11px] mono font-bold tracking-wider ${matchStarted ? "text-primary-foreground" : "text-nexus-muted"}`}>
                        {timeDisplay}
                      </span>
                    </div>
                    <span className="text-[8px] sm:text-[9px] mono text-nexus-muted text-center leading-tight">{module?.periods[currentPeriod]}</span>
                  </div>
                  <button onClick={() => setActiveTeam("away")}
                    className={`p-4 sm:p-8 text-center transition-all duration-200 ${activeTeam === "away" ? "bg-foreground" : "bg-background hover:bg-nexus-surface/50"}`}>
                    <p className={`text-[9px] sm:text-[10px] mono tracking-[0.18em] uppercase mb-2 sm:mb-3 truncate ${activeTeam === "away" ? "text-primary-foreground/60" : "text-nexus-muted"}`}>{awayTeam}</p>
                    <motion.p key={awayScore} className={`score-display text-3xl sm:text-score-lg ${activeTeam === "away" ? "text-primary-foreground" : "text-foreground"}`} animate={{ scale: [1.15, 1] }} transition={{ duration: 0.2 }}>
                      {awayScore}
                    </motion.p>
                    {activeTeam === "away" && <p className="text-[9px] sm:text-[10px] mono mt-2 sm:mt-3 text-primary-foreground/50">Active</p>}
                  </button>
                </div>
              </div>

              {/* Match Control Row */}
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 flex-wrap">
                {!matchStarted ? (
                  <button onClick={startMatch}
                    className="flex items-center gap-2 h-9 px-4 sm:px-5 bg-foreground text-primary-foreground text-xs font-bold tracking-wide rounded-lg hover:opacity-85 transition-opacity btn-click">
                    <span className="w-2 h-2 rounded-full bg-primary-foreground/70 animate-pulse" />
                    Start Match
                  </button>
                ) : (
                  <button onClick={() => setMatchStarted(false)}
                    className="flex items-center gap-2 h-9 px-4 sm:px-5 bg-nexus-surface text-foreground text-xs font-bold tracking-wide rounded-lg hover:bg-nexus-silver transition-colors btn-click">
                    <span className="w-2 h-2 rounded-full bg-nexus-live animate-pulse" />
                    Pause Timer
                  </button>
                )}
                <button onClick={() => matchStarted ? setMatchStarted(false) : setMatchStarted(true)}
                  className="h-9 w-9 flex items-center justify-center hairline rounded-lg text-nexus-muted hover:text-foreground transition-colors btn-click"
                  title={matchStarted ? "Pause" : "Resume"}>
                  {matchStarted ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  )}
                </button>
                <span className="text-[10px] mono text-nexus-muted ml-auto flex items-center gap-1.5">
                  {matchStarted && <span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse" />}
                  {matchStarted ? "Live" : "Paused"}
                  {isDbMode && " · DB"}
                  {!isDbMode && sessionMode !== "official" && ` · ${sessionMode}`}
                </span>
              </div>

              {/* Period selector */}
              <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-5 overflow-x-auto pb-1 scrollbar-hide">
                {module?.periods.map((period, i) => (
                  <button key={period} onClick={() => setCurrentPeriod(i)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold tracking-wide rounded-lg whitespace-nowrap flex-shrink-0 btn-click transition-all
                      ${currentPeriod === i ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}>
                    {period}
                  </button>
                ))}
              </div>

              {/* Team selector */}
              <div className="flex gap-2 mb-4 sm:mb-5">
                <button onClick={() => setActiveTeam("home")}
                  className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold rounded-xl btn-click transition-all ${activeTeam === "home" ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}>
                  {homeTeam}
                </button>
                <button onClick={() => setActiveTeam("away")}
                  className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold rounded-xl btn-click transition-all ${activeTeam === "away" ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}>
                  {awayTeam}
                </button>
              </div>

              {/* Events */}
              <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted mb-2 sm:mb-3">
                Log Event — {activeTeam === "home" ? homeTeam : awayTeam}
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {module?.events.map((event) => {
                  const pts = SCORE_EVENTS[selectedModule!]?.[event];
                  return (
                    <button key={event} onClick={() => logEvent(event)}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-xs font-semibold tracking-wide rounded-xl bg-nexus-surface hover:bg-foreground hover:text-primary-foreground text-foreground transition-all duration-200 btn-click hairline">
                      {event}
                      {pts !== undefined && pts !== 0 && (
                        <span className={`text-[9px] sm:text-[10px] mono rounded-md px-1 sm:px-1.5 py-0.5 ${pts > 0 ? "bg-foreground/10 text-foreground" : "bg-foreground text-primary-foreground"}`}>
                          {pts > 0 ? `+${pts}` : pts}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event log */}
            <div className="flex flex-col hairline-t lg:hairline-t-0">
              <div className="px-4 sm:px-6 py-4 sm:py-5 hairline-b flex items-center justify-between">
                <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">Event Log</p>
                <div className="flex items-center gap-2">
                  {matchStarted && <span className="text-[10px] mono text-nexus-live flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse" />Live</span>}
                  {isDbMode && <span className="text-[10px] mono text-nexus-muted">Saving to DB</span>}
                  {!isDbMode && sessionMode !== "official" && <span className="text-[10px] mono text-nexus-muted">{sessionMode} session</span>}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[500px] sm:max-h-[600px]">
                {log.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center"><p className="text-xs mono text-nexus-muted">Events will appear here as you score.</p></div>
                ) : (
                  <div className="flex flex-col divide-y" style={{ borderColor: "hsl(var(--silver-line))" }}>
                    {log.map((entry) => (
                      <motion.div key={entry.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }}
                        className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{entry.event}</p>
                          <p className="text-[9px] sm:text-[10px] mono text-nexus-muted mt-0.5">
                            {entry.team === "home" ? homeTeam : awayTeam} · {entry.period}
                            {entry.minute !== undefined ? ` · ${String(entry.minute).padStart(2, "0")}'` : ""}
                          </p>
                        </div>
                        <span className="text-[9px] sm:text-[10px] mono text-nexus-muted flex-shrink-0">{entry.time}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              {log.length > 0 && (
                <div className="p-4 sm:p-5 hairline-t">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs mono text-nexus-muted">{log.length} events</p>
                    <button onClick={() => {
                      const csv = ["Time,Team,Event,Period,Minute", ...log.map(e => `${e.time},${e.team === "home" ? homeTeam : awayTeam},${e.event},${e.period},${e.minute||""}`).join("\n")];
                      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv.join("\n")])); a.download = "match_log.csv"; a.click();
                    }} className="text-xs mono text-nexus-muted hover:text-foreground hairline px-3 py-1.5 rounded-md transition-colors">
                      Export CSV
                    </button>
                  </div>
                  <div className="hairline rounded-lg p-3 sm:p-4 bg-nexus-surface/50 text-center">
                    <p className="score-display text-2xl sm:text-score-md text-foreground">{homeScore} — {awayScore}</p>
                    <p className="text-[10px] sm:text-xs mono text-nexus-muted mt-1">{homeTeam} vs {awayTeam}</p>
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
