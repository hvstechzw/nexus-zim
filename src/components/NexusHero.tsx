import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import aieLogoLight from "@/assets/aie-logo-light.png";
import { useTheme } from "@/context/ThemeContext";

export function NexusHero() {
  const { theme } = useTheme();

  const { data: stats } = useQuery({
    queryKey: ["hero-stats"],
    queryFn: async () => {
      const [comps, athletes, venues, live] = await Promise.all([
        supabase.from("competitions").select("id", { count: "exact", head: true }),
        supabase.from("athletes").select("id", { count: "exact", head: true }),
        supabase.from("venues").select("id", { count: "exact", head: true }),
        supabase.from("fixtures").select("id", { count: "exact", head: true }).eq("status", "live"),
      ]);
      return {
        competitions: comps.count || 0,
        athletes: athletes.count || 0,
        venues: venues.count || 0,
        live: live.count || 0,
      };
    },
  });

  const STAT_ITEMS = [
    { value: stats?.competitions ? `${stats.competitions}` : "—", label: "Competitions" },
    { value: stats?.athletes ? `${stats.athletes}` : "—", label: "Athletes" },
    { value: stats?.venues ? `${stats.venues}` : "—", label: "Venues" },
    { value: stats?.live ? `${stats.live}` : "0", label: "Live Now" },
  ];

  return (
    <section className="relative min-h-[100svh] flex flex-col overflow-hidden bg-background">
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-16 pt-20 sm:pt-24 pb-6 sm:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-3xl"
        >
          <div className="bg-foreground rounded-2xl px-8 py-10 sm:px-12 sm:py-14 md:px-20 md:py-20 flex items-center justify-center card-shadow-md">
            <img
              src={aieLogoLight}
              alt="Aetheris Innovative Enterprises"
              className="w-full max-w-xs sm:max-w-md md:max-w-xl h-auto object-contain"
              style={{ filter: theme === "dark" ? "brightness(0.1)" : "brightness(10)" }}
            />
          </div>

          <div className="mt-3 sm:mt-4 px-4 sm:px-6 py-4 sm:py-5 hairline bg-background rounded-xl flex items-center justify-between card-shadow">
            <div>
              <p className="text-[9px] sm:text-[10px] mono tracking-[0.25em] uppercase text-nexus-muted">Product</p>
              <h1 className="display-font text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-0.5 tracking-tight">Nexus</h1>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] mono tracking-[0.25em] uppercase text-nexus-muted">By</p>
              <p className="display-font text-xs sm:text-sm font-semibold text-foreground mt-0.5">Aetheris Innovative Enterprises</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-3xl mt-6 sm:mt-10 mb-4 sm:mb-8"
        >
          <p className="text-xl sm:text-display-lg display-font font-semibold text-foreground max-w-[28ch] leading-snug">
            The National Pulse.{" "}
            <span className="text-nexus-muted font-normal">Every match, every move, every second.</span>
          </p>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base leading-relaxed text-nexus-muted max-w-[58ch]">
            Zimbabwe's centralised competition infrastructure — tracking, broadcasting, and registering every competitive
            discipline across every level.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <a href="#live" className="flex items-center justify-center gap-2 h-11 sm:h-12 px-7 bg-foreground text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-85 transition-opacity btn-click">
              <span className="w-2 h-2 rounded-full bg-primary-foreground/60 animate-pulse" />
              View Live
            </a>
            <a href="/competitions" className="flex items-center justify-center h-11 sm:h-12 px-7 bg-nexus-surface text-foreground text-sm font-medium rounded-xl hover:bg-nexus-silver transition-colors btn-click">
              Browse Events
            </a>
            <a href="/fixtures" className="flex items-center justify-center h-11 sm:h-12 px-7 bg-nexus-surface text-foreground text-sm font-medium rounded-xl hover:bg-nexus-silver transition-colors btn-click">
              Fixture Generator
            </a>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="hairline-t"
      >
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 sm:grid-cols-4">
          {STAT_ITEMS.map((stat, i) => (
            <div
              key={stat.label}
              className={`px-4 sm:px-8 py-5 sm:py-7 stagger-item ${i < STAT_ITEMS.length - 1 ? "sm:hairline-r" : ""} ${i % 2 === 0 && i < 2 ? "hairline-r sm:hairline-r" : ""}`}
              style={{ animationDelay: `${0.55 + i * 0.08}s` }}
            >
              <p className="score-display text-xl sm:text-score-md text-foreground">{stat.value}</p>
              <p className="text-[10px] sm:text-xs tracking-wide uppercase text-nexus-muted mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
