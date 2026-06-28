import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export type AppRole =
  // Legacy roles (preserved for backward compatibility)
  | "super_admin"
  | "admin"
  | "federation_official"
  | "referee"
  | "scorer"
  | "broadcaster"
  | "athlete"
  | "team_manager"
  | "school_coordinator"
  | "coach"
  | "hic"
  | "umpire"
  | "national_admin"
  | "viewer"
  // NASH 20-role hierarchy
  | "platform_admin"
  | "nash_national"
  | "naph_national"
  | "national_technical_director"
  | "provincial_admin"
  | "provincial_technical_director"
  | "district_admin"
  | "district_technical_director"
  | "zonal_admin"
  | "school_head"
  | "timekeeper"
  | "technical_delegate"
  | "parent"
  | "public"
  | "competition_organiser";

// Roles permitted to create/manage competitions & fixtures. Must stay in sync
// with public.is_competition_organizer() in the database (RLS).
export const ORGANIZER_ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "platform_admin",
  "federation_official",
  "national_admin",
  "nash_national",
  "naph_national",
  "national_technical_director",
  "provincial_admin",
  "provincial_technical_director",
  "district_admin",
  "district_technical_director",
  "zonal_admin",
  "competition_organiser",
  "hic",
  "coach",
];

const ADMIN_ROLES: AppRole[] = ["admin", "super_admin", "platform_admin", "nash_national", "naph_national"];

export interface RoleState {
  loading: boolean;
  roles: AppRole[];
  hasRole: (...roles: AppRole[]) => boolean;
  isAdmin: boolean;
  /** Can create/manage competitions and fixtures (matches RLS). */
  isOrganizer: boolean;
}

/**
 * Resolves the signed-in user's roles from `public.user_roles`. Returns
 * `{ loading: true }` until the query settles so UIs can render a skeleton
 * instead of flashing either admin or non-admin state.
 */
export function useHasRole(): RoleState {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) return;
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (cancelled) return;
      if (error) {
        console.error("useHasRole: failed to load roles", error);
        setRoles([]);
      } else {
        setRoles((data || []).map((r: { role: AppRole }) => r.role));
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  const hasRole = (...wanted: AppRole[]) => wanted.some((r) => roles.includes(r));

  return {
    loading,
    roles,
    hasRole,
    isAdmin: hasRole(...ADMIN_ROLES),
    isOrganizer: hasRole(...ORGANIZER_ROLES),
  };
}
