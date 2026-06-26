import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { supabase } from "@/integrations/supabase/client";

export default function StandingsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: comp } = useQuery({
    queryKey: ["comp", id],
    enabled: !!id,
    queryFn: async () => (await supabase.from("competitions").select("id, name, discipline").eq("id", id!).maybeSingle()).data,
  });
  const { data: rows = [] } = useQuery({
    queryKey: ["standings", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("standings")
        .select("id, group_label, position, played, won, drawn, lost, score_for, score_against, score_diff, points, school_team_id, school_teams!standings_school_team_id_fkey(name)")
        .eq("competition_id", id!)
        .order("group_label", { ascending: true, nullsFirst: true })
        .order("position", { ascending: true, nullsFirst: false });
      return (data || []) as any[];
    },
  });

  const groups = Array.from(new Set(rows.map((r) => r.group_label || "Overall")));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet><title>{`${comp?.name || "Standings"} — Nexus`}</title></Helmet>
      <NexusHeader />
      <div className="max-w-[1000px] mx-auto px-4 sm:px-8 pt-20 pb-16">
        <Link to={`/competition/${id}`} className="text-xs mono text-nexus-muted hover:text-foreground">← Competition</Link>
        <h1 className="display-font text-display-md font-bold mt-2 mb-8">{comp?.name || "Standings"}</h1>

        {groups.length === 0 && <p className="text-nexus-muted text-sm">No standings yet — finish at least one group fixture.</p>}

        {groups.map((g) => (
          <div key={g} className="mb-8">
            <p className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted mb-3">{g}</p>
            <div className="hairline rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-nexus-surface/50 text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted">
                  <tr><Th>#</Th><Th className="text-left">Team</Th><Th>P</Th><Th>W</Th><Th>D</Th><Th>L</Th><Th>SF</Th><Th>SA</Th><Th>±</Th><Th>Pts</Th></tr>
                </thead>
                <tbody>
                  {rows.filter((r) => (r.group_label || "Overall") === g).map((r) => (
                    <tr key={r.id} className="hairline-b last:border-b-0">
                      <Td>{r.position ?? "—"}</Td>
                      <Td className="text-left font-medium">{r.school_teams?.name || "—"}</Td>
                      <Td>{r.played ?? 0}</Td><Td>{r.won ?? 0}</Td><Td>{r.drawn ?? 0}</Td><Td>{r.lost ?? 0}</Td>
                      <Td>{r.score_for ?? 0}</Td><Td>{r.score_against ?? 0}</Td>
                      <Td>{r.score_diff ?? 0}</Td>
                      <Td className="font-bold">{r.points ?? 0}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      <NexusFooter />
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-center ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 text-center tabular-nums ${className}`}>{children}</td>;
}
