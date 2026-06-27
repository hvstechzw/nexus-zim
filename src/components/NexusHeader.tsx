import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { BrandLockup } from "@/components/Brand";
import { NotificationBell } from "@/components/NotificationBell";

const PUBLIC_LINKS = [
  { label: "Feed", href: "/" },
  { label: "Live", href: "/live" },
  { label: "Schools", href: "/schools" },
  { label: "Tournaments", href: "/competitions" },
  { label: "Inter-School", href: "/inter-school" },
];

const ADMIN_ONLY_LINKS = [
  { label: "Sync", href: "/admin/sync" },
  { label: "Verify", href: "/admin/verify" },
  { label: "Admin", href: "/admin" },
];

export function NexusHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { loading: rolesLoading, isAdmin, isOrganizer, hasRole } = useHasRole();

  const canSchedule = isOrganizer;
  const canScore = isAdmin || hasRole("hic", "umpire", "referee", "scorer");

  const NAV_LINKS = !user || rolesLoading
    ? PUBLIC_LINKS
    : [
        ...PUBLIC_LINKS,
        ...(canSchedule ? [{ label: "Fixtures", href: "/fixtures" }] : []),
        ...(canScore ? [{ label: "Scoring", href: "/scoring" }] : []),
        ...(isAdmin ? ADMIN_ONLY_LINKS : []),
      ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          mobileOpen
            ? "bg-background hairline-b"
            : scrolled
              ? "bg-background/95 backdrop-blur-md shadow-sm hairline-b"
              : "bg-background/80 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* Brand — theme-aware wordmark */}
          <BrandLockup to="/" onClick={() => setMobileOpen(false)} className="flex-shrink-0" />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="px-3 xl:px-4 h-8 flex items-center gap-1.5 text-[11px] tracking-wide font-medium rounded-md transition-colors duration-200 text-nexus-muted hover:text-foreground hover:bg-nexus-surface"
              >
                {link.label === "Live" && <span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse flex-shrink-0" />}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-nexus-surface hover:bg-nexus-silver transition-colors duration-200 btn-click"
            >
              {theme === "dark" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {user && <NotificationBell />}

            {user ? (
              <>
                <Link to="/dashboard" className="hidden lg:flex items-center h-8 px-3 text-[11px] font-semibold tracking-wide bg-nexus-surface text-foreground rounded-lg hover:bg-nexus-silver transition-colors btn-click">
                  Dashboard
                </Link>
                <button onClick={signOut} className="hidden lg:flex items-center h-8 px-3 text-[11px] font-semibold tracking-wide text-nexus-muted hover:text-foreground transition-colors btn-click">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden lg:flex items-center h-8 px-3 text-[11px] font-semibold tracking-wide bg-nexus-surface text-foreground rounded-lg hover:bg-nexus-silver transition-colors btn-click">
                  Sign In
                </Link>
                <Link to="/register" className="hidden lg:flex items-center h-8 px-4 text-[11px] font-semibold tracking-wide bg-foreground text-primary-foreground rounded-lg hover:opacity-85 transition-opacity btn-click">
                  Register
                </Link>
              </>
            )}

            <a href="https://scholasticservices.online" target="_blank" rel="noopener noreferrer" className="hidden xl:flex items-center gap-1.5 h-8 px-3 text-[10px] mono tracking-wide font-medium rounded-lg bg-nexus-surface text-nexus-muted hover:text-foreground transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Scholastic Services
            </a>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex flex-col items-center justify-center gap-1 bg-nexus-surface hover:bg-nexus-silver transition-colors btn-click"
              aria-label="Toggle menu"
            >
              <motion.span animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 4 : 0 }} className="w-4 h-[1.5px] bg-foreground rounded-full block" />
              <motion.span animate={{ opacity: mobileOpen ? 0 : 1 }} className="w-4 h-[1.5px] bg-foreground rounded-full block" />
              <motion.span animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -4 : 0 }} className="w-4 h-[1.5px] bg-foreground rounded-full block" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background lg:hidden"
          >
            <div className="pt-[4.5rem] px-5 sm:px-6 pb-8 flex flex-col h-full overflow-y-auto">
              <p className="text-[10px] mono tracking-[0.22em] uppercase text-nexus-muted px-1 pt-2 pb-3">Menu</p>
              <nav className="flex flex-col gap-0.5 flex-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  >
                    <Link
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between gap-3 px-3 py-3.5 rounded-xl text-lg display-font font-semibold text-foreground hover:bg-nexus-surface transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        {link.label === "Live" && <span className="w-2 h-2 rounded-full bg-nexus-live animate-pulse" />}
                        {link.label}
                      </span>
                      <span className="text-nexus-muted text-sm">→</span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="flex flex-col gap-3 mt-5 pt-5 hairline-t">
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="h-12 px-6 bg-foreground text-primary-foreground text-sm font-semibold rounded-xl btn-click flex items-center justify-center">
                      Dashboard
                    </Link>
                    <button onClick={() => { signOut(); setMobileOpen(false); }} className="h-12 px-6 bg-nexus-surface text-foreground text-sm font-semibold rounded-xl btn-click">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="h-12 px-6 bg-nexus-surface text-foreground text-sm font-semibold rounded-xl btn-click flex items-center justify-center">
                      Sign In
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="h-12 px-6 bg-foreground text-primary-foreground text-sm font-semibold rounded-xl btn-click flex items-center justify-center">
                      Create account
                    </Link>
                  </>
                )}

                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 h-9 px-3 rounded-lg bg-nexus-surface text-foreground text-xs font-medium btn-click"
                  >
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                  </button>
                  <a href="https://scholasticservices.online" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] mono uppercase tracking-wide text-nexus-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Scholastic Services
                  </a>
                </div>
                <p className="text-[10px] mono text-nexus-muted text-center mt-1">Nexus by Aetheris Innovative Enterprises</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
