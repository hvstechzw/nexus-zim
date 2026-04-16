import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function ScholasticPartnerSection() {
  const { data: stats } = useQuery({
    queryKey: ["scholastic-partner-stats"],
    queryFn: async () => {
      const [schools, students] = await Promise.all([
        supabase.from("teams").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("athletes").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      return { schools: schools.count || 0, students: students.count || 0 };
    },
  });

  return (
    <section id="register" className="hairline-b bg-nexus-surface/30">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-12 sm:py-20">
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <p className="text-[10px] sm:text-xs mono tracking-[0.25em] uppercase text-nexus-muted font-medium">Exclusive Data Partner</p>
          <h2 className="display-font text-2xl sm:text-display-md font-bold text-foreground mt-2 tracking-tight">
            Schools join Nexus through Scholastic Services
          </h2>
          <p className="mt-4 text-sm sm:text-base text-nexus-muted max-w-[60ch] leading-relaxed">
            Nexus is a closed platform. There is no public sign-up. Every school, every student athlete, every roster
            entry is sourced directly from <a href="https://scholasticservices.online" target="_blank" rel="noopener noreferrer" className="text-foreground font-semibold hover:opacity-70 underline">Scholastic Services</a> —
            Zimbabwe's vetted school registry. This guarantees authenticity, age verification, and academic eligibility for every competitor.
          </p>
        </motion.div>

        <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {[
            { n: "01", t: "School registers", d: "Your school enrols on Scholastic Services and is verified by their team." },
            { n: "02", t: "Roster syncs to Nexus", d: "Students, teachers and houses appear automatically inside your Nexus dashboard." },
            { n: "03", t: "Compete & broadcast", d: "Run inter-school fixtures, sports days and house competitions on day one." },
          ].map((step) => (
            <div key={step.n} className="hairline rounded-xl p-5 sm:p-6 bg-background card-shadow flex flex-col gap-2">
              <p className="mono text-[10px] tracking-[0.25em] uppercase text-nexus-muted">{step.n}</p>
              <p className="display-font text-base sm:text-lg font-bold text-foreground">{step.t}</p>
              <p className="text-xs sm:text-sm text-nexus-muted leading-relaxed">{step.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 hairline rounded-2xl p-5 sm:p-7 bg-background flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8 card-shadow">
          <div className="flex-1">
            <p className="display-font text-lg sm:text-xl font-bold text-foreground">Ready to bring your school onboard?</p>
            <p className="text-xs sm:text-sm text-nexus-muted mt-1">Register through Scholastic Services and your Nexus access is provisioned automatically.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <p className="score-display text-xl sm:text-2xl text-foreground">{stats?.schools ?? "—"}</p>
              <p className="text-[10px] mono uppercase tracking-wider text-nexus-muted">Schools</p>
            </div>
            <div className="text-right">
              <p className="score-display text-xl sm:text-2xl text-foreground">{stats?.students ?? "—"}</p>
              <p className="text-[10px] mono uppercase tracking-wider text-nexus-muted">Students</p>
            </div>
            <a
              href="https://scholasticservices.online"
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-6 text-sm font-semibold rounded-xl bg-foreground text-primary-foreground hover:opacity-85 transition-opacity btn-click flex items-center gap-2"
            >
              Visit Scholastic Services
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
