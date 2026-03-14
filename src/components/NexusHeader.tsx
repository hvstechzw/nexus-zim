import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? "bg-background/90 backdrop-blur-md hairline-b" : ""
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <a href="#" className="flex items-center gap-3">
          <span className="display-font text-sm font-semibold tracking-[0.2em] uppercase text-foreground">
            Nexus
          </span>
          <span className="hairline-l pl-3 text-xs mono text-nexus-muted tracking-widest uppercase">
            by Aetheris
          </span>
        </a>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-0">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              className={`px-5 h-14 flex items-center text-xs tracking-[0.15em] uppercase font-medium transition-colors duration-200 text-nexus-muted hover:text-foreground ${
                i < NAV_LINKS.length - 1 ? "hairline-r" : ""
              }`}
            >
              {link.label === "Live" && (
                <span className="w-1.5 h-1.5 rounded-full bg-nexus-live mr-2 animate-pulse" />
              )}
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <a
            href="#register"
            className="hidden md:flex items-center h-8 px-5 text-xs tracking-[0.15em] uppercase font-medium bg-foreground text-primary-foreground hover:bg-nexus-muted transition-colors duration-200 btn-click"
          >
            Register Now
          </a>
        </div>
      </div>
    </motion.header>
  );
}
