import type { LucideIcon } from "lucide-react";
import { CalendarDays, CheckCircle2, LayoutGrid, Newspaper, Radio } from "lucide-react";
import type { AppRole } from "@/hooks/useHasRole";
import { TOOL_DIRECTORY, type ToolDef } from "@/lib/toolDirectory";

/**
 * The one destination model (Aetheris §12.2). The mobile bottom navigation, the
 * desktop rail, the header title and the Tools page all render from this file.
 * Labels and icons never change between breakpoints.
 */
export interface Destination {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  /** Paths (besides `to`) that count as being inside this destination. */
  also?: string[];
}

/** Five global destinations in the fixed 2 / 1 / 2 order. Live is the centre: the product's dominant recurring destination. */
export const GLOBAL_DESTINATIONS: Destination[] = [
  { id: "feed", label: "Home", to: "/", icon: Newspaper },
  { id: "results", label: "Results", to: "/results", icon: CheckCircle2, also: ["/standings", "/bracket", "/records"] },
  { id: "live", label: "Live", to: "/live", icon: Radio },
  { id: "calendar", label: "Calendar", to: "/calendar", icon: CalendarDays, also: ["/competition"] },
  { id: "tools", label: "Tools", to: "/tools", icon: LayoutGrid },
];

export const CENTRE_DESTINATION_ID = "live";

export function isInside(pathname: string, dest: Destination): boolean {
  if (dest.to === "/") return pathname === "/";
  return [dest.to, ...(dest.also ?? [])].some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export interface RailGroup {
  tier: string;
  tools: ToolDef[];
}

/** Capability-based visibility: destinations the person cannot use are removed, not locked (§12.2). */
export function toolsForPerson(
  signedIn: boolean,
  hasRole: (...roles: AppRole[]) => boolean,
): RailGroup[] {
  const canUse = (tool: ToolDef) => {
    if (!tool.roles || tool.roles.length === 0) return signedIn;
    return signedIn && hasRole(...tool.roles);
  };
  return TOOL_DIRECTORY.map((group) => ({
    tier: group.tier,
    tools: group.tools.filter((t) => group.tier === "Public" || canUse(t)),
  })).filter((g) => g.tools.length > 0);
}

/** Where the person is, for the header subtitle. Longest matching path wins. */
export function locationLabel(pathname: string): string {
  const candidates: { to: string; label: string }[] = [
    ...GLOBAL_DESTINATIONS.map((d) => ({ to: d.to, label: d.label })),
    ...TOOL_DIRECTORY.flatMap((g) => g.tools.map((t) => ({ to: t.to, label: t.label }))),
  ];
  let best: { to: string; label: string } | null = null;
  for (const c of candidates) {
    const match = c.to === "/" ? pathname === "/" : pathname === c.to || pathname.startsWith(c.to + "/");
    if (match && (!best || c.to.length > best.to.length)) best = c;
  }
  return best?.label ?? "Nexus";
}

/** Routes that render without the signed-in shell chrome. */
export function shellVariant(pathname: string): "full" | "bare" | "none" {
  if (/^\/broadcast\/[^/]+$/.test(pathname) && pathname !== "/broadcast/gallery") return "none";
  if (/^\/(login|register|auth)(\/|$)/.test(pathname)) return "bare";
  return "full";
}
