// Outbound mirror — signs payload as issuer "nexus" and POSTs to Scholastic bridge.
// Callers: scholastic-federation (server-side), and the Nexus app (client invoke).
//
// Input: { athleteId?: string, external_student_id?: string }
// Builds: { rankings, personalBests, recentFixtures, standings } for that athlete.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { signHmac, signFederationJwt } from "../_shared/federation.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BRIDGE_URL = Deno.env.get("SCHOLASTIC_BRIDGE_URL")!;
const HMAC_SECRET = Deno.env.get("FEDERATION_HMAC_SECRET")!;
const JWT_SECRET = Deno.env.get("FEDERATION_JWT_SECRET")!;

const ISSUER = "nexus";

const json = (cors: Record<string, string>, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  if (!BRIDGE_URL || !HMAC_SECRET) {
    return json(cors, { error: "scholastic-push not configured (BRIDGE_URL/HMAC secret missing)" }, 503);
  }

  // Caller auth: either internal service-role call (X-Internal-Call) OR an
  // authenticated Nexus user. Reject anon.
  const authHeader = req.headers.get("authorization") || "";
  const internalCall = req.headers.get("x-internal-call") === "1"
    && authHeader === `Bearer ${SUPABASE_SERVICE_KEY}`;

  if (!internalCall) {
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return json(cors, { error: "unauthorized" }, 401);
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.slice(7);
    const { data, error } = await userClient.auth.getClaims(token);
    if (error || !data?.claims?.sub) {
      return json(cors, { error: "unauthorized" }, 401);
    }
  }

  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const { athleteId, external_student_id } = body;
  if (!athleteId && !external_student_id) {
    return json(cors, { error: "athleteId or external_student_id required" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

  let athleteQ = admin.from("athletes")
    .select("id, external_student_id, first_name, last_name, school_name, personal_bests")
    .limit(1);
  athleteQ = athleteId ? athleteQ.eq("id", athleteId) : athleteQ.eq("external_student_id", external_student_id);
  const { data: athleteRow } = await athleteQ.maybeSingle();
  if (!athleteRow) return json(cors, { error: "athlete not found" }, 404);
  if (!athleteRow.external_student_id) {
    return json(cors, { error: "athlete missing external_student_id (not federated)" }, 422);
  }

  // Resolve school id via school_name → teams.external_school_id.
  let schoolId: string | null = null;
  if (athleteRow.school_name) {
    const { data: team } = await admin.from("teams")
      .select("external_school_id")
      .eq("school_name", athleteRow.school_name)
      .not("external_school_id", "is", null)
      .maybeSingle();
    schoolId = team?.external_school_id || null;
  }

  const [recordsRes, standingsRes, fixturesRes] = await Promise.all([
    admin.from("records")
      .select("id, record_type, discipline, event_name, value, unit, achieved_at, is_verified")
      .eq("athlete_id", athleteRow.id).order("achieved_at", { ascending: false }).limit(20),
    admin.from("standings")
      .select("competition_id, position, points, played, won, drawn, lost")
      .eq("athlete_id", athleteRow.id).limit(20),
    admin.from("fixtures")
      .select("id, competition_id, home_score, away_score, status, ended_at")
      .or(`home_athlete_id.eq.${athleteRow.id},away_athlete_id.eq.${athleteRow.id}`)
      .order("ended_at", { ascending: false, nullsFirst: false }).limit(10),
  ]);

  const pbObj = athleteRow.personal_bests && typeof athleteRow.personal_bests === "object"
    ? athleteRow.personal_bests as Record<string, unknown>
    : {};
  const personalBests = Object.entries(pbObj).map(([event, value]) => ({ event, value }));

  const payload = {
    action: "push-nexus-mirror",
    studentId: athleteRow.external_student_id,
    schoolId,
    payload: {
      rankings: standingsRes.data || [],
      personalBests,
      recentFixtures: fixturesRes.data || [],
      standings: standingsRes.data || [],
      records: recordsRes.data || [],
    },
  };

  const rawBody = JSON.stringify(payload);
  const ts = String(Math.floor(Date.now() / 1000));
  const [sig, fedJwt] = await Promise.all([
    signHmac(HMAC_SECRET, ISSUER, ts, rawBody),
    JWT_SECRET ? signFederationJwt(JWT_SECRET, ISSUER, { sub: athleteRow.external_student_id }, 300) : Promise.resolve(""),
  ]);

  try {
    const res = await fetch(BRIDGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Federation-Signature": sig,
        "X-Federation-Timestamp": ts,
        "X-Federation-Issuer": ISSUER,
        ...(fedJwt ? { "X-Federation-Jwt": fedJwt } : {}),
      },
      body: rawBody,
    });
    const text = await res.text();
    return json(cors, {
      ok: res.ok,
      bridge_status: res.status,
      bridge_body: text.slice(0, 1000),
      pushed: { studentId: payload.studentId, schoolId: payload.schoolId },
    }, res.ok ? 200 : 502);
  } catch (e) {
    console.error("[scholastic-push] fetch failed", e);
    return json(cors, { ok: false, error: e instanceof Error ? e.message : "bridge unreachable" }, 502);
  }
});
