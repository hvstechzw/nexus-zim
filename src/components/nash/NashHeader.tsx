import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ToolsSidebar } from "@/components/nash/ToolsSidebar";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { dashboardForRoles, primaryRole, roleLabel } from "@/lib/nashRoles";
import { Menu, LogOut, LayoutDashboard, ShieldCheck, User as UserIcon } from "lucide-react";

/**
 * Header shared by every NASH page. All navigation lives in the hamburger-
 * triggered ToolsSidebar (every module, grouped by tier, role-aware) — the
 * header itself only carries brand, the sidebar trigger, and account actions.
 */
export function NashHeader() {
  const { user, signOut } = useAuth();
  const { roles, loading } = useHasRole();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = primaryRole(roles);
  const dashboardHref = user && !loading ? dashboardForRoles(roles) : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/10 shrink-0" onClick={() => setSidebarOpen((o) => !o)} title="Tools">
          <Menu className="h-4 w-4" />
        </Button>

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-lg tracking-wide">NEXUS</span>
            <span className="text-[9px] font-mono text-accent tracking-[0.18em] uppercase">NASH &amp; NAPH · Zimbabwe</span>
          </div>
        </Link>

        <div className="flex-1" />

        {/* Right-side actions */}
        <div className="flex items-center gap-1">
          {!user && (
            <>
              <Button variant="ghost" size="sm" className="h-9 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button size="sm" className="h-9 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/register")}>
                Register
              </Button>
            </>
          )}

          {user && (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex h-9 text-primary-foreground hover:bg-primary-foreground/10 gap-1.5" onClick={() => navigate(dashboardHref)}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground">
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs">
                    <div className="font-medium truncate">{user.email}</div>
                    {role && (
                      <Badge variant="outline" className="mt-1 text-[10px] font-display tracking-wider">
                        {roleLabel(role).toUpperCase()}
                      </Badge>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(dashboardHref)}>
                    <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => { await signOut(); navigate("/"); }} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      <ToolsSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </header>
  );
}

export default NashHeader;
