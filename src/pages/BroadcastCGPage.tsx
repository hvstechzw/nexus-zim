import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// ─── Live broadcast CG overlay page ───
// Designed for OBS Browser Source capture.
// Route: /broadcast/:fixtureId
// Query param ?overlay=1 → pure transparent overlay mode (no bg)

interface FixtureState {
  id: string;
  status: string;
  home_score: number;
  away_score: number;
  round_label: string | null;
  period_scores: unknown;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
  competition: { name: string; discipline: string; level: string } | null;
  venue: { name: string; city: string } | null;
}

interface ScoreEntry {
  id: string;
  event_type: string;
  value: number | null;
  minute: number | null;
  period: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

// ─── Score Bug (bottom-left overlay) ────────────────────────────────────────
function ScoreBug({ fixture, isLive, elapsed }: { fixture: FixtureState; isLive: boolean; elapsed: number }) {
  const home = fixture.home_team?.name || "HOME";
  const away = fixture.away_team?.name || "AWAY";
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-stretch rounded-xl overflow-hidden shadow-2xl"
      style={{ minWidth: 340 }}
    >
      {/* Live pill */}
      {isLive && (
        <div className="bg-red-600 text-white flex items-center px-3 gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase">Live</span>
        </div>
      )}
      {/* Scores */}
      <div className="bg-black/90 backdrop-blur-sm flex items-stretch">
        <div className="flex flex-col items-center justify-center px-5 py-3 gap-1 border-r border-white/10">
          <span className="text-[10px] text-white/50 tracking-[0.15em] uppercase font-semibold truncate max-w-[90px]">{home}</span>
          <motion.span key={fixture.home_score} className="text-3xl font-black text-white leading-none"
            animate={{ scale: [1.3, 1] }} transition={{ duration: 0.25 }}>
            {fixture.home_score ?? 0}
          </motion.span>
        </div>
        <div className="flex flex-col items-center justify-center px-4 py-3 gap-0.5">
          <span className="text-[9px] text-white/30 font-mono tracking-widest">{fixture.round_label || fixture.competition?.discipline || "—"}</span>
          {isLive && <span className="text-[11px] font-mono text-white/60">{timeStr}</span>}
        </div>
        <div className="flex flex-col items-center justify-center px-5 py-3 gap-1 border-l border-white/10">
          <span className="text-[10px] text-white/50 tracking-[0.15em] uppercase font-semibold truncate max-w-[90px]">{away}</span>
          <motion.span key={fixture.away_score} className="text-3xl font-black text-white leading-none"
            animate={{ scale: [1.3, 1] }} transition={{ duration: 0.25 }}>
            {fixture.away_score ?? 0}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Lower Third ─────────────────────────────────────────────────────────────
function LowerThird({ text, sub, visible }: { text: string; sub?: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-stretch rounded-r-xl overflow-hidden shadow-2xl"
          style={{ maxWidth: 420 }}
        >
          <div className="w-1 bg-red-600" />
          <div className="bg-black/90 backdrop-blur-sm px-5 py-3">
            <p className="text-white font-black text-lg leading-tight">{text}</p>
            {sub && <p className="text-white/50 text-[11px] tracking-[0.12em] uppercase font-semibold mt-0.5">{sub}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Event Flash ─────────────────────────────────────────────────────────────
function EventFlash({ event, visible }: { event: ScoreEntry | null; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && event && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white text-black rounded-xl px-6 py-4 shadow-2xl text-center"
          style={{ minWidth: 180 }}
        >
          <p className="text-3xl mb-1">
            {event.event_type.includes("Goal") ? "⚽" :
             event.event_type.includes("Try") ? "🏉" :
             event.event_type.includes("Correct") ? "✅" :
             event.event_type.includes("Six") ? "🏏" :
             event.event_type.includes("Ace") ? "🏐" : "🎯"}
          </p>
          <p className="font-black text-sm leading-tight">{event.event_type}</p>
          {event.minute && <p className="text-xs text-black/40 mono mt-0.5">{event.minute}'</p>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Full CG Control Panel (regular view) ────────────────────────────────────
function CGControlPanel({ fixture, fixtureId, elapsed }: { fixture: FixtureState; fixtureId: string; elapsed: number }) {
  const [lt1, setLt1] = useState("");
  const [lt1sub, setLt1sub] = useState("");
  const [showLt1, setShowLt1] = useState(false);
  const [showScoreBug, setShowScoreBug] = useState(true);
  const [flashEvent, setFlashEvent] = useState<ScoreEntry | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [showLineup, setShowLineup] = useState(false);
  const overlayUrl = `${window.location.origin}/broadcast/${fixtureId}?overlay=1`;

  const { data: recentEvents = [] } = useQuery({
    queryKey: ["cg-events", fixtureId],
    queryFn: async () => {
      const { data } = await supabase.from("score_entries")
        .select("id, event_type, value, minute, period, created_at, metadata")
        .eq("fixture_id", fixtureId)
        .order("created_at", { ascending: false })
        .limit(10);
      return (data || []) as ScoreEntry[];
    },
    refetchInterval: 3000,
  });

  const triggerFlash = (ev: ScoreEntry) => {
    setFlashEvent(ev);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 4000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/40 font-semibold">NEXUS</span>
          <span className="text-white/20">·</span>
          <span className="text-sm font-semibold text-white/80">Broadcast CG Control</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${fixture.status === "live" ? "bg-red-500 animate-pulse" : "bg-white/20"}`} />
          <span className="text-xs text-white/40 mono">{fixture.status.toUpperCase()}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar controls */}
        <div className="w-80 border-r border-white/10 flex flex-col overflow-y-auto">
          <div className="p-5 border-b border-white/10">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-semibold mb-3">Score Bug</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowScoreBug(!showScoreBug)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${showScoreBug ? "bg-red-600 text-white" : "bg-white/10 text-white/50"}`}
              >
                {showScoreBug ? "● ON AIR" : "○ OFF AIR"}
              </button>
            </div>
          </div>

          <div className="p-5 border-b border-white/10">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-semibold mb-3">Lower Third</p>
            <input
              placeholder="Name / Title…"
              value={lt1}
              onChange={e => setLt1(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-2 placeholder:text-white/20 focus:outline-none focus:border-white/30"
            />
            <input
              placeholder="Subtitle / Role…"
              value={lt1sub}
              onChange={e => setLt1sub(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-3 placeholder:text-white/20 focus:outline-none focus:border-white/30"
            />
            <button
              onClick={() => setShowLt1(!showLt1)}
              disabled={!lt1}
              className={`w-full py-2 text-xs font-bold rounded-lg transition-all disabled:opacity-30 ${showLt1 ? "bg-red-600 text-white" : "bg-white/10 text-white/50 hover:bg-white/20"}`}
            >
              {showLt1 ? "✕ Remove" : "↑ Go To Air"}
            </button>
          </div>

          <div className="p-5 border-b border-white/10">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-semibold mb-3">Event Flash (Instant Replay)</p>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {recentEvents.length === 0 ? (
                <p className="text-xs text-white/20 mono">No events logged yet</p>
              ) : recentEvents.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => triggerFlash(ev)}
                  className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs text-white transition-all text-left"
                >
                  <span className="font-semibold">{ev.event_type}</span>
                  {ev.minute && <span className="text-white/30 mono">{ev.minute}'</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-semibold mb-3">OBS Source URL</p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs mono text-white/40 break-all select-all">{overlayUrl}</div>
            <p className="text-[9px] text-white/20 mt-2">Add as Browser Source in OBS with transparent background</p>
          </div>
        </div>

        {/* Preview canvas */}
        <div className="flex-1 flex flex-col items-center justify-end p-8 gap-6 relative"
          style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
          
          {/* Simulated stadium background text */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none">
            <p className="text-white font-black" style={{ fontSize: "clamp(60px, 15vw, 120px)", letterSpacing: "-0.05em" }}>PREVIEW</p>
          </div>

          {/* Flash overlay (center) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <EventFlash event={flashEvent} visible={showFlash} />
          </div>

          {/* Lower third (bottom-left area) */}
          <div className="w-full flex justify-start">
            <LowerThird text={lt1} sub={lt1sub} visible={showLt1 && !!lt1} />
          </div>

          {/* Score bug (bottom-left) */}
          <div className="w-full flex justify-start">
            {showScoreBug && <ScoreBug fixture={fixture} isLive={fixture.status === "live"} elapsed={elapsed} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pure overlay (for OBS) ──────────────────────────────────────────────────
function PureOverlay({ fixture, elapsed }: { fixture: FixtureState; elapsed: number }) {
  const [lastEvent, setLastEvent] = useState<ScoreEntry | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const prevHome = useRef(fixture.home_score);
  const prevAway = useRef(fixture.away_score);

  useEffect(() => {
    if (fixture.home_score !== prevHome.current || fixture.away_score !== prevAway.current) {
      prevHome.current = fixture.home_score;
      prevAway.current = fixture.away_score;
    }
  }, [fixture.home_score, fixture.away_score]);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ background: "transparent" }}>
      {/* Score bug — bottom left */}
      <div className="absolute bottom-8 left-8">
        <ScoreBug fixture={fixture} isLive={fixture.status === "live"} elapsed={elapsed} />
      </div>
      {/* Competition name — top right */}
      <div className="absolute top-8 right-8">
        <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 text-right">
          <p className="text-white font-black text-sm tracking-tight">{fixture.competition?.name || "Match"}</p>
          <p className="text-white/40 text-[9px] tracking-[0.15em] uppercase font-semibold">{fixture.competition?.discipline || ""}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BroadcastCGPage() {
  const { fixtureId } = useParams<{ fixtureId: string }>();
  const isOverlay = new URLSearchParams(window.location.search).get("overlay") === "1";
  const [elapsed, setElapsed] = useState(0);

  const { data: fixture, isLoading } = useQuery({
    queryKey: ["cg-fixture", fixtureId],
    queryFn: async () => {
      if (!fixtureId) return null;
      const { data } = await supabase.from("fixtures")
        .select(`id, status, home_score, away_score, round_label, period_scores,
          home_team:home_team_id!fixtures_home_team_id_fkey(name),
          away_team:away_team_id!fixtures_away_team_id_fkey(name),
          competition:competition_id(name, discipline, level),
          venue:venue_id(name, city)`)
        .eq("id", fixtureId)
        .single();
      return data as unknown as FixtureState | null;
    },
    refetchInterval: 3000,
    enabled: !!fixtureId,
  });

  // Tick elapsed when live
  useEffect(() => {
    if (fixture?.status !== "live") return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [fixture?.status]);

  // Realtime score subscription
  useEffect(() => {
    if (!fixtureId) return;
    const channel = supabase.channel(`cg-${fixtureId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "fixtures", filter: `id=eq.${fixtureId}` }, () => {})
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fixtureId]);

  // No fixture ID — show selector
  if (!fixtureId) {
    return <FixtureSelector />;
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isOverlay ? "" : "bg-black"}`}>
        <p className="text-white/40 mono text-sm animate-pulse">Loading broadcast…</p>
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 text-sm mb-4">Fixture not found</p>
          <Link to="/broadcast" className="text-white/60 text-xs underline">← Back to Broadcast Hub</Link>
        </div>
      </div>
    );
  }

  if (isOverlay) return <PureOverlay fixture={fixture} elapsed={elapsed} />;

  return <CGControlPanel fixture={fixture} fixtureId={fixtureId} elapsed={elapsed} />;
}

// ─── Fixture selector (no ID provided) ───────────────────────────────────────
function FixtureSelector() {
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ["cg-all-fixtures"],
    queryFn: async () => {
      const { data } = await supabase.from("fixtures")
        .select(`id, status, round_label, home_score, away_score,
          home_team:home_team_id(name), away_team:away_team_id(name),
          competition:competition_id(name, discipline)`)
        .in("status", ["live", "scheduled"])
        .order("scheduled_at", { ascending: true })
        .limit(30);
      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="max-w-2xl mx-auto w-full pt-20 px-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 font-semibold mb-2">Broadcast CG</p>
        <h1 className="text-3xl font-black mb-8">Select a Fixture</h1>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : fixtures.length === 0 ? (
          <div className="py-16 text-center border border-white/10 rounded-2xl">
            <p className="text-white/30 text-sm">No live or scheduled fixtures found.</p>
            <p className="text-white/20 text-xs mt-2">Create fixtures in the Admin Dashboard first.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(fixtures as any[]).map(f => (
              <Link key={f.id} to={`/broadcast/${f.id}`}
                className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-5 py-4 transition-all">
                <div>
                  <p className="font-bold text-white">{f.home_team?.name || "TBD"} vs {f.away_team?.name || "TBD"}</p>
                  <p className="text-xs text-white/40 mono">{f.competition?.name} · {f.round_label || "Scheduled"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-black text-lg">{f.home_score ?? 0} — {f.away_score ?? 0}</span>
                  <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded ${f.status === "live" ? "bg-red-600 text-white" : "bg-white/10 text-white/40"}`}>{f.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
