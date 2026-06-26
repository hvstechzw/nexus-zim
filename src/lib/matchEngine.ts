// Match Engine 2.0 — shared helpers for the live scoring console and the
// public live page. Reads the canonical sport config so periods and event
// types stay in lockstep with the DB trigger.
import { supabase } from "@/integrations/supabase/client";
import { getSport, type SportKey } from "@/lib/sports";

export interface MatchEventRow {
  id: string;
  fixture_id: string;
  sequence: number;
  period: string;
  clock_seconds: number;
  team_side: "home" | "away" | "neutral";
  player_id: string | null;
  assist_player_id: string | null;
  event_type: string;
  sub_type: string | null;
  value: number;
  x: number | null;
  y: number | null;
  notes: string | null;
  is_void: boolean;
  created_by: string | null;
  created_at: string;
}

export interface MatchStateRow {
  fixture_id: string;
  home_score: number;
  away_score: number;
  period: string;
  clock_seconds: number;
  clock_running: boolean;
  possession: string | null;
  home_on_court: string[];
  away_on_court: string[];
  suspensions: Array<{ player_id: string; team_side: string; ends_at: string }>;
  last_event_id: string | null;
  mvp_player_id: string | null;
  win_prob_home: number;
  updated_at: string;
}

export interface CommentaryRow {
  id: string;
  fixture_id: string;
  event_id: string | null;
  text: string;
  tone: "info" | "highlight" | "critical";
  auto_generated: boolean;
  created_at: string;
}

export async function nextSequence(fixtureId: string): Promise<number> {
  const { data } = await supabase
    .from("match_events")
    .select("sequence")
    .eq("fixture_id", fixtureId)
    .order("sequence", { ascending: false })
    .limit(1);
  const last = data?.[0]?.sequence ?? 0;
  return last + 1;
}

export interface RecordEventArgs {
  fixtureId: string;
  side: "home" | "away" | "neutral";
  eventType: string;
  subType?: string | null;
  value?: number;
  period: string;
  clockSeconds: number;
  playerId?: string | null;
  assistPlayerId?: string | null;
  x?: number | null;
  y?: number | null;
  notes?: string | null;
}

export async function recordEvent(args: RecordEventArgs) {
  const seq = await nextSequence(args.fixtureId);
  const { data: u } = await supabase.auth.getUser();
  const { error, data } = await supabase
    .from("match_events")
    .insert({
      fixture_id: args.fixtureId,
      sequence: seq,
      period: args.period,
      clock_seconds: args.clockSeconds,
      team_side: args.side,
      event_type: args.eventType,
      sub_type: args.subType ?? null,
      value: args.value ?? 0,
      player_id: args.playerId ?? null,
      assist_player_id: args.assistPlayerId ?? null,
      x: args.x ?? null,
      y: args.y ?? null,
      notes: args.notes ?? null,
      created_by: u.user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as MatchEventRow;
}

export async function voidEvent(eventId: string) {
  const { error } = await supabase.from("match_events").update({ is_void: true }).eq("id", eventId);
  if (error) throw error;
}

export function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function periodOptions(sport: SportKey) {
  return getSport(sport).periods;
}

export function eventValueFor(sport: SportKey, eventType: string): number {
  const cfg = getSport(sport);
  const e = cfg.scoreEvents.find((x) => x.type === eventType);
  return e?.value ?? 0;
}
