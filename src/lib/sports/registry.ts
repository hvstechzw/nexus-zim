import type { ScoreEventDef, SportConfig, SportKey } from "./types";
import { NETBALL } from "./netball";
import { HANDBALL } from "./handball";

export const SPORTS: Record<SportKey, SportConfig> = {
  netball: NETBALL,
  handball: HANDBALL,
};

/** The two codes Nexus supports, in display order. */
export const SPORT_LIST: SportConfig[] = [NETBALL, HANDBALL];

export function getSport(key: SportKey): SportConfig {
  return SPORTS[key];
}

export function isSportKey(value: unknown): value is SportKey {
  return value === "netball" || value === "handball";
}

/**
 * Resolve a sport from a free-form discipline string (competition.discipline,
 * match_data.sport, etc.). Defaults to handball so an ambiguous fixture still
 * opens in a usable scorer, matching the historic FixtureScoringPage behaviour.
 */
export function detectSport(raw?: string | null): SportKey {
  const v = (raw ?? "").toString().toLowerCase();
  if (v.includes("net")) return "netball";
  if (v.includes("hand")) return "handball";
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
