import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function EventsGrid() {
  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ["events-grid"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, name, discipline, level, format, status, season, province, start_date, end_date, prize_pool, max_participants, logo_url, description")
        .in("status", ["registration_open", "ongoing", "registration_closed"])
        .order("start_date", { ascending: true })
        .limit(12);
      if (error) console.error("EventsGrid query error:", error);
      return data || [];
    },
  });

  const compIds = competitions.map((c: any) => c.id);
  const { data: regCounts = {} } = useQuery({
    queryKey: ["events-grid-reg", compIds],
    queryFn: async () => {
      if (compIds.length === 0) return {};
      const { data } = await supabase
        .from("registrations")
        .select("competition_id")
        .in("competition_id", compIds);
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.competition_id] = (counts[r.competition_id] || 0) + 1;
      });
      return counts;
    },
    enabled: compIds.length > 0,
  });

  // Also fetch fixture counts per competition
  const { data: fixtureCounts = {} } = useQuery({
    queryKey: ["events-grid-fixtures", compIds],
    queryFn: async () => {
      if (compIds.length === 0) return {};
      const { data } = await supabase
        .from("fixtures")
        .select("competition_id")
        .in("competition_id", compIds);
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.competition_id] = (counts[r.competition_id] || 0) + 1;
      });
      return counts;
    },
    enabled: compIds.length > 0,
  });

  const STATUS_CONFIG: Record<string, { label: string; dot: boolean }> = {
    registration_open: { label: "Open", dot: false },
    registration_closed: { label: "Closed", dot: false },
    ongoing: { label: "Live", dot: true },
    draft: { label: "Draft", dot: false },
    completed: { label: "Completed", dot: false },
    cancelled: { label: "Cancelled", dot: false },
  };

  return (
    <section id="events" className="hairline-b">
      <div className="px-4 sm:px-8 py-4 sm:py-5 hairline-b flex items-center justify-between">
        <p className="text-[10px] sm:text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">Upcoming & Active Events</p>
        <span className="text-[10px] sm:text-xs mono text-nexus-muted">{competitions.length} event{competitions.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-8">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="hairline rounded-xl p-5 sm:p-6 animate-pulse">
            <div className="h-3 bg-nexus-surface rounded w-1/3 mb-3" />
            <div className="h-5 bg-nexus-surface rounded w-3/4 mb-2" />
            <div className="h-3 bg-nexus-surface rounded w-1/2" />
          </div>
        ))}

        {!isLoading && competitions.map((comp: any, i: number) => {
          const status = STATUS_CONFIG[comp.status] || { label: comp.status, dot: false };
          const regCount = (regCounts as any)[comp.id] || 0;
          const fixtureCount = (fixtureCounts as any)[comp.id] || 0;
          const fillPct = comp.max_participants ? Math.min(100, Math.round((regCount / comp.max_participants) * 100)) : 0;

          return (
            <Link to={`/competition/${comp.id}`} key={comp.id}>
            <motion.article
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: (i % 3) * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="hairline rounded-xl p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 hover:bg-nexus-surface/50 transition-colors duration-200 cursor-pointer group card-shadow bg-background"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {comp.logo_url && <img src={comp.logo_url} className="w-5 h-5 rounded object-cover bg-white" alt="" />}
                  <span className="text-[9px] sm:text-[10px] mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-2 py-0.5 sm:py-1 rounded-full">
                    {comp.discipline}
                  </span>
                  <span className="text-[9px] sm:text-[10px] mono tracking-widest uppercase text-nexus-muted/70 bg-nexus-surface px-2 py-0.5 sm:py-1 rounded-full">
                    {comp.level?.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] mono tracking-widest uppercase text-nexus-muted">
                  {status.dot && <span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse" />}
                  {status.label}
                </span>
              </div>

              <h3 className="display-font text-xs sm:text-sm font-semibold text-foreground leading-snug group-hover:opacity-75 transition-opacity">
                {comp.name}
              </h3>

              {comp.description && (
                <p className="text-[10px] sm:text-xs text-nexus-muted leading-relaxed line-clamp-2">{comp.description}</p>
              )}

              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                <span className="text-[10px] sm:text-[11px] mono text-nexus-muted hairline px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
                  {comp.format?.replace(/_/g, " ")}
                </span>
                {comp.season && (
                  <span className="text-[10px] sm:text-[11px] mono text-nexus-muted hairline px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">{comp.season}</span>
                )}
                {comp.province && (
                  <span className="text-[10px] sm:text-[11px] mono text-nexus-muted hairline px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">{comp.province}</span>
                )}
                {fixtureCount > 0 && (
                  <span className="text-[10px] sm:text-[11px] mono text-nexus-muted hairline px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">{fixtureCount} fixtures</span>
                )}
              </div>

              <div className="mt-auto pt-3 sm:pt-4 hairline-t flex items-end justify-between gap-4">
                <div>
                  {comp.start_date && (
                    <p className="text-[10px] sm:text-xs mono text-nexus-muted font-medium">
                      {new Date(comp.start_date).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                      {comp.end_date && ` - ${new Date(comp.end_date).toLocaleDateString("en-ZW", { day: "numeric", month: "short" })}`}
                    </p>
                  )}
                  {comp.prize_pool && comp.prize_pool > 0 && (
                    <p className="text-[10px] mono text-nexus-muted/70 mt-0.5">Prize: ${Number(comp.prize_pool).toLocaleString()}</p>
                  )}
                </div>
                {comp.max_participants && (
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-10 sm:w-14 h-1.5 bg-nexus-silver rounded-full overflow-hidden">
                        <div className="h-full bg-foreground transition-all duration-700 rounded-full" style={{ width: `${fillPct}%` }} />
                      </div>
                      <span className="text-[10px] sm:text-[11px] mono text-nexus-muted">{regCount}/{comp.max_participants}</span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] mono text-nexus-muted/60 mt-0.5">entries</p>
                  </div>
                )}
              </div>
            </motion.article>
          );
        })}

        {!isLoading && competitions.length === 0 && (
          <div className="col-span-full py-16 sm:py-20 text-center">
            <p className="text-nexus-muted mono text-sm">No active events at this time.</p>
            <p className="text-nexus-muted mono text-xs mt-2">Competitions will appear here once created and opened for registration.</p>
          </div>
        )}
      </div>
    </section>
  );
}
