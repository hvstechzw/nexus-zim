import type { SportConfig } from "./types";

/** Seconds → "MM:SS". Clamps negatives to 0. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/** Remaining seconds in a period given elapsed time. */
export function remaining(periodSeconds: number, elapsed: number): number {
  return Math.max(0, periodSeconds - Math.max(0, elapsed));
}

export function periodByKey(sport: SportConfig, key: string) {
  return sport.periods.find((p) => p.key === key);
}

/** Cumulative match minute for display, e.g. 2nd half 03:10 → 33'. */
export function matchMinute(sport: SportConfig, periodKey: string, elapsed: number): number {
  let before = 0;
  for (const p of sport.periods) {
    if (p.key === periodKey) break;
    if (p.kind === "regulation") before += p.seconds;
  }
  return Math.floor((before + Math.max(0, elapsed)) / 60);
}
