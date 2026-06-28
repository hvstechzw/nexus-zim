import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { useTheme } from "@/context/ThemeContext";
import { dashboardForRoles, primaryRole, roleLabel } from "@/lib/nashRoles";
import { Menu, Moon, Sun, LogOut, LayoutDashboard, Trophy, ShieldCheck, User as UserIcon } from "lucide-react";

interface NavItem { label: string; to: string; }

/**
 * Header shared by every NASH page. Role-aware: public/auth nav for guests,
 * dashboard-first nav for signed-in users. Branding fixed: "Nexus Zimbabwe"
 * with the gold "Powered by NASH" tagline; deep-green band on dark theme.
 */
export function NashHeader() {
  const { user, signOut } = useAuth();
  const { roles, loading } = useHasRole();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = primaryRole(roles);
  const dashboardHref = user && !loading ? dashboardForRoles(roles) : "/dashboard";

  const PUBLIC_NAV: NavItem[] = [
    { label: "Live", to: "/live" },
    { label: "Results", to: "/results" },
    { label: "Calendar", to: "/calendar" },
    { label: "Schools", to: "/schools" },
    { label: "Records", to: "/records" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-lg tracking-wide">NEXUS</span>
            <span className="text-[9px] font-mono text-accent tracking-[0.18em] uppercase">Powered by NASH</span>
          </div>
        </Link>

        {/* Desktop public nav */}
        <nav className="hidden md:flex items-center gap-0.5 ml-4">
          {PUBLIC_NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-3 h-8 flex items-center text-xs font-display tracking-wider uppercase rounded text-primary-foreground/70 hover:text-accent hover:bg-primary-foreground/5 transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Right-side actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/10" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

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
                  <DropdownMenuItem onClick={() => navigate("/records")}>
                    <Trophy className="h-4 w-4 mr-2" /> Records
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => { await signOut(); navigate("/"); }} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setMobileOpen((o) => !o)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-primary-foreground/10 bg-primary">
          <nav className="flex flex-col p-2">
            {PUBLIC_NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMobileOpen(false)}
                className="px-3 h-10 flex items-center text-sm font-display tracking-wider uppercase text-primary-foreground/80 hover:text-accent hover:bg-primary-foreground/5 rounded"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export default NashHeader;
