# NEXUS — Master Audit & Redesign Specification
Scope: Nexus for Schools (NASH / NAPH, Zimbabwe). Stack: React 18 + Vite + Tailwind, Lovable Cloud, Scholastic Services (SS) HMAC federation.
Audit date: June 2026. Based on a read of the route map (`src/App.tsx`), shell (`components/shell/*`), nav model (`lib/navModel.ts`, `lib/toolDirectory.ts`), tokens (`src/index.css`), offline queue (`lib/offlineQueue.ts`), Sly (`components/sly/*`, `content/sly.ts`) and the high-traffic pages.

---

## PART 1 — Product Positioning & Strategic Foundations

### 1.1 Core problem
School sport in Zimbabwe runs on paper match sheets, WhatsApp PDFs and verbal eligibility checks. That produces three failures:
- **Ineligible athletes**: overage or non-enrolled players fielded at zonal and district level because nobody can check identity at the gate.
- **Lost records**: match sheets lost or changed between cluster meets and provincial submission.
- **Late information**: parents, scouts and MoPSE learn results days or weeks later.

**The one truth:** Nexus is the official record of school sport. Every athlete, school and official traces back to a Scholastic Services record. Every score traces back to a named scorer's event log.

### 1.2 Non-negotiable axioms
1. **Identity comes from SS.** Non-SS teams can register, but stay "Unverified draft" until a Nexus admin approves them. Unverified athletes cannot enter sanctioned provincial or national stages.
2. **Pathway integrity.** Zonal → District → Provincial → National. Entry to a stage requires a qualifying result from the stage below (or an explicit admin override, logged).
3. **The server computes the numbers.** Scores, standings, MVP and records come from `match_events` + DB triggers (`recompute_match_state`, `recompute_standings`). The client only sends events.
4. **Every displayed number is real.** No placeholder counts, no sample fixtures, no "demo" leaderboards outside a labelled sandbox.
5. **Scoring never blocks on network.** Every scoring action is accepted locally and synced later, exactly once.

### 1.3 What Nexus refuses to do
- No betting, odds or gambling-adjacent features.
- No ads or third-party trackers aimed at minors.
- No public comment threads on minors' profiles.
- No fees charged to students or parents to view fixtures or their own stats.
- No silent score edits. Corrections go through `voidEvent` with author and timestamp.
- No exposure of sensitive student data (DOB, ID numbers, contact info) on public pages.

### 1.4 Target users

| Persona | Where they are | Device & constraints | What they need |
|---|---|---|---|
| **Scorer** (teacher/volunteer) | Outdoor court, midday sun, noisy sideline | Entry-level Android, cracked screen, 2G/3G that drops, one thumb, eyes mostly on the game | Log a goal in under 5 s without looking twice |
| **Coach / Sports director** | Bus, dugout, staff room | Mid-range phone, rushed before tip-off | Submit a team sheet, scan cards, check eligibility |
| **Federation admin** (zonal → national) | Office, sometimes on unstable power | Laptop/desktop, large tables | Approve teams, roles and venues, build fixtures, produce MoPSE reports |
| **Athlete** | Home, school | Shared or low-end phone | See own profile, stats, upcoming matches |
| **Parent / alumni / scout** | Anywhere, including diaspora | Low bandwidth | Fast live scores and results, no sign-in needed |

---

## PART 2 — Competitive Analysis

| Competitor | Philosophy & money | Strengths | Fatal flaws for Zimbabwe schools |
|---|---|---|---|
| **CricHeroes** | Freemium grassroots cricket, PRO subscriptions, ads | Excellent ball-by-ball scoring, career stats, share cards | Cricket only; ads and paywalls; no school identity; no federation hierarchy |
| **PlayHQ** | Federation SaaS (Australia) | Strong registration and competition admin | Enterprise pricing; assumes reliable broadband; no NASH/NAPH structure |
| **TeamSnap / SportsEngine** | Club pay-to-play (US) | Rosters, messaging, payments | Built around parent fees and club seasons; no tiered school pathway |
| **FIBA LiveStats / HandballNet** | Elite federation scoring | Accurate, broadcast-grade | Needs trained operators and laptops; useless at a zonal meet |
| **WhatsApp + paper** (incumbent) | Free, everyone already uses it | Zero learning curve, works on any phone | No audit trail, easy fraud, no history, no search, no standings maths |

### 2.1 Moats
1. **SS identity bridge.** Only Nexus can check an athlete against official enrolment (`verify-card`, `scholastic-federation`). Competitors would need the SS partnership.
2. **Official sanction.** NASH/NAPH tiers, MoPSE report and venue database make Nexus the system of record, not an optional app.
3. **Field-first scoring.** Offline-safe, one-thumb scoring beats paper on speed, which is the only way to replace paper.
4. **Loop:** SS enrolment → verified athlete → scored events → career profile → SS sports profile → more schools register to get their athletes seen.

### 2.2 Indispensable in 60 seconds
- **0–10 s:** Home loads with what is live right now. No pop-ups, no sign-in wall.
- **10–30 s:** One tap into a live match: score, clock, lineups, event timeline.
- **30–60 s:** Tap a player: verified badge, school, season stats. Share card ready.

---

## PART 3 — The 10 Anti-Vibecoding Laws

1. **Tokens only.** No `text-white`, `bg-black`, `bg-[#…]`, no purple/indigo glows. Colour comes from `index.css` semantic tokens. Sport accents (handball / netball) are tokens, not literals.
2. **One shell.** `AppShell` owns header, rail, bottom bar and footer. Pages never render their own header, footer, hamburger or `min-h-screen` wrapper.
3. **Touch targets.** 44×44 px minimum everywhere; 56 px for scoring actions; 8 px minimum gap between scoring buttons.
4. **Honest data.** Every count is a real query with a visible scope ("Live now: 3 in Harare"). No "15 sports covered" filler cards. Empty means empty, said plainly.
5. **Visible state.** Every tap responds in under 100 ms. Network work shows pending / synced / failed, and every failed state has a retry or a way out.
6. **No emojis in officiating, admin or records.** Icons + words only.
7. **Sly stays out of the way.** Never over a control, never on scoring, wizard, auth or broadcast screens; never simulates data.
8. **Hide what you can't use.** Users without a role don't see disabled buttons for it; the action is absent.
9. **Server maths.** Standings, GD, points, MVP and bracket advance are computed in the database only.
10. **Sunlight contrast.** Score, clock, jersey numbers and foul counts are at least 7:1 against their surface.

---

## PART 4 — Current-State Audit (ranked)

| ID | Where | Severity | Problem | Fix |
|---|---|---|---|---|
| D-01 | 18+ pages (`LivePage`, `MatchConsolePage`, `ResultsPage`, `SchoolProfilePage`, `CompetitionDetailPage`, `PlayerProfilePage`, `BracketPage`, `StandingsPage`, …) | P0 | Pages still import empty `NexusHeader` / `NexusFooter` / `NashHeader` and wrap themselves in `min-h-screen bg-background` inside `AppShell`. Footer text duplicates (`ResultsPage` prints its own "Powered by" line). Nested full-height wrappers push the shell footer far below content. | Remove the stubs and wrappers; pages render only their `<main>` content. Delete the stub components once unused. |
| D-02 | `lib/offlineQueue.ts` | P0 | Queue is a plain `localStorage` array with a random id but no idempotency key sent to the server. A retry after a timeout that actually succeeded inserts the event twice — inflating the score. | Generate `client_event_id` (uuid) at tap time; add a unique index on `match_events.client_event_id`; upsert with `onConflict` ignore. Move storage to IndexedDB. |
| D-03 | `LivePage`, `toolDirectory`, `InterSchoolFixturesBuilder`, `TeamRegistrationPage` | P0 | Copy and filters still list 15 sports ("All 15 NASH & NAPH sports", hockey, chess, swimming…). Contradicts the handball/netball-only scope and leads users into empty results. | One sport list from `lib/sports/registry` (handball, netball). Remove hardcoded `NEXUS_DISCIPLINES` / `SPORTS` arrays. |
| D-04 | `LivePage` stat cards | P1 | "Sports Covered: 15" is a constant presented as a statistic; Live/Upcoming/Completed counts are limited to 60 rows but read as totals. | Remove the constant card. Use `count: "exact"` queries or label as "latest 60". |
| D-05 | `MatchConsolePage` event buttons | P1 | Event palette buttons are standard size; at 360–390 px wide they fall below 48 px and sit close together. Team → player → event takes three precise taps with no undo shortcut. | Scoring layout from Part 6.1: 56 px buttons, two-column team split, last-event undo bar. |
| D-06 | `index.css` legacy tokens | P1 | `--nash-gold`, `--nash-gold-light`, `--live-red` etc. are re-aimed at greys/info blue. "Live red" renders blue; `text-nexus-muted` grey on ivory is used for small mono labels below 4.5:1 in places. | Delete legacy aliases after migrating usages; add `--live` token (real red, paired with the word LIVE). |
| D-07 | `NexusSlyGuide` | P1 | Hidden-route list misses `/match`, `/console`, `/coach/registration`, `/athlete/register`, `/admin/verify` (camera). Sly can sit over the scanner and wizard controls. | Invert: Sly allowed only on an allow-list of browse pages (`/`, `/results`, `/calendar`, `/live`, `/schools`). |
| D-08 | `TournamentWizardPage` (11 steps), `TeamRegistrationPage` (4 steps) | P2 | State lives only in React; a refresh or a phone call loses the whole wizard. | Autosave draft to `sessionStorage` per user; "Resume draft" banner. |
| D-09 | `InterSchoolFixturesBuilder` | P2 | Switching Competition ↔ Manual mode silently drops exclusions; generated fixtures appear without preview; no date/venue/time-slot allocation. | Keep a preview step (rounds table) before insert; persist exclusions per mode; add slot allocator. |
| D-10 | `AthletesRegistryPage`, `TeamsAdminPage` | P2 | Wide tables on mobile clip; search is client-side over first 1000 rows only. | Card list under 768 px; server-side `ilike` search with pagination. |
| D-11 | `toolDirectory` | P2 | Several tools have no `roles` (Seasons, Sports Registry, Finances, Venues, Sync, Register Athlete), so every signed-in user sees admin tools in the rail and hits RLS errors. Two entries point to `/admin/dashboard`. | Assign roles to every non-public tool; remove duplicates. |
| D-12 | Empty states across Results, Live, Calendar | P3 | Generic "No … yet" with no next step. | Each empty state says why and offers one action (change filter, see calendar, register team). |
| D-13 | `VenuesDatabasePage` | P3 | No inline validation; required fields only fail on save. | Field-level validation with zod (`src/schemas`). |

### Responsive check (360–428 px vs desktop)
- Bottom bar fits at 360 px; centre "Live" target is 58 px — good.
- Pages with their own `max-w-6xl px-4 sm:px-8` add padding on top of the shell `rail`, so content is narrower than other pages: inconsistent gutters.
- Sport filter chips on Live scroll horizontally without a fade hint.

---

## PART 5 — Information Architecture

### 5.1 Global destinations (unchanged count, sharpened meaning)
Mobile bottom bar and desktop rail share the same five, same order:

```text
[ Home ]  [ Results ]  ( LIVE )  [ Fixtures ]  [ More ]
```
- **Home** — what matters now: live, today, my teams (if signed in), latest results.
- **Results** — results, standings, brackets, records.
- **Live** — every live match; scorers see "Score this match" on assigned fixtures.
- **Fixtures** (renamed from Calendar) — upcoming by date, tier, sport.
- **More** (renamed from Tools) — role-scoped tools, schools, profile.

### 5.2 Route consolidation
| Keep | Merge / remove |
|---|---|
| `/` Home | `/home` (Index) → redirect to `/` |
| `/live/:fixtureId` public match | `/live/:id` vs `/match/...` — one public match page |
| `/score/:fixtureId` scorer console | `ScoringPage`, `FixtureScoringPage`, `MatchConsolePage` → one console |
| `/competition/:id` with tabs Overview · Fixtures · Standings · Bracket | `/standings/:id`, `/bracket/:id` become tabs (old URLs redirect) |
| `/admin/*` grouped by: People · Competitions · Places · Reports · Sync | `/platform`, `/admin/dashboard` duplicates |

### 5.3 Wireframes

**Home — mobile (390 px)**
```text
┌──────────────────────────────────┐
│ NEXUS · Home              (🔔)(👤)│
├──────────────────────────────────┤
│ LIVE NOW (2)                 All →│
│ ┌──────────────────────────────┐ │
│ │ ● LIVE  Handball U16 Boys     │ │
│ │ Prince Edward   14            │ │
│ │ Churchill       12   2H 18:42 │ │
│ └──────────────────────────────┘ │
│ TODAY (5)                        │
│ 10:00  Marist v St Dominic's  NB │
│ 11:30  Allan Wilson v Mabelreign │
│ LATEST RESULTS                   │
│ Harare Zonal U18 · Final         │
├──────────────────────────────────┤
│ Home  Results ( LIVE ) Fixtures More│
└──────────────────────────────────┘
```

**Competition — desktop (1280 px)**
```text
┌────────┬──────────────────────────────────────────────┐
│ Rail   │ Harare Provincial · Handball U18 Boys         │
│        │ [Overview][Fixtures][Standings][Bracket]      │
│ Home   ├───────────────────────────┬──────────────────┤
│ Results│ Fixtures by round          │ Standings (top 4)│
│ Live   │ R1  PE 14–12 CHU   Final   │ 1 PE   9 pts     │
│ Fixture│ R1  ALW –  MAB   10:30     │ 2 CHU  6 pts     │
│ More   │                            │ Venue · Dates    │
└────────┴───────────────────────────┴──────────────────┘
```

---

## PART 6 — High-Frequency Flows

### 6.1 Score an event in under 5 seconds
```text
┌──────────────────────────────────┐
│ PE  14 : 12  CHU    2H 18:42 [⏸] │  ← 7:1 contrast, mono numerals
│ ● Synced                         │
├────────────────┬─────────────────┤
│ PRINCE EDWARD  │ CHURCHILL       │
│ [ GOAL     ]   │ [ GOAL     ]    │  ← 56 px
│ [ 7m       ]   │ [ 7m       ]    │
│ [ 2 MIN    ]   │ [ 2 MIN    ]    │
│ [ YELLOW   ]   │ [ YELLOW   ]    │
│ [ TIMEOUT  ]   │ [ TIMEOUT  ]    │
├────────────────┴─────────────────┤
│ Last: Goal PE #7 Moyo  [ UNDO ]  │
└──────────────────────────────────┘
```
1. Tap **event on the team side** (1 tap). Score updates instantly.
2. A jersey grid slides up (verified players only, jersey numbers 56 px). Tap a number, or **Skip** — player can be added later.
3. Event saved to the outbox with `client_event_id`; sync badge shows Pending → Synced.
4. **Undo** available for 10 s, then via the event log (writes `voidEvent`).
Netball variant uses Goal / Centre pass / Intercept per `lib/sports/netball.ts`.

### 6.2 Review & lock (post-match reconciliation)
1. Scorer taps **End match** → summary: final score, events per player, unsynced count.
2. Blocked if outbox is not empty; shows "3 events waiting for signal" with Retry.
3. Both coaches (or technical delegate) confirm on their phones, or the scorer records "confirmed on paper by …".
4. **Lock** sets fixture `completed`; triggers recompute standings, MVP, bracket advance, feed item.
5. After lock, edits need an admin and leave an audit entry.

### 6.3 Handoff: non-SS team → approved → fixtures
1. Coach completes Team Registration (school, details, logo/photo, review) → status **Pending**.
2. Admin sees it in **Approvals** (one list for teams, roles, regions) with Approve / Reject + reason.
3. Coach gets a notification; team appears in "My teams" as **Approved**.
4. Athletes self-register and request to join; coach confirms in the team sheet.
5. Team registers for a competition; once approved, it appears in the fixture generator's competition mode.

---

## PART 7 — Accessibility & Design System

### 7.1 Token matrix (light theme, from `index.css`)
| Token | Hex | Use | Contrast on background |
|---|---|---|---|
| `--background` | #FBF9F4 | Canvas | — |
| `--card` | #FFFFFF | Cards | — |
| `--foreground` | #36454F | Body text | ~9.6:1 |
| `--supporting` | #5F5C53 | Secondary text | ~6.4:1 |
| `--muted-foreground` | #6E6A5F | Captions ≥14px only | ~5.1:1 |
| `--control` | #87837A | Input borders | 3.6:1 (non-text, passes 3:1) |
| `--border` | #E3E1DB | Dividers | decoration only |
| `--primary` | #36454F | Primary buttons | text #FBF9F4 ~9.6:1 |
| `--success` | hsl(146 52% 24%) | Verified, synced | ≥7:1 |
| `--warning` | hsl(22 92% 37%) | Pending, suspensions | ≥4.5:1 |
| `--danger` | hsl(13 80% 40%) | Red cards, void, errors | ≥5:1 |
| `--live` (new) | #B42318 | LIVE dot + word | ≥5.5:1 |
| `--sport-handball` | #FF6B35 | Accent bars/chips only, never text | — |
| `--sport-netball` | #9B5DE5 | Accent bars/chips only, never text | — |

Remove: `--nash-*`, `--live-red`, `--silver-*` aliases after migration.

### 7.2 Type scale
Display: Space Grotesk 600 — 32 / 24 / 20. Body: Inter 400/500 — 16 base, 14 secondary, 12 minimum (labels only). Numbers (score, clock, jersey, IDs): JetBrains Mono, tabular; score 48–64 px on console.

### 7.3 Accessibility contract
- Targets 44 px (56 px on scoring); 8 px gaps.
- Every icon-only button has `aria-label`.
- Live score regions use `aria-live="polite"`; sync errors `aria-live="assertive"`.
- Visible focus ring (`--ring`, 2 px offset) on all controls.
- Motion ≤ 200 ms; `prefers-reduced-motion` disables Sly travel and transitions.
- State always shown as icon + word, never colour alone.

---

## PART 8 — Offline-First & Data Integrity

### 8.1 Outbox contract
```ts
interface OutboxOp {
  client_event_id: string;   // uuid, created at tap
  fixture_id: string;
  seq: number;               // per-fixture, monotonic on this device
  table: "match_events" | "fixtures";
  action: "insert" | "update";
  payload: Record<string, unknown>;
  attempts: number;
  status: "pending" | "syncing" | "failed";
  last_error?: string;
  created_at: number;
}
```
- Storage: IndexedDB (`nexus-outbox`), fallback to current localStorage.
- Server: `match_events.client_event_id uuid unique`; inserts use upsert ignore-duplicates, so retries are safe.
- Replay: on `online`, on app focus, and every 15 s while pending; strictly by `seq`; backoff 2 s → 4 → 8 → 30 s cap.
- Failed (validation, permission) ops stop the queue for that fixture and show the reason with **Retry** and **Discard** (discard requires confirm).

### 8.2 Connection badge
In the console header: `● Synced` / `◐ 3 pending` / `▲ Offline — saving on this phone` / `✕ 1 failed — tap to review`. Never a modal, never blocks scoring.

### 8.3 Optimistic rollback
Local score is derived from (server state + pending ops). If an op is rejected, it is removed from the derived view and shown in the failed list — nothing else is lost and the UI never freezes.

---

## PART 9 — Assistive AI (Sly)

- **Allow-list only:** Home, Results, Fixtures, Live list, Schools. Never on scoring, wizards, registration, camera, admin or broadcast.
- **Docking:** above the bottom bar clearance (`--layout-nav-clearance`) on mobile, bottom-right gutter outside content on desktop; steps aside when a dialog opens or a field is focused (already partly implemented).
- **Tone:** dry and short, but every claim describes a real feature. No invented numbers.
- **Tours:** run on the real page with real data; steps whose target is absent are skipped (current behaviour, keep). Any future practice mode is badged "Practice — not saved" and writes nothing.

---

## PART 10 — Roadmap

| Phase | Work | Done when |
|---|---|---|
| **1. Foundations** | Remove page-level header/footer stubs and wrappers (D-01); one sport list (D-03); roles on every tool (D-11); token clean-up + `--live` (D-06); honest stat cards (D-04) | No page renders its own chrome; only handball/netball appear anywhere; no admin tool visible to non-admins |
| **2. Scoring & navigation** | Single scorer console (6.1); undo bar; end-match/lock flow (6.2); Calendar→Fixtures, Tools→More; competition tabs (5.2) | A test scorer logs 20 events on a 360 px phone with no mis-taps |
| **3. Secondary screens** | Approvals inbox (6.3); fixture preview + slot allocator (D-09); mobile card lists + server search (D-10); empty states (D-12); wizard autosave (D-08); venue validation (D-13) | Every list has search, empty state and mobile layout |
| **4. Resilience & polish** | IndexedDB outbox + `client_event_id` unique index (D-02, Part 8); sync badge; Sly allow-list (D-07); accessibility pass (axe + manual) | Airplane-mode test: 50 events offline, reconnect, exactly 50 saved |
