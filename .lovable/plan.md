## Restructure Admin Dashboard — Schools-Only Handball/Netball Model

Rebuild `/admin` so it matches what the app actually does today: a closed Scholastic Services ecosystem for school Handball and Netball with a Zonal → District → Provincial → National pathway. Same single `/admin` route, content adapts to the signed-in role.

### Tab map (replaces current 13 tabs)

| New tab | Who sees it | Replaces |
|---|---|---|
| Overview | All admins | Overview |
| Schools & Teams | All admins (filtered by region) | Athletes + Teams |
| Competitions | super_admin, national_admin, region admins (own region) | Competitions |
| Sporting Calendar | super_admin, national_admin, region admins | new |
| Fixtures & Scoring | All admins (filtered) | Fixtures |
| Officials (HIC / Umpire) | super_admin, national_admin, region admins | Officials |
| Standings & Records | All admins | Standings |
| Broadcasts & Media | super_admin, national_admin | Broadcasts |
| Users & Roles | super_admin only | new (replaces Registrations) |
| Region Requests | super_admin only | (was at /admin/regions) |
| Federation Sync | super_admin only | Scholastic Services |

Removed entirely: Athletes, Teams (generic), Venues, Disciplinary, Registrations, Sponsorships.

### Sporting Calendar (new)

Per-discipline timeline (Handball, Netball) similar to NASH:
- Auto-populated from competitions: every competition with start/end dates becomes a calendar entry tagged by level and region
- Manual entries: training camps, trials, congresses, holidays
- Filters: discipline, level (Zonal/District/Provincial/National), season
- Views: list + month grid
- Region admins see their region + national; super_admin sees all
- New table `calendar_events` (discipline, level, region, title, start/end, type, competition_id?, created_by)

### Role-aware access

Wrap each tab section in a small `<RoleGate roles=[...] regions=[...]>` helper. Region admins only see/edit data scoped to their assigned zone/district/province (from `region_admin_assignments`).

| Role | Default landing tab | Scope |
|---|---|---|
| super_admin | Overview | Global |
| national_admin | Overview | Global, read-mostly except calendar/competitions |
| provincial_admin | Schools & Teams | Their province |
| district_admin | Fixtures & Scoring | Their district |
| zonal_admin | Fixtures & Scoring | Their zone |
| hic | Fixtures & Scoring | Assigned fixtures |
| coach | Schools & Teams | Their school's teams |

### Technical details

- Database: one migration to add `public.calendar_events` (with GRANTs + RLS) and a `competition_calendar_sync` trigger that mirrors competition date changes into the calendar
- `src/pages/AdminDashboard.tsx`: replace the tab list, drop dead forms/queries, gate sections by role + region using `useHasRole` and a new `useRegionScope` hook
- New components: `src/components/admin/SportingCalendar.tsx`, `src/components/admin/UsersRolesPanel.tsx`, `src/components/admin/RegionRequestsPanel.tsx` (move from `/admin/regions`), `src/components/admin/FederationSyncPanel.tsx` (move existing ScholasticPanel content)
- Remove `/admin/regions` standalone route (becomes a tab); keep redirect for old links
- Keep all existing data fetches that still apply; delete queries for the removed tabs (sponsorships, disciplinary, registrations, generic teams/athletes/venues)

### Out of scope (ask later if you want)

- Editing synced school/student records (stay read-only mirror)
- Bulk roster CSV imports
- Mobile-specific calendar gestures
