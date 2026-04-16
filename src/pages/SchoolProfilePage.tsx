import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { ScholasticBadge } from "@/components/ScholasticBadge";
import { tierLabel } from "@/lib/schools";

export default function SchoolProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: school } = useQuery({
    queryKey: ["school", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase.from("teams").select("*").eq("id", id).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const { data: roster = [] } = useQuery({
    queryKey: ["school-roster", school?.school_name],
    queryFn: async () => {
      if (!school?.school_name) return [];
      const { data } = await supabase.from("athletes").select("id, first_name, last_name, gender, date_of_birth, disciplines, house").eq("school_name", school.school_name).eq("is_active", true).limit(500);
      return data || [];
    },
    enabled: !!school?.school_name,
  });

  const { data: fixtures = [] } = useQuery({
    queryKey: ["school-fixtures", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase.from("fixtures").select("*, competition:competitions(name, discipline, age_group)").or(`home_team_id.eq.${id},away_team_id.eq.${id}`).order("scheduled_at", { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!id,
  });

  useEffect(() => { document.title = school ? `${school.school_name || school.name} — Nexus` : "School — Nexus"; }, [school]);

  if (!school) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NexusHeader />
        <main className="pt-24 px-4 text-center"><p className="text-sm text-nexus-muted">Loading school…</p></main>
        <NexusFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />
      <main className="pt-16 sm:pt-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
          <Link to="/schools" className="text-xs text-nexus-muted hover:text-foreground transition-colors">← All schools</Link>

          <div className="hairline rounded-2xl p-6 sm:p-8 bg-background card-shadow flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white flex items-center justify-center p-2 hairline flex-shrink-0">
              {school.logo_url ? <img src={school.logo_url} alt={school.name} className="w-full h-full object-contain" /> : <span className="text-3xl font-bold">{school.name.charAt(0)}</span>}
            </div>
            <div className="flex-1">
              <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted">{tierLabel(school.level)} · {school.province}</p>
              <h1 className="display-font text-2xl sm:text-3xl font-bold mt-1 tracking-tight">{school.school_name || school.name}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <ScholasticBadge size="sm" />
                {(school.sports_offered || []).map((s: string) => (
                  <span key={s} className="text-[10px] mono px-2.5 py-1 hairline rounded-full text-nexus-muted">{s}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div><p className="score-display text-xl text-foreground">{roster.length}</p><p className="text-[10px] mono uppercase tracking-wider text-nexus-muted">Students</p></div>
              <div><p className="score-display text-xl text-foreground">{fixtures.length}</p><p className="text-[10px] mono uppercase tracking-wider text-nexus-muted">Fixtures</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="hairline rounded-xl p-5 bg-background card-shadow">
              <p className="display-font text-base font-bold mb-3">Student Roster</p>
              {roster.length === 0 ? (
                <p className="text-xs text-nexus-muted">No students synced for this school yet.</p>
              ) : (
                <div className="max-h-96 overflow-y-auto flex flex-col gap-1">
                  {roster.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-2 hairline-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{a.first_name} {a.last_name}</p>
                        <p className="text-[10px] text-nexus-muted">{(a.disciplines || []).slice(0, 3).join(" · ")}</p>
                      </div>
                      {a.house && <span className="text-[10px] mono px-2 py-0.5 rounded-full hairline">{a.house}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="hairline rounded-xl p-5 bg-background card-shadow">
              <p className="display-font text-base font-bold mb-3">Recent Fixtures</p>
              {fixtures.length === 0 ? (
                <p className="text-xs text-nexus-muted">No fixtures yet.</p>
              ) : (
                <div className="max-h-96 overflow-y-auto flex flex-col gap-2">
                  {fixtures.map((f: any) => (
                    <div key={f.id} className="hairline rounded-lg p-3 bg-nexus-surface/50">
                      <p className="text-xs font-semibold">{f.competition?.name || "Competition"}</p>
                      <p className="text-[10px] text-nexus-muted mt-0.5">{f.competition?.discipline} · {f.competition?.age_group || "All"} · {f.status}</p>
                      <p className="mono text-sm mt-1">{f.home_score ?? "-"} : {f.away_score ?? "-"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <NexusFooter />
    </div>
  );
}
