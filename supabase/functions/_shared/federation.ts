// Federation security helpers: HMAC-SHA256 signing/verification + HS256 JWT verify.
//
// Wire protocol:
//   X-Federation-Signature = hex(HMAC_SHA256(FEDERATION_HMAC_SECRET, `${issuer}.${ts}.${rawBody}`))
//   X-Federation-Timestamp = unix epoch seconds (string), must be within ±REPLAY_WINDOW_S
//   X-Federation-Issuer    = "scholastic" | "nexus" | "vimera" | "learners"
//   X-Federation-Jwt       = HS256 JWT signed with FEDERATION_JWT_SECRET (optional but recommended)

import { jwtVerify, SignJWT } from "npm:jose@5.9.6";

const REPLAY_WINDOW_S = 300;
const encoder = new TextEncoder();

async function hmacKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase();
  if (clean.length % 2 !== 0) throw new Error("invalid hex");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function signHmac(
  secret: string,
  issuer: string,
  ts: string,
  rawBody: string,
): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${issuer}.${ts}.${rawBody}`),
  );
  return toHex(sig);
}

export async function verifyHmac(
  secret: string,
  issuer: string,
  ts: string,
  rawBody: string,
  sigHex: string,
): Promise<boolean> {
  try {
    const key = await hmacKey(secret);
    return await crypto.subtle.verify(
      "HMAC",
      key,
      hexToBytes(sigHex),
      encoder.encode(`${issuer}.${ts}.${rawBody}`),
    );
  } catch {
    return false;
  }
}

export function timestampFresh(ts: string): boolean {
  const n = Number(ts);
  if (!Number.isFinite(n)) return false;
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - n) <= REPLAY_WINDOW_S;
}

export async function verifyFederationJwt(
  token: string,
  secret: string,
  expectedIssuer: string,
): Promise<{ ok: true; claims: Record<string, unknown> } | { ok: false; error: string }> {
  try {
    const { payload } = await jwtVerify(token, encoder.encode(secret), {
      algorithms: ["HS256"],
    });
    if (payload.iss && payload.iss !== expectedIssuer) {
      return { ok: false, error: `unexpected issuer: ${payload.iss}` };
    }
    return { ok: true, claims: payload as Record<string, unknown> };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "jwt verify failed" };
  }
}

export async function signFederationJwt(
  secret: string,
  issuer: string,
  extraClaims: Record<string, unknown> = {},
  ttlSeconds = 300,
): Promise<string> {
  return await new SignJWT({ ...extraClaims })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(encoder.encode(secret));
}

export interface FederationVerifyResult {
  ok: boolean;
  status: number;
  error?: string;
  issuer?: string;
  jwtClaims?: Record<string, unknown>;
}

export async function verifyFederationRequest(
  req: Request,
  rawBody: string,
  opts: {
    hmacSecret: string;
    jwtSecret?: string;
    expectedIssuer: string;
  },
): Promise<FederationVerifyResult> {
  // Reject any user/anon JWT — federation endpoints must not accept Supabase auth.
  const authHeader = req.headers.get("authorization");
  if (authHeader && /^bearer\s+ey/i.test(authHeader)) {
    return { ok: false, status: 401, error: "user JWT not allowed on federation endpoint" };
  }

  const sig = req.headers.get("x-federation-signature");
  const ts = req.headers.get("x-federation-timestamp");
  const issuer = req.headers.get("x-federation-issuer");
  const fedJwt = req.headers.get("x-federation-jwt");

  if (!sig || !ts || !issuer) {
    return { ok: false, status: 401, error: "missing federation headers" };
  }
  if (issuer !== opts.expectedIssuer) {
    return { ok: false, status: 401, error: `unexpected issuer: ${issuer}` };
  }
  if (!timestampFresh(ts)) {
    return { ok: false, status: 401, error: "stale or invalid timestamp" };
  }
  const sigOk = await verifyHmac(opts.hmacSecret, issuer, ts, rawBody, sig);
  if (!sigOk) {
    return { ok: false, status: 401, error: "bad HMAC signature" };
  }

  let jwtClaims: Record<string, unknown> | undefined;
  if (opts.jwtSecret && fedJwt) {
    const r = await verifyFederationJwt(fedJwt, opts.jwtSecret, opts.expectedIssuer);
    if (!r.ok) return { ok: false, status: 401, error: r.error };
    jwtClaims = r.claims;
  }

  return { ok: true, status: 200, issuer, jwtClaims };
}
