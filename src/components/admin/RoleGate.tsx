import { ReactNode } from "react";
import { useHasRole, AppRole } from "@/hooks/useHasRole";

interface RoleGateProps {
  roles: AppRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

/** Renders children only when the signed-in user has at least one of the listed roles. */
export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { hasRole, loading } = useHasRole();
  if (loading) return null;
  if (!hasRole(...roles)) return <>{fallback}</>;
  return <>{children}</>;
}
