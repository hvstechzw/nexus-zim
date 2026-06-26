import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { Button } from "@/components/ui/button";

import { athleteEligibility, detectSport as detectSportKey, getSport, type Eligibility, type SportKey } from "@/lib/sports";

interface RosterPlayer { id: string; name: string; jersey: number | null; position: string | null; elig: Eligibility }

// Single source of truth: the rule set (periods, events, point values) comes
// from the shared sport domain layer so this per-fixture scorer and the main
// scoring console can never drift apart.
function buildConfig(sport: SportKey) {
  const c = getSport(sport);
  return {
    label: c.label,
    periodLabel: c.periodNoun,
    periods: c.periods.map((p) => p.short),
    scoreEvents: c.scoreEvents.map((e) => ({ type: e.type, label: e.label, value: e.value })),
    otherEvents: c.otherEvents.map((e) => ({ type: e.type, label: e.label, value: 0 })),
  };
}

/** type → display label, so stored canonical event types render readably. */
function eventLabelMap(sport: SportKey): Record<string, string> {
  const c = getSport(sport);
  const out: Record<string, string> = {};
  for (const e of [...c.scoreEvents, ...c.otherEvents]) out[e.type] = e.label;
  return out;
}

function detectSport(f: { match_data?: any; competition?: { discipline?: string } | null }): SportKey {
  return detectSportKey(f.match_data?.sport || f.competition?.discipline);
}

export default function FixtureScoringPage() {
  const { fixtureId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activePeriod, setActivePeriod] = useState<string>("");
  const [activeSide, setActiveSide] = useState<"home" | "away">("home");
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(null);
  const clockRef = useRef<HTMLSpanElement>(null);

  const { data: fixture, refetch } = useQuery({
    queryKey: ["fixture", fixtureId],
    enabled: !!fixtureId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fixtures")
        .select(`*, home_team:home_team_id(id,name), away_team:away_team_id(id,name), competition:competition_id(name,discipline,level), venue:venue_id(name,city)`)
        .eq("id", fixtureId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: events = [], refetch: refetchEvents } = useQuery({
    queryKey: ["score-entries", fixtureId],
    enabled: !!fixtureId,
    queryFn: async () => {
      const { data } = await supabase
        .from("score_entries")
        .select("*")
        .eq("fixture_id", fixtureId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const homeSchoolTeamId = (fixture as any)?.home_school_team_id ?? null;
  const awaySchoolTeamId = (fixture as any)?.away_school_team_id ?? null;

  // Roster load for player attribution (mirrors the main scoring console).
  const { data: rosters = { home: [], away: [] } } = useQuery({
    queryKey: ["fixture-rosters", homeSchoolTeamId, awaySchoolTeamId],
    enabled: !!(homeSchoolTeamId || awaySchoolTeamId),
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
          elig: athleteEligibility({ is_active: r.athletes?.is_active, is_suspended: r.athletes?.is_suspended, scholastic_card_verified: r.athletes?.scholastic_card_verified }),
        }));
      };
      const [home, away] = await Promise.all([load(homeSchoolTeamId), load(awaySchoolTeamId)]);
      return { home, away };
    },
  });

  const sport: SportKey = useMemo(() => fixture ? detectSport(fixture as any) : "handball", [fixture]);
  const config = useMemo(() => buildConfig(sport), [sport]);
  const labels = useMemo(() => eventLabelMap(sport), [sport]);
  const activeRoster: RosterPlayer[] = (rosters as any)[activeSide] || [];

  useEffect(() => {
    if (!activePeriod && config.periods.length) setActivePeriod(config.periods[0]);
  }, [config, activePeriod]);

  // Realtime: fixture + score_entries
  useEffect(() => {
    if (!fixtureId) return;
    const ch = supabase
      .channel(`scoring-${fixtureId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "fixtures", filter: `id=eq.${fixtureId}` }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "score_entries", filter: `fixture_id=eq.${fixtureId}` }, () => refetchEvents())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fixtureId, refetch, refetchEvents]);

  // Simple wall clock since start
  useEffect(() => {
    const t = setInterval(() => {
      if (!clockRef.current || !fixture?.started_at) return;
      const ms = Date.now() - new Date(fixture.started_at).getTime();
      const m = Math.max(0, Math.floor(ms / 60000));
      const s = Math.max(0, Math.floor((ms % 60000) / 1000));
      clockRef.current.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }, 1000);
    return () => clearInterval(t);
  }, [fixture?.started_at]);

  if (!fixture) {
    return (
      <div className="min-h-screen bg-background">
        <NexusHeader />
        <div className="px-8 py-20 text-center text-nexus-muted">Loading fixture…</div>
      </div>
    );
  }

  const teamId = (side: "home" | "away") =>
    side === "home" ? (fixture as any).home_team?.id : (fixture as any).away_team?.id;

  async function startMatch() {
    const { error } = await supabase
      .from("fixtures")
      .update({ status: "live", started_at: new Date().toISOString() })
      .eq("id", fixtureId!);
    if (error) toast({ title: "Could not start", description: error.message, variant: "destructive" });
  }

  async function endMatch() {
    const { error } = await supabase
      .from("fixtures")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", fixtureId!);
    if (error) toast({ title: "Could not end", description: error.message, variant: "destructive" });
    else toast({ title: "Match completed" });
  }

  async function logEvent(eventType: string, value: number) {
    const tId = teamId(activeSide);
    if (!tId) { toast({ title: "Missing team", variant: "destructive" }); return; }
    const { error } = await supabase.from("score_entries").insert({
      fixture_id: fixtureId!,
      scorer_id: user?.id ?? null,
      event_type: eventType,
      team_id: tId,
      athlete_id: selectedPlayer ? selectedPlayer.id : null,
      period: activePeriod,
      value,
      metadata: { side: activeSide, sport, player_name: selectedPlayer?.name ?? null },
    });
    if (error) { toast({ title: "Log failed", description: error.message, variant: "destructive" }); return; }

    if (value > 0) {
      const field = activeSide === "home" ? "home_score" : "away_score";
      const newScore = Number((fixture as any)[field] ?? 0) + value;
      await supabase.from("fixtures").update({ [field]: newScore, round_label: activePeriod } as any).eq("id", fixtureId!);
    }
  }

  async function undoLast() {
    const last = events[0];
    if (!last) return;
    await supabase.from("score_entries").delete().eq("id", last.id);
    if (Number(last.value) > 0) {
      const side = (last.metadata as any)?.side ?? "home";
      const field = side === "home" ? "home_score" : "away_score";
      const newScore = Math.max(0, Number((fixture as any)[field] ?? 0) - Number(last.value));
      await supabase.from("fixtures").update({ [field]: newScore } as any).eq("id", fixtureId!);
    }
  }

  const f: any = fixture;
  const isLive = f.status === "live";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NexusHeader />
      <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto">
        <div className="flex items-center justify-between mb-4 text-xs mono text-nexus-muted">
          <Link to="/fixtures" className="hover:text-foreground">← Fixtures</Link>
          <span className="pill-sport" data-sport={sport}>{config.label}</span>
        </div>

        {/* Scoreboard */}
        <div className="hairline rounded-xl overflow-hidden mb-6">
          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
            <TeamPanel name={f.home_team?.name || "Home"} score={f.home_score ?? 0} active={activeSide === "home"} onSelect={() => { setActiveSide("home"); setSelectedPlayer(null); }} />
            <div className="px-4 sm:px-8 py-6 flex flex-col items-center justify-center gap-2 bg-nexus-surface/50 min-w-[120px]">
              <span className="text-[10px] mono tracking-widest uppercase text-nexus-muted">{config.periodLabel}</span>
              <span className="text-sm font-semibold">{activePeriod}</span>
              <span ref={clockRef} className="score-display text-lg text-nexus-muted">{isLive ? "00:00" : f.status}</span>
            </div>
            <TeamPanel name={f.away_team?.name || "Away"} score={f.away_score ?? 0} active={activeSide === "away"} onSelect={() => { setActiveSide("away"); setSelectedPlayer(null); }} align="right" />
          </div>
          <div className="hairline-t px-4 py-3 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-1 flex-wrap">
              {config.periods.map(p => (
                <button key={p} onClick={() => setActivePeriod(p)}
                  className={`px-3 py-1.5 text-[10px] mono rounded-md transition ${activePeriod === p ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}>
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {f.status === "scheduled" && <Button size="sm" onClick={startMatch}>Start Match</Button>}
              {isLive && <Button size="sm" variant="outline" onClick={endMatch}>End Match</Button>}
              <Button size="sm" variant="ghost" onClick={undoLast} disabled={!events.length}>Undo</Button>
            </div>
          </div>
        </div>

        {/* Event controls */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card title={`Score — ${activeSide === "home" ? f.home_team?.name : f.away_team?.name}`}>
            {activeRoster.length > 0 && (
              <div className="mb-3">
                <p className="text-[9px] mono tracking-widest uppercase text-nexus-muted mb-1.5">Attribute to {selectedPlayer ? <span className="text-foreground">{selectedPlayer.name}</span> : "player (optional)"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {activeRoster.map((p) => (
                    <button key={p.id} disabled={!p.elig.eligible} title={p.elig.status !== "eligible" ? p.elig.label : undefined}
                      onClick={() => p.elig.eligible && setSelectedPlayer(selectedPlayer?.id === p.id ? null : p)}
                      className={`flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md hairline btn-click transition-all ${
                        !p.elig.eligible ? "opacity-40 cursor-not-allowed line-through"
                        : selectedPlayer?.id === p.id ? "bg-foreground text-primary-foreground"
                        : "bg-nexus-surface text-foreground hover:bg-nexus-silver"}`}>
                      {p.elig.status === "suspended" && <span className="w-1.5 h-2.5 rounded-[1px] bg-red-500" />}
                      {p.elig.status === "unverified" && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                      {p.jersey != null && <span className="mono text-nexus-muted">#{p.jersey}</span>}{p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {config.scoreEvents.map(e => (
                <button key={e.type} onClick={() => logEvent(e.type, e.value)}
                  className="hairline rounded-lg px-4 py-6 text-center hover:bg-nexus-surface transition btn-click">
                  <div className="text-base font-semibold">{e.label}</div>
                  <div className="text-[10px] mono text-nexus-muted mt-1">+{e.value}</div>
                </button>
              ))}
            </div>
          </Card>
          <Card title="Other events">
            <div className="grid grid-cols-2 gap-2">
              {config.otherEvents.map(e => (
                <button key={e.type} onClick={() => logEvent(e.type, 0)}
                  className="hairline rounded-lg px-3 py-3 text-xs text-left hover:bg-nexus-surface transition btn-click">
                  {e.label}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Event feed */}
        <Card title={`Event feed (${events.length})`}>
          <div className="max-h-80 overflow-y-auto divide-y" style={{ borderColor: "hsl(var(--silver-line))" }}>
            {events.length === 0 && <div className="py-8 text-center text-xs text-nexus-muted">No events logged.</div>}
            {events.map((ev: any) => {
              const side = ev.metadata?.side ?? (ev.team_id === f.home_team?.id ? "home" : "away");
              const teamName = side === "home" ? f.home_team?.name : f.away_team?.name;
              return (
                <div key={ev.id} className="py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="mono text-nexus-muted w-12">{ev.period}</span>
                    <span className="font-medium truncate">{labels[ev.event_type] || ev.event_type}</span>
                    {Number(ev.value) > 0 && <span className="mono text-nexus-live">+{ev.value}</span>}
                  </div>
                  <span className="text-nexus-muted truncate ml-2">{teamName}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </main>
      <NexusFooter />
    </div>
  );
}

function TeamPanel({ name, score, active, onSelect, align = "left" }: { name: string; score: number; active: boolean; onSelect: () => void; align?: "left" | "right" }) {
  return (
    <button onClick={onSelect}
      className={`p-6 sm:p-10 text-center transition ${active ? "bg-nexus-surface" : "bg-background hover:bg-nexus-surface/50"}`}>
      <div className={`text-[10px] mono tracking-widest uppercase text-nexus-muted mb-3 truncate text-${align}`}>{name}</div>
      <div className="score-display text-5xl sm:text-6xl text-foreground">{score}</div>
      <div className={`text-[9px] mono text-nexus-muted mt-2 ${active ? "opacity-100" : "opacity-0"}`}>● scoring</div>
    </button>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="hairline rounded-xl overflow-hidden">
      <header className="px-4 py-2.5 hairline-b bg-nexus-surface/40">
        <h3 className="text-[10px] mono tracking-widest uppercase text-nexus-muted">{title}</h3>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
