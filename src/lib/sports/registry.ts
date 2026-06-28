import type { ScoreEventDef, SportConfig, SportKey } from "./types";
import { NETBALL } from "./netball";
import { HANDBALL } from "./handball";
import {
  FOOTBALL, BASKETBALL, VOLLEYBALL, CRICKET, RUGBY, HOCKEY, TENNIS,
  TABLE_TENNIS, BADMINTON, ATHLETICS, SWIMMING, CROSS_COUNTRY, CHESS,
} from "./nashSports";

export const SPORTS: Record<SportKey, SportConfig> = {
  netball: NETBALL,
  handball: HANDBALL,
  football: FOOTBALL,
  basketball: BASKETBALL,
  volleyball: VOLLEYBALL,
  cricket: CRICKET,
  rugby: RUGBY,
  hockey: HOCKEY,
  tennis: TENNIS,
  table_tennis: TABLE_TENNIS,
  badminton: BADMINTON,
  athletics: ATHLETICS,
  swimming: SWIMMING,
  cross_country: CROSS_COUNTRY,
  chess: CHESS,
};

/** All NASH sports, in display order (legacy two first for compatibility). */
export const SPORT_LIST: SportConfig[] = [
  NETBALL, HANDBALL, FOOTBALL, BASKETBALL, VOLLEYBALL, CRICKET, RUGBY, HOCKEY,
  TENNIS, TABLE_TENNIS, BADMINTON, ATHLETICS, SWIMMING, CROSS_COUNTRY, CHESS,
];

export function getSport(key: SportKey): SportConfig {
  return SPORTS[key];
}

const VALID_KEYS = new Set<string>(Object.keys(SPORTS));
export function isSportKey(value: unknown): value is SportKey {
  return typeof value === "string" && VALID_KEYS.has(value);
}

/**
 * Resolve a sport from a free-form discipline string (competition.discipline,
 * match_data.sport, NASH sport code, etc.). Defaults to handball so an
 * ambiguous fixture still opens in a usable scorer, matching the historic
 * FixtureScoringPage behaviour.
 */
export function detectSport(raw?: string | null): SportKey {
  const v = (raw ?? "").toString().toLowerCase().replace(/[^a-z_]/g, "");
  if (!v) return "handball";
  // Direct key match (already canonical)
  if (isSportKey(v)) return v as SportKey;
  // NASH 2-letter codes
  const codeMap: Record<string, SportKey> = {
    nb: "netball", hb: "handball", fb: "football", bk: "basketball", vb: "volleyball",
    cr: "cricket", rg: "rugby", hk: "hockey", tn: "tennis", at: "athletics",
    sw: "swimming", xc: "cross_country", tt: "table_tennis", bd: "badminton", ch: "chess",
  };
  if (codeMap[v]) return codeMap[v];
  // Substring detection — order matters (basket before bask, table_tennis before tennis)
  if (v.includes("netball")) return "netball";
  if (v.includes("handball")) return "handball";
  if (v.includes("basket")) return "basketball";
  if (v.includes("volley")) return "volleyball";
  if (v.includes("football") || v.includes("soccer")) return "football";
  if (v.includes("cricket")) return "cricket";
  if (v.includes("rugby")) return "rugby";
  if (v.includes("hockey")) return "hockey";
  if (v.includes("tabletennis") || v.includes("table_tennis") || v.includes("pingpong")) return "table_tennis";
  if (v.includes("tennis")) return "tennis";
  if (v.includes("badminton")) return "badminton";
  if (v.includes("crosscountry") || v.includes("cross_country")) return "cross_country";
  if (v.includes("athletic") || v.includes("track") || v.includes("field")) return "athletics";
  if (v.includes("swim")) return "swimming";
  if (v.includes("chess")) return "chess";
  return "handball";
}

export function findScoreEvent(sport: SportKey, type: string): ScoreEventDef | undefined {
  return SPORTS[sport].scoreEvents.find((e) => e.type === type);
}

/** Points a given event type contributes to its side (0 for non-scoring events). */
export function scoreValueFor(sport: SportKey, type: string): number {
  return findScoreEvent(sport, type)?.value ?? 0;
}

export function allEventLabels(sport: SportKey): Record<string, string> {
  const cfg = SPORTS[sport];
  const out: Record<string, string> = {};
  for (const e of [...cfg.scoreEvents, ...cfg.otherEvents]) out[e.type] = e.label;
  return out;
}
