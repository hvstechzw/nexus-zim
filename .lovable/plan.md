# Nexus Rebuild — Handball & Netball, SS via Federation

Federation stays the SS bridge — no direct cross-project Supabase client, no SS anon key in the browser. All SS reads/writes go through the existing HMAC edge functions (`scholastic-federation`, `scholastic-push`), extended with new actions.

## Phase 1 — Migration (single transaction)

1. `TRUNCATE` all 22 existing tables `CASCADE`.
2. Extend `app_role` enum: add `coach`, `hic`, `umpire`.
3. Alter existing tables:
   - `athletes`: add `is_ss_linked`, `scholastic_card_verified`, `jersey_number`, `nexus_sport` (`handball|netball|both`), `ss_school_id`.
   - `teams`: add `is_ss_school`, `sport` (`handball|netball|both|general`).
4. Create new tables (each with GRANTs + RLS + policies):
   - `nexus_coaches` — coach registrations, verified by HIC.
   - `team_sheets` — coach → HIC submissions with `players` JSONB.
   - `scholastic_card_verifications` — audit trail of card scans / manual confirms.
   - `ss_sync_log` — federation sync results.
   - `nexus_student_activity` — outbound feed read by SS (public SELECT).
5. Create public view `nexus_student_sports_profile` for SS to consume.
6. RLS policies use `has_role()` for HIC/super_admin gates; coaches limited to own school; athletes limited to own row.

## Phase 2 — Federation extensions (edge functions only, no browser SS client)

Extend `scholastic-federation` with new inbound actions Nexus calls outward via the existing HMAC client:
- `pull-schools` → upsert into `teams` (`is_ss_school=true`).
- `pull-students` (optional sport filter) → upsert into `athletes` (`is_ss_linked=true`).
- `full-sync` → both, writes `ss_sync_log`.

Outbound to SS via `scholastic-push`:
- `push-student-activity` on each goal / match-completed / card / award.
- `push-card-verification` after HIC verifies a card.

Front-end `/admin → Sync` tab calls a new `scholastic-sync` function (server-side) that orchestrates pulls. No SS keys ever land in the client bundle.

## Phase 3 — UI rebuild (delete all current pages/components except shadcn + supabase client)

Pages:
- `/` Home — hero, live strip, upcoming, standings (Handball|Netball tabs), SS banner.
- `/live` — Realtime live matches, two columns by sport.
- `/fixtures`, `/results`, `/standings` — filters by sport/competition/school.
- `/schools`, `/schools/:id` — directory + profile with SS Verified / Independent badges.
- `/scoring/:fixtureId` — sport-aware console:
  - Handball: 2 halves, goal/yellow/red/2-min, period_scores JSON.
  - Netball: 4 quarters, goal/penalty/contact/obstruction.
  - Realtime score broadcast, offline event buffer.
- `/register/coach`, `/register/umpire`, `/register/school` — public forms.
- `/login`, `/dashboard` (role router).
- `/admin` (super_admin + hic) — tabs: Overview, Competitions, Fixtures, Team Sheets, Player Verification (QR scan of Scholastic Card), Schools, Coaches, Umpires, Sync from SS, Settings.
- `/coach` — squad, team-sheet submission, fixtures.
- `/umpire` — assigned fixtures, "Start Scoring".
- `/player-profile` — SS-linked athlete stats + activity feed.

Design tokens (semantic, in `index.css`):
- bg `#0A1628`, primary `#00E5FF`, handball pill `#FF6B35`, netball pill `#9B5DE5`.
- Keep existing Nexus + AIE logos.

## Phase 4 — Verification flow

Coach submits team_sheet → HIC opens Player Verification → camera reads Scholastic Card QR → compare scanned `student_id` to `athletes.external_student_id` → mark `scholastic_card_verified=true` and `push-card-verification` to SS. Manual override path with required note for non-SS schools / scan failures.

## Phase 5 — Activity push-back

On every goal / match-complete / card / award for an SS-linked athlete, insert into `nexus_student_activity` and call `scholastic-push push-student-activity`. SS reads either the public table directly or via the `nexus_student_sports_profile` view.

## Out of scope (explicit)

- No `VITE_SS_SUPABASE_URL` / SS anon key in the client.
- No sports other than handball + netball.
- No payments, SMS, parent portal.
- No edits to `src/integrations/supabase/client.ts` / `types.ts` / `.env`.

## Confirmation needed before I start

This `TRUNCATE … CASCADE` is irreversible — every athlete, team, fixture, score, role, profile row is gone. Approve this plan and I'll begin with the migration, then deploy the federation actions, then rebuild the UI.
