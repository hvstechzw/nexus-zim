import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
        .limit(8);
      if (data?.length && !activeCompId) setActiveCompId(data[0].id);
      return data || [];
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
          team:team_id(name),
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
      <div className="px-8 py-5 hairline-b flex items-center justify-between">
        <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">League Standings</p>
      </div>

      {competitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <p className="text-nexus-muted mono text-sm">No standings data yet.</p>
          <p className="text-nexus-muted mono text-xs mt-2">Standings will appear once competitions begin.</p>
        </div>
      ) : (
        <>
          <div className="flex px-5 py-3 gap-2 hairline-b overflow-x-auto">
            {competitions.map((comp) => (
              <button
                key={comp.id}
                onClick={() => setActiveCompId(comp.id)}
                className={`px-5 py-2 text-xs font-semibold tracking-wide rounded-lg transition-all duration-200 btn-click whitespace-nowrap flex-shrink-0
                  ${activeCompId === comp.id
                    ? "bg-foreground text-primary-foreground"
                    : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}
              >
                {comp.name}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto px-4 py-4">
            {standings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-nexus-muted mono text-sm">No standings data for this competition yet.</p>
              </div>
            ) : (
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr>
                    {["#", "Team / Athlete", "P", "W", "D", "L", "GF", "GA", "PTS"].map((col) => (
                      <th
                        key={col}
                        className={`pb-3 text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold
                          ${col === "Team / Athlete" ? "text-left px-4" : "text-center px-3"}`}
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
                    return (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="rounded-lg hover:bg-nexus-surface/60 transition-colors duration-200"
                      >
                        <td className="py-3.5 text-center px-3">
                          <span className={`mono text-sm font-semibold ${pos <= 3 ? "text-foreground" : "text-nexus-muted"}`}>{pos}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="display-font text-sm font-semibold text-foreground">{name}</span>
                        </td>
                        {[row.played ?? 0, row.won ?? 0, row.drawn ?? 0, row.lost ?? 0, row.score_for ?? 0, row.score_against ?? 0].map((val, j) => (
                          <td key={j} className="py-3.5 text-center px-3">
                            <span className="mono text-sm text-nexus-muted">{val}</span>
                          </td>
                        ))}
                        <td className="py-3.5 text-center px-3">
                          <span className="mono text-sm font-bold text-foreground bg-nexus-surface px-2.5 py-1 rounded-md">
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
