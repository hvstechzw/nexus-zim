import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { disciplineLeaders, topScorers, type ScoreEntryLike } from "@/lib/sports";

// Competition leaderboards. Primary source: vw_competition_top_players
// (aggregates the new live match_events). Secondary: legacy score_entries
// for discipline cards. The scorer attributes goals/assists/etc to specific
// athletes during the match, which feeds player career profiles and the
// auto-selected MVP / Player of the Match / Player of the Tournament.
export function LeaderboardPanel({
  fixtureIds,
  competitionId,
}: { fixtureIds: string[]; competitionId?: string }) {
  // New engine: per-competition aggregates (goals, assists, defensive, impact)
  const { data: career = [] } = useQuery({
    queryKey: ["comp-top-players", competitionId],
    enabled: !!competitionId,
    queryFn: async () => {
      const { data } = await supabase
        .from("vw_competition_top_players")
        .select("athlete_id, points, goals, assists, defensive_actions, impact_score")
        .eq("competition_id", competitionId!);
      const rows = (data || []) as any[];
      if (!rows.length) return [] as any[];
      const ids = rows.map(r => r.athlete_id);
      const { data: athletes } = await supabase
        .from("athletes")
        .select("id, display_name, first_name, last_name, photo_url, school_name")
        .in("id", ids);
      const byId = new Map((athletes || []).map((a: any) => [a.id, a]));
      return rows.map(r => ({
        ...r,
        impact_score: Number(r.impact_score ?? 0),
        athlete: byId.get(r.athlete_id) || null,
      }));
    },
  });

  // Legacy discipline (cards/suspensions) — still from score_entries.
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["comp-discipline", fixtureIds.slice().sort().join(",")],
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

  if (fixtureIds.length === 0 && career.length === 0)
    return <p className="text-nexus-muted mono text-sm text-center py-12">No fixtures yet.</p>;

  const legacyScorers = topScorers(rows);
  const discipline = disciplineLeaders(rows);

  const liveScorers = [...career].sort((a, b) => (b.goals - a.goals) || (b.points - a.points));
  const impact = [...career].sort((a, b) => b.impact_score - a.impact_score);
  const tournamentMVP = impact[0];

  const displayName = (a: any) =>
    a?.display_name || `${a?.first_name ?? ""} ${a?.last_name?.[0] ?? ""}.`.trim() || "Player";

  if (!career.length && !legacyScorers.length && !discipline.length)
    return (
      <p className="text-nexus-muted mono text-sm text-center py-12">
        No attributed scoring yet. Tag goals to players in the live scorer to populate the leaderboard.
      </p>
    );

  return (
    <div className="space-y-6">
      {tournamentMVP?.athlete && (
        <section className="hairline rounded-2xl p-5 bg-gradient-to-br from-nexus-surface/60 to-background">
          <p className="text-[10px] mono tracking-[0.22em] uppercase text-nexus-muted mb-2">Player of the Tournament (live)</p>
          <Link to={`/players/${tournamentMVP.athlete_id}`} className="flex items-center gap-4 group">
            {tournamentMVP.athlete.photo_url ? (
              <img src={tournamentMVP.athlete.photo_url} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-nexus-surface" />
            )}
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold text-foreground group-hover:underline truncate">
                {displayName(tournamentMVP.athlete)}
              </p>
              <p className="text-[11px] mono text-nexus-muted truncate">{tournamentMVP.athlete.school_name || "—"}</p>
              <p className="text-[11px] mono text-nexus-muted mt-1">
                Impact <b className="text-foreground">{tournamentMVP.impact_score.toFixed(1)}</b>
                {"  ·  "}Goals <b className="text-foreground">{tournamentMVP.goals}</b>
                {"  ·  "}Assists <b className="text-foreground">{tournamentMVP.assists}</b>
              </p>
            </div>
          </Link>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted mb-3">Top Scorers</p>
          {liveScorers.length > 0 ? (
            <div className="hairline rounded-xl overflow-hidden">
              {liveScorers.slice(0, 20).map((s, i) => (
                <div key={s.athlete_id} className="flex items-center gap-3 px-4 py-3 hairline-b last:border-b-0 hover:bg-nexus-surface/40 transition-colors">
                  <span className="text-sm font-bold w-6 text-nexus-muted">{i + 1}</span>
                  <Link to={`/players/${s.athlete_id}`} className="text-sm font-semibold text-foreground flex-1 truncate hover:underline">
                    {displayName(s.athlete)}
                  </Link>
                  <span className="text-[10px] mono text-nexus-muted">{s.assists} ast</span>
                  <span className="text-base font-bold mono text-foreground w-10 text-right">{s.goals}</span>
                </div>
              ))}
            </div>
          ) : legacyScorers.length > 0 ? (
            <div className="hairline rounded-xl overflow-hidden">
              {legacyScorers.slice(0, 20).map((s, i) => (
                <div key={s.athleteId} className="flex items-center gap-3 px-4 py-3 hairline-b last:border-b-0 hover:bg-nexus-surface/40 transition-colors">
                  <span className="text-sm font-bold w-6 text-nexus-muted">{i + 1}</span>
                  <Link to={`/players/${s.athleteId}`} className="text-sm font-semibold text-foreground flex-1 truncate hover:underline">{s.name}</Link>
                  <span className="text-[10px] mono text-nexus-muted">{s.goals} {s.goals === 1 ? "goal" : "goals"}</span>
                  <span className="text-base font-bold mono text-foreground w-10 text-right">{s.points}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs mono text-nexus-muted">—</p>
          )}
        </section>

        <section className="space-y-6">
          <div>
            <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted mb-3">Impact Leaders</p>
            {impact.length > 0 ? (
              <div className="hairline rounded-xl overflow-hidden">
                {impact.slice(0, 10).map((s, i) => (
                  <div key={s.athlete_id} className="flex items-center gap-3 px-4 py-3 hairline-b last:border-b-0">
                    <span className="text-sm font-bold w-6 text-nexus-muted">{i + 1}</span>
                    <Link to={`/players/${s.athlete_id}`} className="text-sm font-semibold text-foreground flex-1 truncate hover:underline">
                      {displayName(s.athlete)}
                    </Link>
                    <span className="text-[10px] mono text-nexus-muted">
                      G{s.goals} · A{s.assists} · D{s.defensive_actions}
                    </span>
                    <span className="text-base font-bold mono text-foreground w-12 text-right">{s.impact_score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs mono text-nexus-muted">No live events yet.</p>
            )}
          </div>

          <div>
            <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted mb-3">Discipline</p>
            {discipline.length === 0 ? (
              <p className="text-xs mono text-nexus-muted">No cards or suspensions recorded.</p>
            ) : (
              <div className="hairline rounded-xl overflow-hidden">
                {discipline.slice(0, 10).map((d) => (
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
          </div>
        </section>
      </div>
    </div>
  );
}
