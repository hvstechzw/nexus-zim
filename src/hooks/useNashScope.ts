import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "./useHasRole";
import { primaryRole, roleTier, ADMIN_TIER_ROLES } from "@/lib/nashRoles";
import type { AppRole } from "./useHasRole";

export interface NashScope {
  loading: boolean;
  /** The user's strongest assigned role (e.g. nash_national). */
  role: AppRole | null;
  tier: ReturnType<typeof roleTier>;
  /** The organisation_id this user is a member of, if any. */
  organisationId: string | null;
  organisationName: string | null;
  /** Province / district / zone derived from organisation, when applicable. */
  province: string | null;
  district: string | null;
  zone: string | null;
  /** True if user is in an admin tier (platform/federation/provincial/district/zonal). */
  isAdmin: boolean;
}

/**
 * Resolves the signed-in user's NASH scope: which organisation they belong
 * to (via nash_members.user_id), and the geographic province/district/zone
 * those map to. Components use this to filter queries (a district admin
 * should only see their district's data) without each consumer re-running
 * the lookup.
 *
 * Loading=true until both the user's roles and the membership lookup
 * settle so dashboards can render skeletons instead of flashing the wrong
 * scope.
 */
export function useNashScope(): NashScope {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useHasRole();
  const [membership, setMembership] = useState<{
    organisationId: string | null; organisationName: string | null;
    province: string | null; district: string | null; zone: string | null;
  } | null>(null);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    if (authLoading || !user) { setResolving(false); return; }
    let cancelled = false;
    (async () => {
      // Member lookup → nash_organisation join
      const { data } = await (supabase as any)
        .from("nash_members")
        .select("organisation_id, organisation:organisation_id(id,name,province,district,zone)")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      const o = data?.organisation;
      setMembership({
        organisationId: o?.id ?? null,
        organisationName: o?.name ?? null,
        province: o?.province ?? null,
        district: o?.district ?? null,
        zone: o?.zone ?? null,
      });
      setResolving(false);
    })();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  const role = primaryRole(roles);
  return {
    loading: authLoading || rolesLoading || resolving,
    role,
    tier: roleTier(role),
    organisationId: membership?.organisationId ?? null,
    organisationName: membership?.organisationName ?? null,
    province: membership?.province ?? null,
    district: membership?.district ?? null,
    zone: membership?.zone ?? null,
    isAdmin: roles.some((r) => ADMIN_TIER_ROLES.includes(r as AppRole)),
  };
}
