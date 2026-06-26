import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BrandLockup } from "@/components/Brand";
import { ScholasticBadge } from "@/components/ScholasticBadge";

export function NexusHero() {
  const { data: stats } = useQuery({
    queryKey: ["hero-stats"],
    queryFn: async () => {
      const [comps, students, venues, live, schools, fixtures] = await Promise.all([
        supabase.from("competitions").select("id", { count: "exact", head: true }),
        supabase.from("athletes").select("id", { count: "exact", head: true }),
        supabase.from("venues").select("id", { count: "exact", head: true }),
        supabase.from("fixtures").select("id", { count: "exact", head: true }).eq("status", "live"),
        supabase.from("teams").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("fixtures").select("id", { count: "exact", head: true }),
      ]);
      return {
        competitions: comps.count || 0,
        students: students.count || 0,
        venues: venues.count || 0,
        live: live.count || 0,
        schools: schools.count || 0,
        fixtures: fixtures.count || 0,
      };
    },
  });

  const STAT_ITEMS = [
    { value: stats?.schools ? `${stats.schools}` : "—", label: "Schools" },
    { value: stats?.students ? `${stats.students}` : "—", label: "Students" },
    { value: stats?.competitions ? `${stats.competitions}` : "—", label: "Competitions" },
    { value: stats?.fixtures ? `${stats.fixtures}` : "—", label: "Inter-School Fixtures" },
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
          <BrandLockup
            glyphClass="w-12 h-12 sm:w-14 sm:h-14 text-2xl sm:text-3xl rounded-xl"
            wordClass="text-3xl sm:text-4xl"
            subtitle="Inter-School Sports · Zimbabwe"
          />
          <p className="text-[10px] sm:text-[11px] mono tracking-[0.2em] uppercase text-nexus-muted mt-4">
            by Aetheris Innovative Enterprises
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-3xl mt-6 sm:mt-10 mb-4 sm:mb-8"
        >
          <h1 className="text-xl sm:text-display-lg display-font font-semibold text-foreground max-w-[30ch] leading-snug">
            Nexus for Schools.{" "}
            <span className="text-nexus-muted font-normal">Zimbabwe's handball & netball network.</span>
          </h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base leading-relaxed text-nexus-muted max-w-[60ch]">
            A closed platform for inter-school handball and netball — fixtures, live scoring, standings and player verification between vetted Zimbabwean schools.
            Schools and student athletes are sourced directly from{" "}
            <a href="https://scholasticservices.online" target="_blank" rel="noopener noreferrer" className="text-foreground font-medium hover:opacity-70 transition-opacity">Scholastic Services</a>.
            No public sign-ups.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <a href="#live" className="flex items-center justify-center gap-2 h-11 sm:h-12 px-7 bg-foreground text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-85 transition-opacity btn-click">
              <span className="w-2 h-2 rounded-full bg-primary-foreground/60 animate-pulse" />
              View Live
            </a>
            <a href="#schools" className="flex items-center justify-center h-11 sm:h-12 px-7 bg-nexus-surface text-foreground text-sm font-medium rounded-xl hover:bg-nexus-silver transition-colors btn-click">
              Browse Schools
            </a>
          </div>

          {/* Sport chips — Nexus is scoped to handball + netball */}
          <div className="mt-6 flex flex-wrap gap-2">
            {["Handball", "Netball"].map(d => (
              <span key={d} className="text-[10px] sm:text-[11px] mono text-foreground hairline px-2.5 py-1 rounded-full">{d}</span>
            ))}
          </div>

          {/* Scholastic Services integration badge */}
          <div className="mt-5 flex items-center gap-3">
            <ScholasticBadge size="md" />
            <span className="text-[10px] text-nexus-muted">Exclusive data partner — schools, students & house rosters</span>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="hairline-t"
      >
        <div className="max-w-[1400px] mx-auto grid grid-cols-3 sm:grid-cols-6">
          {STAT_ITEMS.map((stat, i) => (
            <div
              key={stat.label}
              className={`px-3 sm:px-6 py-4 sm:py-6 stagger-item ${i < STAT_ITEMS.length - 1 ? "hairline-r" : ""}`}
              style={{ animationDelay: `${0.55 + i * 0.08}s` }}
            >
              <p className="score-display text-lg sm:text-score-md text-foreground">{stat.value}</p>
              <p className="text-[9px] sm:text-[10px] tracking-wide uppercase text-nexus-muted mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
