// Scholastic Card QR parser — see docs/SCHOLASTIC_CARD_QR_SPEC.md
// Classifies a raw QR string into the four supported shapes and extracts the
// fields Nexus needs to forward to the `verify-card` edge function.

export type ParsedCard =
  | { kind: "temporal"; portalId: string; password: string; schoolId?: string | null }
  | { kind: "v1"; qrData: string; schoolId?: string | null }
  | { kind: "v2"; portalId: string; password: string }
  | { kind: "legacy"; portalId: string; password?: string }
  | { kind: "student_id"; portalId: string }
  | { kind: "unknown"; raw: string };

const PORTAL_RE = /^[A-Za-z0-9_-]{3,64}$/;

function b64Decode(b64: string): string | null {
  try {
    const std = b64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = std + "=".repeat((4 - (std.length % 4)) % 4);
    return atob(padded);
  } catch {
    return null;
  }
}

function classifyBase64(b64: string, schoolId: string | null): ParsedCard {
  const decoded = b64Decode(b64);
  if (!decoded) return { kind: "unknown", raw: b64 };
  if (decoded.charCodeAt(0) === 0x01) {
    return { kind: "v1", qrData: b64, schoolId };
  }
  const sep = decoded.indexOf("|");
  if (sep > 0 && sep < decoded.length - 1) {
    const portalId = decoded.slice(0, sep).trim();
    const password = decoded.slice(sep + 1);
    if (PORTAL_RE.test(portalId)) return { kind: "v2", portalId, password };
  }
  return { kind: "unknown", raw: b64 };
}

export function parseScholasticCard(raw: string): ParsedCard {
  const text = (raw ?? "").trim();
  if (!text) return { kind: "unknown", raw: text };

  // 1) URL form
  try {
    const url = new URL(text);
    const sp = url.searchParams;
    if (sp.get("autoLogin") === "true") {
      return {
        kind: "temporal",
        portalId: (sp.get("portalId") || "").trim(),
        password: sp.get("password") || "",
        schoolId: sp.get("schoolId"),
      };
    }
    const d = sp.get("d");
    if (d) return classifyBase64(d, sp.get("schoolId"));
    const pid = sp.get("pid") || sp.get("portalId");
    const key = sp.get("key") || sp.get("password");
    if (pid) return { kind: "legacy", portalId: pid.trim(), password: key || undefined };
    // /student/<id> path
    const m = url.pathname.match(/\/student\/([A-Za-z0-9_-]{3,64})\/?$/);
    if (m) return { kind: "student_id", portalId: m[1] };
  } catch {
    /* not a URL */
  }

  // 2) Prefixes
  if (/^STUDENT:/i.test(text)) return { kind: "student_id", portalId: text.slice(8).trim() };
  if (/^PORTAL:/i.test(text)) return { kind: "student_id", portalId: text.slice(7).trim() };

  // 3) JSON wrapper {student_id:...}
  if (text.startsWith("{")) {
    try {
      const j = JSON.parse(text);
      const sid = j.student_id || j.portalId || j.id;
      if (typeof sid === "string" && PORTAL_RE.test(sid)) return { kind: "student_id", portalId: sid };
    } catch { /* fallthrough */ }
  }

  // 4) Raw base64 — must contain only b64 chars and be reasonably long
  if (/^[A-Za-z0-9+/=_-]+$/.test(text) && text.length >= 8 && !PORTAL_RE.test(text)) {
    return classifyBase64(text, null);
  }

  // 5) Plain portal id
  if (PORTAL_RE.test(text)) return { kind: "student_id", portalId: text };

  return { kind: "unknown", raw: text };
}

// Build the request body for the Nexus `verify-card` edge function.
export function buildVerifyCardBody(
  parsed: ParsedCard,
  extra?: { fixtureId?: string; schoolId?: string },
): Record<string, unknown> | null {
  switch (parsed.kind) {
    case "v1":
      return { qrData: parsed.qrData, schoolId: parsed.schoolId || extra?.schoolId };
    case "v2":
    case "legacy":
    case "temporal":
      return {
        student_id: parsed.portalId,
        ...(("password" in parsed && parsed.password) ? { password: parsed.password } : {}),
        ...(("schoolId" in parsed && parsed.schoolId) ? { schoolId: parsed.schoolId } : {}),
        ...(extra?.schoolId && !("schoolId" in parsed && parsed.schoolId) ? { schoolId: extra.schoolId } : {}),
        ...(extra?.fixtureId ? { fixtureId: extra.fixtureId } : {}),
        ...(parsed.kind === "temporal" ? { temporal: true } : {}),
      };
    case "student_id":
      return {
        student_id: parsed.portalId,
        ...(extra?.schoolId ? { schoolId: extra.schoolId } : {}),
        ...(extra?.fixtureId ? { fixtureId: extra.fixtureId } : {}),
      };
    default:
      return null;
  }
}
