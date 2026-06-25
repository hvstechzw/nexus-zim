// Verify a Scholastic Card by POSTing the raw QR (or student_id) to the SS bridge.
// Nexus does NOT decode v1 obfuscated payloads — SS owns that. We just forward
// with HMAC s2s and log the result for anti-replay & audit.
//
// Caller: authenticated Nexus user with role hic / admin / super_admin.
// Input: { qrData?: string, student_id?: string, schoolId?: string, fixtureId?: string }
// Output: bridge response + locally-resolved athlete row (if mirrored).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { signHmac, signFederationJwt } from "../_shared/federation.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HMAC_SECRET = Deno.env.get("FEDERATION_HMAC_SECRET")!;
const JWT_SECRET = Deno.env.get("FEDERATION_JWT_SECRET")!;
const RAW_BRIDGE = Deno.env.get("SCHOLASTIC_BRIDGE_URL") || "";
const SS_SUPABASE_URL = Deno.env.get("SCHOLASTIC_SERVICES_SUPABASE_URL") || "";
const SS_ANON = Deno.env.get("SCHOLASTIC_SERVICES_SUPABASE_ANON_KEY") || "";
const ISSUER = "nexus";

function bridgeUrl(): string {
  const fnMatch = RAW_BRIDGE.match(/\/functions\/v1\/([^/?#]+)/);
  const fnName = fnMatch?.[1] || "scholastic-bridge";
  if (/\.supabase\.co/i.test(RAW_BRIDGE)) return RAW_BRIDGE;
  if (SS_SUPABASE_URL) return `${SS_SUPABASE_URL.replace(/\/$/, "")}/functions/v1/${fnName}`;
  return RAW_BRIDGE;
}

const json = (cors: Record<string, string>, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(cors, { error: "method not allowed" }, 405);

  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json(cors, { error: "unauthorized" }, 401);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: u } = await userClient.auth.getUser();
  const userId = u?.user?.id;
  if (!userId) return json(cors, { error: "unauthorized" }, 401);

  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userId);
  const allowed = new Set(["hic", "admin", "super_admin"]);
  if (!(roles || []).some((r: any) => allowed.has(r.role))) {
    return json(cors, { error: "forbidden — HIC/admin only" }, 403);
  }

  let body: any = {};
  try { body = await req.json(); } catch {}
  const { qrData, student_id, schoolId, fixtureId } = body || {};
  if (!qrData && !student_id) return json(cors, { error: "qrData or student_id required" }, 400);

  const url = bridgeUrl();
  if (!url) return json(cors, { error: "bridge not configured" }, 503);

  const jti = `nexus-${crypto.randomUUID()}`;
  const nonce = crypto.randomUUID();
  const payload: Record<string, unknown> = {
    action: "verify-student-card",
    jti, nonce,
    ...(qrData ? { qrData } : {}),
    ...(student_id ? { student_id } : {}),
    ...(schoolId ? { schoolId } : {}),
  };
  const rawBody = JSON.stringify(payload);
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = await signHmac(HMAC_SECRET, ISSUER, ts, rawBody);
  const fedJwt = JWT_SECRET ? await signFederationJwt(JWT_SECRET, ISSUER, { action: "verify-student-card" }, 120) : "";

  let bridgeStatus = 0;
  let bridgeJson: any = null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Federation-Signature": sig,
        "X-Federation-Timestamp": ts,
        "X-Federation-Issuer": ISSUER,
        ...(fedJwt ? { "X-Federation-Jwt": fedJwt } : {}),
        ...(SS_ANON ? { "apikey": SS_ANON, "Authorization": `Bearer ${SS_ANON}` } : {}),
      },
      body: rawBody,
    });
    bridgeStatus = res.status;
    const txt = await res.text();
    try { bridgeJson = txt ? JSON.parse(txt) : {}; } catch { bridgeJson = { raw: txt }; }
  } catch (e) {
    return json(cors, { error: e instanceof Error ? e.message : "bridge unreachable" }, 502);
  }

  if (bridgeStatus >= 400 || !bridgeJson?.valid) {
    await admin.from("scholastic_card_verifications").insert({
      ss_student_id: bridgeJson?.student?.student_id || student_id || "",
      verified_by: userId,
      verification_method: qrData ? "scholastic_card" : "manual_confirm",
      card_scan_data: qrData ? String(qrData).slice(0, 4000) : null,
      status: bridgeJson?.status || "invalid",
      jti, nonce, fixture_id: fixtureId || null,
      student_payload: bridgeJson?.student || null,
      notes: bridgeJson?.error || `bridge ${bridgeStatus}`,
    });
    return json(cors, { ok: false, bridgeStatus, ...bridgeJson }, bridgeStatus || 400);
  }

  // Resolve / mirror the local athlete row for UI display.
  const ssId = bridgeJson.student.student_id;
  const { data: athlete } = await admin
    .from("athletes")
    .select("id, display_name, first_name, last_name, photo_url, school_name, scholastic_card_verified, ss_school_id, nexus_sport, external_student_id")
    .eq("external_student_id", ssId)
    .maybeSingle();

  if (athlete && bridgeJson.status === "active") {
    await admin.from("athletes").update({ scholastic_card_verified: true }).eq("id", athlete.id);
  }

  await admin.from("scholastic_card_verifications").insert({
    ss_student_id: ssId,
    athlete_id: athlete?.id || null,
    verified_by: userId,
    verification_method: qrData ? "scholastic_card" : "manual_confirm",
    card_scan_data: qrData ? String(qrData).slice(0, 4000) : null,
    status: bridgeJson.status,
    jti, nonce, fixture_id: fixtureId || null,
    student_payload: bridgeJson.student,
  });

  return json(cors, {
    ok: true,
    status: bridgeJson.status,
    student: bridgeJson.student,
    athlete,
    jti,
  });
});
