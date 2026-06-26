// Competition-wide leaderboards derived from score_entries. Pure aggregation so
// it can be unit-tested and reused by the competition page, a player profile,
// and the broadcast overlay without a round-trip.

export interface ScoreEntryLike {
  athlete_id?: string | null;
  team_id?: string | null;
  value?: number | null;
  event_type: string;
  metadata?: { side?: string; player_name?: string; card?: string | null } | null;
}

export interface ScorerRow {
  athleteId: string;
  name: string;
  goals: number;
  points: number;
  teamId: string | null;
}

export interface DisciplineRow {
  athleteId: string;
  name: string;
  yellow: number;
  suspensions: number;
  red: number;
  /** Weighted severity for ranking: red 3, suspension 2, yellow 1. */
  weight: number;
}

const SUSPENSION_TYPES = new Set(["suspension_2min"]);
const RED_TYPES = new Set(["disqualification"]);
const YELLOW_TYPES = new Set(["warning"]);

function nameFor(e: ScoreEntryLike, names?: Record<string, string>): string {
  const id = e.athlete_id || "";
  return names?.[id] || e.metadata?.player_name || "Unknown";
}

/**
 * Top scorers across a set of score entries. A "goal" is any entry that added
 * points (value > 0); points is the sum of value (so a netball Super Shot is one
 * goal worth two points). Unattributed entries (no athlete_id) are excluded.
 */
export function topScorers(entries: ScoreEntryLike[], names?: Record<string, string>): ScorerRow[] {
  const byId = new Map<string, ScorerRow>();
  for (const e of entries) {
    const value = Number(e.value ?? 0);
    if (value <= 0 || !e.athlete_id) continue;
    const row =
      byId.get(e.athlete_id) ??
      { athleteId: e.athlete_id, name: nameFor(e, names), goals: 0, points: 0, teamId: e.team_id ?? null };
    row.goals += 1;
    row.points += value;
    byId.set(e.athlete_id, row);
  }
  return [...byId.values()].sort((a, b) => b.points - a.points || b.goals - a.goals || a.name.localeCompare(b.name));
}

/** Discipline table (handball): cards and suspensions per athlete, worst first. */
export function disciplineLeaders(entries: ScoreEntryLike[], names?: Record<string, string>): DisciplineRow[] {
  const byId = new Map<string, DisciplineRow>();
  for (const e of entries) {
    const card = e.metadata?.card;
    const isYellow = YELLOW_TYPES.has(e.event_type) || card === "yellow";
    const isSusp = SUSPENSION_TYPES.has(e.event_type);
    const isRed = RED_TYPES.has(e.event_type) || card === "red";
    if (!isYellow && !isSusp && !isRed) continue;
    if (!e.athlete_id) continue;
    const row = byId.get(e.athlete_id) ?? { athleteId: e.athlete_id, name: nameFor(e, names), yellow: 0, suspensions: 0, red: 0, weight: 0 };
    if (isYellow) { row.yellow += 1; row.weight += 1; }
    if (isSusp) { row.suspensions += 1; row.weight += 2; }
    if (isRed) { row.red += 1; row.weight += 3; }
    byId.set(e.athlete_id, row);
  }
  return [...byId.values()].sort(
    (a, b) => b.weight - a.weight || b.red - a.red || b.suspensions - a.suspensions || a.name.localeCompare(b.name),
  );
}

/** Total goals scored per team across the entries (for a team attack table). */
export function teamGoals(entries: ScoreEntryLike[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries) {
    const value = Number(e.value ?? 0);
    if (value <= 0 || !e.team_id) continue;
    out[e.team_id] = (out[e.team_id] ?? 0) + value;
  }
  return out;
}
