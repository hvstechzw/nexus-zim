import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { ScholasticBadge } from "@/components/ScholasticBadge";
import { tierLabel } from "@/lib/schools";

export default function SchoolProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: school, isLoading: schoolLoading } = useQuery({
    queryKey: ["school", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase.from("teams").select("*").eq("id", id).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  // Published school teams (Marist Handball U16, Marist Netball U18, etc.)
  const { data: schoolTeams = [] } = useQuery({
    queryKey: ["school-teams", id, !!user],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("school_teams")
        .select("id, name, discipline, age_group, gender, is_published, season")
        .eq("school_id", id)
        .order("discipline")
        .order("age_group");
      return data || [];
    },
    enabled: !!id,
  });

  // Roster = athletes registered into a published team for this school.
  // RLS already gates non-published rosters to coach/HIC/admin.
  const teamIds = schoolTeams.map((t: any) => t.id);
  const { data: rosterRows = [] } = useQuery({
    queryKey: ["school-team-players", teamIds.join(",")],
    queryFn: async () => {
      if (teamIds.length === 0) return [];
      const { data } = await supabase
        .from("school_team_players")
        .select("school_team_id, jersey_number, is_captain, athlete:athletes(id, first_name, last_name, photo_url, scholastic_card_verified)")
        .in("school_team_id", teamIds);
      return data || [];
    },
    enabled: teamIds.length > 0,
  });

  const studentCount = new Set(rosterRows.map((r: any) => r.athlete?.id).filter(Boolean)).size;

  const { data: fixtures = [] } = useQuery({
    queryKey: ["school-fixtures", id, teamIds.join(",")],
    queryFn: async () => {
      if (teamIds.length === 0) return [];
      const filter = teamIds.map((t) => `home_school_team_id.eq.${t},away_school_team_id.eq.${t}`).join(",");
      const { data } = await supabase
        .from("fixtures")
        .select("id, status, home_score, away_score, scheduled_at, home_school_team_id, away_school_team_id, competition:competitions(name, discipline, age_group, stage)")
        .or(filter)
        .order("scheduled_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: teamIds.length > 0,
  });

  useEffect(() => { document.title = school ? `${school.school_name || school.name} — Nexus` : "School — Nexus"; }, [school]);

  if (schoolLoading || !school) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NexusHeader />
        <main className="pt-24 px-4 text-center"><p className="text-sm text-nexus-muted">Loading school…</p></main>
        <NexusFooter />
      </div>
    );
  }

  const initials = (school.school_name || school.name || "S").split(/\s+/).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const teamLookup = new Map(schoolTeams.map((t: any) => [t.id, t]));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />
      <main className="pt-16 sm:pt-20">
        {/* Banner */}
        <div className="relative h-40 sm:h-56 bg-gradient-to-br from-foreground/90 via-foreground/70 to-foreground/40 hairline-b overflow-hidden">
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)", backgroundSize: "40px 40px, 60px 60px" }} />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pb-4 w-full">
              <Link to="/schools" className="text-[11px] text-primary-foreground/80 hover:text-primary-foreground transition-colors">← All schools</Link>
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
          {/* Identity card */}
          <div className="hairline rounded-2xl p-6 sm:p-8 bg-background card-shadow flex flex-col sm:flex-row gap-6 items-start -mt-16 sm:-mt-20 relative z-10">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-white flex items-center justify-center p-2 hairline flex-shrink-0 shadow-lg">
              {school.logo_url ? (
                <img src={school.logo_url} alt={school.name} className="w-full h-full object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <span className="text-3xl font-bold text-foreground">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted">{tierLabel(school.level)}</p>
              <h1 className="display-font text-2xl sm:text-3xl font-bold mt-1 tracking-tight">{school.school_name || school.name}</h1>
              <p className="text-sm text-nexus-muted mt-1 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                {school.province || "Zimbabwe"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ScholasticBadge size="sm" />
                {(school.sports_offered || []).slice(0, 6).map((s: string) => (
                  <span key={s} className="text-[10px] mono px-2.5 py-1 hairline rounded-full text-nexus-muted">{s}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 sm:gap-6 w-full sm:w-auto">
              <div><p className="score-display text-xl text-foreground">{schoolTeams.filter((t: any) => t.is_published).length}</p><p className="text-[10px] mono uppercase tracking-wider text-nexus-muted">Teams</p></div>
              <div><p className="score-display text-xl text-foreground">{studentCount}</p><p className="text-[10px] mono uppercase tracking-wider text-nexus-muted">Players</p></div>
              <div><p className="score-display text-xl text-foreground">{fixtures.length}</p><p className="text-[10px] mono uppercase tracking-wider text-nexus-muted">Fixtures</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Teams + minimal roster */}
            <div className="hairline rounded-xl p-5 bg-background card-shadow">
              <h2 className="display-font text-base font-bold mb-3">Published Teams</h2>
              {!user ? (
                <p className="text-xs text-nexus-muted">Sign in to view team rosters. Sensitive student information is never shown publicly.</p>
              ) : schoolTeams.length === 0 ? (
                <div className="text-xs text-nexus-muted space-y-2">
                  <p>No teams published yet for this school.</p>
                  <p>The school's sports director publishes teams (e.g. <span className="font-semibold">Marist Handball U16</span>) from the coach console. Only published team rosters appear here.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-h-[28rem] overflow-y-auto">
                  {schoolTeams.map((t: any) => {
                    const players = rosterRows.filter((r: any) => r.school_team_id === t.id);
                    return (
                      <div key={t.id} className="hairline rounded-lg p-3 bg-nexus-surface/40">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">{t.name}</p>
                            <p className="text-[10px] mono uppercase tracking-wider text-nexus-muted mt-0.5">{t.discipline} · {t.age_group || "All ages"}{t.gender ? ` · ${t.gender}` : ""}</p>
                          </div>
                          <span className={`text-[10px] mono px-2 py-0.5 rounded-full hairline ${t.is_published ? "text-foreground" : "text-nexus-muted"}`}>{t.is_published ? "Published" : "Draft"}</span>
                        </div>
                        {players.length === 0 ? (
                          <p className="text-[11px] text-nexus-muted mt-2">No players added.</p>
                        ) : (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {players.map((p: any) => {
                              const a = p.athlete;
                              if (!a) return null;
                              const initial = (a.last_name || "").charAt(0).toUpperCase();
                              return (
                                <span key={a.id} className="text-[11px] px-2 py-1 rounded-md hairline bg-background inline-flex items-center gap-1.5" title="Vetted via Scholastic Services">
                                  {p.jersey_number != null && <span className="mono text-nexus-muted">#{p.jersey_number}</span>}
                                  {a.first_name} {initial}{initial && "."}
                                  {a.scholastic_card_verified && <span className="w-1.5 h-1.5 rounded-full bg-foreground" title="Card verified" />}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-[10px] text-nexus-muted mt-3">Ages, identity and eligibility are auto-vetted via Scholastic Services. Personal details are never exposed.</p>
            </div>

            {/* Fixtures */}
            <div className="hairline rounded-xl p-5 bg-background card-shadow">
              <h2 className="display-font text-base font-bold mb-3">Recent Fixtures</h2>
              {fixtures.length === 0 ? (
                <p className="text-xs text-nexus-muted">No fixtures yet for this school's teams.</p>
              ) : (
                <div className="max-h-[28rem] overflow-y-auto flex flex-col gap-2">
                  {fixtures.map((f: any) => {
                    const home = teamLookup.get(f.home_school_team_id);
                    const away = teamLookup.get(f.away_school_team_id);
                    return (
                      <div key={f.id} className="hairline rounded-lg p-3 bg-nexus-surface/50">
                        <p className="text-xs font-semibold">{f.competition?.name || "Competition"}</p>
                        <p className="text-[10px] text-nexus-muted mt-0.5">{f.competition?.discipline} · {f.competition?.age_group || "All"} · {f.competition?.stage || ""} · {f.status}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs">{home?.name || "—"} <span className="text-nexus-muted">vs</span> {away?.name || "—"}</span>
                          <span className="mono text-sm">{f.home_score ?? "-"} : {f.away_score ?? "-"}</span>
                        </div>
                      </div>
                    );
                  })}
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
