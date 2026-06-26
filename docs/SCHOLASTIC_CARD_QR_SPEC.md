# Scholastic Card QR Code Specification

Reference for Nexus (and any federated client) to scan and decode Scholastic-issued
student/staff QR cards correctly. Source of truth lives in the Scholastic Services
project (`src/lib/scan.ts` client probe, `supabase/functions/student-login/index.ts`
server decode).

---

## 1. Supported payload formats

A scanned QR may contain any of the following. Detect in this order:

### A. URL-wrapped payload
```
https://scholastic-services.lovable.app/qr?d=<base64-payload>
```
Unwrap `d`, then treat as raw base64 (§2 / §3).

### B. Temporal Access Card (single-use, 1h TTL)
```
https://scholastic-services.lovable.app/qr?portalId=<PID>&password=<PWD>&autoLogin=true[&schoolId=<UUID>]
```
Decode by reading query params directly. No crypto.

### C. Raw base64 payload
URL-safe (`-_`) or standard (`+/`) alphabet, optional `=` padding.
Two sub-formats are distinguished by the **first decoded byte**:

| First byte    | Format            | Decodable client-side?              |
|---------------|-------------------|--------------------------------------|
| `0x01`        | **v1 obfuscated** | ❌ requires `school_id` + server      |
| anything else | **v2 plain**      | ✅ yes                                |

### D. Legacy
- `/qr?pid=<PID>&key=<PWD>` — read params directly.
- `/student/<student_id>` — student lookup only, no auth.
- `STUDENT:<id>` / `PORTAL:<id>` prefix strings.
- Plain alphanumeric ID (3–64 chars, `[A-Za-z0-9_-]`).

---

## 2. v2 plain (decode locally)
```
payload = base64( portal_id + "|" + password )
```

## 3. v1 obfuscated (server-assisted — recommended)

POST raw payload to Scholastic Services and let it decode + auth in one round trip:

```http
POST https://mhxtagvrtcdhdgcdhwqx.supabase.co/functions/v1/student-login
Content-Type: application/json

{ "qrData": "<raw base64>", "schoolId": "<uuid, optional>" }
```

Response: `{ student: { id, student_id, name, surname, school_id, stream, gender } }`
401 = bad credentials, 403 = inactive.

### Offline byte layout (if you must)

```
byte 0           : 0x01 (version)
bytes 1..N-2     : XOR(reverse(portalId), key) + 0x7C ('|') + XOR(reverse(password), key)
byte N-1         : XOR checksum of bytes 1..N-2
key              : SHA-256( utf8( school_id + "_SCHOLASTIC_SECRET" ) )   // 32 bytes
```

Steps: verify checksum → for each `0x7C` in body, split / XOR each half with
`key[i % 32]` / UTF-8 decode / reverse → first candidate whose portal id matches
`^[A-Za-z0-9_-]{3,64}$` wins.

---

## 4. Nexus setup

1. Scanner reads QR text verbatim (no auto-trim that strips `=` padding).
2. Use `parseScholasticCard()` from `src/lib/scholasticCardScan.ts`.
3. POST `qrData` (+ `schoolId` if known) through Nexus' `verify-card` edge function;
   it federates to SS server-side.
4. On success, Nexus mints its own session — never reuse the Scholastic password.
5. v1 obfuscation is anti-casual-scan, not encryption — always TLS, always
   re-verify server-side, never log decoded passwords.

## 5. Field reference

| Field        | Source                  | Notes                                            |
|--------------|-------------------------|--------------------------------------------------|
| `portal_id`  | `students.student_id`   | Uppercase alnum 3–64, primary login id.          |
| `password`   | plaintext (legacy) / PBKDF2 server-side | Never log, never forward.        |
| `school_id`  | Scholastic school UUID  | Required for v1 decode; persist with session.    |
