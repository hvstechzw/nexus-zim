import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { disciplineLeaders, topScorers, type ScoreEntryLike } from "@/lib/sports";

// Competition leaderboards built from score_entries. Goal attribution + the
// scorer's player_name are written by the live scoring console, so no fragile
// foreign-key join is needed here.
export function LeaderboardPanel({ fixtureIds }: { fixtureIds: string[] }) {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["comp-leaders", fixtureIds.slice().sort().join(",")],
    enabled: fixtureIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("score_entries")
        .select("athlete_id, team_id, value, event_type, metadata")
        .in("fixture_id", fixtureIds)
        .limit(10000);
      return (data || []) as ScoreEntryLike[];
    },
  });

  if (fixtureIds.length === 0)
    return <p className="text-nexus-muted mono text-sm text-center py-12">No fixtures yet.</p>;
  if (isLoading)
    return <p className="text-nexus-muted mono text-sm text-center py-12">Loading leaders…</p>;

  const scorers = topScorers(rows);
  const discipline = disciplineLeaders(rows);

  if (scorers.length === 0 && discipline.length === 0)
    return (
      <p className="text-nexus-muted mono text-sm text-center py-12">
        No attributed scoring yet. Tag goals to players in the live scorer to populate the leaderboard.
      </p>
    );

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <section>
        <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted mb-3">Top Scorers</p>
        {scorers.length === 0 ? (
          <p className="text-xs mono text-nexus-muted">—</p>
        ) : (
          <div className="hairline rounded-xl overflow-hidden">
            {scorers.slice(0, 20).map((s, i) => (
              <div key={s.athleteId} className="flex items-center gap-3 px-4 py-3 hairline-b last:border-b-0 hover:bg-nexus-surface/40 transition-colors">
                <span className="text-sm font-bold w-6 text-nexus-muted">{i + 1}</span>
                <span className="text-sm font-semibold text-foreground flex-1 truncate">{s.name}</span>
                <span className="text-[10px] mono text-nexus-muted">{s.goals} {s.goals === 1 ? "goal" : "goals"}</span>
                <span className="text-base font-bold mono text-foreground w-10 text-right">{s.points}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted mb-3">Discipline</p>
        {discipline.length === 0 ? (
          <p className="text-xs mono text-nexus-muted">No cards or suspensions recorded.</p>
        ) : (
          <div className="hairline rounded-xl overflow-hidden">
            {discipline.slice(0, 20).map((d) => (
              <div key={d.athleteId} className="flex items-center gap-3 px-4 py-3 hairline-b last:border-b-0">
                <span className="text-sm font-semibold text-foreground flex-1 truncate">{d.name}</span>
                <span className="flex items-center gap-2 text-[10px] mono text-nexus-muted">
                  {d.yellow > 0 && <span className="flex items-center gap-1"><span className="w-2 h-3 rounded-[1px] bg-yellow-400" />{d.yellow}</span>}
                  {d.suspensions > 0 && <span>{d.suspensions}×2′</span>}
                  {d.red > 0 && <span className="flex items-center gap-1"><span className="w-2 h-3 rounded-[1px] bg-red-500" />{d.red}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
