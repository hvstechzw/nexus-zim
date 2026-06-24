import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isNexusDiscipline } from "@/lib/nexusSports";

export function StandingsTable() {
  const [activeCompId, setActiveCompId] = useState<string>("");

  const { data: competitions = [] } = useQuery({
    queryKey: ["standings-competitions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, name, discipline, level")
        .in("status", ["ongoing", "registration_closed", "completed"])
        .order("created_at", { ascending: false })
        .limit(48);
      const filtered = (data || []).filter((c: any) => isNexusDiscipline(c.discipline)).slice(0, 8);
      if (filtered.length && !activeCompId) setActiveCompId(filtered[0].id);
      return filtered;
    },
  });


  const { data: standings = [] } = useQuery({
    queryKey: ["standings-data", activeCompId],
    queryFn: async () => {
      if (!activeCompId) return [];
      const { data } = await supabase
        .from("standings")
        .select(`
          id, position, points, played, won, drawn, lost, score_for, score_against, score_diff, form,
          team:team_id(name, logo_url),
          athlete:athlete_id(first_name, last_name, display_name)
        `)
        .eq("competition_id", activeCompId)
        .order("points", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!activeCompId,
  });

  return (
    <section id="standings" className="hairline-b">
      <div className="px-4 sm:px-8 py-4 sm:py-5 hairline-b flex items-center justify-between">
        <p className="text-[10px] sm:text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">League Standings</p>
      </div>

      {competitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4 sm:px-8">
          <p className="text-nexus-muted mono text-sm">No standings data yet.</p>
          <p className="text-nexus-muted mono text-xs mt-2">Standings will appear once competitions begin.</p>
        </div>
      ) : (
        <>
          <div className="flex px-3 sm:px-5 py-2.5 sm:py-3 gap-1.5 sm:gap-2 hairline-b overflow-x-auto scrollbar-hide">
            {competitions.map((comp: any) => (
              <button
                key={comp.id}
                onClick={() => setActiveCompId(comp.id)}
                className={`px-3 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold tracking-wide rounded-lg transition-all duration-200 btn-click whitespace-nowrap flex-shrink-0
                  ${activeCompId === comp.id
                    ? "bg-foreground text-primary-foreground"
                    : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}
              >
                {comp.name}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto px-2 sm:px-4 py-3 sm:py-4">
            {standings.length === 0 ? (
              <div className="py-10 sm:py-12 text-center">
                <p className="text-nexus-muted mono text-sm">No standings data for this competition yet.</p>
              </div>
            ) : (
              <table className="w-full min-w-[580px] border-collapse">
                <thead>
                  <tr>
                    {["#", "Team / Athlete", "P", "W", "D", "L", "GF", "GA", "GD", "PTS"].map((col) => (
                      <th
                        key={col}
                        className={`pb-2 sm:pb-3 text-[9px] sm:text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold
                          ${col === "Team / Athlete" ? "text-left px-2 sm:px-4" : "text-center px-1.5 sm:px-3"}`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row: any, i) => {
                    const name = row.team?.name || `${row.athlete?.first_name || ""} ${row.athlete?.last_name || ""}`.trim() || "—";
                    const pos = row.position || i + 1;
                    const gd = row.score_diff ?? ((row.score_for ?? 0) - (row.score_against ?? 0));
                    return (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="rounded-lg hover:bg-nexus-surface/60 transition-colors duration-200"
                      >
                        <td className="py-2.5 sm:py-3.5 text-center px-1.5 sm:px-3">
                          <span className={`mono text-xs sm:text-sm font-semibold ${pos <= 3 ? "text-foreground" : "text-nexus-muted"}`}>{pos}</span>
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                          <div className="flex items-center gap-2">
                            {row.team?.logo_url && <img src={row.team.logo_url} className="w-5 h-5 rounded object-cover bg-white" alt="" />}
                            <span className="display-font text-xs sm:text-sm font-semibold text-foreground">{name}</span>
                          </div>
                        </td>
                        {[row.played ?? 0, row.won ?? 0, row.drawn ?? 0, row.lost ?? 0, row.score_for ?? 0, row.score_against ?? 0, gd].map((val, j) => (
                          <td key={j} className="py-2.5 sm:py-3.5 text-center px-1.5 sm:px-3">
                            <span className={`mono text-xs sm:text-sm ${j === 6 ? (val > 0 ? "text-foreground font-semibold" : val < 0 ? "text-nexus-muted" : "text-nexus-muted") : "text-nexus-muted"}`}>
                              {j === 6 && val > 0 ? `+${val}` : val}
                            </span>
                          </td>
                        ))}
                        <td className="py-2.5 sm:py-3.5 text-center px-1.5 sm:px-3">
                          <span className="mono text-xs sm:text-sm font-bold text-foreground bg-nexus-surface px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md">
                            {row.points ?? 0}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </section>
  );
}
