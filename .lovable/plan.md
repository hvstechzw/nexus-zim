The user wants to pivot Nexus from a public/multi-level competition platform to a **schools-only** platform. All athletes come from Scholastic Services (students), all teams are schools from Scholastic Services. No public registration. Everything is built around school competitions.

Let me check the current admin/competition pages quickly to understand what needs adjusting.

Key changes needed:

1. Remove public registration (RegistrationPanel) from homepage
2. Reframe homepage messaging as "Schools Competition Hub"
3. Lock athlete/team creation to Scholastic Services sync only (no manual creation in admin)
4. Add school-specific tooling: inter-school fixtures, house competitions, age groups (U12/U14/U16/U19) cater for all possible! And also allow for adding custom age groups, term-based seasons, school sports day mode
5. Hero stats reframed (Schools, Students, Inter-School Fixtures, etc.)
6. LevelSwitcher → school-tier switcher (Primary / Secondary / Tertiary)
7. Header nav: drop public-facing items, add Schools, Students, Inter-School Fixtures, Sports Day
8. Auto-sync Scholastic on admin load (already in plan), plus a Schools directory page
9. Branding: "Nexus for Schools — exclusively powered by Scholastic Services"

# Plan: Pivot Nexus to a Schools-Only Competition Platform

## Vision

Nexus becomes **Nexus for Schools** — a closed platform exclusively for school competitions in Zimbabwe. No public sign-ups. All schools and students are pulled from Scholastic Services. Every tool is purpose-built for inter-school sport, academic, and cultural competitions.

## 1. Remove the public-facing layer

- Delete `RegistrationPanel` from the homepage (`src/pages/Index.tsx`).
- Remove the "self sign-up" path from `AuthModal` — keep only **School Coordinator login** and **Student Athlete login** (accounts created exclusively via Scholastic sync, login uses email + password issued by school).
- Add a "Request access via your school" notice instead of signup, linking to scholasticservices.online.

## 2. Reframe the homepage as a Schools Hub

New section order in `src/pages/Index.tsx`:

1. `NexusHero` — rewritten: "Zimbabwe's Inter-School Competition Network"
2. `LiveScoreboard` — filtered to school fixtures only
3. `SchoolTierSwitcher` (replaces `LevelSwitcher`) — Primary / Secondary / Tertiary / All
4. `SchoolsDirectory` (new) — grid of synced schools with logos, province, sports
5. `EventsGrid` — relabelled "Inter-School Competitions"
6. `StandingsTable` — school league tables
7. `BroadcastHub` — school match streams
8. `ScholasticPartnerSection` (new, replaces RegistrationPanel) — explains the exclusive integration and how schools join via Scholastic Services

## 3. Reframe stats & language across the app


| Old                   | New                            |
| --------------------- | ------------------------------ |
| Athletes              | Student Athletes               |
| Teams                 | Schools                        |
| Competitions          | School Competitions            |
| Fixtures              | Inter-School Fixtures          |
| Province registration | Drawn from Scholastic Services |


Update: `NexusHero` stats, `NexusHeader` nav links, `NexusFooter` tagline, page titles, and `index.html` meta.

## 4. School-specific competition tooling

Add to `AdminDashboard` (and a new Schools page) — these are the "all tools needed for school competitions":

- **Age group brackets**: U10, U12, U14, U16, U19, Open — applied as a filter on competitions and standings.
- **House competitions mode**: when a single school runs internal houses (Red/Blue/Green/Yellow) — auto-creates 4 sub-teams under the school.
- **Inter-school fixtures generator**: pick N schools + discipline + age group → auto-builds round-robin or knockout draw.
- **Sports Day mode**: one-day, multi-event, multi-age-group meet with live points table per school.
- **Term-based seasons**: Term 1 / Term 2 / Term 3 instead of calendar seasons.
- **Discipline catalogue tuned for schools**: Athletics, Football, Rugby, Netball, Cricket, Hockey, Basketball, Tennis, Swimming, Chess, Debate, Quiz, Public Speaking, Spelling Bee, Science Olympiad, Maths Olympiad. Just add all possible disciplines and sports including volleyball, EVERYTHING infact including darts. 
- **School roster view**: per school → list of students from Scholastic, assignable to teams per discipline.
- **Permission tiers**: School Coordinator (manages only their school), Federation Official (cross-school), Super Admin.

## 5. Lock down data origin to Scholastic Services

- Remove "Add Athlete" and "Add School/Team" manual forms from `AdminDashboard` — replace with **"Sync from Scholastic Services"** as the only path.
- Auto-trigger `scholastic-sync?action=sync-all` on first admin load if `teams` count is 0.
- Add a "Sync status" widget showing last sync time, schools synced, students synced.
- Show a Scholastic verified badge next to every school and student row everywhere they appear.

## 6. New pages

- `/schools` — directory of all synced schools, filterable by province, level (primary/secondary/tertiary), sport offered. Click → school profile with roster, fixtures, standings, trophies.
- `/schools/:id` — school profile page.
- `/sports-day` — Sports Day live console (event queue, live points per school, announcer view).
- `/inter-school` — inter-school fixtures dashboard.
- You can add a public no login needed section for local scoring maybe used during training etc

Existing pages updated: `/admin`, `/competitions`, `/fixtures`, `/scoring`, `/broadcast` — all relabelled and filtered to schools-only context.

## 7. Branding pass

- Update logo strip / header tagline to **"Nexus for Schools"**.
- Add the `ScholasticIntegrationBanner` (already built) to: top of `/admin`, top of `/schools`, footer of every page.
- Rewrite `NexusHero` copy to lead with schools.
- Update `index.html` `<title>` and meta description.
- Update `AuthModal` heading: "School Coordinator & Student Sign-In".

## 8. Database touches (minimal — schema already supports this)

No new tables required. Light additions:

- Add `age_group` (text) and `term` (text) columns to `competitions` via migration.
- Add `house` (text, nullable) column to `athletes` for house competitions.
- Add `sports_offered` (text[]) column to `teams` for school-level sport catalogue.
- Also get school logos etc

## Technical notes

- All changes are frontend + one small migration + one edge-function tweak (sync-all on first admin load is already wired; just needs the auto-trigger).
- `RegistrationPanel.tsx` will be deleted; references removed from `Index.tsx`.
- `LevelSwitcher.tsx` renamed/replaced by `SchoolTierSwitcher.tsx`.
- New components: `SchoolsDirectory.tsx`, `ScholasticPartnerSection.tsx`, `SyncStatusWidget.tsx`, `AgeGroupFilter.tsx`, `SportsDayConsole.tsx`, `InterSchoolFixturesBuilder.tsx`, `HouseCompetitionsPanel.tsx`.
- New pages: `SchoolsPage.tsx`, `SchoolProfilePage.tsx`, `SportsDayPage.tsx`, `InterSchoolPage.tsx`.

## Out of scope (confirm if you want these too)

- Parent/guardian portal: no
- Fee collection / payments: no
- SMS notifications to school: no