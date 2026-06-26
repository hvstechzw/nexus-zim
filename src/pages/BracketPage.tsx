import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { supabase } from "@/integrations/supabase/client";

type Fx = {
  id: string; bracket_round: number | null; bracket_slot: string | null;
  advances_to_fixture_id: string | null; round_label: string | null;
  home_school_team_id: string | null; away_school_team_id: string | null;
  home_score: number | null; away_score: number | null; status: string;
};

export default function BracketPage() {
  const { id } = useParams<{ id: string }>();
  const { data: comp } = useQuery({
    queryKey: ["comp", id],
    enabled: !!id,
    queryFn: async () => (await supabase.from("competitions").select("id, name, discipline").eq("id", id!).maybeSingle()).data,
  });
  const { data: fixtures = [] } = useQuery({
    queryKey: ["bracket", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("fixtures")
        .select("id, bracket_round, bracket_slot, advances_to_fixture_id, round_label, home_school_team_id, away_school_team_id, home_score, away_score, status")
        .eq("competition_id", id!).not("bracket_round", "is", null)
        .order("bracket_round", { ascending: true });
      return (data || []) as Fx[];
    },
  });
  const { data: teams = [] } = useQuery({
    queryKey: ["bracket-teams", id, fixtures.map((f) => f.id).join(",")],
    enabled: fixtures.length > 0,
    queryFn: async () => {
      const ids = Array.from(new Set(fixtures.flatMap((f) => [f.home_school_team_id, f.away_school_team_id]).filter(Boolean))) as string[];
      if (!ids.length) return [];
      const { data } = await supabase.from("school_teams").select("id, name").in("id", ids);
      return data || [];
    },
  });
  const teamName = (tid: string | null) => tid ? (teams.find((t) => t.id === tid)?.name || "—") : "TBD";

  const rounds = Array.from(new Set(fixtures.map((f) => f.bracket_round!))).sort((a, b) => a - b);
  const byRound = rounds.map((r) => fixtures.filter((f) => f.bracket_round === r));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet><title>{`${comp?.name || "Bracket"} — Nexus`}</title></Helmet>
      <NexusHeader />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-20 pb-16">
        <Link to={`/competition/${id}`} className="text-xs mono text-nexus-muted hover:text-foreground">← Competition</Link>
        <h1 className="display-font text-display-md font-bold mt-2 mb-2">{comp?.name || "Bracket"}</h1>
        <p className="text-xs mono text-nexus-muted mb-8">{comp?.discipline} · single elimination bracket</p>

        {fixtures.length === 0 ? (
          <p className="text-nexus-muted text-sm">No knockout fixtures.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-6 min-w-max">
              {byRound.map((round, ri) => (
                <div key={ri} className="flex flex-col justify-around gap-4 min-w-[240px]">
                  <p className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted mb-2">{round[0]?.round_label || `Round ${ri + 1}`}</p>
                  {round.map((f) => (
                    <Link to={`/live/${f.id}`} key={f.id} className="block hairline rounded-xl p-3 hover:bg-nexus-surface/40">
                      <MatchRow team={teamName(f.home_school_team_id)} score={f.home_score} winner={(f.home_score ?? 0) > (f.away_score ?? 0) && f.status === "completed"} />
                      <div className="hairline-b my-1" />
                      <MatchRow team={teamName(f.away_school_team_id)} score={f.away_score} winner={(f.away_score ?? 0) > (f.home_score ?? 0) && f.status === "completed"} />
                      <p className="text-[9px] mono uppercase tracking-[0.15em] text-nexus-muted mt-1">{f.status}</p>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <NexusFooter />
    </div>
  );
}

function MatchRow({ team, score, winner }: { team: string; score: number | null; winner: boolean }) {
  return (
    <div className={`flex items-center justify-between text-sm ${winner ? "font-semibold" : "text-nexus-muted"}`}>
      <span className="truncate">{team}</span>
      <span className="mono tabular-nums">{score ?? "—"}</span>
    </div>
  );
}
