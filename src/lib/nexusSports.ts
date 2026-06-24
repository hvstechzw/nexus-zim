// Nexus is scoped to handball + netball only. Use this helper everywhere
// we filter cross-discipline data sourced from the shared schema.
export const NEXUS_SPORTS = ["handball", "netball"] as const;
export type NexusSport = (typeof NEXUS_SPORTS)[number];

export function isNexusDiscipline(value?: string | null): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  return NEXUS_SPORTS.some((s) => v.includes(s));
}

export function matchesNexusSports(values?: string | string[] | null): boolean {
  if (!values) return false;
  const arr = Array.isArray(values) ? values : String(values).split(/[,;]+/);
  return arr.some((v) => isNexusDiscipline(v));
}
