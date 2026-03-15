import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import aieLogoLight from "@/assets/aie-logo-light.png";
import { AuthModal } from "@/components/AuthModal";

const NAV_LINKS = [
  { label: "Live", href: "#live" },
  { label: "Events", href: "#events" },
  { label: "Standings", href: "#standings" },
  { label: "Register", href: "#register" },
  { label: "Broadcast", href: "#broadcast" },
];

export function NexusHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-6">
          {/* Brand */}
          <a href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="bg-foreground rounded-lg p-1.5 flex items-center justify-center w-8 h-8">
              <img
                src={aieLogoLight}
                alt="Aetheris"
                className="w-5 h-5 object-contain"
                style={{ filter: theme === "dark" ? "brightness(0.1)" : "brightness(10)" }}
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="display-font text-sm font-semibold tracking-tight text-foreground">
                Nexus
              </span>
              <span className="text-[10px] text-nexus-muted tracking-wide uppercase">
                by Aetheris
              </span>
            </div>
          </a>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 h-9 flex items-center gap-1.5 text-xs tracking-wide font-medium rounded-md transition-colors duration-200 text-nexus-muted hover:text-foreground hover:bg-nexus-surface"
              >
                {link.label === "Live" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse flex-shrink-0" />
                )}
                {link.label}
              </a>
            ))}
            <a
              href="/admin"
              className="px-4 h-9 flex items-center text-xs tracking-wide font-medium rounded-md transition-colors duration-200 text-nexus-muted hover:text-foreground hover:bg-nexus-surface"
            >
              Admin
            </a>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-nexus-surface hover:bg-nexus-silver transition-colors duration-200 btn-click"
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {/* Auth */}
            {user ? (
              <button
                onClick={signOut}
                className="hidden md:flex items-center h-9 px-4 text-xs font-semibold tracking-wide bg-nexus-surface text-foreground rounded-lg hover:bg-nexus-silver transition-colors btn-click"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="hidden md:flex items-center h-9 px-4 text-xs font-semibold tracking-wide bg-nexus-surface text-foreground rounded-lg hover:bg-nexus-silver transition-colors btn-click"
              >
                Sign In
              </button>
            )}

            <a
              href="#register"
              className="hidden md:flex items-center h-9 px-5 text-xs font-semibold tracking-wide bg-foreground text-primary-foreground rounded-lg hover:opacity-85 transition-opacity btn-click"
            >
              Register Now
            </a>
          </div>
        </div>
      </motion.header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
