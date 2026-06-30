# Nexus Zimbabwe — End-to-End Testing Plan

This document walks every NASH/NAPH workflow end-to-end and covers the
bridge with Scholastic Services. Use it to validate the platform before
showing it to NASH's national executive.

Both apps live at:

- **Nexus Zimbabwe** — https://nexus-zim.lovable.app
- **Scholastic Services** — https://scholastic-services.lovable.app

The two apps share a Supabase project (`xkyqaeconxbsqgzgpxua`) but each
has its own auth model. Nexus uses Supabase Auth + `public.user_roles`.
Scholastic Services uses `public.school_users` with custom PBKDF2 auth.

---

## 0. Prerequisites — clean slate & test accounts

### 0.1 Remove any prior test data

In the Supabase SQL editor, run **once** before each clean test pass:

```sql
-- Nexus test data
DELETE FROM public.nash_eligibility_flags
  WHERE raised_by IN (
    SELECT id FROM auth.users WHERE email LIKE '%@nexus-test.zw'
  );
DELETE FROM public.nash_athlete_registrations
  WHERE nash_athlete_id IN (
    SELECT id FROM public.nash_athlete_registry WHERE nash_id LIKE 'NASH-%-TEST-%'
  );
DELETE FROM public.nash_athlete_registry WHERE nash_id LIKE 'NASH-%-TEST-%';
DELETE FROM public.fixtures WHERE competition_id IN (
  SELECT id FROM public.competitions WHERE name ILIKE 'TEST %'
);
DELETE FROM public.competitions WHERE name ILIKE 'TEST %';
DELETE FROM public.school_teams WHERE name ILIKE 'TEST %';

-- DO NOT delete from nash_organisations, nash_seasons, nash_sports,
-- nash_competition_tiers — those are reference seeds.
```

### 0.2 Seed test accounts (Nexus)

In the **Supabase dashboard → Edge Functions → seed-test-accounts**,
invoke with body:

```json
{ "action": "seed" }
```

This creates 20 NASH-role test users sharing password **`TestNash2026!`**
on the `@nexus-test.zw` email domain.

Returned accounts (one per NASH role):

| Email | Role | Use for |
|---|---|---|
| `platform@nexus-test.zw` | platform_admin | Step 1, 14 |
| `nash.national@nexus-test.zw` | nash_national | Steps 2–4, 13, MoPSE report |
| `naph.national@nexus-test.zw` | naph_national | Step 4b (NAPH variant) |
| `national.td.hb@nexus-test.zw` | national_technical_director | Step 13 |
| `harare.prov@nexus-test.zw` | provincial_admin | Step 5 |
| `harare.prov.td@nexus-test.zw` | provincial_technical_director | Step 5 |
| `harare.district@nexus-test.zw` | district_admin | Step 6 |
| `harare.district.td@nexus-test.zw` | district_technical_director | Step 6 |
| `harare.zone1@nexus-test.zw` | zonal_admin | Step 7 |
| `school.head@nexus-test.zw` | school_head | Step 8 (eligibility approval) |
| `coach.hb@nexus-test.zw` | coach | Steps 8, 9 (team registration) |
| `team.manager@nexus-test.zw` | team_manager | Step 8 |
| `referee.a@nexus-test.zw` | referee | Step 11 |
| `scorer@nexus-test.zw` | scorer | Step 11 (live scoring) |
| `timekeeper@nexus-test.zw` | timekeeper | Step 11 |
| `tech.delegate@nexus-test.zw` | technical_delegate | Step 11 (sanction) |
| `athlete@nexus-test.zw` | athlete | Step 10 (athlete profile) |
| `parent@nexus-test.zw` | parent | Step 10 |
| `organiser@nexus-test.zw` | competition_organiser | Step 4 |
| `broadcaster@nexus-test.zw` | broadcaster | Step 12 (broadcast) |

### 0.3 Seed test accounts (Scholastic Services)

In the SS Supabase dashboard, invoke **`seed-test-accounts`** with
`{"action":"seed"}`. Returns 19 staff accounts (school_users) all on
school `TEST_SCHOOL` with password **`Test1234!`** + a student portal
account `TSTD001` with the same password. **Save the response** — you
will need it for the bridge tests (Step 14).

---

## A. NEXUS WORKFLOWS (NASH platform)

### Step 1 — Platform Admin sanity check

1. Sign in at `/auth/login` as `platform@nexus-test.zw`
2. Land on `/dashboard` → should redirect to NASH National (Owner)
3. Verify in the top-right user dropdown: badge reads **PLATFORM ADMIN**
4. Visit `/admin/sports` — confirm **all 15 sports** listed (handball,
   netball, football, athletics, basketball, volleyball, swimming, cricket,
   rugby, hockey, tennis, cross country, table tennis, badminton, chess)
5. Visit `/admin/seasons` — confirm **Term 3 2026** marked **CURRENT**
6. Visit `/admin/organisations` — confirm NASH National + 10 provincial
   PSSAs in the tree
7. Sign out

### Step 2 — NASH National Command Centre

1. Sign in as `nash.national@nexus-test.zw`
2. You should land directly on `/federation/nash`
3. Verify header: **POWERED BY NASH** in gold under the wordmark
4. Verify 6 stat cards rendered: Registered Athletes, Schools, Active
   Competitions, Upcoming, Officials Deployed, Eligibility Flags
5. Verify the **Province Participation** card lists all 10 provinces with
   bar charts (will be 0 on a clean slate)
6. Verify **Quick Actions** card has 7 buttons (Create Competition,
   Review Eligibility Flags, Athlete Registry, etc.)

### Step 3 — Athlete Registry CRUD + dual-enrollment guard

1. Still as `nash.national`, navigate `/admin/athletes/new`
2. Register **Athlete A**:
   - First: `Tatenda`, Last: `Mukundi`, DOB: `2008-04-12`
   - Gender: Male, Province: Harare, School: `Prince Edward School`
3. Submit — toast should read **"Registered as NASH-2026-000001"**
   (or similar — first number for the year)
4. Browser navigates to `/players/NASH-2026-000001` — verify the public
   athlete profile renders
5. Go **back** to `/admin/athletes/new`. Register **Athlete B**:
   - First: `Bryan`, Last: `Mukundi`, DOB: **`2008-04-12`** (same DOB,
     same surname)
   - School: `St George's College` (different school)
6. As you type the surname + DOB, a **warning card** must appear showing
   "1 athlete with the same last name & DOB already in the registry"
   listing Tatenda Mukundi's NASH ID
7. Submit anyway — toast should read **"Registered with dual-enrollment
   flag"** with the conflict NASH ID
8. Navigate `/admin/eligibility` — you should see **1 open flag** of type
   "Dual Enrollment" against Bryan, with the description naming Tatenda's
   NASH ID and Prince Edward
9. Click **Review** → enter resolution "Verified with both schools — Bryan
   has transferred to St George's" → click **Mark Resolved**
10. Refresh `/admin/eligibility` — open count drops, the case moves to
    Resolved when you switch the filter
11. Visit `/admin/athletes` — both athletes appear in the registry with
    their NASH IDs

### Step 4 — Tournament Wizard creates a competition

1. As `organiser@nexus-test.zw`, sign in and go `/admin/competitions/new`
2. **Step 1**: Federation = NASH → Next
3. **Step 2**: Sport = Handball (HB) → Next
4. **Step 3**: Season = Term 3 2026 → Next
5. **Step 4**: Tier = District → Next
6. **Step 5**: Organisation = Harare Schools Sports Association → Next
7. **Step 6**: Gender = Boys, Age Group = U18 → Next
8. **Step 7**: Name suggestion populates automatically — edit to `TEST
   Harare District Handball U18 Boys`. Start = today, End = +7 days,
   Host school: `Prince Edward School` → Next
9. **Step 8**: Format = Round Robin → Next
10. **Step 9**: Entry fee = `25`, Total budget = `500` → Next
11. **Step 10**: Toggle **all three** verification switches ON → Next
12. **Step 11 (Review)**: confirm summary matches → **Create Competition**
13. Toast shows **"NASH sanction: NASH-HB-2026-HA-XXX"** (or HR depending
    on province code resolution)
14. Browser navigates to `/competition/<id>` — competition detail page
15. Visit `/admin/competitions` — competition appears in the list with
    its sanction number and **NASH-SANCTIONED** badge

**Step 4b — NAPH variant** (smoke test): Sign in as `naph.national` and
visit `/federation/naph`. Confirm the header band reads **NAPH** (not
NASH) but otherwise renders identically.

### Step 5 — Provincial dashboard

1. Sign in as `harare.prov@nexus-test.zw`
2. Lands at `/province` (or `/province/<orgId>`)
3. Stat cards: Provincial Competitions (should show 0 because Step 4 was
   district, not provincial), Athletes, Officials, Open Flags
4. Use the Tournament Wizard again at `/admin/competitions/new` —
   select Tier = **Provincial**, Organisation = Harare Schools Sports
   Association. Create a TEST provincial competition
5. Refresh `/province` — the new provincial comp appears in the bottom
   list

### Step 6 — District dashboard

1. Sign in as `harare.district@nexus-test.zw`
2. Lands at `/district`
3. The district tier competition from Step 4 appears in the bottom list
4. Quick actions: Eligibility, Officials, Finances, SS Sync

### Step 7 — Zonal dashboard

1. Sign in as `harare.zone1@nexus-test.zw` → lands at `/zone`
2. Confirm the chrome renders correctly; zonal competitions list will be
   empty unless you create one in the wizard with Tier = Zonal

### Step 8 — Coach Dashboard + Team Registration

1. Sign in as `coach.hb@nexus-test.zw`
2. Lands at `/coach/dashboard`. Stats show 0 across the board on a clean
   start
3. Click **Register Team** → land at `/coach/registration` (placeholder
   for the dedicated registration UI — for now use the legacy team
   builder at `/schools` → pick a school → New Team)
4. Build a team for handball, add 2 athletes (use the NASH IDs from
   Step 3)
5. Return to `/coach/dashboard` — squad list shows the registered
   athletes with eligibility chips (Pending until approved)
6. Verify the registration deadline countdown banner appears if Term 3
   2026's `registration_deadline` is within 30 days

### Step 9 — Eligibility approval

1. As `school.head@nexus-test.zw`, navigate `/school/eligibility`
2. Confirm the page renders (currently shares the federation
   EligibilityFlagsPage scoped to your school's records)
3. As `nash.national`, navigate `/admin/eligibility` — verify the
   pending registrations from Step 8 are visible

### Step 10 — Athlete + Parent views

1. Sign in as `athlete@nexus-test.zw` → lands at `/athlete/profile`
2. The "no athlete record linked" message appears (the test user isn't
   linked to a nash_athlete_id by default — that's expected. Link via
   `athletes.user_id = <auth user>` and `athletes.nash_athlete_id = <id>`
   in SQL to populate this view)
3. Sign in as `parent@nexus-test.zw` → also `/athlete/profile`. Same
   "no record" message.

### Step 11 — Live Scoring (sport-aware) + officials

1. Sign in as `tech.delegate@nexus-test.zw` and ensure the competition
   from Step 4 has at least one fixture (create via legacy
   `/admin/competitions` → competition detail → fixtures tab, OR via
   InterSchoolFixturesBuilder)
2. Sign in as `scorer@nexus-test.zw` and navigate `/scoring`
3. Pick the fixture, open `/score/<fixtureId>`
4. **The scoring buttons must be SPORT-SPECIFIC** for handball:
   `Goal`, `7m Goal`, `2-min Suspension`, `Yellow Card`, `Red Card`,
   `Timeout`, etc. — NOT just "Point Home/Away"
5. Record a goal → score updates → score_entries row inserted
6. As `referee.a@nexus-test.zw`, navigate `/official/dashboard` — your
   profile is loaded from nash_officials (will be empty unless you
   inserted a row; expected on clean run)

**Sport-awareness sanity matrix**: create dummy fixtures for football,
basketball, rugby, cricket competitions (use the wizard, pick different
sports) and confirm `/score/<fixtureId>` for each shows the right buttons:

- Football: Goal, Yellow, Red, Penalty Goal, Substitution, Offside, etc.
- Basketball: 2pt, 3pt, Free Throw, Personal Foul, Technical Foul, etc.
- Rugby: Try (+5), Conversion (+2), Penalty Goal (+3), Drop Goal (+3),
  Yellow with 10-min suspension
- Cricket: Run, Boundary 4, Boundary 6, Wicket, Wide, No Ball, Over End

### Step 12 — Broadcast CG

1. Sign in as `broadcaster@nexus-test.zw`
2. Navigate `/broadcast` — verify the NASH-themed gallery renders:
   Score Bug (4 states), Goal Celebration, Player Spotlight, Player of
   the Match, Bracket Reveal, Sponsor Billboard
3. Open a live fixture from Step 11 at `/broadcast/<fixtureId>` — the
   legacy live overlay with NASH header should render

### Step 13 — MoPSE Annual Report

1. As `nash.national`, navigate `/admin/reports`
2. Pick **Term 3 2026** from the season selector
3. The report renders with 6 sections:
   - Executive Summary
   - 1. Participation (by gender + by 10 provinces)
   - 2. Competitions by Tier (zonal/district/provincial/national)
   - 3. Competitions by Sport
   - 4. National & Provincial Champions
   - 5. Disciplinary & Eligibility (flag types)
   - 6. Official Deployment
4. Click **Print / Save as PDF** → browser print dialog opens
5. Save the PDF — should be a clean letterhead document with no UI chrome

### Step 14 — Competitions & Teams admin (delete actions)

1. As `organiser@nexus-test.zw`, navigate `/admin/competitions`
2. Find your TEST competition row → click the chevron to expand
3. Confirm fixtures load inline (empty if you didn't add any)
4. Click the red trash icon next to the competition → confirm dialog
   warns about cascade → confirm → competition row disappears
5. Navigate `/admin/teams` — find your TEST team → red trash icon →
   confirm → team row disappears
6. **Important**: deletes are creator-gated client-side. RLS is the
   ultimate authority. If you can't see a delete button on a row, it's
   because your user didn't create it.

### Step 15 — Public surfaces

1. Sign out completely
2. Visit `/` — the **NASH multi-sport public landing** loads:
   - "Every sport. Every school. One national network." hero
   - 4 live stat cards
   - Filter bar (Sport / Province / Tier)
   - LIVE NOW grid (renders only if any fixture has status =
     in_progress/live/active)
   - Upcoming Competitions grid
   - Latest Results grid
   - Latest Activity feed (from feed_items realtime)
   - Explore tile column
3. Visit each public route and confirm NASH chrome:
   - `/live` `/results` `/calendar` `/records` `/nashgames`
     `/standings/<id>` `/bracket/<id>` `/schools` `/players/<nashId>`
     `/competition/<id>`

---

## B. SCHOLASTIC SERVICES (the bridged app)

Sign in at `scholastic-services.lovable.app/login` using the test
accounts seeded in Step 0.3. All test staff use password `Test1234!`.

### SS-1 — Owner Admin dashboard
1. Sign in as `test_admin` → land on owner-admin dashboard
2. Confirm the new tabs are present: **Cards**, **Portals** (top
   sidebar)

### SS-2 — Card Generator
1. Owner Admin → **Cards** tab
2. Pick a school, upload a front + back background, an institution logo,
   and a manufacturer logo
3. Open the **Template editor** → drag the photo / QR / barcode / text
   fields on the live preview
4. Save as default → reload page → layout persists
5. Pick a student from the list → **PDF** button → single card PDF
   downloads with QR code
6. Select multiple students → **Print Sheet** button → A4 PDF with 8
   cards per page, fronts and mirrored backs for duplex printing
7. Verify the **input fields work** (no focus loss while typing — the
   old "entries not receiving input" bug must be gone)

### SS-3 — Portal Account Manager
1. Owner Admin → **Portals** tab
2. Pick a school
3. Click **Generate {N} Missing** to bulk-create portal accounts for
   every student without one
4. Verify each row shows `STU…` portal ID + reveal-able password
5. **Copy** → credentials copied to clipboard
6. **Reset password** → row gets a new password
7. **Export CSV** → CSV downloads with all credentials
8. Sign out, navigate to the student portal and **sign in with the
   portal_id + password** from the CSV — login succeeds

### SS-4 — Student Management parity
1. Owner Admin → **Students** tab (or `/students` if direct route)
2. Confirm all fields editable, including `national_id`, blood group,
   religion, nationality, house, boarding status, disability info,
   medical info
3. Add/edit/delete works on test data
4. Bulk operations: promote, batch-migrate, withdrawal — exercise each

### SS-5 — HR multi-role staff
1. Owner Admin → **Staff** / HR
2. Pick a staff member → assign multiple roles
3. Confirm they can toggle between dashboards for each role

### SS-6 — Teacher assignments
1. As a teacher staff member, navigate to the teacher dashboard
2. Confirm marks entry only shows subjects/classes they're assigned to
   teach

---

## C. THE BRIDGE — SS ↔ Nexus

### C-1 — Nexus reads from SS (Scholastic Sync)
1. In Nexus, sign in as `nash.national@nexus-test.zw`
2. Navigate `/admin/sync`
3. Click **Full sync** → toast reports schools/students/teams/players
   counts pulled from the SS bridge
4. Verify in Nexus database:
   - `public.teams` has `is_ss_school = true` rows from SS
   - `public.athletes` has `is_ss_linked = true` rows
   - `public.ss_sync_log` has a new row with `status = success`
5. Click **Run academic check** → baselines unchecked registrations as
   academic_eligible = true with today's date

### C-2 — Scholastic Card → Nexus login (the QR flow)
**The card QR encodes credentials with the same byte-exact format used
by both Nexus player verification and the student portal login.**

The format (from `_obfuscate_credentials` in `scholastic_cards.py`):

```
base64url( 0x01 + XOR(reverse(portalId), key)
                + 0x7C("|")
                + XOR(reverse(password), key)
                + checksum )
key = SHA-256(schoolId + "_SCHOLASTIC_SECRET")
checksum = XOR of all combined bytes
```

1. In SS Owner Admin → **Cards**, generate a card for `TSTD001` (the
   student created in Step 0.3) — the QR encodes the obfuscated
   credentials
2. Print the card (or screenshot it)
3. **Scholastic Services side**: sign out, go to the student portal
   login, click **Scan Card**, scan the QR — should auto-login as
   TSTD001
4. **Nexus side**: in Nexus, sign in as a scorer, navigate
   `/admin/verify` (PlayerVerifyPage). Scan the same QR. The page
   should:
   - Decode the QR using the same `decodeObfuscatedWithKey` algorithm
   - Look up the student via portal_accounts
   - Display: name, school, gate-eligibility status
5. **Both sides** decode the same payload. If one works and the other
   doesn't, the obfuscation key/algorithm has drifted and needs a
   matching fix in either `student-login` (SS) or `verify-card`
   (Nexus) edge function.

### C-3 — Nexus writes back to SS (activity)
1. Score a goal in Nexus for an SS-linked athlete (an athlete with
   `is_ss_linked = true` from C-1)
2. A row appears in SS `public.nexus_student_activity` with the
   `activity_type = 'goal'` and the student linked
3. View the student's profile in SS — the activity feed shows the goal

### C-4 — SS tier gating
1. In Nexus, try to register a team for a **Provincial** competition
   from a school that doesn't have SS Professional package
2. The team registration UI shows an **upgrade prompt** with a deep-link
   to SS

---

## D. ACCEPTANCE GATES

Before showing to NASH, all of the following must pass:

- [ ] All 20 NASH role accounts can sign in and reach a dashboard
- [ ] Header reads **NEXUS / POWERED BY NASH** in green & gold on every
      page (Live, Schools, Players, Competition, Standings, Bracket,
      Fixtures, Admin Dashboard, etc.)
- [ ] Athlete registration auto-raises dual-enrollment flag
- [ ] Eligibility Engine review modal resolves/dismisses with notes
- [ ] Tournament Wizard creates a competition with NASH sanction number
- [ ] Competition + fixture + team delete each cascade correctly with
      confirm modals
- [ ] Sport-specific scoring buttons render for ≥ 5 different sports
- [ ] Broadcast CG gallery renders without errors
- [ ] MoPSE PDF prints cleanly (no UI chrome, A4 size)
- [ ] SS Full Sync returns a success log
- [ ] Same Scholastic Card QR successfully logs into SS portal AND
      verifies on Nexus PlayerVerifyPage
- [ ] Goal scored in Nexus for SS-linked athlete appears in SS activity
      feed

---

## E. CLEANUP

Once testing is done:

```json
{ "action": "cleanup" }
```

posted to `seed-test-accounts` removes all `@nexus-test.zw` users and
their assigned roles. Run the SQL in §0.1 to remove any TEST-prefixed
competitions/teams/athletes left over.

---

_Powered by NASH · Integrated with Scholastic Services · Built by Aetheris Innovative Enterprises._
