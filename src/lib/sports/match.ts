import type { Side, SportKey } from "./types";
import { getSport, scoreValueFor } from "./registry";

// Pure, framework-free match state. The live scorer keeps an array of
// MatchEvent and derives everything (scoreline, per-period breakdown, top
// scorers, live suspensions) from it — so undo is trivial and the same logic
// powers the broadcast overlay and post-match stats without divergence.

export interface MatchEvent {
  id: string;
  ts: number; // wall-clock ms when logged
  side: Side;
  type: string; // event type from the sport config
  label: string;
  period: string; // period key
  clock: number; // seconds elapsed in the period when logged
  value: number; // points contributed (0 for non-scoring)
  playerId?: string | null;
  playerName?: string | null;
  card?: "yellow" | "red" | "blue";
  suspensionSeconds?: number;
}

export interface ScorerTally {
  playerId: string;
  playerName: string;
  goals: number;
  points: number;
}

let seq = 0;
function nextId(): string {
  seq += 1;
  return `evt_${Date.now().toString(36)}_${seq}`;
}

export function createEvent(
  sport: SportKey,
  input: Omit<MatchEvent, "id" | "ts" | "value" | "label"> &
    Partial<Pick<MatchEvent, "value" | "label" | "ts" | "id">>,
): MatchEvent {
  const cfg = getSport(sport);
  const scoreDef = cfg.scoreEvents.find((e) => e.type === input.type);
  const otherDef = cfg.otherEvents.find((e) => e.type === input.type);
  const def = scoreDef ?? otherDef;
  return {
    id: input.id ?? nextId(),
    ts: input.ts ?? Date.now(),
    side: input.side,
    type: input.type,
    label: input.label ?? def?.label ?? input.type,
    period: input.period,
    clock: input.clock,
    value: input.value ?? scoreValueFor(sport, input.type),
    playerId: input.playerId ?? null,
    playerName: input.playerName ?? null,
    card: input.card ?? otherDef?.card,
    suspensionSeconds: input.suspensionSeconds ?? otherDef?.suspensionSeconds,
  };
}

export function applyEvent(events: MatchEvent[], event: MatchEvent): MatchEvent[] {
  return [...events, event];
}

/** Remove the most recent event (global undo). */
export function undoLast(events: MatchEvent[]): MatchEvent[] {
  if (events.length === 0) return events;
  return events.slice(0, -1);
}

export function removeEvent(events: MatchEvent[], id: string): MatchEvent[] {
  return events.filter((e) => e.id !== id);
}

export function scoreFor(events: MatchEvent[], side: Side): number {
  return events.reduce((sum, e) => (e.side === side ? sum + e.value : sum), 0);
}

export interface PeriodScore {
  period: string;
  home: number;
  away: number;
}

/** Score broken down per period, in the sport's period order. */
export function periodScores(sport: SportKey, events: MatchEvent[]): PeriodScore[] {
  const cfg = getSport(sport);
  return cfg.periods
    .map((p) => ({
      period: p.key,
      home: events.filter((e) => e.period === p.key && e.side === "home").reduce((s, e) => s + e.value, 0),
      away: events.filter((e) => e.period === p.key && e.side === "away").reduce((s, e) => s + e.value, 0),
    }))
    .filter((row) => row.home > 0 || row.away > 0 || events.some((e) => e.period === row.period));
}

/** Goal scorers for a side, ranked by points then goals. Unattributed goals omitted. */
export function scorers(events: MatchEvent[], side: Side): ScorerTally[] {
  const byPlayer = new Map<string, ScorerTally>();
  for (const e of events) {
    if (e.side !== side || e.value <= 0 || !e.playerId) continue;
    const cur =
      byPlayer.get(e.playerId) ?? { playerId: e.playerId, playerName: e.playerName || "—", goals: 0, points: 0 };
    cur.goals += 1;
    cur.points += e.value;
    byPlayer.set(e.playerId, cur);
  }
  return [...byPlayer.values()].sort((a, b) => b.points - a.points || b.goals - a.goals);
}

export interface ActiveSuspension {
  event: MatchEvent;
  endsAt: number; // seconds within the period
  remaining: number;
}

/**
 * Handball short-handed tracking: suspensions active for `side` at a given
 * (period, clock). A suspension runs `suspensionSeconds` from when it was
 * logged, within the same period.
 */
export function activeSuspensions(
  events: MatchEvent[],
  side: Side,
  period: string,
  clock: number,
): ActiveSuspension[] {
  const out: ActiveSuspension[] = [];
  for (const e of events) {
    if (e.side !== side || e.period !== period || !e.suspensionSeconds) continue;
    const endsAt = e.clock + e.suspensionSeconds;
    if (clock >= e.clock && clock < endsAt) {
      out.push({ event: e, endsAt, remaining: endsAt - clock });
    }
  }
  return out;
}

export interface CardTally {
  yellow: number;
  red: number;
  blue: number;
  suspensions: number;
}

export function cardTally(events: MatchEvent[], side: Side): CardTally {
  const t: CardTally = { yellow: 0, red: 0, blue: 0, suspensions: 0 };
  for (const e of events) {
    if (e.side !== side) continue;
    if (e.card === "yellow") t.yellow += 1;
    if (e.card === "red") t.red += 1;
    if (e.card === "blue") t.blue += 1;
    if (e.suspensionSeconds) t.suspensions += 1;
  }
  return t;
}

/**
 * Netball centre-pass possession. The first centre pass belongs to `firstSide`
 * (toss winner); it then alternates after every goal regardless of scorer.
 */
export function nextCentrePass(sport: SportKey, events: MatchEvent[], firstSide: Side = "home"): Side {
  if (!getSport(sport).centrePassAlternates) return firstSide;
  const goals = events.filter((e) => e.value > 0).length;
  const flip = goals % 2 === 1;
  return flip ? other(firstSide) : firstSide;
}

export function other(side: Side): Side {
  return side === "home" ? "away" : "home";
}
