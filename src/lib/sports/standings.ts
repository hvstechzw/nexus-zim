// Pure standings computation — mirrors the recalc_standings() SQL trigger so the
// client can preview a table, sort consistently, and show projected positions
// without a round-trip. Adds a head-to-head tiebreaker the SQL omits.

export interface ResultInput {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  at?: string | number; // ordering for form (most recent last)
}

export interface StandingRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: string[]; // most recent first, max 5
  position: number;
}

export interface PointsRule {
  win: number;
  draw: number;
  loss: number;
}

export const DEFAULT_POINTS: PointsRule = { win: 3, draw: 1, loss: 0 };

function blank(teamId: string): StandingRow {
  return {
    teamId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
    form: [],
    position: 0,
  };
}

type Outcome = "W" | "D" | "L";
function outcome(a: number, b: number): Outcome {
  return a > b ? "W" : a === b ? "D" : "L";
}

/** Head-to-head points between two teams across the given results. */
function headToHead(a: string, b: string, results: ResultInput[], rule: PointsRule): [number, number] {
  let pa = 0;
  let pb = 0;
  for (const r of results) {
    const involvesA = r.homeTeamId === a || r.awayTeamId === a;
    const involvesB = r.homeTeamId === b || r.awayTeamId === b;
    if (!involvesA || !involvesB) continue;
    const aScore = r.homeTeamId === a ? r.homeScore : r.awayScore;
    const bScore = r.homeTeamId === b ? r.homeScore : r.awayScore;
    const o = outcome(aScore, bScore);
    pa += o === "W" ? rule.win : o === "D" ? rule.draw : rule.loss;
    pb += o === "L" ? rule.win : o === "D" ? rule.draw : rule.loss;
  }
  return [pa, pb];
}

/**
 * Build a sorted standings table from completed results.
 * Sort: points → goal difference → goals for → head-to-head → teamId.
 */
export function computeStandings(results: ResultInput[], rule: PointsRule = DEFAULT_POINTS): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  const ordered = [...results].sort((x, y) => order(x.at) - order(y.at));

  for (const r of ordered) {
    const home = rows.get(r.homeTeamId) ?? blank(r.homeTeamId);
    const away = rows.get(r.awayTeamId) ?? blank(r.awayTeamId);
    const o = outcome(r.homeScore, r.awayScore);

    home.played += 1;
    away.played += 1;
    home.goalsFor += r.homeScore;
    home.goalsAgainst += r.awayScore;
    away.goalsFor += r.awayScore;
    away.goalsAgainst += r.homeScore;

    if (o === "W") {
      home.won += 1;
      away.lost += 1;
      home.points += rule.win;
      away.points += rule.loss;
    } else if (o === "D") {
      home.drawn += 1;
      away.drawn += 1;
      home.points += rule.draw;
      away.points += rule.draw;
    } else {
      home.lost += 1;
      away.won += 1;
      home.points += rule.loss;
      away.points += rule.win;
    }

    home.form.unshift(o);
    away.form.unshift(o === "W" ? "L" : o === "L" ? "W" : "D");
    home.form = home.form.slice(0, 5);
    away.form = away.form.slice(0, 5);

    rows.set(r.homeTeamId, home);
    rows.set(r.awayTeamId, away);
  }

  const table = [...rows.values()];
  for (const row of table) row.goalDiff = row.goalsFor - row.goalsAgainst;

  table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    const [pa, pb] = headToHead(a.teamId, b.teamId, results, rule);
    if (pb !== pa) return pb - pa;
    return a.teamId.localeCompare(b.teamId);
  });

  table.forEach((row, i) => (row.position = i + 1));
  return table;
}

function order(at: string | number | undefined): number {
  if (at == null) return 0;
  if (typeof at === "number") return at;
  const t = Date.parse(at);
  return Number.isNaN(t) ? 0 : t;
}
