import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import nexusLogo from "@/assets/nexus-logo.png";
import { AuthModal } from "@/components/AuthModal";

const NAV_LINKS = [
  { label: "Live", href: "#live" },
  { label: "Events", href: "#events" },
  { label: "Standings", href: "#standings" },
  { label: "Fixtures", href: "/fixtures" },
  { label: "Competitions", href: "/competitions" },
  { label: "Scoring", href: "/scoring" },
  { label: "ID Cards", href: "/athletes/id-cards" },
  { label: "Broadcast CG", href: "/broadcast" },
  { label: "Admin", href: "/admin" },
];

export function NexusHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

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
          scrolled
            ? "bg-background/95 backdrop-blur-md shadow-sm hairline-b"
            : "bg-background/80 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <a href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img
              src={nexusLogo}
              alt="Nexus"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
              style={{ filter: theme === "dark" ? "invert(1)" : "none" }}
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3 xl:px-4 h-8 flex items-center gap-1.5 text-[11px] tracking-wide font-medium rounded-md transition-colors duration-200 text-nexus-muted hover:text-foreground hover:bg-nexus-surface"
              >
                {link.label === "Live" && <span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse flex-shrink-0" />}
                {link.label}
              </a>
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

            {user ? (
              <button onClick={signOut} className="hidden lg:flex items-center h-8 px-3 text-[11px] font-semibold tracking-wide bg-nexus-surface text-foreground rounded-lg hover:bg-nexus-silver transition-colors btn-click">
                Sign Out
              </button>
            ) : (
              <button onClick={() => setAuthOpen(true)} className="hidden lg:flex items-center h-8 px-3 text-[11px] font-semibold tracking-wide bg-nexus-surface text-foreground rounded-lg hover:bg-nexus-silver transition-colors btn-click">
                Sign In
              </button>
            )}

            <a href="#register" className="hidden lg:flex items-center h-8 px-4 text-[11px] font-semibold tracking-wide bg-foreground text-primary-foreground rounded-lg hover:opacity-85 transition-opacity btn-click">
              Register
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
            className="fixed inset-0 z-40 bg-background/98 backdrop-blur-xl lg:hidden"
          >
            <div className="pt-20 px-6 pb-10 flex flex-col h-full overflow-y-auto">
              <nav className="flex flex-col gap-1 flex-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="flex items-center gap-3 px-4 py-4 rounded-xl text-lg display-font font-semibold text-foreground hover:bg-nexus-surface transition-colors"
                  >
                    {link.label === "Live" && <span className="w-2 h-2 rounded-full bg-nexus-live animate-pulse" />}
                    {link.label}
                  </motion.a>
                ))}
              </nav>

              <div className="flex flex-col gap-3 mt-6">
                {user ? (
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="h-12 px-6 bg-nexus-surface text-foreground text-sm font-semibold rounded-xl btn-click">
                    Sign Out
                  </button>
                ) : (
                  <button onClick={() => { setAuthOpen(true); setMobileOpen(false); }} className="h-12 px-6 bg-nexus-surface text-foreground text-sm font-semibold rounded-xl btn-click">
                    Sign In
                  </button>
                )}
                <a href="#register" onClick={() => setMobileOpen(false)} className="h-12 px-6 bg-foreground text-primary-foreground text-sm font-semibold rounded-xl btn-click flex items-center justify-center">
                  Register Now
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
