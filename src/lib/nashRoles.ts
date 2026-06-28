// ════════════════════════════════════════════════════════════════
// NASH role hierarchy — canonical metadata for the 20-role system.
// Mirrors the public.app_role enum (see migration 20260628120000).
// Pure data/helpers — safe to import anywhere.
// ════════════════════════════════════════════════════════════════
import type { AppRole } from "@/hooks/useHasRole";

export type RoleTier =
  | "platform" | "federation" | "provincial" | "district" | "zonal"
  | "school" | "officials" | "athlete" | "operations" | "legacy";

export interface RoleMeta {
  role: AppRole;
  label: string;
  tier: RoleTier;
  /** Base dashboard path for this role (scoped redirects resolved at runtime). */
  home: string;
  /** Sport-specific role (technical directors). */
  sportScoped?: boolean;
}

export const ROLE_META: Record<string, RoleMeta> = {
  // Platform
  platform_admin: { role: "platform_admin", label: "Platform Admin", tier: "platform", home: "/platform" },
  // Federation
  nash_national: { role: "nash_national", label: "NASH National", tier: "federation", home: "/federation/nash" },
  naph_national: { role: "naph_national", label: "NAPH National", tier: "federation", home: "/federation/naph" },
  national_technical_director: { role: "national_technical_director", label: "National Technical Director", tier: "federation", home: "/admin/dashboard", sportScoped: true },
  // Provincial
  provincial_admin: { role: "provincial_admin", label: "Provincial Admin", tier: "provincial", home: "/province" },
  provincial_technical_director: { role: "provincial_technical_director", label: "Provincial Technical Director", tier: "provincial", home: "/province", sportScoped: true },
  // District
  district_admin: { role: "district_admin", label: "District Admin", tier: "district", home: "/district" },
  district_technical_director: { role: "district_technical_director", label: "District Technical Director", tier: "district", home: "/district", sportScoped: true },
  // Zonal
  zonal_admin: { role: "zonal_admin", label: "Zonal Admin", tier: "zonal", home: "/zone" },
  // School
  school_head: { role: "school_head", label: "School Head", tier: "school", home: "/school/dashboard" },
  coach: { role: "coach", label: "Coach", tier: "school", home: "/coach/dashboard" },
  team_manager: { role: "team_manager", label: "Team Manager", tier: "school", home: "/coach/dashboard" },
  // Officials
  referee: { role: "referee", label: "Referee", tier: "officials", home: "/official/dashboard" },
  scorer: { role: "scorer", label: "Scorer", tier: "officials", home: "/official/dashboard" },
  timekeeper: { role: "timekeeper", label: "Timekeeper", tier: "officials", home: "/official/dashboard" },
  technical_delegate: { role: "technical_delegate", label: "Technical Delegate", tier: "officials", home: "/official/dashboard" },
  umpire: { role: "umpire", label: "Umpire", tier: "officials", home: "/official/dashboard" },
  // Athlete / spectator
  athlete: { role: "athlete", label: "Athlete", tier: "athlete", home: "/athlete/profile" },
  parent: { role: "parent", label: "Parent", tier: "athlete", home: "/athlete/profile" },
  public: { role: "public", label: "Public", tier: "athlete", home: "/" },
  // Operations
  competition_organiser: { role: "competition_organiser", label: "Competition Organiser", tier: "operations", home: "/organiser/dashboard" },
  broadcaster: { role: "broadcaster", label: "Broadcaster", tier: "operations", home: "/dashboard" },
  // Legacy (kept for backward compatibility with existing data)
  super_admin: { role: "super_admin", label: "Super Admin", tier: "platform", home: "/admin/dashboard" },
  admin: { role: "admin", label: "Administrator", tier: "platform", home: "/admin/dashboard" },
  federation_official: { role: "federation_official", label: "Federation Official", tier: "federation", home: "/federation/nash" },
  national_admin: { role: "national_admin", label: "National Admin", tier: "federation", home: "/federation/nash" },
  school_coordinator: { role: "school_coordinator", label: "School Coordinator", tier: "school", home: "/school/dashboard" },
  hic: { role: "hic", label: "Head of Competition", tier: "operations", home: "/organiser/dashboard" },
  viewer: { role: "viewer", label: "Viewer", tier: "athlete", home: "/" },
};

// Role groups (priority order — first match wins for "primary role")
export const PLATFORM_ROLES: AppRole[] = ["platform_admin", "super_admin", "admin"];
export const FEDERATION_ROLES: AppRole[] = ["nash_national", "naph_national", "national_technical_director", "federation_official", "national_admin"];
export const PROVINCIAL_ROLES: AppRole[] = ["provincial_admin", "provincial_technical_director"];
export const DISTRICT_ROLES: AppRole[] = ["district_admin", "district_technical_director"];
export const ZONAL_ROLES: AppRole[] = ["zonal_admin"];
export const SCHOOL_ROLES: AppRole[] = ["school_head", "coach", "team_manager", "school_coordinator"];
export const OFFICIAL_ROLES: AppRole[] = ["referee", "scorer", "timekeeper", "technical_delegate", "umpire"];
export const OPERATIONS_ROLES: AppRole[] = ["competition_organiser", "broadcaster", "hic"];
export const ATHLETE_ROLES: AppRole[] = ["athlete", "parent"];

/** Roles with admin authority over competitions/registries (scope-checked in RLS). */
export const ADMIN_TIER_ROLES: AppRole[] = [
  ...PLATFORM_ROLES, ...FEDERATION_ROLES, ...PROVINCIAL_ROLES, ...DISTRICT_ROLES, ...ZONAL_ROLES,
];

/** Roles that can see financial data (entry fees, budgets, stipends) for their scope. */
export const FINANCE_ROLES: AppRole[] = [
  "platform_admin", "super_admin", "admin", "nash_national", "naph_national",
  "provincial_admin", "district_admin",
];

// Priority order for resolving a single "primary" role from a user's roles.
const ROLE_PRIORITY: AppRole[] = [
  "platform_admin", "super_admin", "admin",
  "nash_national", "naph_national", "national_admin", "federation_official", "national_technical_director",
  "provincial_admin", "provincial_technical_director",
  "district_admin", "district_technical_director",
  "zonal_admin",
  "competition_organiser", "hic", "broadcaster",
  "technical_delegate", "referee", "umpire", "scorer", "timekeeper",
  "school_head", "coach", "team_manager", "school_coordinator",
  "athlete", "parent", "viewer", "public",
];

export function primaryRole(roles: AppRole[]): AppRole | null {
  if (!roles?.length) return null;
  for (const r of ROLE_PRIORITY) if (roles.includes(r)) return r;
  return roles[0];
}

export function roleLabel(role: AppRole | null | undefined): string {
  if (!role) return "Guest";
  return ROLE_META[role]?.label ?? role;
}

export function roleTier(role: AppRole | null | undefined): RoleTier {
  if (!role) return "athlete";
  return ROLE_META[role]?.tier ?? "legacy";
}

/** Resolve the home/dashboard path for a user's roles. */
export function dashboardForRoles(roles: AppRole[]): string {
  const r = primaryRole(roles);
  return (r && ROLE_META[r]?.home) || "/";
}
