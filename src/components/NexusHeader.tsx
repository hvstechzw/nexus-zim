import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import aieLogoLight from "@/assets/aie-logo-light.png";

const NAV_LINKS = [
  { label: "Live", href: "#live" },
  { label: "Events", href: "#events" },
  { label: "Standings", href: "#standings" },
  { label: "Register", href: "#register" },
  { label: "Broadcast", href: "#broadcast" },
];

export function NexusHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
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
        <a href="#" className="flex items-center gap-3 flex-shrink-0">
          <div className="bg-foreground rounded-lg p-1.5 flex items-center justify-center w-8 h-8">
            <img
              src={aieLogoLight}
              alt="Aetheris"
              className="w-5 h-5 object-contain"
              style={{ filter: "brightness(10)" }}
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
        </nav>

        {/* CTA */}
        <a
          href="#register"
          className="hidden md:flex items-center h-9 px-5 text-xs font-semibold tracking-wide bg-foreground text-primary-foreground rounded-lg hover:opacity-85 transition-opacity btn-click"
        >
          Register Now
        </a>
      </div>
    </motion.header>
  );
}
