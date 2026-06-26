# Nexus → CricHeroes-grade platform (Handball & Netball)

Goal: bring Nexus to feature parity with CricHeroes for the two codes we support, while keeping every player action attributable to a Scholastic Services–verified student and every tournament hosted only by a verified admin.

Delivered in four tightly-scoped phases. Each phase ships working UI + data.

---

## Phase 1 — Match Engine 2.0 (live scoring + commentary)

The scorer is the heart of the product. We replace today's basic counter with an action-by-action engine that produces real stats.

**Database (one migration)**

- `match_events`: `fixture_id`, `sequence` (int), `period`, `clock_seconds`, `team_side` (home/away), `player_id` (FK athletes, nullable for team events), `event_type`, `sub_type`, `value` (numeric, e.g. goal=1), `x`, `y` (court coords 0–100), `assist_player_id`, `notes`, `created_by`, `is_void`. Indexed on `(fixture_id, sequence)`.
- `match_commentary`: `fixture_id`, `event_id`, `text`, `tone` (info/highlight/critical), `auto_generated`, `created_at`.
- `match_state` (1 row per fixture): live snapshot — `home_score`, `away_score`, `period`, `clock_seconds`, `clock_running`, `possession`, `home_on_court[]`, `away_on_court[]`, `suspensions` (jsonb), `last_event_id`, `mvp_player_id`, `win_prob_home`, updated by triggers.
- Triggers: on `match_events` insert → recompute `match_state`, append commentary, recompute win-prob (simple model: score delta + period weight), bump `fixtures.home_score/away_score/status`.
- Realtime: add `match_events`, `match_state`, `match_commentary` to `supabase_realtime`.

**Scoring console (**`/score/:fixtureId`**) with maximum customization and flexibility** 

- Sport-aware (reads from `src/lib/sports`): netball = 4 quarters + centre-pass, handball = 2 halves + 2-min suspensions.
- Court tap-to-score with shot map; player picker locked to the published team sheet (SS-verified students only — unverified players cannot be selected).
- Action palette: goal, assist, shot (made/missed), turnover, intercept, rebound (netball), 7m/free-throw (handball), card (yellow/red/blue), suspension (2:00 countdown for handball), sub on/off, timeout.
- Timeline (right rail): every event with undo (voids the event, recomputes state).
- Auto-commentary: templated strings ("GOAL! Tariro M. — Marist now lead 12–10, 4:32 Q2").
- Auto-MoM at FT: weighted score of goals + assists + intercepts + cards (negative).
- Win-probability sparkline at top.

**Public live page (`/live/:fixtureId`)**

- Read-only mirror of scoring console: scoreboard, commentary feed, shot map, top performers, win-prob curve.

---

## Phase 2 — Player Career Profiles

CricHeroes-style, not exactly but more modern and sleek and nexus themed career page per athlete, sourced from `match_events`.

**Aggregations (DB views, not new tables)**

- `vw_player_career`: per athlete totals — matches, goals, assists, shots, shooting %, turnovers, intercepts, cards, MoM count, by season + by discipline.
- `vw_player_form`: last 5 matches with per-match stat line.
- `vw_player_records`: bests (most goals in a match, longest scoring streak).

**UI updates**

- `PlayerProfilePage.tsx` rebuilt: hero (photo, school, jersey, SS-verified badge), tabs **Overview / Stats / Matches / Achievements**.
- Form graph (last 5), shooting-% donut, position breakdown.
- Badges: "Centurion" (100 career goals), "Shooter of the Term", etc. Auto-awarded by trigger.
- Privacy: only published team players visible publicly; minors still masked as `FirstName L.` for non-school users.

---

## Phase 3 — Tournament Hosting Wizard

Self-serve hosting, but gated to verified admins (super/national/provincial/district/zonal) and HICs.

**New flow `/admin/competitions/new**`

- Step 1 Basics: name, discipline (handball/netball), level (Zonal→National), season, dates, region.
- Step 2 Format: league / single-KO / double-KO / pooled (groups → KO). Number of teams, group size, points rules (W/D/L), tiebreakers.
- Step 3 Teams: pick from SS-verified published `school_teams`; restrict to organiser's region scope.
- Step 4 Schedule: auto-generate fixtures (round-robin per group + bracket), venue assignment from `venues` table, slot times.
- Step 5 Officials: assign HIC + umpires from `officials` (must be SS-verified school staff).
- Step 6 Publish: writes `competitions` + `registrations` + `fixtures` + bracket rows in one transaction.

**Live bracket page** at `/competitions/:id/bracket` (SVG bracket, auto-advance winners on fixture completion via trigger).

**Standings page** auto-rebuilds from `fixtures` results.

---

## Phase 4 — Community & Engagement

CricHeroes-grade social layer, scoped to SS-verified students/staff only.

**Schema**

- `follows`: `follower_user_id`, `entity_type` (player/team/competition), `entity_id`.
- `feed_items`: derived/materialised activity (goal milestones, MoM, fixture results, new records).
- `poll_votes`/`polls`: already exist — wire to MoM voting per fixture.
- `share_cards`: server-rendered PNG share assets (Edge Function with @vercel/og-style HTML→image).

**UI**

- `/feed` — personalised activity stream (followed players/teams/competitions).
- Follow buttons on player/team/competition pages.
- MoM voting widget on completed fixture pages (closes 24h after FT).
- "Share match" button → generates branded PNG with score + top performer.
- Top-of-week leaderboards on `/` home.

---

## Technical notes (for the technical reader)

- All new tables get GRANTs + RLS in the same migration. Public reads only for `match_state`, `match_commentary`, and aggregates derived from already-published teams.
- Edge functions added: `compute-mom` (callable at FT, also runs in DB trigger), `render-share-card` (HTML→PNG), `bracket-advance` (idempotent, called after each fixture FT).
- Federation push: `scholastic-push` extended to mirror every finalised fixture + MoM + new badge back to SS so school dashboards stay in lockstep.
- Realtime: enable on `match_events`, `match_state`, `match_commentary`, `feed_items`.
- All player pickers in scoring + hosting hit `school_team_players` filtered by `is_verified = true` (i.e. SS card verified). Unverified roster slots show in team builder but are non-selectable for scoring.
- No video streaming this round (deferred per your choice).

---

## Order of execution

1. Phase 1 migration + scoring console + public live page.
2. Phase 2 views + rebuilt player profile.
3. Phase 3 hosting wizard + bracket + standings.
4. Phase 4 follows + feed + MoM voting + share cards.

Each phase is independently shippable. I'll pause between phases for you to test, unless you tell me to run straight through.