// Admin-callable function that creates one Supabase auth user per NASH role,
// assigns the matching role in public.user_roles, and bootstraps a minimal
// member record in nash_members linking the user to the relevant NASH org.
//
// Invoke from the Supabase dashboard / CLI with:
//   { "action": "seed" }     → idempotent seed (re-runs are safe)
//   { "action": "cleanup" }  → removes test users + their roles
//   { "action": "list" }     → returns the current test account list (no writes)
//
// All test users share the password "TestNash2026!" and use the
// "*@nexus-test.zw" email domain so cleanup can target them deterministically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { buildCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TEST_PASSWORD = "TestNash2026!";
const EMAIL_DOMAIN = "nexus-test.zw";

// Canonical NASH test accounts — one per major role. Naming is stable so the
// testing document can reference them by handle.
const ACCOUNTS: Array<{ handle: string; role: string; name: string; provincePref?: string }> = [
  { handle: "platform",          role: "platform_admin",         name: "Test Platform Admin" },
  { handle: "nash.national",     role: "nash_national",          name: "NASH National Executive" },
  { handle: "naph.national",     role: "naph_national",          name: "NAPH National Executive" },
  { handle: "national.td.hb",    role: "national_technical_director", name: "National TD — Handball" },
  { handle: "harare.prov",       role: "provincial_admin",       name: "Harare PSSA Admin",          provincePref: "Harare" },
  { handle: "harare.prov.td",    role: "provincial_technical_director", name: "Harare PSSA TD — Netball", provincePref: "Harare" },
  { handle: "harare.district",   role: "district_admin",         name: "Harare District Admin",      provincePref: "Harare" },
  { handle: "harare.district.td", role: "district_technical_director", name: "Harare District TD — Football", provincePref: "Harare" },
  { handle: "harare.zone1",      role: "zonal_admin",            name: "Harare Zone 1 Coordinator",  provincePref: "Harare" },
  { handle: "school.head",       role: "school_head",            name: "Test School Head" },
  { handle: "coach.hb",          role: "coach",                  name: "Test Handball Coach" },
  { handle: "team.manager",      role: "team_manager",           name: "Test Team Manager" },
  { handle: "referee.a",         role: "referee",                name: "Grade A Referee" },
  { handle: "scorer",            role: "scorer",                 name: "Test Scorer" },
  { handle: "timekeeper",        role: "timekeeper",             name: "Test Timekeeper" },
  { handle: "tech.delegate",     role: "technical_delegate",     name: "NASH Technical Delegate" },
  { handle: "athlete",           role: "athlete",                name: "Test Athlete" },
  { handle: "parent",            role: "parent",                 name: "Test Parent" },
  { handle: "organiser",         role: "competition_organiser",  name: "Test Competition Organiser" },
  { handle: "broadcaster",       role: "broadcaster",            name: "Test Broadcaster" },
];

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

  let body: { action?: string } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const action = body.action || "list";

  if (action === "list") {
    return new Response(JSON.stringify({
      password: TEST_PASSWORD,
      email_domain: EMAIL_DOMAIN,
      accounts: ACCOUNTS.map((a) => ({ ...a, email: `${a.handle}@${EMAIL_DOMAIN}` })),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (action === "cleanup") {
    // List → filter by domain → delete each
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const targets = (list?.users || []).filter((u) => (u.email || "").endsWith(`@${EMAIL_DOMAIN}`));
    let removed = 0;
    for (const u of targets) {
      // user_roles cascades on auth.users delete via the FK; nash_members.user_id is SET NULL.
      const { error } = await admin.auth.admin.deleteUser(u.id);
      if (!error) removed++;
    }
    return new Response(JSON.stringify({ success: true, removed, scanned: list?.users.length ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action !== "seed") {
    return new Response(JSON.stringify({ error: 'Unknown action. Use "seed", "cleanup", or "list".' }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // SEED — idempotent. Each account is created if missing; if it already exists
  // we just re-assert the role and member rows.
  const results: Array<{ handle: string; email: string; role: string; status: string; user_id?: string; error?: string }> = [];

  // Look up provincial orgs once so we can wire member rows
  const { data: orgs } = await admin.from("nash_organisations").select("id,name,province,level").eq("is_active", true);
  const orgByProv = new Map<string, string>();
  const orgByLevel = new Map<string, string>();
  (orgs || []).forEach((o: any) => {
    if (o.level === "provincial" && o.province) orgByProv.set(o.province, o.id);
    if (o.level === "national") orgByLevel.set("national", o.id);
  });

  for (const a of ACCOUNTS) {
    const email = `${a.handle}@${EMAIL_DOMAIN}`;
    try {
      // Try to find existing user
      const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1, email } as any);
      let userId: string | null = null;
      const found = (existing?.users || []).find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
      if (found) {
        userId = found.id;
        // Reset password to known value so docs stay accurate
        await admin.auth.admin.updateUserById(userId, { password: TEST_PASSWORD, email_confirm: true });
      } else {
        const { data: created, error } = await admin.auth.admin.createUser({
          email, password: TEST_PASSWORD, email_confirm: true,
          user_metadata: { test_account: true, handle: a.handle, role: a.role, display_name: a.name },
        });
        if (error || !created?.user) throw error || new Error("createUser returned no user");
        userId = created.user.id;
      }

      // Upsert the role
      await admin.from("user_roles").upsert(
        { user_id: userId, role: a.role as any },
        { onConflict: "user_id,role" },
      );

      // Wire a nash_members row if the role maps to an org tier
      let orgId: string | null = null;
      if (a.role === "nash_national" || a.role === "naph_national" || a.role === "national_technical_director") {
        orgId = orgByLevel.get("national") ?? null;
      } else if (a.provincePref) {
        orgId = orgByProv.get(a.provincePref) ?? null;
      }
      if (orgId) {
        // Delete existing membership for this user then insert (no UNIQUE on user_id+org)
        await admin.from("nash_members").delete().eq("user_id", userId);
        await admin.from("nash_members").insert({
          user_id: userId, organisation_id: orgId,
          first_name: a.name.split(" ")[0] || "Test",
          last_name: a.name.split(" ").slice(1).join(" ") || "User",
          role_title: a.role, is_active: true,
        });
      }

      results.push({ handle: a.handle, email, role: a.role, status: found ? "updated" : "created", user_id: userId ?? undefined });
    } catch (e: any) {
      results.push({ handle: a.handle, email, role: a.role, status: "failed", error: e?.message || String(e) });
    }
  }

  return new Response(JSON.stringify({
    success: true,
    password: TEST_PASSWORD,
    email_domain: EMAIL_DOMAIN,
    note: `All test users share the password "${TEST_PASSWORD}". Sign in with the email shown for each account.`,
    accounts: results,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
