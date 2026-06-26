// Tournament generators for Phase 3 hosting wizard.
// Pure functions — no DB. Caller inserts the resulting fixture rows.

export type Side = { school_team_id: string; label?: string };
export type PendingFixture = {
  home_school_team_id: string | null;
  away_school_team_id: string | null;
  round_number: number | null;
  round_label: string | null;
  group_label: string | null;
  bracket_round: number | null;
  bracket_slot: "home" | "away" | null;
  // After insert, caller resolves IDs and sets advances_to_fixture_id by matching this temp key:
  _tempId: string;
  _advancesToTempId?: string;
};

function uid(prefix: string, i: number, j = 0) { return `${prefix}-${i}-${j}-${Math.random().toString(36).slice(2, 7)}`; }

/** Round-robin (circle method). Adds a BYE if odd. */
export function roundRobin(teams: Side[], groupLabel: string | null = null): PendingFixture[] {
  const list = teams.slice();
  if (list.length < 2) return [];
  const bye = list.length % 2 === 1;
  if (bye) list.push({ school_team_id: "__BYE__" });
  const n = list.length;
  const rounds = n - 1;
  const half = n / 2;
  const arr = list.slice();
  const out: PendingFixture[] = [];
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const a = arr[i]; const b = arr[n - 1 - i];
      if (a.school_team_id === "__BYE__" || b.school_team_id === "__BYE__") continue;
      const swap = r % 2 === 1;
      out.push({
        home_school_team_id: swap ? b.school_team_id : a.school_team_id,
        away_school_team_id: swap ? a.school_team_id : b.school_team_id,
        round_number: r + 1,
        round_label: `Round ${r + 1}`,
        group_label: groupLabel,
        bracket_round: null,
        bracket_slot: null,
        _tempId: uid("rr", r, i),
      });
    }
    // rotate (keep arr[0] fixed)
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop()!);
    arr.splice(0, arr.length, fixed, ...rest);
  }
  return out;
}

/** Single-elimination bracket. Pads to next power of 2 with byes. */
export function singleElimination(teams: Side[]): PendingFixture[] {
  if (teams.length < 2) return [];
  let size = 1; while (size < teams.length) size *= 2;
  const seeded: (Side | null)[] = teams.slice();
  while (seeded.length < size) seeded.push(null);
  const rounds = Math.log2(size);

  // Build empty bracket of fixtures per round
  const grid: PendingFixture[][] = [];
  for (let r = 0; r < rounds; r++) {
    const count = size / Math.pow(2, r + 1);
    const round: PendingFixture[] = [];
    for (let i = 0; i < count; i++) {
      round.push({
        home_school_team_id: null, away_school_team_id: null,
        round_number: r + 1, round_label: roundLabel(r, rounds),
        group_label: null, bracket_round: r + 1, bracket_slot: null,
        _tempId: uid("ko", r, i),
      });
    }
    grid.push(round);
  }
  // Seat first-round teams
  for (let i = 0; i < grid[0].length; i++) {
    const a = seeded[i * 2]; const b = seeded[i * 2 + 1];
    grid[0][i].home_school_team_id = a ? a.school_team_id : null;
    grid[0][i].away_school_team_id = b ? b.school_team_id : null;
  }
  // Wire advances_to + auto-advance byes
  for (let r = 0; r < rounds - 1; r++) {
    for (let i = 0; i < grid[r].length; i++) {
      const next = grid[r + 1][Math.floor(i / 2)];
      grid[r][i]._advancesToTempId = next._tempId;
      grid[r][i].bracket_slot = i % 2 === 0 ? "home" : "away";
      // Bye handling: if a side missing, auto-seat the present team into next round
      if (r === 0) {
        const f = grid[r][i];
        if (!f.home_school_team_id && f.away_school_team_id) {
          if (f.bracket_slot === "home") next.home_school_team_id = f.away_school_team_id;
          else next.away_school_team_id = f.away_school_team_id;
        } else if (f.home_school_team_id && !f.away_school_team_id) {
          if (f.bracket_slot === "home") next.home_school_team_id = f.home_school_team_id;
          else next.away_school_team_id = f.home_school_team_id;
        }
      }
    }
  }
  return grid.flat();
}

function roundLabel(r: number, totalRounds: number) {
  const fromEnd = totalRounds - r;
  if (fromEnd === 1) return "Final";
  if (fromEnd === 2) return "Semi-final";
  if (fromEnd === 3) return "Quarter-final";
  return `Round of ${Math.pow(2, fromEnd)}`;
}

/** Pooled: split into groups, round-robin per group, then single-KO across group winners (top N per group). */
export function pooled(teams: Side[], groupSize: number, advancePerGroup = 2): PendingFixture[] {
  if (teams.length < 2) return [];
  const groups: Side[][] = [];
  const groupCount = Math.max(1, Math.ceil(teams.length / groupSize));
  for (let i = 0; i < groupCount; i++) groups.push([]);
  // Snake seed
  let dir = 1, g = 0;
  for (const t of teams) {
    groups[g].push(t);
    g += dir;
    if (g === groupCount) { g--; dir = -1; }
    else if (g < 0) { g = 0; dir = 1; }
  }
  const out: PendingFixture[] = [];
  groups.forEach((grp, gi) => {
    const label = `Group ${String.fromCharCode(65 + gi)}`;
    out.push(...roundRobin(grp, label));
  });
  // Placeholder KO with empty slots; advancing happens manually after group stage closes
  // (we leave it to the standings tool to seat winners — wizard will recommend running KO later).
  return out;
}

/** Double-elimination: simplified — winners bracket + losers bracket merged at grand final.
 *  Caller seeds winners bracket; losers bracket fixtures are pre-created but empty (manual seeding). */
export function doubleElimination(teams: Side[]): PendingFixture[] {
  // For v1 ship singleElimination twice (winners + losers shell) — operators can extend.
  const wb = singleElimination(teams).map((f) => ({ ...f, round_label: `WB · ${f.round_label}` }));
  return wb;
}
