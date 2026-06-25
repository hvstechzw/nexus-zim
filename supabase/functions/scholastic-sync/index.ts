// Outbound sync: Nexus → Scholastic Services bridge.
// Called from the /admin Sync tab. Requires HIC/super_admin/admin role.
// Pulls schools and students from SS, upserts into Nexus teams/athletes,
// records the run in ss_sync_log.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { signHmac, signFederationJwt } from "../_shared/federation.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HMAC_SECRET = Deno.env.get("FEDERATION_HMAC_SECRET")!;
const JWT_SECRET = Deno.env.get("FEDERATION_JWT_SECRET")!;
const BRIDGE_URL = Deno.env.get("SCHOLASTIC_BRIDGE_URL")!;
const ISSUER = "nexus";

const json = (cors: Record<string, string>, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

async function callBridge(action: string, payload: Record<string, unknown>) {
  if (!BRIDGE_URL) throw new Error("SCHOLASTIC_BRIDGE_URL not configured");
  const body = JSON.stringify({ action, ...payload });
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = await signHmac(HMAC_SECRET, ISSUER, ts, body);
  const jwt = await signFederationJwt(JWT_SECRET, ISSUER, { action }, 120);
  const res = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Federation-Signature": sig,
      "X-Federation-Timestamp": ts,
      "X-Federation-Issuer": ISSUER,
      "X-Federation-Jwt": jwt,
    },
    body,
  });
  const text = await res.text();
  let parsed: any = {};
  try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = { raw: text }; }
  if (!res.ok) throw new Error(`bridge ${action} ${res.status}: ${parsed?.error || text}`);
  return parsed;
}

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const authHeader = req.headers.get("Authorization") || "";
  const bearer = authHeader.replace("Bearer ", "").trim();
  const isCron = bearer && bearer === SUPABASE_SERVICE_KEY;

  let userId: string | null = null;

  if (!isCron) {
    if (!authHeader.startsWith("Bearer ")) {
      return json(cors, { error: "unauthorized" }, 401);
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(bearer);
    if (claimsErr || !claimsData?.claims?.sub) {
      return json(cors, { error: "unauthorized" }, 401);
    }
    userId = claimsData.claims.sub as string;

    const { data: roles } = await admin
      .from("user_roles").select("role").eq("user_id", userId);
    const allowed = new Set(["hic", "super_admin", "admin"]);
    const ok = (roles || []).some((r: any) => allowed.has(r.role));
    if (!ok) return json(cors, { error: "forbidden" }, 403);
  }

  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const action: string = body.action || "full-sync";
  const sport: string | undefined = body.sport;

  let schoolsSynced = 0;
  let studentsSynced = 0;
  let status: "success" | "failed" | "partial" = "success";
  let errorMessage: string | null = null;

  try {
    if (action === "sync-schools" || action === "full-sync") {
      const res = await callBridge("fetch-schools", {});
      const schools: any[] = res.schools || [];
      for (const s of schools) {
        const { error } = await admin.from("teams").upsert({
          external_school_id: s.school_id,
          name: s.name,
          short_name: s.short_name || s.name?.slice(0, 16),
          logo_url: s.logo_url || null,
          province: s.province || "Unknown",
          level: s.level || "secondary",
          school_name: s.name,
          city: s.city || null,
          is_ss_school: true,
          sport: "general",
          discipline: "general",
          is_active: s.is_active !== false,
        }, { onConflict: "external_school_id" });
        if (!error) schoolsSynced++;
        else console.warn("[sync-schools] upsert", s.school_id, error.message);
      }
    }

    if (action === "sync-students" || action === "full-sync") {
      const res = await callBridge("fetch-students", sport ? { sport } : {});
      const students: any[] = res.students || [];
      // map ss_school_id -> Nexus team name for backfill
      const schoolIds = [...new Set(students.map((s) => s.school_id).filter(Boolean))];
      const { data: teams } = await admin
        .from("teams")
        .select("name, province, external_school_id")
        .in("external_school_id", schoolIds.length ? schoolIds : ["__none__"]);
      const teamMap = new Map((teams || []).map((t: any) => [t.external_school_id, t]));

      for (const st of students) {
        const fullName: string = st.name || "";
        const [first, ...rest] = fullName.trim().split(/\s+/);
        const last = rest.join(" ") || first || "Student";
        const sportsArr: string[] = typeof st.sports === "string"
          ? st.sports.split(/[,;]+/).map((x: string) => x.trim()).filter(Boolean)
          : Array.isArray(st.sports) ? st.sports : [];
        const nexusSport = (() => {
          const lower = sportsArr.map((s) => s.toLowerCase());
          const hb = lower.some((s) => s.includes("handball"));
          const nb = lower.some((s) => s.includes("netball"));
          if (hb && nb) return "both";
          if (hb) return "handball";
          if (nb) return "netball";
          return null;
        })();
        const team = teamMap.get(st.school_id);
        const { error } = await admin.from("athletes").upsert({
          external_student_id: st.student_id,
          first_name: first || "Student",
          last_name: last,
          display_name: fullName || `${first} ${last}`.trim(),
          date_of_birth: st.date_of_birth || null,
          gender: st.gender || null,
          photo_url: st.photo_url || null,
          school_name: team?.name || null,
          province: team?.province || "Unknown",
          ss_school_id: st.school_id || null,
          disciplines: sportsArr.length ? sportsArr : ["General"],
          nexus_sport: nexusSport,
          is_ss_linked: true,
          is_active: (st.status || "active") === "active",
        }, { onConflict: "external_student_id" });
        if (!error) studentsSynced++;
        else console.warn("[sync-students] upsert", st.student_id, error.message);
      }
    }

    if (action !== "sync-schools" && action !== "sync-students" && action !== "full-sync") {
      return json(cors, { error: `unknown action: ${action}` }, 400);
    }
  } catch (e) {
    status = (schoolsSynced || studentsSynced) ? "partial" : "failed";
    errorMessage = e instanceof Error ? e.message : String(e);
    console.error("[scholastic-sync]", action, errorMessage);
  }

  const syncType = action === "sync-schools" ? "schools"
    : action === "sync-students" ? "students" : "full";
  await admin.from("ss_sync_log").insert({
    sync_type: syncType,
    schools_synced: schoolsSynced,
    students_synced: studentsSynced,
    status,
    error_message: errorMessage,
    performed_by: userId,
  });

  return json(cors, {
    ok: status !== "failed",
    status,
    schoolsSynced,
    studentsSynced,
    error: errorMessage,
  }, status === "failed" ? 502 : 200);
});
