import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import { BrandLockup } from "@/components/Brand";
import { NotificationBell } from "@/components/NotificationBell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { locationLabel } from "@/lib/navModel";
import { dashboardForRoles, primaryRole, roleLabel } from "@/lib/nashRoles";

/**
 * 64px application header on the page surface, no seam (§11.4). Left: product
 * (mobile) or current location (desktop, where the rail carries the brand).
 * Right: notifications, account. Every target is 44×44.
 */
export function AppHeader({ showBrand }: { showBrand: boolean }) {
  const { user, signOut } = useAuth();
  const { roles, loading } = useHasRole();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const role = primaryRole(roles);
  const dashboardHref = user && !loading ? dashboardForRoles(roles) : "/dashboard";
  const here = locationLabel(pathname);

  return (
    <header className="sticky top-0 z-sticky h-[var(--layout-header-height)] bg-background">
      <div className="rail flex h-full items-center gap-2">
        <div className="min-w-0 flex-1">
          {showBrand ? (
            <BrandLockup to="/" subtitle="NASH & NAPH · Zimbabwe" />
          ) : (
            <>
              <Link to="/" className="lg:hidden" aria-label="Nexus home">
                <BrandLockup subtitle={here} />
              </Link>
              <div className="hidden lg:block">
                <p className="text-sm text-supporting leading-tight">Nexus</p>
                <p className="truncate font-display text-lg font-semibold leading-tight">{here}</p>
              </div>
            </>
          )}
        </div>

        {!user && !showBrand && (
          <>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Register</Link>
            </Button>
          </>
        )}

        {user && (
          <>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Account menu"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-hover text-primary-foreground"
                >
                  <UserIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="truncate text-sm font-medium">{user.email}</div>
                  {role && (
                    <Badge variant="secondary" className="mt-1">
                      {roleLabel(role)}
                    </Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="min-h-11" onClick={() => navigate(dashboardHref)}>
                  <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden="true" /> My dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="min-h-11 text-danger focus:text-danger"
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}
