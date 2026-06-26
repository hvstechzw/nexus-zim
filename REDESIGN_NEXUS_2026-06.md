# Nexus Zimbabwe — Redesign (Phase 1) · June 2026

Nexus is the inter-school **netball & handball** competition platform for
Zimbabwe. This phase refocuses the product on its niche and rebuilds its core —
the live scoring engine — on a sport-accurate, tested domain layer.

## Audit — what was wrong

| # | Finding | Severity |
|---|---------|----------|
| 1 | The main scorer (`/scoring`) was a generic **12-sport** tool (football, rugby, cricket, chess, debate…). **Handball — a headline sport — was missing entirely.** | 🔴 Critical |
| 2 | **Two divergent scoring engines** with duplicated, conflicting rules: `/scoring` (generic, no undo, wrote `team_id: null`) vs `/scoring/:fixtureId` (netball/handball, undo, realtime). | 🔴 Critical |
| 3 | **No tested domain layer** — sport rules and standings math lived inline in pages (`src/lib` was 92 LOC). | 🔴 High |
| 4 | **Rich schema thrown away** — the scorer never set `score_entries.athlete_id` / `team_id` or `fixtures.period_scores`, so no top-scorer leaderboards and no per-quarter/half breakdown were possible. | 🟠 High |
| 5 | **Sport-inaccurate**: wall-clock count-up (not 4×15 / 2×30 countdown), no netball centre-pass, no handball 2-minute suspensions / short-handed tracking / progressive cards, no player attribution. | 🟠 High |
| 6 | **No undo** in the main scorer — unworkable for live officiating. | 🟠 Med |

## What changed

### 1. A tested sport domain layer — `src/lib/sports/`
Single source of truth for *how netball and handball are scored, timed,
disciplined and ranked*. The live console, the per-fixture scorer, the broadcast
overlay and the stats engine all read from it, so they can't drift.

- **`netball.ts`** — World Netball: 7-a-side, four 15-min quarters, positions
  GS/GA/WA/C/WD/GD/GK (only GS/GA score), centre-pass alternation, Super Shot.
- **`handball.ts`** — IHF: 7-a-side (6 + GK), two 30-min halves, 7-metre throws,
  2-minute suspensions, progressive discipline (yellow → 2-min → red, blue card).
- **`match.ts`** — a pure, framework-free match reducer: apply/undo events,
  per-period scores, ranked top scorers (player attribution), live short-handed
  tracking from suspensions, card tallies, netball centre-pass possession.
- **`standings.ts`** — pure standings mirroring the `recalc_standings()` SQL
  (3-1-0, GD, GF, last-5 form) **plus** a head-to-head tiebreaker.
- **`clock.ts`** / **`registry.ts`** — period clocks, sport lookup, discipline
  detection.
- **21 unit tests** covering scoring, undo, attribution, suspensions, centre-pass
  and standings tiebreakers. (Repo test count: 15 → **36**.)

### 2. Rebuilt the main scoring console — `/scoring`
Netball/handball only, driven entirely by the domain layer:
- Sport picker (two codes, governing body + format).
- **Period countdown clock** sized per sport/period; period selector.
- **Undo last event** + per-event delete in the feed.
- **Player attribution** — loads school-team rosters and tags goals to athletes,
  persisting `score_entries.athlete_id` + `team_id` + `value` + `period`.
- **Per-quarter/half breakdown**, **live top scorers**, and handball card/suspension
  tallies in a side panel.
- Handball **short-handed indicator**; netball **centre-pass** indicator.
- Writes `fixtures.period_scores` so results carry their period breakdown.
- Session modes (official / friendly / local) retained; mirrors finals to
  Scholastic Services on finalize.

### 3. De-duplicated the per-fixture scorer
`FixtureScoringPage` (`/scoring/:fixtureId`) now derives its rule set from the
shared domain layer instead of its own copy — eliminating the conflicting
definitions in finding #2.

## Verification
`tsc` 0 errors · `vite build` ✅ · `vitest` **36/36** · new domain layer is
lint-clean.

## Phase 2 — competition intelligence (shipped)

Built on the attribution data Phase 1 began capturing.

- **Competition leaderboards** — `src/lib/sports/leaderboard.ts` (pure, tested):
  `topScorers` (goals + points, Super Shot aware), `disciplineLeaders`
  (weighted yellow/2-min/red), `teamGoals`. Surfaced as a new **Leaders** tab on
  the competition page (`LeaderboardPanel`), reading `score_entries` for the
  competition's fixtures.
- **Roster eligibility gating** — `src/lib/sports/eligibility.ts` (pure, tested):
  suspended/inactive athletes are blocked from goal attribution in the scorer;
  unverified-card athletes are allowed but flagged. Wired into the live scorer's
  player picker (red bar = suspended, amber dot = unverified card).
- Test count: 36 → **46**.

## Phase 3 roadmap (next)
- Migrate the per-fixture scorer fully onto the `match` reducer (shared event
  vocabulary + realtime hydration from `score_entries`).
- Player **season profile** page (goals, discipline, appearances) from
  `score_entries.athlete_id`.
- IA/visual refresh of the public pages (live, fixtures, schools, competition)
  around the two-sport identity.
