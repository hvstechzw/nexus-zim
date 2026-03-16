import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function EventsGrid() {
  const navigate = useNavigate();

  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ["events-grid"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select(`*, registrations(count)`)
        .in("status", ["registration_open", "ongoing", "registration_closed"])
        .order("start_date", { ascending: true })
        .limit(9);
      return data || [];
    },
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
      <div className="px-8 py-5 hairline-b flex items-center justify-between">
        <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">Upcoming & Active Events</p>
        <button
          onClick={() => navigate("/competitions")}
          className="text-xs font-semibold text-nexus-muted hover:text-foreground transition-colors flex items-center gap-1"
        >
          View All →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6 md:p-8">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="hairline rounded-xl p-6 animate-pulse">
            <div className="h-3 bg-nexus-surface rounded w-1/3 mb-3" />
            <div className="h-5 bg-nexus-surface rounded w-3/4 mb-2" />
            <div className="h-3 bg-nexus-surface rounded w-1/2" />
          </div>
        ))}

        {!isLoading && competitions.map((comp, i) => {
          const status = STATUS_CONFIG[comp.status] || { label: comp.status, dot: false };
          const regCount = (comp as any).registrations?.[0]?.count || 0;
          const fillPct = comp.max_participants ? Math.min(100, Math.round((regCount / comp.max_participants) * 100)) : 0;

          return (
            <motion.article
              key={comp.id}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: (i % 3) * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="hairline rounded-xl p-6 flex flex-col gap-4 hover:bg-nexus-surface/50 transition-colors duration-200 cursor-pointer group card-shadow bg-background"
              onClick={() => navigate("/competitions")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-2.5 py-1 rounded-full">
                    {comp.discipline}
                  </span>
                  <span className="text-[10px] mono tracking-widest uppercase text-nexus-muted/70 bg-nexus-surface px-2.5 py-1 rounded-full">
                    {comp.level?.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] mono tracking-widest uppercase text-nexus-muted">
                  {status.dot && <span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse" />}
                  {status.label}
                </span>
              </div>

              <h3 className="display-font text-sm font-semibold text-foreground leading-snug group-hover:opacity-75 transition-opacity">
                {comp.name}
              </h3>

              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] mono text-nexus-muted hairline px-2 py-1 rounded-md">
                  {comp.format?.replace(/_/g, " ")}
                </span>
                {comp.season && (
                  <span className="text-[11px] mono text-nexus-muted hairline px-2 py-1 rounded-md">{comp.season}</span>
                )}
                {comp.province && (
                  <span className="text-[11px] mono text-nexus-muted hairline px-2 py-1 rounded-md">{comp.province}</span>
                )}
              </div>

              <div className="mt-auto pt-4 hairline-t flex items-end justify-between gap-4">
                <div>
                  {comp.start_date && (
                    <p className="text-xs mono text-nexus-muted font-medium">
                      {new Date(comp.start_date).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                  {comp.prize_pool && comp.prize_pool > 0 && (
                    <p className="text-xs mono text-nexus-muted/70 mt-0.5">Prize: ${Number(comp.prize_pool).toLocaleString()}</p>
                  )}
                </div>
                {comp.max_participants && (
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 bg-nexus-silver rounded-full overflow-hidden">
                        <div className="h-full bg-foreground transition-all duration-700 rounded-full" style={{ width: `${fillPct}%` }} />
                      </div>
                      <span className="text-[11px] mono text-nexus-muted">{regCount}/{comp.max_participants}</span>
                    </div>
                    <p className="text-[10px] mono text-nexus-muted/60 mt-1">entries</p>
                  </div>
                )}
              </div>
            </motion.article>
          );
        })}

        {!isLoading && competitions.length === 0 && (
          <div className="col-span-3 py-20 text-center">
            <p className="text-nexus-muted mono text-sm">No active events at this time.</p>
            <p className="text-nexus-muted mono text-xs mt-2">Competitions will appear here once created and opened for registration.</p>
          </div>
        )}
      </div>
    </section>
  );
}
