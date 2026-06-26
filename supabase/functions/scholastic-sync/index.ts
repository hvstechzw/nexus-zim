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
// Resolve BRIDGE_URL. The SS bridge is a Supabase edge function — when the
// configured URL points at the Lovable custom domain (scholasticservices.online)
// the /functions/v1/* path returns the SPA index.html, not the function.
// Prefer the Scholastic Services Supabase project URL when available.
const RAW_BRIDGE = Deno.env.get("SCHOLASTIC_BRIDGE_URL") || "";
const SS_SUPABASE_URL = Deno.env.get("SCHOLASTIC_SERVICES_SUPABASE_URL") || "";
function resolveBridgeUrl(): string {
  const fnMatch = RAW_BRIDGE.match(/\/functions\/v1\/([^/?#]+)/);
  const fnName = fnMatch?.[1] || "scholastic-bridge";
  const isSupabaseHost = /\.supabase\.co/i.test(RAW_BRIDGE);
  if (isSupabaseHost) return RAW_BRIDGE;
  if (SS_SUPABASE_URL) return `${SS_SUPABASE_URL.replace(/\/$/, "")}/functions/v1/${fnName}`;
  return RAW_BRIDGE;
}
const BRIDGE_URL = resolveBridgeUrl();
const ISSUER = "nexus";

const json = (cors: Record<string, string>, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

async function callBridge(action: string, payload: Record<string, unknown>) {
  if (!BRIDGE_URL) throw new Error("SCHOLASTIC_BRIDGE_URL not configured");
  console.log("[bridge] POST", action, "->", BRIDGE_URL);
  const body = JSON.stringify({ action, ...payload });
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = await signHmac(HMAC_SECRET, ISSUER, ts, body);
  const jwt = await signFederationJwt(JWT_SECRET, ISSUER, { action }, 120);
  const SS_ANON = Deno.env.get("SCHOLASTIC_SERVICES_SUPABASE_ANON_KEY") || "";
  const res = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Federation-Signature": sig,
      "X-Federation-Timestamp": ts,
      "X-Federation-Issuer": ISSUER,
      "X-Federation-Jwt": jwt,
      ...(SS_ANON ? { "apikey": SS_ANON, "Authorization": `Bearer ${SS_ANON}` } : {}),
    },
    body,
  });
  const text = await res.text();
  let parsed: any = {};
  try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = { raw: text }; }
  if (!res.ok) throw new Error(`bridge ${action} ${res.status}: ${parsed?.error || text}`);
  return parsed;
}

function normalizeSchoolLevel(level: unknown): string {
  const raw = String(level || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (raw === "primary" || raw === "primary_school") return "primary_school";
  if (raw === "secondary" || raw === "high" || raw === "high_school" || raw === "secondary_school") return "secondary_school";
  if (raw === "club" || raw === "academy" || raw === "club_academy") return "club_academy";
  if (raw === "provincial") return "provincial";
  if (raw === "national" || raw === "national_league") return "national_league";
  if (raw === "national_cup") return "national_cup";
  if (raw === "international") return "international";
  return "secondary_school";
}

function pickFirstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function normalizeExternalAssetUrl(raw: unknown): string | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return null;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  const origin = (() => {
    try { return new URL(RAW_BRIDGE || "https://scholasticservices.online").origin; }
    catch { return "https://scholasticservices.online"; }
  })();
  return `${origin}${value.startsWith("/") ? "" : "/"}${value}`;
}

function schoolLogoFromPayload(s: Record<string, unknown>): string | null {
  const branding = (s.branding && typeof s.branding === "object") ? s.branding as Record<string, unknown> : {};
  const media = (s.media && typeof s.media === "object") ? s.media as Record<string, unknown> : {};
  const profile = (s.profile && typeof s.profile === "object") ? s.profile as Record<string, unknown> : {};
  return normalizeExternalAssetUrl(pickFirstString(
    s.logo_url,
    s.logoUrl,
    s.logoURL,
    s.logo,
    s.school_logo_url,
    s.schoolLogoUrl,
    s.school_logo,
    s.emblem_url,
    s.badge_url,
    branding.logo_url,
    branding.logoUrl,
    branding.logo,
    media.logo_url,
    media.logoUrl,
    media.logo,
    profile.logo_url,
    profile.logoUrl,
    profile.logo,
  ));
}

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const authHeader = req.headers.get("Authorization") || "";
  const bearer = authHeader.replace("Bearer ", "").trim();
  const isService = bearer && bearer === SUPABASE_SERVICE_KEY;

  let userId: string | null = null;
  let isPrivileged = isService;

  // Try to resolve a signed-in user (optional). If they have HIC/admin/super_admin, mark privileged.
  if (!isService && authHeader.startsWith("Bearer ")) {
    try {
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      if (userData?.user?.id) {
        userId = userData.user.id;
        const { data: roles } = await admin
          .from("user_roles").select("role").eq("user_id", userId);
        const allowed = new Set(["hic", "super_admin", "admin"]);
        if ((roles || []).some((r: any) => allowed.has(r.role))) isPrivileged = true;
      }
    } catch (_) { /* anon fallback */ }
  }

  // Anonymous / non-privileged auto-sync: throttle to one run per 90s to prevent abuse.
  if (!isPrivileged) {
    const cutoff = new Date(Date.now() - 90_000).toISOString();
    const { data: recent } = await admin
      .from("ss_sync_log")
      .select("id, status, schools_synced, students_synced")
      .gte("created_at", cutoff)
      .in("status", ["success", "partial"])
      .limit(1);
    const recentUsefulSync = (recent || []).some((r: any) => (r.schools_synced || 0) > 0 || (r.students_synced || 0) > 0);
    if (recentUsefulSync) {
      return json(cors, { ok: true, throttled: true, schoolsSynced: 0, studentsSynced: 0 }, 200);
    }
  }

  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const action: string = body.action || "full-sync";
  const sport: string | undefined = body.sport;

  let schoolsSynced = 0;
  let studentsSynced = 0;
  let staffSynced = 0;
  let teamsSynced = 0;
  let playersSynced = 0;
  let upsertErrors = 0;
  let status: "success" | "failed" | "partial" = "success";
  let errorMessage: string | null = null;

  try {
    if (action === "sync-schools" || action === "full-sync") {
      const res = await callBridge("fetch-schools", {});
      const schools: any[] = res.schools || [];
      for (const s of schools) {
        const logoUrl = schoolLogoFromPayload(s);
        
        const { error } = await admin.from("teams").upsert({
          external_school_id: s.school_id,
          name: s.name,
          short_name: s.short_name || s.name?.slice(0, 16),
          logo_url: logoUrl,
          province: s.province || "Unknown",
          level: normalizeSchoolLevel(s.level),
          school_name: s.name,
          is_ss_school: true,
          sport: "general",
          discipline: "general",
          is_active: s.is_active !== false,
        }, { onConflict: "external_school_id" });
        if (!error) schoolsSynced++;
        else { upsertErrors++; console.warn("[sync-schools] upsert", s.school_id, error.message); }
      }
    }

    if (action === "sync-students" || action === "full-sync") {
      const res = await callBridge("fetch-students", sport ? { sport } : {});
      const students: any[] = res.students || [];
      const schoolIds = [...new Set(students.map((s) => s.school_id).filter(Boolean))];
      const { data: teams } = await admin
        .from("teams").select("name, province, external_school_id")
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
        // Base profile. Physical/position fields from the SS sports profile are
        // only included when present so a full-sync never wipes manual edits.
        const payload: Record<string, unknown> = {
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
        };
        if (st.preferred_position) payload.preferred_position = st.preferred_position;
        const heightNum = st.height_cm != null ? Number(st.height_cm) : NaN;
        if (Number.isFinite(heightNum) && heightNum > 0) payload.height_cm = heightNum;
        const { error } = await admin.from("athletes").upsert(payload, { onConflict: "external_student_id" });
        if (!error) studentsSynced++;
        else { upsertErrors++; console.warn("[sync-students] upsert", st.student_id, error.message); }
      }
    }

    if (action === "sync-staff" || action === "full-sync") {
      try {
        const res = await callBridge("fetch-school-staff", {});
        const staff: any[] = res.staff || [];
        for (const m of staff) {
          const { error } = await admin.from("school_staff").upsert({
            ss_staff_id: m.ss_staff_id,
            ss_school_id: m.school_id,
            email: m.email || null,
            phone: m.phone || null,
            name: m.name || "Staff",
            title: m.title || null,
            department: m.department || null,
            primary_role: m.primary_role || null,
            roles: Array.isArray(m.roles) ? m.roles : [],
            sport_relevant: !!m.sport_relevant,
            sports: Array.isArray(m.sports) ? m.sports : [],
            is_active: m.is_active !== false,
            last_synced_at: new Date().toISOString(),
          }, { onConflict: "ss_staff_id" });
          if (!error) staffSynced++;
          else { upsertErrors++; console.warn("[sync-staff] upsert", m.ss_staff_id, error.message); }
        }
      } catch (e) {
        // bridge may not implement fetch-school-staff yet — log but don't fail
        console.warn("[sync-staff] skipped:", e instanceof Error ? e.message : e);
      }
    }

    if (action === "sync-rosters" || action === "full-sync") {
      // Pull sport squads (handball/netball) and mirror them into Nexus
      // school_teams + school_team_players. Best-effort: if the bridge does not
      // implement fetch-rosters yet, skip without failing the whole run.
      try {
        const res = await callBridge("fetch-rosters", sport ? { sport } : {});
        const rosters: any[] = res.rosters || [];

        // external school id -> Nexus team (school) id
        const extSchoolIds = [...new Set(rosters.map((r) => r.school_id).filter(Boolean))];
        const { data: teams } = await admin
          .from("teams").select("id, external_school_id")
          .in("external_school_id", extSchoolIds.length ? extSchoolIds : ["__none__"]);
        const teamByExt = new Map((teams || []).map((t: any) => [t.external_school_id, t.id]));

        // external student id -> Nexus athlete id (chunked to keep URLs short)
        const extStudentIds = [...new Set(rosters.flatMap((r) => (r.members || []).map((m: any) => m.student_id)).filter(Boolean))];
        const athleteByExt = new Map<string, string>();
        for (let i = 0; i < extStudentIds.length; i += 400) {
          const chunk = extStudentIds.slice(i, i + 400);
          const { data: ath } = await admin
            .from("athletes").select("id, external_student_id").in("external_student_id", chunk);
          for (const a of ath || []) athleteByExt.set(a.external_student_id, a.id);
        }

        for (const r of rosters) {
          const schoolTeamSchoolId = teamByExt.get(r.school_id);
          if (!schoolTeamSchoolId || !r.external_team_id) continue; // school not synced yet
          const { data: st, error: stErr } = await admin.from("school_teams").upsert({
            external_ss_team_id: r.external_team_id,
            school_id: schoolTeamSchoolId,
            discipline: r.discipline,
            name: r.name || `${r.discipline} Team`,
            age_group: r.age_group || null,
            gender: r.gender || null,
            coach_name: r.coach_name || null,
            is_published: true,
          }, { onConflict: "external_ss_team_id" }).select("id").single();
          if (stErr || !st) { upsertErrors++; continue; }
          teamsSynced++;

          for (const m of (r.members || [])) {
            const athleteId = athleteByExt.get(m.student_id);
            if (!athleteId) continue; // athlete not synced / not in Nexus
            const jerseyNum = m.jersey_no != null ? parseInt(String(m.jersey_no).replace(/\D/g, ""), 10) : NaN;
            const { error: pErr } = await admin.from("school_team_players").upsert({
              school_team_id: st.id,
              athlete_id: athleteId,
              jersey_number: Number.isFinite(jerseyNum) ? jerseyNum : null,
              position: m.position || null,
              is_captain: r.captain_student_id ? m.student_id === r.captain_student_id : false,
            }, { onConflict: "school_team_id,athlete_id" });
            if (!pErr) playersSynced++; else upsertErrors++;
          }
        }
      } catch (e) {
        console.warn("[sync-rosters] skipped:", e instanceof Error ? e.message : e);
      }
    }

    if (!["sync-schools","sync-students","sync-staff","sync-rosters","full-sync"].includes(action)) {
      return json(cors, { error: `unknown action: ${action}` }, 400);
    }
    if (upsertErrors > 0) {
      status = (schoolsSynced || studentsSynced || staffSynced) ? "partial" : "failed";
      errorMessage = `${upsertErrors} record(s) could not be saved`;
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
    staffSynced,
    teamsSynced,
    playersSynced,
    error: errorMessage,
  }, status === "failed" ? 502 : 200);
});
