// Public live page — read-only mirror of the scoring console.
// Realtime feed of score, commentary, top performers, and win-prob curve.
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { Badge } from "@/components/ui/badge";
import { detectSport, getSport, type SportKey } from "@/lib/sports";
import type { CommentaryRow, MatchEventRow, MatchStateRow } from "@/lib/matchEngine";
import { formatClock } from "@/lib/matchEngine";
import { MoMVote } from "@/components/community/MoMVote";
import { ShareCard } from "@/components/community/ShareCard";

export default function MatchLivePage() {
  const { fixtureId } = useParams();

  const { data: fixture } = useQuery({
    queryKey: ["live-fixture", fixtureId],
    enabled: !!fixtureId,
    queryFn: async () => {
      const { data } = await supabase
        .from("fixtures")
        .select(`id, scheduled_at, status, match_data,
                 home_team:home_team_id(id,name), away_team:away_team_id(id,name),
                 competition:competition_id(name,discipline,level)`)
        .eq("id", fixtureId!).maybeSingle();
      return data;
    },
  });

  const sport: SportKey = useMemo(
    () => detectSport(((fixture as any)?.match_data?.sport) ?? (fixture as any)?.competition?.discipline),
    [fixture]
  );
  const cfg = getSport(sport);

  const [state, setState] = useState<MatchStateRow | null>(null);
  const [events, setEvents] = useState<MatchEventRow[]>([]);
  const [commentary, setCommentary] = useState<CommentaryRow[]>([]);

  useEffect(() => {
    if (!fixtureId) return;
    (async () => {
      const [s, e, c] = await Promise.all([
        supabase.from("match_state").select("*").eq("fixture_id", fixtureId).maybeSingle(),
        supabase.from("match_events").select("*").eq("fixture_id", fixtureId).order("sequence", { ascending: true }),
        supabase.from("match_commentary").select("*").eq("fixture_id", fixtureId).order("created_at", { ascending: false }).limit(120),
      ]);
      setState((s.data as any) || null);
      setEvents((e.data as any) || []);
      setCommentary((c.data as any) || []);
    })();

    const channel = supabase
      .channel(`live-${fixtureId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "match_state", filter: `fixture_id=eq.${fixtureId}` },
        (p) => setState(p.new as any))
      .on("postgres_changes", { event: "*", schema: "public", table: "match_events", filter: `fixture_id=eq.${fixtureId}` },
        async () => {
          const { data } = await supabase.from("match_events").select("*").eq("fixture_id", fixtureId).order("sequence", { ascending: true });
          setEvents((data as any) || []);
        })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "match_commentary", filter: `fixture_id=eq.${fixtureId}` },
        (p) => setCommentary((prev) => [p.new as any, ...prev].slice(0, 120)))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fixtureId]);

  // Win-prob curve (sample after each scoring event)
  const curve = useMemo(() => {
    let h = 0, a = 0;
    const points: number[] = [50];
    for (const e of events.filter((x) => !x.is_void && x.value > 0)) {
      if (e.team_side === "home") h += e.value;
      else if (e.team_side === "away") a += e.value;
      const diff = h - a;
      const p = Math.max(2, Math.min(98, 50 + diff * 5));
      points.push(p);
    }
    return points;
  }, [events]);

  // Top performers
  const top = useMemo(() => {
    const acc: Record<string, { goals: number; assists: number; cards: number }> = {};
    for (const e of events) {
      if (e.is_void || !e.player_id) continue;
      const row = (acc[e.player_id] ||= { goals: 0, assists: 0, cards: 0 });
      if (e.value > 0) row.goals += e.value;
      if (e.event_type === "assist") row.assists += 1;
      if (["warning", "suspension_2min", "disqualification", "card"].includes(e.event_type)) row.cards += 1;
    }
    return Object.entries(acc).sort((a, b) => (b[1].goals * 2 + b[1].assists) - (a[1].goals * 2 + a[1].assists)).slice(0, 5);
  }, [events]);

  if (!fixture) return <Shell><div className="p-6">Fixture not found.</div></Shell>;

  const accent = `var(${cfg.accentVar})`;
  const homeName = (fixture as any).home_team?.name ?? "Home";
  const awayName = (fixture as any).away_team?.name ?? "Away";
  const homeScore = state?.home_score ?? 0;
  const awayScore = state?.away_score ?? 0;
  const winHome = Math.round((state?.win_prob_home ?? 0.5) * 100);
  const path = curve.map((y, i) => `${i === 0 ? "M" : "L"} ${(i / Math.max(1, curve.length - 1)) * 100} ${100 - y}`).join(" ");

  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="rounded-2xl border bg-card/60 backdrop-blur p-5">
          <div className="text-xs uppercase opacity-70 flex justify-between">
            <span>{(fixture as any).competition?.name ?? "Live fixture"}</span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: accent }} />
              LIVE · {cfg.label}
            </span>
          </div>
          <div className="grid grid-cols-3 items-center mt-3">
            <div className="text-right">
              <div className="text-base truncate">{homeName}</div>
              <div className="text-5xl font-bold tabular-nums">{homeScore}</div>
            </div>
            <div className="text-center">
              <div className="text-xs opacity-60">{state?.period ?? cfg.periods[0].short}</div>
              <div className="text-3xl font-mono tabular-nums">{formatClock(state?.clock_seconds ?? 0)}</div>
            </div>
            <div className="text-left">
              <div className="text-base truncate">{awayName}</div>
              <div className="text-5xl font-bold tabular-nums">{awayScore}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[10px] uppercase opacity-60 flex justify-between"><span>Win prob {winHome}%</span><span>{100 - winHome}%</span></div>
            <div className="h-1.5 rounded-full overflow-hidden bg-muted">
              <div className="h-full" style={{ width: `${winHome}%`, background: accent }} />
            </div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-3 w-full h-20">
              <path d={path} fill="none" stroke={accent as any} strokeWidth={1.2} />
              <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeOpacity={0.15} strokeWidth={0.3} />
            </svg>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-card/50 p-3">
            <div className="text-xs uppercase opacity-60 mb-2">Commentary</div>
            <div className="space-y-2 max-h-[420px] overflow-auto">
              {commentary.length === 0 && <div className="text-xs opacity-60">Awaiting first action…</div>}
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
            <div className="text-xs uppercase opacity-60 mb-2">Top performers</div>
            <div className="space-y-1 text-sm">
              {top.length === 0 && <div className="text-xs opacity-60">No stats yet.</div>}
              {top.map(([pid, s]) => (
                <Link to={`/players/${pid}`} key={pid} className="flex justify-between border-b border-border/60 py-1">
                  <span className="font-mono opacity-60">{pid.slice(0, 8)}</span>
                  <span className="tabular-nums">{s.goals}G · {s.assists}A · {s.cards}C</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-card/50 p-3">
            <MoMVote fixtureId={fixtureId!} />
          </div>
          <ShareCard
            title={(fixture as any).competition?.name ?? "Nexus fixture"}
            subtitle={`${cfg.label} · ${state?.period ?? ""}`}
            home={homeName} away={awayName} homeScore={homeScore} awayScore={awayScore}
            accent={accent}
            footer="nexuszw.online · Powered by Scholastic Services"
          />
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
