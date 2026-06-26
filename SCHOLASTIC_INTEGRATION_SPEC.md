# Scholastic Services ⇄ Nexus — Integration Spec (v2)

> Audience: the Scholastic Services (SS) engineering team.  
> Goal: a closed, federated link where SS is the **source of truth** for schools, students and sports staff, and Nexus is the **execution engine** for handball & netball competitions. Sports data flows back so each student's SS profile shows their Nexus career.

Bridge URL (SS side, public):
```
POST https://scholasticservices.online/functions/v1/scholastic-bridge
```
All requests are signed (see Auth below). No anonymous access. Same headers in both directions.

---

## 1. Auth & headers

Every call between Nexus ↔ SS carries:

| Header | Purpose |
|---|---|
| `X-Federation-Issuer` | `nexus` or `scholastic` |
| `X-Federation-Timestamp` | Unix seconds, must be within ±300s |
| `X-Federation-Signature` | `hex(HMAC_SHA256(secret, issuer + "." + ts + "." + rawBody))` |
| `X-Federation-Jwt` | HS256 JWT signed with `FEDERATION_JWT_SECRET`, 5-min TTL, `iss` = issuer |

Shared secrets (already provisioned on Nexus, please set the same values on SS):
- `FEDERATION_HMAC_SECRET` = `9347e5acfd36c79b7530cafb6af5483714a7fa044ed0222141fef88cde69fb08`
- `FEDERATION_JWT_SECRET` (separately rotated)

Reject any request where timestamp drift > 300s or signature mismatches.

---

## 2. Endpoints SS must expose

The bridge is a single function that switches on `action`:

### 2.1 `fetch-schools`
Returns every school SS has vetted.
```jsonc
{
  "action": "fetch-schools",
  "since": "2026-06-01T00:00:00Z"   // optional — incremental
}
```
Response:
```jsonc
{
  "schools": [{
    "external_school_id": "ss_sch_abc123",
    "name": "Marist Brothers Nyanga",
    "short_name": "MBN",
    "logo_url": "https://...",
    "banner_url": "https://...",
    "city": "Nyanga",
    "province": "Manicaland",
    "district": "Nyanga",
    "zone": "Eastern Highlands",
    "level": "secondary",            // primary | secondary | tertiary
    "student_count": 842,
    "head_email": "head@mbn.ac.zw",
    "updated_at": "2026-06-25T10:00:00Z"
  }]
}
```

### 2.2 `fetch-students`
Athlete-eligible students only. **Do not send academic grades, fees, addresses or medical data.** Nexus only needs sport eligibility.
```jsonc
{ "action": "fetch-students", "school_id": "ss_sch_abc123" }
```
Response:
```jsonc
{
  "students": [{
    "external_student_id": "ss_std_xyz789",
    "external_school_id": "ss_sch_abc123",
    "first_name": "Tendai",
    "last_name_initial": "M.",        // privacy — full surname stays on SS
    "dob_year": 2009,                  // year only, used for age groups
    "gender": "F",
    "photo_url": "https://...",
    "card_qr_hash": "sha256:...",      // see §5
    "house": "Mhondoro",
    "year_group": 3,
    "updated_at": "..."
  }]
}
```

### 2.3 `fetch-school-staff`  *(currently 500ing — see Known Issues)*
Returns coaches, sports directors and HICs.
```jsonc
{ "action": "fetch-school-staff", "school_id": "ss_sch_abc123" }
```
Response shape:
```jsonc
{
  "staff": [{
    "external_staff_id": "ss_stf_001",
    "external_school_id": "ss_sch_abc123",
    "full_name": "Mr T. Moyo",
    "email": "tmoyo@mbn.ac.zw",        // used to auto-grant Nexus role
    "phone": "+263...",                 // optional — DO NOT select a column that doesn't exist
    "ss_role": "sports_director",      // sports_director | hic | coach | teacher
    "sports": ["handball", "netball"],
    "photo_url": "https://...",
    "updated_at": "..."
  }]
}
```
**Known bug:** the current handler errors with `column school_users.mobile does not exist`. Either add the `mobile` column or change the SELECT to use the actual phone column (or omit it). Until fixed, Nexus skips staff sync.

### 2.4 `verify-card`
Called when Nexus scans a Scholastic Card QR.
```jsonc
{ "action": "verify-card", "qr_payload": "<raw string from QR>" }
```
Response:
```jsonc
{
  "valid": true,
  "external_student_id": "ss_std_xyz789",
  "external_school_id": "ss_sch_abc123",
  "name": "Tendai M.",
  "photo_url": "https://...",
  "eligible_age_groups": ["U16", "U18"],
  "warnings": []                      // e.g. ["transferred"], ["suspended"]
}
```

---

## 3. Endpoint SS must accept (mirror push)

Nexus pushes back per-student sport activity whenever a fixture finalises, a record is set, or a badge is awarded.

`POST` to bridge with:
```jsonc
{
  "action": "push-nexus-mirror",
  "studentId": "ss_std_xyz789",
  "schoolId": "ss_sch_abc123",
  "payload": {
    "rankings":  [...],   // standings rows
    "personalBests": [{ "event": "...", "value": "..." }],
    "recentFixtures": [{ "id": "...", "home_score": 24, "away_score": 21, "status": "completed", "ended_at": "..." }],
    "standings": [...],
    "records":  [{ "discipline": "handball", "event_name": "goals", "value": 12, "achieved_at": "..." }],
    "badges":   [{ "code": "50_goal_club", "awarded_at": "..." }],
    "summary":  { "matches": 18, "goals": 67, "mvp_count": 3, "shooting_pct": 64.2 }
  }
}
```
SS persists this on the student's profile under a `sports.nexus` block (overwrite-on-write). 200 OK with `{ ok: true }` is enough.

---

## 4. Modifying the SS Student Sports profile

On the student detail page, add a **Sports** tab fed entirely from `sports.nexus`:

```
┌─────────────────────────────────────────────┐
│ [photo] Tendai M.  •  Year 3  •  Mhondoro    │
│ Handball · Netball                           │
├─────────────────────────────────────────────┤
│ ► Career    18 matches · 67 goals · 64% shot │
│ ► Form      ●●●○●●○●●○  (W/L last 10)        │
│ ► Records   3 personal bests  ›              │
│ ► Badges    50-Goal Club, MoM ×3             │
│ ► Recent    vs Peterhouse  24-21  W  ›       │
│             vs Falcon       19-22  L  ›      │
│ ─────────────────────────────────────────── │
│ View full profile on Nexus →                 │
└─────────────────────────────────────────────┘
```
- "View full profile on Nexus" → `https://nexuszw.online/players/<external_student_id>` (Nexus resolves by `external_student_id`).
- All numbers are read from `sports.nexus.summary` — SS does **not** compute them.
- If `sports.nexus` is missing, show "No competition data yet — eligible to play."

---

## 5. Scholastic Card QR — structure & decoding

Use the format SS already issues (don't invent a new one). Document confirms:
- QR payload is an opaque token (URL-safe base64) that the bridge alone can decode.
- Nexus never parses the payload locally — it always calls `verify-card` and trusts the response.
- The token embeds: `student_id`, `school_id`, `issued_at`, `card_version`, and an HMAC tail signed with an SS-only secret.
- Nexus stores only the returned `external_student_id` on `scholastic_card_verifications` for audit.

If you rotate the card-signing secret, no change is needed on Nexus.

---

## 6. Sports Director / School Coordinator — role & UI in SS

Create a first-class **Sports Director** role in SS (same weight as a Head of Department). One per school. They are the only SS users with write access to the new **School Sports** module:

| Capability in SS | Writes to Nexus via |
|---|---|
| Add/remove athletes from a sport's eligibility list | `fetch-students` next sync picks them up |
| Edit school logo, banner, house list, sport colours | `fetch-schools` next sync |
| Appoint **Coaches** & **HICs** (with sport + age group) | `fetch-school-staff` |
| Publish a **Team Sheet** (squad of 12-15 for a fixture) | `POST push-team-published` (new) |
| Approve a transfer request | `POST push-transfer-approved` (new) |
| View Nexus competition invitations | `GET pull-nexus-invitations` (new) |

### New outbound endpoints SS should expose for the Sports Director
1. **`push-team-published`** — SS → Nexus  
   ```jsonc
   { "action": "push-team-published",
     "external_school_id": "...",
     "team": { "name": "MBN Handball U16 Girls", "sport": "handball", "age_group": "U16", "gender": "F",
               "photo_url": "...", "coach_external_staff_id": "...",
               "players": [{ "external_student_id": "...", "shirt": 7, "position": "GK", "is_captain": true }] }
   }
   ```
2. **`pull-nexus-invitations`** — SS pulls the list of fixtures Nexus is inviting this school to, so the director can accept/decline inside SS.
3. **`push-invitation-response`** — director's response back to Nexus.

### Sports Director UI in SS (one new top-level nav item: **"School Sports"**)
```
Schools › <School> › School Sports
  ├─ Overview        (cards: active teams, upcoming fixtures, recent results)
  ├─ Teams           (CRUD team sheets, team photo, coach assignment)
  ├─ Athletes        (toggle sport eligibility, view per-athlete Nexus stats)
  ├─ Staff           (add coaches/HICs, set sports + age groups)
  ├─ Fixtures        (calendar pulled from Nexus, accept/decline invitations)
  └─ Settings        (house list, sport colours, banner upload)
```
Everything in this module is mirrored to Nexus on save. The director never logs into Nexus directly — SS is their only surface.

### Auto-role granting on Nexus
When a staff record arrives via `fetch-school-staff`, Nexus:
1. Matches `staff.email` against `auth.users.email`.
2. If a Nexus account exists, grants the matching role (`sports_director` → `school_coordinator`, `hic` → `hic`, `coach` → `coach`).
3. If not, the email is whitelisted — when that person signs up on Nexus, the role is granted immediately, no admin approval needed.

---

## 7. Known issues to fix on SS now
1. **`fetch-school-staff`** → 500 `column school_users.mobile does not exist`. Fix the column name or add the column.
2. CORS on the bridge — currently allows all origins (Nexus logs warn `ALLOWED_ORIGINS not set`). Restrict to `https://nexuszw.online,https://www.nexuszw.online,https://nexus-zim.lovable.app`.
3. Add `sports_director` to the SS role enum so step 6 above is enforceable.
4. Add a `mobile` (or `phone`) column on `school_users` if you want phone numbers federated.

---

## 8. Sync cadence
- Nexus polls `fetch-schools`, `fetch-students`, `fetch-school-staff` every **2 minutes** (already implemented in `useScholasticAutoSync`).
- SS should fire `push-team-published` and `push-invitation-response` **immediately on save** (no polling).
- Nexus fires `push-nexus-mirror` **immediately** on fixture finalize, record verify, badge award.

That's the whole contract. Once §7.1 is fixed, staff & sports-director rollout unblocks end-to-end.
