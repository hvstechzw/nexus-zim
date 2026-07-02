// Inbound federation endpoint — called by Scholastic Services (and partners).
// HMAC-required on every request. Never accepts a Supabase user JWT.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { verifyFederationRequest } from "../_shared/federation.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HMAC_SECRET = Deno.env.get("FEDERATION_HMAC_SECRET")!;
const JWT_SECRET = Deno.env.get("FEDERATION_JWT_SECRET")!;
const EXPECTED_ISSUER = Deno.env.get("FEDERATION_ISSUER_EXPECTED") || "scholastic";

const json = (cors: Record<string, string>, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

function normalizeNexusSport(v: any): "handball" | "netball" | "both" | null {
  if (!v) return null;
  const s = String(v).toLowerCase().trim();
  if (s === "handball" || s === "netball" || s === "both") return s;
  if (s.includes("hand")) return "handball";
  if (s.includes("net")) return "netball";
  return null;
}

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return json(cors, { error: "server misconfigured" }, 500);
  }
  if (!HMAC_SECRET || !JWT_SECRET) {
    return json(cors, { error: "federation secrets not configured" }, 503);
  }

  let rawBody = "";
  try { rawBody = await req.text(); } catch { rawBody = ""; }

  const verified = await verifyFederationRequest(req, rawBody, {
    hmacSecret: HMAC_SECRET,
    jwtSecret: JWT_SECRET,
    expectedIssuer: EXPECTED_ISSUER,
  });
  if (!verified.ok) return json(cors, { error: verified.error }, verified.status);

  let body: any = {};
  try { body = rawBody ? JSON.parse(rawBody) : {}; }
  catch { return json(cors, { error: "invalid json" }, 400); }

  const action: string = body.action || new URL(req.url).searchParams.get("action") || "";
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  try {
    switch (action) {
      case "pull-calendar":           return await pullCalendar(cors, supabase, body);
      case "pull-events":             return await pullCalendar(cors, supabase, body);
      case "pull-scores":             return await pullScores(cors, supabase, body);
      case "pull-matrix":             return await pullMatrix(cors, supabase, body);
      case "pull-rankings":           return await pullRankings(cors, supabase, body);
      case "pull-player-data":        return await pullPlayerData(cors, supabase, body);
      case "register-athlete-mirror": return await registerAthleteMirror(cors, supabase, body);
      case "push-athlete":            return await pushAthlete(cors, supabase, body);
      case "link-account":            return await linkAccount(cors, supabase, body);
      case "register-entry":          return await registerEntry(cors, supabase, body);
      case "push-team-published":     return await pushTeamPublished(cors, supabase, body);
      case "pull-nexus-invitations":  return await pullInvitations(cors, supabase, body);
      case "push-invitation-response":return await pushInvitationResponse(cors, supabase, body);
      case "webhook-register":        return await webhookRegister(cors, supabase, body);
      default:
        return json(cors, { error: `unknown action: ${action || "(none)"}` }, 400);
    }
  } catch (e: any) {
    console.error("[scholastic-federation]", action, e);
    const detail = e?.message || e?.hint || e?.details || (typeof e === "string" ? e : JSON.stringify(e));
    return json(cors, {
      error: detail || "internal error",
      action,
      code: e?.code || null,
      hint: e?.hint || null,
      details: e?.details || null,
    }, 500);
  }
});

// ---------- Actions ----------

async function pullCalendar(cors: Record<string, string>, supabase: any, body: any) {
  const { external_school_id, from, to, season, limit = 200 } = body;
  let teamId: string | null = null;
  if (external_school_id) {
    const { data: t } = await supabase
      .from("teams").select("id").eq("external_school_id", external_school_id).maybeSingle();
    teamId = t?.id || null;
  }

  let q = supabase
    .from("competitions")
    .select("id, name, discipline, level, start_date, end_date, status, venue:venue_id(name, city, province)")
    .order("start_date", { ascending: true })
    .limit(Math.min(Number(limit) || 200, 1000));
  if (season) q = q.eq("season", season);
  if (from) q = q.gte("start_date", from);
  if (to) q = q.lte("end_date", to);
  const { data, error } = await q;
  if (error) throw error;

  let events = (data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    discipline: c.discipline,
    level: c.level,
    start_date: c.start_date,
    end_date: c.end_date,
    venue: c.venue ? `${c.venue.name}${c.venue.city ? ", " + c.venue.city : ""}` : null,
    status: c.status,
  }));

  if (teamId) {
    const { data: regs } = await supabase
      .from("registrations").select("competition_id").eq("team_id", teamId);
    const allowed = new Set((regs || []).map((r: any) => r.competition_id));
    events = events.filter((e: any) => allowed.has(e.id));
  }

  return json(cors, { events });
}

async function pullScores(cors: Record<string, string>, supabase: any, body: any) {
  const { competition_id, external_school_id, since, limit = 200 } = body;
  let teamId: string | null = null;
  if (external_school_id) {
    const { data: t } = await supabase
      .from("teams").select("id").eq("external_school_id", external_school_id).maybeSingle();
    teamId = t?.id || null;
  }

  let q = supabase
    .from("fixtures")
    .select(`id, competition_id, home_score, away_score, status, ended_at,
             home:home_team_id(id, name, external_school_id),
             away:away_team_id(id, name, external_school_id)`)
    .order("ended_at", { ascending: false, nullsFirst: false })
    .limit(Math.min(Number(limit) || 200, 1000));
  if (competition_id) q = q.eq("competition_id", competition_id);
  if (since) q = q.gte("ended_at", since);
  if (teamId) q = q.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);
  const { data, error } = await q;
  if (error) throw error;

  return json(cors, {
    fixtures: (data || []).map((f: any) => ({
      id: f.id,
      competition_id: f.competition_id,
      home: f.home ? { id: f.home.id, name: f.home.name, external_school_id: f.home.external_school_id } : null,
      away: f.away ? { id: f.away.id, name: f.away.name, external_school_id: f.away.external_school_id } : null,
      home_score: f.home_score,
      away_score: f.away_score,
      status: f.status,
      ended_at: f.ended_at,
    })),
  });
}

async function pullMatrix(cors: Record<string, string>, supabase: any, body: any) {
  const { competition_id, external_school_id } = body;

  let teamQ = supabase.from("teams").select("id, name, discipline, external_school_id");
  if (external_school_id) teamQ = teamQ.eq("external_school_id", external_school_id);
  const { data: teams, error: tErr } = await teamQ.limit(500);
  if (tErr) throw tErr;

  const teamIds = (teams || []).map((t: any) => t.id);
  let standingsQ = supabase
    .from("standings")
    .select("team_id, competition_id, position, played, won, drawn, lost, points")
    .in("team_id", teamIds.length ? teamIds : ["00000000-0000-0000-0000-000000000000"]);
  if (competition_id) standingsQ = standingsQ.eq("competition_id", competition_id);
  const { data: standings } = await standingsQ;

  const byTeam = new Map<string, any>();
  for (const s of standings || []) {
    if (!byTeam.has(s.team_id)) byTeam.set(s.team_id, s);
  }

  return json(cors, {
    teams: (teams || []).map((t: any) => ({
      external_school_id: t.external_school_id,
      name: t.name,
      discipline: t.discipline,
      standing: byTeam.get(t.id)
        ? {
            position: byTeam.get(t.id).position,
            played: byTeam.get(t.id).played,
            won: byTeam.get(t.id).won,
            drawn: byTeam.get(t.id).drawn,
            lost: byTeam.get(t.id).lost,
            points: byTeam.get(t.id).points,
          }
        : null,
    })),
  });
}

async function pullPlayerData(cors: Record<string, string>, supabase: any, body: any) {
  const { external_student_id } = body;
  if (!external_student_id) return json(cors, { error: "external_student_id required" }, 400);

  const { data: athlete, error } = await supabase
    .from("athletes")
    .select("id, external_student_id, first_name, last_name, display_name, gender, date_of_birth, province, school_name, club_name, disciplines, personal_bests, is_active, is_suspended, photo_url")
    .eq("external_student_id", external_student_id)
    .maybeSingle();
  if (error) throw error;
  if (!athlete) return json(cors, { error: "athlete not found" }, 404);

  const [recordsRes, standingsRes, fixturesRes] = await Promise.all([
    supabase.from("records")
      .select("id, record_type, discipline, event_name, value, unit, achieved_at, is_verified")
      .eq("athlete_id", athlete.id).order("achieved_at", { ascending: false }).limit(50),
    supabase.from("standings")
      .select("competition_id, position, points, played, won, drawn, lost")
      .eq("athlete_id", athlete.id).limit(50),
    supabase.from("fixtures")
      .select("id, competition_id, home_score, away_score, status, ended_at, home_athlete_id, away_athlete_id")
      .or(`home_athlete_id.eq.${athlete.id},away_athlete_id.eq.${athlete.id}`)
      .order("ended_at", { ascending: false, nullsFirst: false }).limit(20),
  ]);

  const personalBests = athlete.personal_bests && typeof athlete.personal_bests === "object"
    ? Object.entries(athlete.personal_bests as Record<string, unknown>).map(([k, v]) => ({ event: k, value: v }))
    : [];

  return json(cors, {
    athlete,
    personalBests,
    rankings: standingsRes.data || [],
    recentFixtures: fixturesRes.data || [],
    records: recordsRes.data || [],
  });
}

async function registerAthleteMirror(cors: Record<string, string>, supabase: any, body: any) {
  const { external_student_id, first_name, last_name, date_of_birth, gender, province, school_name, external_school_id, disciplines, photo_url } = body;
  if (!external_student_id || !first_name || !last_name) {
    return json(cors, { error: "external_student_id, first_name, last_name required" }, 400);
  }

  let school = school_name || null;
  if (external_school_id) {
    const { data: t } = await supabase
      .from("teams").select("name").eq("external_school_id", external_school_id).maybeSingle();
    if (t?.name) school = t.name;
  }

  const patch = {
    external_student_id,
    first_name,
    last_name,
    date_of_birth: date_of_birth || null,
    gender: gender || null,
    province: province || "Unknown",
    school_name: school,
    disciplines: Array.isArray(disciplines) ? disciplines : (disciplines ? [String(disciplines)] : ["General"]),
    photo_url: photo_url || null,
    is_active: true,
  };

  const { data, error } = await supabase
    .from("athletes")
    .upsert(patch, { onConflict: "external_student_id" })
    .select("id, external_student_id")
    .maybeSingle();
  if (error) throw error;

  // Fire-and-forget mirror back so Scholastic's view is in sync.
  try {
    await fetch(new URL("/functions/v1/scholastic-push", SUPABASE_URL).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "x-internal-call": "1",
      },
      body: JSON.stringify({ athleteId: data?.id }),
    });
  } catch (e) {
    console.warn("[register-athlete-mirror] push failed", e);
  }

  return json(cors, { ok: true, athleteId: data?.id, external_student_id: data?.external_student_id });
}

async function webhookRegister(cors: Record<string, string>, supabase: any, body: any) {
  // Accept partner webhook registration metadata for future routing.
  // We just log + ack for now; storage table can be added later if needed.
  console.log("[webhook-register]", JSON.stringify(body));
  return json(cors, { ok: true, received: true });
}

// ---------- Expanded actions ----------

async function pushAthlete(cors: Record<string, string>, supabase: any, body: any) {
  const {
    studentId, external_student_id,
    email, fullName, first_name, last_name,
    schoolId, external_school_id,
    sports, primarySport, primary_sport,
    preferredPosition, secondaryPosition,
    dominantHand, heightCm, weightKg,
    jerseyNumber, yearsPlaying, previousClubs,
    parentConsent, medicalCleared, bio,
    photo_url, gender, date_of_birth, province,
  } = body;

  const sid = studentId || external_student_id;
  if (!sid) return json(cors, { error: "studentId (external_student_id) required" }, 400);

  let fn = first_name, ln = last_name;
  if ((!fn || !ln) && fullName) {
    const parts = String(fullName).trim().split(/\s+/);
    fn = fn || parts[0] || "Unknown";
    ln = ln || parts.slice(1).join(" ") || "—";
  }
  if (!fn || !ln) return json(cors, { error: "fullName or first_name/last_name required" }, 400);

  const ssid = schoolId || external_school_id || null;
  let schoolName: string | null = null;
  if (ssid) {
    const { data: t } = await supabase
      .from("teams").select("name").eq("external_school_id", ssid).maybeSingle();
    schoolName = t?.name || null;
  }

  const disciplines = Array.isArray(sports) && sports.length
    ? sports
    : (primarySport || primary_sport ? [primarySport || primary_sport] : ["Handball"]);

  const patch: Record<string, any> = {
    external_student_id: sid,
    first_name: fn,
    last_name: ln,
    display_name: `${fn} ${ln[0] || ""}.`.trim(),
    gender: gender || null,
    date_of_birth: date_of_birth || null,
    province: province || "Unknown",
    school_name: schoolName,
    ss_school_id: ssid,
    disciplines,
    primary_sport: primarySport || primary_sport || disciplines[0] || null,
    nexus_sport: normalizeNexusSport(primarySport || primary_sport || disciplines[0]),
    preferred_position: preferredPosition ?? null,
    secondary_position: secondaryPosition ?? null,
    dominant_hand: dominantHand ?? null,
    height_cm: heightCm ?? null,
    weight_kg: weightKg ?? null,
    jersey_number: jerseyNumber ?? null,
    years_playing: yearsPlaying ?? null,
    previous_clubs: previousClubs ?? null,
    parent_consent: parentConsent === true,
    medical_cleared: medicalCleared === true,
    bio: bio ?? null,
    photo_url: photo_url ?? null,
    is_active: true,
    is_ss_linked: true,
  };

  const { data, error } = await supabase
    .from("athletes")
    .upsert(patch, { onConflict: "external_student_id" })
    .select("id, external_student_id")
    .maybeSingle();
  if (error) throw error;

  return json(cors, { ok: true, athleteId: data?.id, external_student_id: data?.external_student_id });
}

async function linkAccount(cors: Record<string, string>, supabase: any, body: any) {
  const { external_student_id, email, user_id, first_name, last_name, fullName } = body;
  if (!external_student_id) return json(cors, { error: "external_student_id required" }, 400);

  let { data: athlete, error: aErr } = await supabase
    .from("athletes").select("id, user_id").eq("external_student_id", external_student_id).maybeSingle();
  if (aErr) throw aErr;

  // Auto-create a stub athlete so link can succeed before push-athlete
  if (!athlete) {
    let fn = first_name, ln = last_name;
    if ((!fn || !ln) && fullName) {
      const parts = String(fullName).trim().split(/\s+/);
      fn = fn || parts[0] || "Pending";
      ln = ln || parts.slice(1).join(" ") || "—";
    }
    const stub = {
      external_student_id,
      first_name: fn || "Pending",
      last_name: ln || "—",
      display_name: `${fn || "Pending"} ${(ln || "").charAt(0)}.`.trim(),
      province: "Unknown",
      disciplines: ["Handball"],
      is_active: true,
      is_ss_linked: true,
    };
    const { data: created, error: cErr } = await supabase
      .from("athletes").upsert(stub, { onConflict: "external_student_id" })
      .select("id, user_id").maybeSingle();
    if (cErr) throw cErr;
    athlete = created;
  }

  let uid = user_id || null;
  if (!uid && email) {
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    const match = list?.users?.find((u: any) => (u.email || "").toLowerCase() === String(email).toLowerCase());
    uid = match?.id || null;
  }

  if (uid) {
    await supabase.from("athletes").update({ user_id: uid, is_ss_linked: true }).eq("id", athlete.id);
  }
  return json(cors, { ok: true, athleteId: athlete.id, linked_user_id: uid, auto_created: !user_id && !athlete.user_id });
}

async function registerEntry(cors: Record<string, string>, supabase: any, body: any) {
  const { competition_id, external_school_id, team_id, school_team_id, division, notes } = body;
  if (!competition_id) return json(cors, { error: "competition_id required" }, 400);

  let tid = team_id || null;
  if (!tid && external_school_id) {
    const { data: t } = await supabase
      .from("teams").select("id").eq("external_school_id", external_school_id).maybeSingle();
    tid = t?.id || null;
  }
  if (!tid && !school_team_id) {
    return json(cors, { error: "team_id, school_team_id, or external_school_id required" }, 400);
  }

  const payload: Record<string, any> = {
    competition_id,
    team_id: tid,
    school_team_id: school_team_id || null,
    division: division || null,
    notes: notes || null,
    status: "pending",
  };
  const { data, error } = await supabase
    .from("registrations").insert(payload).select("id").maybeSingle();
  if (error) throw error;
  return json(cors, { ok: true, registrationId: data?.id });
}

async function pushTeamPublished(cors: Record<string, string>, supabase: any, body: any) {
  const { external_school_id, sport, name, age_group, gender, season, roster, coach_ss_staff_id, team_photo_url } = body;
  if (!external_school_id || !sport || !name) {
    return json(cors, { error: "external_school_id, sport, name required" }, 400);
  }

  const { data: team } = await supabase
    .from("teams").select("id").eq("external_school_id", external_school_id).maybeSingle();
  if (!team) return json(cors, { error: "school not found" }, 404);

  const patch: Record<string, any> = {
    team_id: team.id,
    sport,
    name,
    age_group: age_group || null,
    gender: gender || null,
    season: season || null,
    coach_ss_staff_id: coach_ss_staff_id || null,
    team_photo_url: team_photo_url || null,
    is_published: true,
  };
  const { data: st, error: stErr } = await supabase
    .from("school_teams")
    .upsert(patch, { onConflict: "team_id,sport,name,season" })
    .select("id").maybeSingle();
  if (stErr) throw stErr;

  if (Array.isArray(roster) && st?.id) {
    await supabase.from("school_team_players").delete().eq("school_team_id", st.id);
    const rows = [];
    for (const r of roster) {
      const sid = r.external_student_id || r.studentId;
      if (!sid) continue;
      const { data: ath } = await supabase
        .from("athletes").select("id").eq("external_student_id", sid).maybeSingle();
      if (ath?.id) rows.push({
        school_team_id: st.id, athlete_id: ath.id,
        jersey_number: r.jersey_number || r.jerseyNumber || null,
        position: r.position || null,
      });
    }
    if (rows.length) await supabase.from("school_team_players").insert(rows);
  }

  return json(cors, { ok: true, school_team_id: st?.id });
}

async function pullInvitations(cors: Record<string, string>, supabase: any, body: any) {
  const { external_school_id, status = "pending", limit = 50 } = body;
  let q = supabase.from("external_invitations")
    .select("id, kind, external_student_id, external_school_id, competition_id, payload, status, created_at")
    .eq("status", status).order("created_at", { ascending: false })
    .limit(Math.min(Number(limit) || 50, 200));
  if (external_school_id) q = q.eq("external_school_id", external_school_id);
  const { data, error } = await q;
  if (error) throw error;
  return json(cors, { invitations: data || [] });
}

async function pushInvitationResponse(cors: Record<string, string>, supabase: any, body: any) {
  const { invitation_id, external_id, status, response } = body;
  if (!status || (!invitation_id && !external_id)) {
    return json(cors, { error: "invitation_id (or external_id) and status required" }, 400);
  }
  let q = supabase.from("external_invitations").update({
    status, response: response || null, responded_at: new Date().toISOString(),
  });
  q = invitation_id ? q.eq("id", invitation_id) : q.eq("external_id", external_id);
  const { data, error } = await q.select("id").maybeSingle();
  if (error) throw error;
  return json(cors, { ok: true, invitationId: data?.id });
}

async function pullRankings(cors: Record<string, string>, supabase: any, body: any) {
  const { competition_id, discipline, external_student_id, external_school_id, limit = 100 } = body;

  // If asked for a specific athlete, resolve their school to filter rankings
  let filterSchoolId: string | null = null;
  if (external_student_id) {
    const { data: ath } = await supabase
      .from("athletes").select("ss_school_id").eq("external_student_id", external_student_id).maybeSingle();
    filterSchoolId = ath?.ss_school_id || external_school_id || null;
  } else if (external_school_id) {
    filterSchoolId = external_school_id;
  }

  let q = supabase
    .from("standings")
    .select(`competition_id, position, played, won, drawn, lost, points, score_for, score_against,
             school_team:school_team_id(id, name, school:school_id(external_school_id, name)),
             competition:competition_id(name, discipline)`)
    .order("position", { ascending: true })
    .limit(Math.min(Number(limit) || 100, 500));
  if (competition_id) q = q.eq("competition_id", competition_id);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data || [])
    .filter((r: any) => !discipline || r.competition?.discipline === discipline)
    .map((r: any) => ({
      competition_id: r.competition_id,
      competition_name: r.competition?.name || null,
      discipline: r.competition?.discipline || null,
      position: r.position,
      points: r.points,
      played: r.played, won: r.won, drawn: r.drawn, lost: r.lost,
      score_for: r.score_for, score_against: r.score_against,
      team_name: r.school_team?.name || null,
      external_school_id: r.school_team?.team?.external_school_id || null,
    }));
  return json(cors, { rankings: rows });
}
