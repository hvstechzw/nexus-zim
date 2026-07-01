import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useHasRole, ORGANIZER_ROLES } from "@/hooks/useHasRole";

// Roles trusted with the CG control panel (score bug, lower thirds, sponsor
// ticker, custom graphics). The transparent ?overlay=1 render used as an OBS
// Browser Source stays public since it's read-only and its URL is only ever
// shared privately by a broadcaster.
const BROADCAST_ROLES = [...ORGANIZER_ROLES, "broadcaster", "technical_delegate"] as const;

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

// ─── Score Bug ────────────────────────────────────────────────────────────────
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
      {isLive && (
        <div className="bg-red-600 text-white flex items-center px-3 gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase">Live</span>
        </div>
      )}
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
          {!isLive && fixture.status === "completed" && <span className="text-[10px] font-mono text-white/40">FT</span>}
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
          <div className="w-8 h-8 rounded-lg bg-black/10 flex items-center justify-center mx-auto mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <p className="font-black text-sm leading-tight">{event.event_type}</p>
          {event.minute !== null && <p className="text-xs text-black/40 mono mt-0.5">{event.minute}'</p>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Sponsor Ticker ───────────────────────────────────────────────────────────
function SponsorTicker({ sponsors, visible }: { sponsors: { sponsor_name: string; sponsor_logo: string | null }[]; visible: boolean }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!visible || sponsors.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % sponsors.length), 5000);
    return () => clearInterval(t);
  }, [visible, sponsors.length]);

  if (!visible || sponsors.length === 0) return null;
  const s = sponsors[idx];
  return (
    <AnimatePresence mode="wait">
      <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        className="flex items-center gap-2.5 bg-black/80 backdrop-blur-sm rounded-xl px-4 py-2">
        {s.sponsor_logo && <img src={s.sponsor_logo} className="w-6 h-6 rounded-md object-contain bg-white p-0.5" alt="" />}
        <span className="text-[10px] text-white/60 tracking-[0.12em] uppercase font-semibold">{s.sponsor_name}</span>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Full CG Control Panel ────────────────────────────────────────────────────
function CGControlPanel({ fixture, fixtureId, elapsed, onElapsedChange }: {
  fixture: FixtureState; fixtureId: string; elapsed: number;
  onElapsedChange: (v: number) => void;
}) {
  const [lt1, setLt1] = useState("");
  const [lt1sub, setLt1sub] = useState("");
  const [showLt1, setShowLt1] = useState(false);
  const [showScoreBug, setShowScoreBug] = useState(true);
  const [showSponsor, setShowSponsor] = useState(false);
  const [flashEvent, setFlashEvent] = useState<ScoreEntry | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [timerRunning, setTimerRunning] = useState(fixture.status === "live");
  const [customGraphic, setCustomGraphic] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const graphicRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const overlayUrl = `${window.location.origin}/broadcast/${fixtureId}?overlay=1`;

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => onElapsedChange(elapsed + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning, elapsed, onElapsedChange]);

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

  const { data: sponsors = [] } = useQuery({
    queryKey: ["cg-sponsors"],
    queryFn: async () => {
      const { data } = await supabase.from("sponsorships").select("sponsor_name, sponsor_logo").limit(10);
      return (data || []) as { sponsor_name: string; sponsor_logo: string | null }[];
    },
  });

  const triggerFlash = (ev: ScoreEntry) => {
    setFlashEvent(ev);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 4000);
  };

  const handleGraphicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomGraphic(url);
  };

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link to="/broadcast" className="text-[10px] tracking-[0.2em] uppercase text-white/40 hover:text-white/70 transition-colors font-semibold">
            NEXUS
          </Link>
          <span className="text-white/20">·</span>
          <span className="text-sm font-semibold text-white/80">Broadcast CG Control</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTimerRunning(!timerRunning)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timerRunning ? "bg-red-600 text-white" : "bg-white/10 text-white/50 hover:bg-white/20"}`}
          >
            {timerRunning ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {timeStr}
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                {timeStr}
              </>
            )}
          </button>
          <button onClick={() => onElapsedChange(0)} className="text-[10px] text-white/30 hover:text-white/60 transition-colors mono">
            Reset
          </button>
          <span className={`w-2 h-2 rounded-full ${fixture.status === "live" ? "bg-red-500 animate-pulse" : "bg-white/20"}`} />
          <span className="text-xs text-white/40 mono">{fixture.status.toUpperCase()}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar controls */}
        <div className="w-80 border-r border-white/10 flex flex-col overflow-y-auto">
          <div className="p-5 border-b border-white/10">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-semibold mb-3">Score Bug</p>
            <button
              onClick={() => setShowScoreBug(!showScoreBug)}
              className={`w-full py-2 text-xs font-bold rounded-lg transition-all ${showScoreBug ? "bg-red-600 text-white" : "bg-white/10 text-white/50"}`}
            >
              {showScoreBug ? "ON AIR" : "OFF AIR"}
            </button>
          </div>

          <div className="p-5 border-b border-white/10">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-semibold mb-3">Lower Third</p>
            <input
              placeholder="Name / Title"
              value={lt1}
              onChange={e => setLt1(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-2 placeholder:text-white/20 focus:outline-none focus:border-white/30"
            />
            <input
              placeholder="Subtitle / Role"
              value={lt1sub}
              onChange={e => setLt1sub(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-3 placeholder:text-white/20 focus:outline-none focus:border-white/30"
            />
            <button
              onClick={() => setShowLt1(!showLt1)}
              disabled={!lt1}
              className={`w-full py-2 text-xs font-bold rounded-lg transition-all disabled:opacity-30 ${showLt1 ? "bg-red-600 text-white" : "bg-white/10 text-white/50 hover:bg-white/20"}`}
            >
              {showLt1 ? "Remove" : "Go To Air"}
            </button>
          </div>

          {/* Sponsor Ticker */}
          <div className="p-5 border-b border-white/10">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-semibold mb-3">Sponsor Ticker</p>
            <button
              onClick={() => setShowSponsor(!showSponsor)}
              disabled={sponsors.length === 0}
              className={`w-full py-2 text-xs font-bold rounded-lg transition-all disabled:opacity-30 ${showSponsor ? "bg-red-600 text-white" : "bg-white/10 text-white/50 hover:bg-white/20"}`}
            >
              {showSponsor ? "Stop Rotation" : `Start (${sponsors.length} sponsors)`}
            </button>
          </div>

          {/* Custom Graphic */}
          <div className="p-5 border-b border-white/10">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-semibold mb-3">Custom Graphic</p>
            <input ref={graphicRef} type="file" accept="image/*,video/mp4,image/gif" className="hidden" onChange={handleGraphicUpload} />
            <button onClick={() => graphicRef.current?.click()}
              className="w-full py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white/70 mb-2">
              Upload GIF / Image / MP4
            </button>
            {customGraphic && (
              <div className="flex gap-2">
                <button onClick={() => setShowCustom(!showCustom)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${showCustom ? "bg-red-600 text-white" : "bg-white/10 text-white/50 hover:bg-white/20"}`}>
                  {showCustom ? "Hide" : "Show"}
                </button>
                <button onClick={() => { setCustomGraphic(null); setShowCustom(false); }}
                  className="py-2 px-3 text-xs font-semibold bg-white/5 hover:bg-white/10 rounded-lg text-white/40">
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="p-5 border-b border-white/10">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-semibold mb-3">Event Flash</p>
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
                  {ev.minute !== null && <span className="text-white/30 mono">{ev.minute}'</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-semibold mb-3">OBS Browser Source</p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs mono text-white/40 break-all select-all mb-2">{overlayUrl}</div>
            <button
              onClick={() => navigator.clipboard.writeText(overlayUrl)}
              className="w-full py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white/70"
            >
              Copy URL
            </button>
            <p className="text-[9px] text-white/20 mt-2">Add as Browser Source in OBS with transparent background</p>
          </div>
        </div>

        {/* Preview canvas */}
        <div className="flex-1 flex flex-col items-center justify-end p-8 gap-6 relative"
          style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
          
          <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none">
            <p className="text-white font-black" style={{ fontSize: "clamp(60px, 15vw, 120px)", letterSpacing: "-0.05em" }}>PREVIEW</p>
          </div>

          {/* Score summary */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2">
            <div className="bg-black/50 rounded-xl px-6 py-3 text-center">
              <p className="text-white font-black text-2xl tracking-tight">
                {fixture.home_team?.name || "Home"} {fixture.home_score ?? 0} — {fixture.away_score ?? 0} {fixture.away_team?.name || "Away"}
              </p>
              <p className="text-white/40 text-xs mono mt-1">{fixture.competition?.name}</p>
            </div>
          </div>

          {/* Sponsor ticker (top right) */}
          <div className="absolute top-8 right-8">
            <SponsorTicker sponsors={sponsors} visible={showSponsor} />
          </div>

          {/* Custom graphic overlay */}
          <AnimatePresence>
            {showCustom && customGraphic && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                {customGraphic.endsWith(".mp4") || customGraphic.includes("video") ? (
                  <video src={customGraphic} autoPlay loop muted className="max-w-[400px] max-h-[300px] rounded-xl" />
                ) : (
                  <img src={customGraphic} alt="" className="max-w-[400px] max-h-[300px] rounded-xl" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Flash overlay (center) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <EventFlash event={flashEvent} visible={showFlash} />
          </div>

          {/* Lower third */}
          <div className="w-full flex justify-start">
            <LowerThird text={lt1} sub={lt1sub} visible={showLt1 && !!lt1} />
          </div>

          {/* Score bug */}
          <div className="w-full flex justify-start">
            {showScoreBug && <ScoreBug fixture={fixture} isLive={fixture.status === "live" || timerRunning} elapsed={elapsed} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pure overlay (for OBS) ──────────────────────────────────────────────────
function PureOverlay({ fixture, elapsed }: { fixture: FixtureState; elapsed: number }) {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ background: "transparent" }}>
      <div className="absolute bottom-8 left-8">
        <ScoreBug fixture={fixture} isLive={fixture.status === "live"} elapsed={elapsed} />
      </div>
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
  const { hasRole, loading: rolesLoading } = useHasRole();
  const canBroadcast = hasRole(...(BROADCAST_ROLES as unknown as Parameters<typeof hasRole>));

  const { data: fixture, isLoading } = useQuery({
    queryKey: ["cg-fixture", fixtureId],
    queryFn: async () => {
      if (!fixtureId) return null;
      const { data } = await supabase.from("fixtures")
        .select(`id, status, home_score, away_score, round_label, period_scores,
          home_team:teams!fixtures_home_team_id_fkey(name),
          away_team:teams!fixtures_away_team_id_fkey(name),
          competition:competitions!fixtures_competition_id_fkey(name, discipline, level),
          venue:venues!fixtures_venue_id_fkey(name, city)`)
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

  // Pure overlay (OBS Browser Source) is read-only and stays public — the URL
  // is only ever shared privately by the broadcaster who copied it from the
  // control panel below, which IS gated.
  if (!isOverlay) {
    if (rolesLoading) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <p className="text-white/40 mono text-sm animate-pulse">Checking access…</p>
        </div>
      );
    }
    if (!canBroadcast) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-destructive mb-3">403 Forbidden</p>
            <h1 className="text-2xl font-display font-bold mb-3">Broadcast access required</h1>
            <p className="text-sm text-muted-foreground">
              The Broadcast CG control panel is restricted to organisers, technical delegates and broadcasters. Request the broadcaster role via <Link to="/register" className="underline">registration</Link>.
            </p>
            <Link to="/broadcast" className="inline-block mt-6 text-xs font-mono uppercase tracking-widest text-accent hover:underline">Back to Broadcast Hub</Link>
          </div>
        </div>
      );
    }
  }

  if (!fixtureId) return <FixtureSelector />;

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isOverlay ? "" : "bg-black"}`}>
        <p className="text-white/40 mono text-sm animate-pulse">Loading broadcast</p>
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 text-sm mb-4">Fixture not found</p>
          <Link to="/broadcast" className="text-white/60 text-xs underline">Back to Broadcast Hub</Link>
        </div>
      </div>
    );
  }

  if (isOverlay) return <PureOverlay fixture={fixture} elapsed={elapsed} />;

  return <CGControlPanel fixture={fixture} fixtureId={fixtureId} elapsed={elapsed} onElapsedChange={setElapsed} />;
}

// ─── Fixture selector ─────────────────────────────────────────────────────────
function FixtureSelector() {
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ["cg-all-fixtures"],
    queryFn: async () => {
      const { data } = await supabase.from("fixtures")
        .select(`id, status, round_label, home_score, away_score,
          home_team:teams!fixtures_home_team_id_fkey(name),
          away_team:teams!fixtures_away_team_id_fkey(name),
          competition:competitions!fixtures_competition_id_fkey(name, discipline)`)
        .in("status", ["live", "scheduled", "completed"])
        .order("scheduled_at", { ascending: false })
        .limit(30);
      return (data || []) as unknown[];
    },
  });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="max-w-2xl mx-auto w-full pt-20 px-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[hsl(var(--accent))] font-semibold mb-2">NASH · NAPH Broadcast CG</p>
        <h1 className="text-3xl font-black mb-8">Select a Fixture</h1>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : fixtures.length === 0 ? (
          <div className="py-16 text-center border border-white/10 rounded-2xl">
            <p className="text-white/30 text-sm">No fixtures found.</p>
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
                  <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded ${f.status === "live" ? "bg-red-600 text-white" : f.status === "completed" ? "bg-white/20 text-white/60" : "bg-white/10 text-white/40"}`}>
                    {f.status === "completed" ? "FT" : f.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
