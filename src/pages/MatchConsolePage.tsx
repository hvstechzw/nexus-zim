// Match Engine 2.0 — Live scoring console.
// Sport-aware: reads periods, event palette and scoring values from
// src/lib/sports. Every action is written to public.match_events; the DB
// trigger recomputes score, MVP, win-prob, and auto-commentary.
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { useToast } from "@/hooks/use-toast";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { detectSport, getSport, type SportKey } from "@/lib/sports";
import {
  recordEvent,
  voidEvent,
  formatClock,
  type MatchEventRow,
  type MatchStateRow,
  type CommentaryRow,
} from "@/lib/matchEngine";

interface Player { id: string; name: string; jersey: number | null; position: string | null; verified: boolean; }

export default function MatchConsolePage() {
  const { fixtureId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { hasRole, loading: rolesLoading } = useHasRole();
  const { toast } = useToast();
  const canScore = hasRole("scorer", "hic", "umpire", "referee", "admin", "super_admin");

  // ----- Fixture
  const { data: fixture } = useQuery({
    queryKey: ["mc-fixture", fixtureId],
    enabled: !!fixtureId,
    queryFn: async () => {
      const { data } = await supabase
        .from("fixtures")
        .select(`id, scheduled_at, status, home_team_id, away_team_id, home_school_team_id, away_school_team_id,
                 home_team:home_team_id(id,name), away_team:away_team_id(id,name),
                 competition:competition_id(name,discipline,level), match_data`)
        .eq("id", fixtureId!).maybeSingle();
      return data;
    },
  });

  const sport: SportKey = useMemo(
    () => detectSport(((fixture as any)?.match_data?.sport) ?? (fixture as any)?.competition?.discipline),
    [fixture]
  );
  const cfg = getSport(sport);

  // ----- Rosters (from published school_team_players, athletes joined)
  const { data: rosters } = useQuery({
    queryKey: ["mc-rosters", fixtureId],
    enabled: !!fixture,
    queryFn: async () => {
      const ids = [
        (fixture as any)?.home_school_team_id,
        (fixture as any)?.away_school_team_id,
      ].filter(Boolean);
      if (!ids.length) return { home: [] as Player[], away: [] as Player[] };
      const { data } = await supabase
        .from("school_team_players")
        .select("school_team_id, jersey_number, position, athlete:athlete_id(id, first_name, last_name, display_name, scholastic_card_verified)")
        .in("school_team_id", ids);
      const toPlayer = (r: any): Player => ({
        id: r.athlete?.id,
        name: r.athlete?.display_name || `${r.athlete?.first_name ?? ""} ${r.athlete?.last_name?.[0] ?? ""}.`,
        jersey: r.jersey_number ?? null,
        position: r.position ?? null,
        verified: !!r.athlete?.scholastic_card_verified,
      });
      return {
        home: (data || []).filter((r: any) => r.school_team_id === (fixture as any).home_school_team_id).map(toPlayer),
        away: (data || []).filter((r: any) => r.school_team_id === (fixture as any).away_school_team_id).map(toPlayer),
      };
    },
  });

  // ----- Live state
  const [state, setState] = useState<MatchStateRow | null>(null);
  const [events, setEvents] = useState<MatchEventRow[]>([]);
  const [commentary, setCommentary] = useState<CommentaryRow[]>([]);

  useEffect(() => {
    if (!fixtureId) return;
    (async () => {
      const [s, e, c] = await Promise.all([
        supabase.from("match_state").select("*").eq("fixture_id", fixtureId).maybeSingle(),
        supabase.from("match_events").select("*").eq("fixture_id", fixtureId).order("sequence", { ascending: false }).limit(200),
        supabase.from("match_commentary").select("*").eq("fixture_id", fixtureId).order("created_at", { ascending: false }).limit(80),
      ]);
      setState((s.data as any) || null);
      setEvents((e.data as any) || []);
      setCommentary((c.data as any) || []);
    })();

    const channel = supabase
      .channel(`mc-${fixtureId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "match_state", filter: `fixture_id=eq.${fixtureId}` },
        (p) => setState(p.new as any))
      .on("postgres_changes", { event: "*", schema: "public", table: "match_events", filter: `fixture_id=eq.${fixtureId}` },
        async () => {
          const { data } = await supabase.from("match_events").select("*").eq("fixture_id", fixtureId).order("sequence", { ascending: false }).limit(200);
          setEvents((data as any) || []);
        })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "match_commentary", filter: `fixture_id=eq.${fixtureId}` },
        (p) => setCommentary((prev) => [p.new as any, ...prev].slice(0, 80)))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fixtureId]);

  // ----- Clock
  const [period, setPeriod] = useState(cfg.periods[0].short);
  const [clock, setClock] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setClock((c) => c + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  // ----- UI state
  const [side, setSide] = useState<"home" | "away">("home");
  const [selected, setSelected] = useState<Player | null>(null);
  const courtRef = useRef<HTMLDivElement>(null);
  const [pendingShot, setPendingShot] = useState<{ x: number; y: number } | null>(null);

  // Show every rostered player — verified ones first, then unverified.
  // Scorers can still tap any name to attribute an action; verified status
  // is shown as a small badge so the HIC can spot gaps without losing input.
  const sortedRoster = (list: Player[] | undefined) =>
    (list || []).slice().sort((a, b) =>
      (Number(b.verified) - Number(a.verified)) ||
      ((a.jersey ?? 999) - (b.jersey ?? 999)) ||
      a.name.localeCompare(b.name)
    );


  async function fire(eventType: string, value = 0, subType?: string) {
    if (!canScore) { toast({ title: "Not allowed", description: "Sign in as a scorer or official." }); return; }
    if (!fixtureId) return;
    try {
      await recordEvent({
        fixtureId, side, eventType, subType, value,
        period, clockSeconds: clock,
        playerId: selected?.id ?? null,
        x: pendingShot?.x ?? null, y: pendingShot?.y ?? null,
      });
      setPendingShot(null);
    } catch (e: any) {
      toast({ title: "Could not record", description: e?.message ?? String(e), variant: "destructive" });
    }
  }

  function onCourtClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!courtRef.current) return;
    const r = courtRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 100);
    const y = Math.round(((e.clientY - r.top) / r.height) * 100);
    setPendingShot({ x, y });
  }

  if (authLoading || rolesLoading) return <Shell><div className="p-6 text-sm opacity-70">Loading…</div></Shell>;

  if (!user) return (
    <Shell>
      <div className="p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Sign in to score</h1>
        <Link to="/login" className="underline">Go to login</Link>
      </div>
    </Shell>
  );

  if (!fixture) return <Shell><div className="p-6">Fixture not found.</div></Shell>;

  const accent = `var(${cfg.accentVar})`;
  const homeName = (fixture as any).home_team?.name ?? "Home";
  const awayName = (fixture as any).away_team?.name ?? "Away";
  const homeScore = state?.home_score ?? 0;
  const awayScore = state?.away_score ?? 0;
  const winHome = Math.round(((state?.win_prob_home ?? 0.5) * 100));

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Scoreboard */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest opacity-70">
            <span>{(fixture as any).competition?.name ?? "Fixture"} · {(fixture as any).competition?.level ?? ""}</span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: accent }} />
              {cfg.label}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 items-center">
            <div className="text-right">
              <div className="text-lg font-medium truncate">{homeName}</div>
              <div className="text-5xl font-bold tabular-nums">{homeScore}</div>
            </div>
            <div className="text-center">
              <div className="text-xs opacity-60">{period}</div>
              <div className="text-4xl font-mono tabular-nums">{formatClock(clock)}</div>
              <div className="mt-2 flex justify-center gap-2">
                <Button size="sm" variant={running ? "secondary" : "default"} onClick={() => setRunning((r) => !r)}>
                  {running ? "Pause" : "Start"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setClock(0)}>Reset</Button>
              </div>
            </div>
            <div className="text-left">
              <div className="text-lg font-medium truncate">{awayName}</div>
              <div className="text-5xl font-bold tabular-nums">{awayScore}</div>
            </div>
          </div>
          {/* Win-prob bar */}
          <div className="mt-4">
            <div className="text-[10px] uppercase opacity-60 flex justify-between"><span>Win prob {winHome}%</span><span>{100 - winHome}%</span></div>
            <div className="h-1.5 rounded-full overflow-hidden bg-muted">
              <div className="h-full" style={{ width: `${winHome}%`, background: accent }} />
            </div>
          </div>
          {/* Period picker */}
          <div className="mt-4 flex gap-1 flex-wrap">
            {cfg.periods.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.short)}
                className={`px-2.5 py-1 text-xs rounded border ${period === p.short ? "bg-foreground text-background" : "bg-background"}`}>
                {p.short}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Left: roster + court + actions */}
          <div className="space-y-4">
            {/* Side toggle */}
            <div className="inline-flex rounded-lg border p-1 text-sm">
              {(["home", "away"] as const).map((s) => (
                <button key={s} onClick={() => { setSide(s); setSelected(null); }}
                  className={`px-3 py-1 rounded ${side === s ? "bg-foreground text-background" : ""}`}>
                  {s === "home" ? homeName : awayName}
                </button>
              ))}
            </div>

            {/* Roster */}
            <div className="rounded-xl border bg-card/50 p-3">
              <div className="text-xs uppercase opacity-60 mb-2">Verified roster · {side === "home" ? homeName : awayName}</div>
              <div className="flex gap-2 flex-wrap">
                {verifiedRoster(side === "home" ? rosters?.home : rosters?.away).map((p) => (
                  <button key={p.id} onClick={() => setSelected(p)}
                    className={`px-3 py-1.5 rounded-full border text-sm ${selected?.id === p.id ? "bg-foreground text-background" : "bg-background"}`}>
                    {p.jersey ? `#${p.jersey} ` : ""}{p.name}{p.position ? ` · ${p.position}` : ""}
                  </button>
                ))}
                {!(verifiedRoster(side === "home" ? rosters?.home : rosters?.away).length) && (
                  <div className="text-xs opacity-60">No Scholastic-verified players on this team sheet.</div>
                )}
              </div>
              {selected && (
                <div className="mt-2 text-xs opacity-70">Attributing actions to <b>{selected.name}</b>. <button className="underline" onClick={() => setSelected(null)}>clear</button></div>
              )}
            </div>

            {/* Court (tap to mark shot location) */}
            <div className="rounded-xl border bg-card/50 p-3">
              <div className="text-xs uppercase opacity-60 mb-2">Court — tap to mark next shot location</div>
              <div ref={courtRef} onClick={onCourtClick}
                className="relative w-full aspect-[2/1] rounded-lg border-2"
                style={{ borderColor: accent, background: "linear-gradient(180deg, var(--muted) 0%, var(--background) 100%)" }}>
                <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/30" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-foreground/30" />
                {events.filter((e) => e.x != null && e.y != null && !e.is_void).slice(0, 60).map((e) => (
                  <div key={e.id}
                    title={`${e.event_type} · ${e.team_side}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      left: `${e.x}%`, top: `${e.y}%`,
                      width: e.value > 0 ? 10 : 6, height: e.value > 0 ? 10 : 6,
                      background: e.team_side === "home" ? accent : "var(--foreground)",
                      opacity: e.value > 0 ? 1 : 0.4,
                    }}
                  />
                ))}
                {pendingShot && (
                  <div className="absolute -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full ring-2 ring-offset-2"
                    style={{ left: `${pendingShot.x}%`, top: `${pendingShot.y}%`, background: accent }} />
                )}
              </div>
              {pendingShot && <div className="mt-1 text-xs opacity-60">Pin set at {pendingShot.x},{pendingShot.y}. Next action attaches to this spot. <button className="underline" onClick={() => setPendingShot(null)}>clear</button></div>}
            </div>

            {/* Action palette */}
            <div className="rounded-xl border bg-card/50 p-3 space-y-3">
              <div>
                <div className="text-xs uppercase opacity-60 mb-2">Scoring</div>
                <div className="flex flex-wrap gap-2">
                  {cfg.scoreEvents.map((e) => (
                    <Button key={e.type} onClick={() => fire(e.type, e.value)} disabled={!canScore}
                      style={{ background: accent, color: "white" }}>
                      +{e.value} {e.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase opacity-60 mb-2">Actions</div>
                <div className="flex flex-wrap gap-2">
                  {cfg.otherEvents.map((e) => (
                    <Button key={e.type} variant="outline" size="sm" onClick={() => fire(e.type, 0, e.card ?? null)} disabled={!canScore}>
                      {e.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: timeline + commentary */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-card/50 p-3">
              <div className="text-xs uppercase opacity-60 mb-2">Live commentary</div>
              <div className="space-y-2 max-h-[360px] overflow-auto">
                {commentary.length === 0 && <div className="text-xs opacity-60">No commentary yet.</div>}
                {commentary.map((c) => (
                  <div key={c.id} className="text-sm">
                    <Badge variant={c.tone === "highlight" ? "default" : c.tone === "critical" ? "destructive" : "secondary"} className="mr-2">
                      {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Badge>
                    {c.text}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-card/50 p-3">
              <div className="text-xs uppercase opacity-60 mb-2">Event timeline · undo</div>
              <div className="space-y-1 max-h-[360px] overflow-auto text-sm">
                {events.length === 0 && <div className="text-xs opacity-60">No events recorded.</div>}
                {events.map((e) => (
                  <div key={e.id} className={`flex items-center justify-between gap-2 ${e.is_void ? "opacity-40 line-through" : ""}`}>
                    <span className="truncate">
                      <span className="font-mono opacity-60 mr-2">{e.period} {formatClock(e.clock_seconds)}</span>
                      <span className="uppercase text-[10px] mr-2 opacity-70">{e.team_side}</span>
                      {e.event_type}{e.value > 0 ? ` +${e.value}` : ""}
                    </span>
                    {!e.is_void && canScore && (
                      <button className="text-xs underline opacity-70" onClick={() => voidEvent(e.id).catch(() => {})}>void</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-card/50 p-3 text-xs space-y-1">
              <div>MVP (live): <b>{(() => {
                const id = state?.mvp_player_id;
                if (!id) return "—";
                const p = [...(rosters?.home ?? []), ...(rosters?.away ?? [])].find((x) => x.id === id);
                return p?.name ?? id.slice(0, 8);
              })()}</b></div>
              <div className="opacity-70">Auto-published as Player of the Match when fixture is marked completed.</div>
              <Link to={`/live/${fixtureId}`} className="underline opacity-80">Open public live page →</Link>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <NexusHeader />
      <main className="flex-1">{children}</main>
      <NexusFooter />
    </div>
  );
}
