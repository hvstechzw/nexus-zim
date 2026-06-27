import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { pushFixtureMirror } from "@/lib/scholasticPush";
import { enqueue, queued, queueSize, removeOp } from "@/lib/offlineQueue";
import {
  activeSuspensions,
  applyEvent,
  athleteEligibility,
  cardTally,
  createEvent,
  detectSport,
  type Eligibility,
  formatClock,
  getSport,
  matchMinute,
  nextCentrePass,
  periodByKey,
  periodScores,
  remaining,
  scoreFor,
  scorers,
  SPORT_LIST,
  undoLast,
  type MatchEvent,
  type Side,
  type SportKey,
} from "@/lib/sports";

type SessionMode = "official" | "friendly" | "local";
interface RosterPlayer { id: string; name: string; jersey: number | null; position: string | null; elig: Eligibility }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ScoringPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [sport, setSport] = useState<SportKey | null>(null);
  const [sessionMode, setSessionMode] = useState<SessionMode>("official");
  const [selectedCompId, setSelectedCompId] = useState("");
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);
  const [fixtureMeta, setFixtureMeta] = useState<{
    homeTeamId: string | null; awayTeamId: string | null;
    homeSchoolTeamId: string | null; awaySchoolTeamId: string | null;
  }>({ homeTeamId: null, awayTeamId: null, homeSchoolTeamId: null, awaySchoolTeamId: null });

  const [homeName, setHomeName] = useState("Home");
  const [awayName, setAwayName] = useState("Away");
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [activeSide, setActiveSide] = useState<Side>("home");
  const [periodKey, setPeriodKey] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(null);
  const [firstCentre] = useState<Side>("home");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dbIdMap = useRef<Record<string, string>>({});
  const offlineIdMap = useRef<Record<string, string>>({});
  const [pendingOffline, setPendingOffline] = useState(0);
  const cfg = sport ? getSport(sport) : null;
  const period = cfg ? periodByKey(cfg, periodKey) : undefined;
  const isDbMode = sessionMode === "official" && !!user && !!selectedFixtureId;

  // Default the active period to the first regulation period when a sport loads.
  useEffect(() => {
    if (cfg && !cfg.periods.some((p) => p.key === periodKey)) setPeriodKey(cfg.periods[0].key);
  }, [cfg, periodKey]);

  // Period countdown clock.
  useEffect(() => {
    if (running) timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const { data: competitions = [] } = useQuery({
    queryKey: ["scoring-competitions", sport],
    enabled: !!sport && sessionMode === "official",
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, name, discipline, level")
        .in("status", ["ongoing", "registration_closed"])
        .order("name")
        .limit(100);
      return (data || []).filter((c) => detectSport(c.discipline) === sport);
    },
  });

  const { data: fixtures = [] } = useQuery({
    queryKey: ["scoring-fixtures", selectedCompId],
    enabled: !!selectedCompId && sessionMode === "official",
    queryFn: async () => {
      const { data } = await supabase
        .from("fixtures")
        .select(`id, round_label, status, home_score, away_score, home_team_id, away_team_id,
          home_school_team_id, away_school_team_id,
          home_team:home_team_id(name), away_team:away_team_id(name)`)
        .eq("competition_id", selectedCompId)
        .in("status", ["scheduled", "live"])
        .order("scheduled_at");
      return data || [];
    },
  });

  // Best-effort roster load for player attribution (school-team rosters).
  const { data: rosters = { home: [], away: [] } } = useQuery({
    queryKey: ["scoring-rosters", fixtureMeta.homeSchoolTeamId, fixtureMeta.awaySchoolTeamId],
    enabled: !!(fixtureMeta.homeSchoolTeamId || fixtureMeta.awaySchoolTeamId),
    queryFn: async () => {
      const load = async (schoolTeamId: string | null): Promise<RosterPlayer[]> => {
        if (!schoolTeamId) return [];
        const { data } = await supabase
          .from("school_team_players")
          .select("athlete_id, jersey_number, position, athletes:athlete_id(first_name, last_name, display_name, is_active, is_suspended, scholastic_card_verified)")
          .eq("school_team_id", schoolTeamId)
          .order("jersey_number");
        return (data || []).map((r: any) => ({
          id: r.athlete_id,
          name: r.athletes?.display_name || `${r.athletes?.first_name ?? ""} ${r.athletes?.last_name ?? ""}`.trim() || "Player",
          jersey: r.jersey_number ?? null,
          position: r.position ?? null,
          elig: athleteEligibility({
            is_active: r.athletes?.is_active,
            is_suspended: r.athletes?.is_suspended,
            scholastic_card_verified: r.athletes?.scholastic_card_verified,
          }),
        }));
      };
      const [home, away] = await Promise.all([load(fixtureMeta.homeSchoolTeamId), load(fixtureMeta.awaySchoolTeamId)]);
      return { home, away };
    },
  });

  const homeScore = scoreFor(events, "home");
  const awayScore = scoreFor(events, "away");
  const breakdown = sport ? periodScores(sport, events) : [];
  const homeScorers = scorers(events, "home");
  const awayScorers = scorers(events, "away");
  const suspHome = cfg ? activeSuspensions(events, "home", periodKey, elapsed) : [];
  const suspAway = cfg ? activeSuspensions(events, "away", periodKey, elapsed) : [];
  const centre = sport ? nextCentrePass(sport, events, firstCentre) : "home";
  const activeRoster: RosterPlayer[] = (rosters as any)[activeSide] || [];

  const teamIdFor = (side: Side) => (side === "home" ? fixtureMeta.homeTeamId : fixtureMeta.awayTeamId);

  function resetMatch() {
    setEvents([]); setElapsed(0); setRunning(false); setSelectedPlayer(null);
    dbIdMap.current = {};
    if (cfg) setPeriodKey(cfg.periods[0].key);
  }

  async function startClock() {
    setRunning(true);
    if (isDbMode) {
      await supabase.from("fixtures").update({ status: "live", started_at: new Date().toISOString() }).eq("id", selectedFixtureId!);
      toast({ title: "Match live", description: "Clock running — events are saved to the database." });
    } else {
      toast({ title: "Clock running", description: sessionMode === "official" ? "Local mode — not saved." : `${sessionMode} session.` });
    }
  }

  // Skips when offline; the fixture score is reconciled to local truth on flush.
  async function persistScores(list: MatchEvent[]) {
    if (!isDbMode || !sport || !navigator.onLine) return;
    await supabase.from("fixtures").update({
      home_score: scoreFor(list, "home"),
      away_score: scoreFor(list, "away"),
      status: "live",
      period_scores: periodScores(sport, list) as any,
    }).eq("id", selectedFixtureId!);
  }

  function scoreEntryPayload(evt: MatchEvent) {
    return {
      fixture_id: selectedFixtureId!,
      event_type: evt.type,
      value: evt.value || null,
      period: evt.period,
      minute: matchMinute(getSport(sport!), evt.period, evt.clock),
      team_id: teamIdFor(evt.side),
      athlete_id: evt.playerId && UUID_RE.test(evt.playerId) ? evt.playerId : null,
      scorer_id: user!.id,
      metadata: { side: evt.side, sport, player_name: evt.playerName, clock: evt.clock, card: evt.card ?? null },
    };
  }

  // Replay queued score entries on reconnect, then reconcile fixture scores.
  async function flushOffline() {
    if (!isDbMode) return;
    for (const op of queued()) {
      if (op.table !== "score_entries") continue;
      const { error } = await supabase.from("score_entries").insert(op.payload as any);
      if (!error) removeOp(op.id);
    }
    setPendingOffline(queueSize());
    await persistScores(events);
  }

  useEffect(() => {
    const onOnline = () => { flushOffline(); };
    window.addEventListener("online", onOnline);
    setPendingOffline(queueSize());
    if (navigator.onLine) flushOffline();
    return () => window.removeEventListener("online", onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDbMode, selectedFixtureId]);

  async function logEvent(type: string) {
    if (!sport || !period) return;
    const evt = createEvent(sport, {
      side: activeSide, type, period: periodKey, clock: elapsed,
      playerId: selectedPlayer?.id ?? null, playerName: selectedPlayer?.name ?? null,
    });
    const next = applyEvent(events, evt);
    setEvents(next);

    if (isDbMode) {
      const payload = scoreEntryPayload(evt);
      if (navigator.onLine) {
        try {
          const { data, error } = await supabase.from("score_entries").insert(payload).select("id").single();
          if (error) throw error;
          if (data?.id) dbIdMap.current[evt.id] = data.id;
          await persistScores(next);
        } catch {
          const op = enqueue({ table: "score_entries", action: "insert", payload });
          offlineIdMap.current[evt.id] = op.id;
          setPendingOffline(queueSize());
        }
      } else {
        const op = enqueue({ table: "score_entries", action: "insert", payload });
        offlineIdMap.current[evt.id] = op.id;
        setPendingOffline(queueSize());
      }
    }
  }

  async function undo() {
    if (events.length === 0) return;
    const last = events[events.length - 1];
    const next = undoLast(events);
    setEvents(next);
    if (isDbMode) {
      const offId = offlineIdMap.current[last.id];
      if (offId) { removeOp(offId); delete offlineIdMap.current[last.id]; setPendingOffline(queueSize()); }
      const dbId = dbIdMap.current[last.id];
      if (dbId) { await supabase.from("score_entries").delete().eq("id", dbId); delete dbIdMap.current[last.id]; }
      await persistScores(next);
    }
  }

  async function finalize() {
    setRunning(false);
    if (isDbMode && sport) {
      await supabase.from("fixtures").update({
        status: "completed", home_score: homeScore, away_score: awayScore,
        period_scores: periodScores(sport, events) as any, ended_at: new Date().toISOString(),
      }).eq("id", selectedFixtureId!);
      pushFixtureMirror(selectedFixtureId!);
    }
    toast({ title: "Match finalized", description: `${homeName} ${homeScore} — ${awayScore} ${awayName}` });
  }

  // ── Sport picker ───────────────────────────────────────────────
  if (!sport) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NexusHeader />
        <div className="max-w-[1400px] mx-auto pt-16 sm:pt-20">
          <div className="px-4 sm:px-8 py-6 sm:py-10 hairline-b">
            <p className="text-[10px] mono tracking-[0.25em] uppercase text-nexus-muted">Officials Portal</p>
            <h1 className="display-font text-xl sm:text-3xl font-bold mt-1">Live Scoring Engine</h1>
            <p className="text-xs sm:text-sm text-nexus-muted mt-2 max-w-[60ch]">Sport-accurate scoring for netball and handball — period clocks, player attribution, discipline tracking and live standings.</p>
          </div>
          <div className="p-4 sm:p-8">
            <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted mb-5">Select Sport</p>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl">
              {SPORT_LIST.map((s, i) => (
                <motion.button key={s.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}
                  onClick={() => { setSport(s.key); resetMatchFor(s.key); }}
                  className="hairline rounded-2xl p-6 text-left hover:bg-nexus-surface/60 transition-all btn-click card-shadow group">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: `hsl(var(${s.accentVar}))` }} />
                    <span className="display-font text-lg font-bold">{s.label}</span>
                    <span className="text-[9px] mono uppercase tracking-widest text-nexus-muted ml-auto">{s.governing}</span>
                  </div>
                  <p className="text-xs text-nexus-muted">{s.blurb}</p>
                  <p className="text-[10px] mono text-nexus-muted mt-3">{s.regulationPeriods} {s.periodNoun.toLowerCase()}s · {s.onCourt}-a-side</p>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
        <NexusFooter />
      </div>
    );

    function resetMatchFor(_k: SportKey) { setEvents([]); setElapsed(0); setRunning(false); dbIdMap.current = {}; }
  }

  // ── Scoring console ────────────────────────────────────────────
  const remainingSecs = period ? remaining(period.seconds, elapsed) : 0;
  const clockText = period && period.kind === "shootout" ? "SO" : formatClock(remainingSecs);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />
      <div className="max-w-[1400px] mx-auto pt-16 sm:pt-20">
        <div className="px-4 sm:px-8 py-5 sm:py-7 hairline-b flex items-center justify-between flex-wrap gap-3">
          <div>
            <button onClick={() => { setSport(null); resetMatch(); }} className="text-xs mono text-nexus-muted hover:text-foreground mb-1">← Change sport</button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: `hsl(var(${cfg!.accentVar}))` }} />
              <h1 className="display-font text-lg sm:text-2xl font-bold">{cfg!.label} — Live Scoring</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 bg-nexus-surface rounded-xl">
              {(["official", "friendly", "local"] as SessionMode[]).map((m) => (
                <button key={m} onClick={() => setSessionMode(m)}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg capitalize transition-all ${sessionMode === m ? "bg-background shadow-sm" : "text-nexus-muted hover:text-foreground"}`}>{m}</button>
              ))}
            </div>
            <button onClick={finalize} className="h-8 px-4 text-xs font-semibold rounded-lg bg-foreground text-primary-foreground hover:opacity-85 btn-click">Finalize</button>
            <button onClick={resetMatch} className="text-xs mono text-nexus-muted hover:text-foreground hairline px-3 py-1.5 rounded-md">Reset</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
          <div className="p-4 sm:p-8 lg:hairline-r">
            {/* Official fixture selectors */}
            {sessionMode === "official" && user && (
              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                <select value={selectedCompId} onChange={(e) => { setSelectedCompId(e.target.value); setSelectedFixtureId(null); }}
                  className="bg-nexus-surface hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none cursor-pointer">
                  <option value="">Select competition…</option>
                  {(competitions as any[]).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={selectedFixtureId || ""} onChange={(e) => {
                  const f = (fixtures as any[]).find((x) => x.id === e.target.value);
                  setSelectedFixtureId(e.target.value || null);
                  if (f) {
                    setHomeName(f.home_team?.name || "Home"); setAwayName(f.away_team?.name || "Away");
                    setFixtureMeta({ homeTeamId: f.home_team_id, awayTeamId: f.away_team_id, homeSchoolTeamId: f.home_school_team_id, awaySchoolTeamId: f.away_school_team_id });
                    setSelectedPlayer(null);
                  }
                }} className="bg-nexus-surface hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none cursor-pointer">
                  <option value="">Select fixture…</option>
                  {(fixtures as any[]).map((f) => <option key={f.id} value={f.id}>{f.home_team?.name || "TBD"} vs {f.away_team?.name || "TBD"}</option>)}
                </select>
              </div>
            )}
            {sessionMode === "official" && !user && (
              <p className="text-xs mono text-nexus-muted bg-nexus-surface hairline rounded-lg px-4 py-2.5 inline-block mb-5">Sign in as a scorer or referee to save official scores.</p>
            )}

            {/* Team names */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input value={homeName} onChange={(e) => setHomeName(e.target.value)} className="bg-nexus-surface hairline rounded-lg px-3 py-2.5 text-sm font-semibold text-center focus:outline-none" />
              <input value={awayName} onChange={(e) => setAwayName(e.target.value)} className="bg-nexus-surface hairline rounded-lg px-3 py-2.5 text-sm font-semibold text-center focus:outline-none" />
            </div>

            {/* Scoreboard + clock */}
            <div className="hairline rounded-xl overflow-hidden mb-3">
              <div className="grid grid-cols-[1fr_auto_1fr]">
                <button onClick={() => { setActiveSide("home"); setSelectedPlayer(null); }} className={`p-4 sm:p-7 text-center transition-all ${activeSide === "home" ? "bg-foreground" : "hover:bg-nexus-surface/50"}`}>
                  <p className={`text-[10px] mono tracking-widest uppercase mb-2 truncate ${activeSide === "home" ? "text-primary-foreground/60" : "text-nexus-muted"}`}>{homeName}</p>
                  <motion.p key={homeScore} animate={{ scale: [1.15, 1] }} transition={{ duration: 0.2 }} className={`score-display text-4xl sm:text-score-lg ${activeSide === "home" ? "text-primary-foreground" : "text-foreground"}`}>{homeScore}</motion.p>
                  {suspHome.length > 0 && <p className="text-[9px] mono mt-1 text-nexus-live">−{suspHome.length} player{suspHome.length > 1 ? "s" : ""}</p>}
                </button>
                <div className="px-3 sm:px-5 flex flex-col items-center justify-center bg-nexus-surface/50 gap-1.5 min-w-[78px]">
                  <div className={`px-2.5 py-1 rounded-md ${running ? "bg-foreground" : "bg-nexus-surface"}`}>
                    <span className={`text-[13px] mono font-bold tracking-wider ${running ? "text-primary-foreground" : "text-nexus-muted"}`}>{clockText}</span>
                  </div>
                  <span className="text-[9px] mono text-nexus-muted">{period?.short} · {cfg!.periodNoun}</span>
                  {sport === "netball" && <span className="text-[8px] mono text-nexus-muted">CP: {centre === "home" ? homeName : awayName}</span>}
                </div>
                <button onClick={() => { setActiveSide("away"); setSelectedPlayer(null); }} className={`p-4 sm:p-7 text-center transition-all ${activeSide === "away" ? "bg-foreground" : "hover:bg-nexus-surface/50"}`}>
                  <p className={`text-[10px] mono tracking-widest uppercase mb-2 truncate ${activeSide === "away" ? "text-primary-foreground/60" : "text-nexus-muted"}`}>{awayName}</p>
                  <motion.p key={awayScore} animate={{ scale: [1.15, 1] }} transition={{ duration: 0.2 }} className={`score-display text-4xl sm:text-score-lg ${activeSide === "away" ? "text-primary-foreground" : "text-foreground"}`}>{awayScore}</motion.p>
                  {suspAway.length > 0 && <p className="text-[9px] mono mt-1 text-nexus-live">−{suspAway.length} player{suspAway.length > 1 ? "s" : ""}</p>}
                </button>
              </div>
            </div>

            {/* Clock controls + period selector */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {!running ? (
                <button onClick={startClock} className="flex items-center gap-2 h-9 px-4 bg-foreground text-primary-foreground text-xs font-bold rounded-lg hover:opacity-85 btn-click"><span className="w-2 h-2 rounded-full bg-primary-foreground/70 animate-pulse" />Start</button>
              ) : (
                <button onClick={() => setRunning(false)} className="flex items-center gap-2 h-9 px-4 bg-nexus-surface text-foreground text-xs font-bold rounded-lg hover:bg-nexus-silver btn-click"><span className="w-2 h-2 rounded-full bg-nexus-live animate-pulse" />Pause</button>
              )}
              <button onClick={() => setElapsed(0)} className="h-9 px-3 text-[11px] mono text-nexus-muted hover:text-foreground hairline rounded-lg" title="Reset period clock">⟲ Clock</button>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide ml-auto">
                {cfg!.periods.map((p) => (
                  <button key={p.key} onClick={() => { setPeriodKey(p.key); setElapsed(0); }}
                    className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg whitespace-nowrap btn-click transition-all ${periodKey === p.key ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}>{p.short}</button>
                ))}
              </div>
            </div>

            {/* Active side + player attribution */}
            <div className="flex gap-2 mb-3">
              {(["home", "away"] as Side[]).map((side) => (
                <button key={side} onClick={() => { setActiveSide(side); setSelectedPlayer(null); }}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl btn-click transition-all ${activeSide === side ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}>
                  {side === "home" ? homeName : awayName}
                </button>
              ))}
            </div>

            {activeRoster.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] mono tracking-widest uppercase text-nexus-muted mb-2">Attribute to player {selectedPlayer && <span className="text-foreground">· {selectedPlayer.name}</span>}</p>
                <div className="flex flex-wrap gap-1.5">
                  {activeRoster.map((p) => (
                    <button key={p.id} onClick={() => p.elig.eligible && setSelectedPlayer(selectedPlayer?.id === p.id ? null : p)}
                      disabled={!p.elig.eligible}
                      title={p.elig.status !== "eligible" ? p.elig.label : undefined}
                      className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg hairline btn-click transition-all ${
                        !p.elig.eligible ? "opacity-40 cursor-not-allowed line-through"
                        : selectedPlayer?.id === p.id ? "bg-foreground text-primary-foreground"
                        : "bg-nexus-surface text-foreground hover:bg-nexus-silver"}`}>
                      {p.elig.status === "suspended" && <span className="w-2 h-3 rounded-[1px] bg-red-500" title="Suspended" />}
                      {p.elig.status === "unverified" && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" title="Card unverified" />}
                      {p.jersey != null && <span className="mono text-nexus-muted mr-1">#{p.jersey}</span>}{p.name}{p.position ? ` · ${p.position}` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Score events */}
            <p className="text-[10px] mono tracking-widest uppercase text-nexus-muted mb-2">Score — {activeSide === "home" ? homeName : awayName}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {cfg!.scoreEvents.map((e) => (
                <button key={e.type} onClick={() => logEvent(e.type)} title={e.hint}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-xl bg-foreground text-primary-foreground hover:opacity-85 btn-click">
                  {e.label}<span className="text-[10px] mono bg-primary-foreground/15 rounded px-1.5 py-0.5">+{e.value}</span>
                </button>
              ))}
            </div>

            {/* Other events */}
            <p className="text-[10px] mono tracking-widest uppercase text-nexus-muted mb-2">Match events</p>
            <div className="flex flex-wrap gap-1.5">
              {cfg!.otherEvents.map((e) => (
                <button key={e.type} onClick={() => logEvent(e.type)} title={e.hint}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-xl hairline btn-click transition-all ${e.card === "red" ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-foreground hover:bg-foreground hover:text-primary-foreground"}`}>
                  {e.card && <span className={`w-2 h-3 rounded-[1px] ${e.card === "yellow" ? "bg-yellow-400" : e.card === "blue" ? "bg-blue-500" : "bg-red-500"}`} />}
                  {e.label}{e.suspensionSeconds ? <span className="text-[9px] mono text-nexus-muted">2:00</span> : null}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button onClick={undo} disabled={events.length === 0}
                className="h-9 px-4 text-xs font-semibold rounded-lg hairline text-foreground hover:bg-nexus-surface btn-click disabled:opacity-40 disabled:cursor-not-allowed">↶ Undo last</button>
              <span className="text-[10px] mono text-nexus-muted">{events.length} events {isDbMode ? "· saving to DB" : sessionMode !== "official" ? `· ${sessionMode}` : "· local"}</span>
              {pendingOffline > 0 && (
                <span className="text-[10px] mono text-nexus-live flex items-center gap-1" title="Will sync when back online">
                  <span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse" />{pendingOffline} queued offline
                </span>
              )}
            </div>
          </div>

          {/* Side panel: breakdown, scorers, log */}
          <div className="flex flex-col">
            <div className="px-4 sm:px-6 py-4 hairline-b">
              <p className="text-[10px] mono tracking-widest uppercase text-nexus-muted mb-2">By {cfg!.periodNoun}</p>
              <div className="space-y-1">
                {breakdown.length === 0 ? <p className="text-xs mono text-nexus-muted">No scoring yet.</p> :
                  breakdown.map((b) => (
                    <div key={b.period} className="flex items-center justify-between text-xs">
                      <span className="mono text-nexus-muted">{b.period}</span>
                      <span className="mono font-semibold">{b.home} — {b.away}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 hairline-b">
              <p className="text-[10px] mono tracking-widest uppercase text-nexus-muted mb-2">Top scorers</p>
              <div className="grid grid-cols-2 gap-3">
                {([["home", homeName, homeScorers], ["away", awayName, awayScorers]] as const).map(([side, name, list]) => (
                  <div key={side}>
                    <p className="text-[10px] mono text-nexus-muted truncate mb-1">{name}</p>
                    {list.length === 0 ? <p className="text-[10px] mono text-nexus-muted/60">—</p> :
                      list.slice(0, 5).map((s) => (
                        <div key={s.playerId} className="flex justify-between text-[11px]"><span className="truncate">{s.playerName}</span><span className="mono font-semibold">{s.points}</span></div>
                      ))}
                  </div>
                ))}
              </div>
              {sport === "handball" && (
                <div className="mt-3 pt-3 hairline-t grid grid-cols-2 gap-3 text-[10px] mono text-nexus-muted">
                  {(["home", "away"] as Side[]).map((side) => {
                    const t = cardTally(events, side);
                    return <div key={side}>{side === "home" ? homeName : awayName}: {t.yellow}Y · {t.suspensions}×2′ · {t.red}R</div>;
                  })}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="px-4 sm:px-6 py-3 hairline-b flex items-center justify-between">
                <p className="text-[10px] mono tracking-widest uppercase text-nexus-muted">Event log</p>
                {running && <span className="text-[10px] mono text-nexus-live flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse" />Live</span>}
              </div>
              <div className="overflow-y-auto max-h-[420px]">
                {events.length === 0 ? <div className="p-6 text-center"><p className="text-xs mono text-nexus-muted">Logged events appear here.</p></div> :
                  [...events].reverse().map((e) => (
                    <div key={e.id} className="px-4 sm:px-6 py-3 hairline-b flex items-center justify-between gap-2 group">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{e.label}{e.value > 0 ? ` +${e.value}` : ""}</p>
                        <p className="text-[10px] mono text-nexus-muted truncate">{e.side === "home" ? homeName : awayName} · {e.period} · {formatClock(e.clock)}{e.playerName ? ` · ${e.playerName}` : ""}</p>
                      </div>
                      <button onClick={() => removeOne(e.id)} className="text-[10px] mono text-nexus-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <NexusFooter />
    </div>
  );

  async function removeOne(id: string) {
    const target = events.find((e) => e.id === id);
    const next = events.filter((e) => e.id !== id);
    setEvents(next);
    if (isDbMode && target) {
      const offId = offlineIdMap.current[id];
      if (offId) { removeOp(offId); delete offlineIdMap.current[id]; setPendingOffline(queueSize()); }
      const dbId = dbIdMap.current[id];
      if (dbId) { await supabase.from("score_entries").delete().eq("id", dbId); delete dbIdMap.current[id]; }
      await persistScores(next);
    }
  }
}
