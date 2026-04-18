/**
 * Shared CORS helper.
 *
 * Set the `ALLOWED_ORIGINS` env var (comma-separated) to restrict callers.
 * If unset, falls back to `*` with a one-time warning.
 */

const ALLOWED_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

const allowlist = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (allowlist.length === 0) {
  console.warn(
    "[cors] ALLOWED_ORIGINS not set — allowing all origins. Set it in Supabase edge-function secrets to restrict."
  );
}

export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allow =
    allowlist.length === 0 || allowlist.includes(origin)
      ? (allowlist.length === 0 ? "*" : origin)
      : allowlist[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Vary": "Origin",
  };
}
