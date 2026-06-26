import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export type AppRole =
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
  | "zonal_admin"
  | "district_admin"
  | "provincial_admin"
  | "national_admin"
  | "viewer";

// Roles permitted to create/manage competitions & fixtures. Must stay in sync
// with public.is_competition_organizer() in the database (RLS).
export const ORGANIZER_ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "federation_official",
  "national_admin",
  "provincial_admin",
  "district_admin",
  "zonal_admin",
  "hic",
  "coach",
];

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
    isAdmin: hasRole("admin", "super_admin"),
    isOrganizer: hasRole(...ORGANIZER_ROLES),
  };
}
