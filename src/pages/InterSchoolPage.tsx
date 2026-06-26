import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { InterSchoolFixturesBuilder } from "@/components/InterSchoolFixturesBuilder";
import { ScholasticIntegrationBanner } from "@/components/ScholasticBadge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { COMPETITION_STAGES, type CompetitionStage } from "@/lib/schools";
import { useHasRole } from "@/hooks/useHasRole";
import { Input } from "@/components/ui/input";

const FIXTURE_ROLES = [
  "admin", "super_admin", "hic", "coach", "federation_official",
  "school_coordinator", "zonal_admin", "district_admin", "provincial_admin", "national_admin",
] as const;

export default function InterSchoolPage() {
  useEffect(() => { document.title = "Inter-School Fixtures — Nexus"; }, []);
  const [stage, setStage] = useState<CompetitionStage | "all">("all");
  const [q, setQ] = useState("");
  const { hasRole, loading: roleLoading } = useHasRole();
  const canBuild = hasRole(...FIXTURE_ROLES);

  const { data: comps = [] } = useQuery({
    queryKey: ["inter-school-comps"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, name, discipline, age_group, term, status, level, stage")
        .in("level", ["primary_school", "secondary_school", "club_academy"])
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const term = q.trim();
  const searchEnabled = term.length >= 2;
  const { data: searchResults } = useQuery({
    enabled: searchEnabled,
    queryKey: ["inter-school-search", term],
    queryFn: async () => {
      const like = `%${term}%`;
      const [players, teams, tournaments] = await Promise.all([
        supabase.from("athletes").select("id, display_name, first_name, last_name, school_name, nexus_sport, photo_url").or(`display_name.ilike.${like},first_name.ilike.${like},last_name.ilike.${like}`).limit(8),
        supabase.from("school_teams").select("id, name, discipline, age_group, school_id, team_photo_url").ilike("name", like).limit(8),
        supabase.from("competitions").select("id, name, discipline, stage, status").ilike("name", like).limit(8),
      ]);
      return {
        players: players.data || [],
        teams: teams.data || [],
        tournaments: tournaments.data || [],
      };
    },
  });

  const filtered = stage === "all" ? comps : comps.filter((c: any) => c.stage === stage);
  const stageCount = (s: string) => comps.filter((c: any) => c.stage === s).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />
      <main className="pt-16 sm:pt-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
          <ScholasticIntegrationBanner />
          <div>
            <p className="text-[10px] sm:text-xs mono tracking-[0.25em] uppercase text-nexus-muted">Inter-School</p>
            <h1 className="display-font text-2xl sm:text-3xl font-bold mt-1 tracking-tight">Inter-School Fixtures</h1>
            <p className="text-xs sm:text-sm text-nexus-muted mt-1">Browse the Zonal → District → Provincial → National pathway. Search players, teams, and tournaments.</p>
          </div>

          {/* Search */}
          <div className="hairline rounded-xl p-4 bg-background">
            <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted font-semibold mb-2">Search</p>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search players, teams, or tournaments…" />
            {searchEnabled && searchResults && (
              <div className="grid gap-4 mt-4 md:grid-cols-3">
                <SearchColumn title="Players" empty="No players">
                  {searchResults.players.map((p: any) => (
                    <Link key={p.id} to={`/players/${p.id}`} className="block hairline rounded-md p-2 bg-nexus-surface/40 hover:bg-nexus-surface">
                      <p className="text-sm font-medium truncate">{p.display_name || `${p.first_name || ""} ${p.last_name?.[0] || ""}.`}</p>
                      <p className="text-[10px] text-nexus-muted truncate">{p.school_name || "—"} · {p.nexus_sport || "—"}</p>
                    </Link>
                  ))}
                </SearchColumn>
                <SearchColumn title="Teams" empty="No teams">
                  {searchResults.teams.map((t: any) => (
                    <Link key={t.id} to={t.school_id ? `/schools/${t.school_id}` : "#"} className="block hairline rounded-md p-2 bg-nexus-surface/40 hover:bg-nexus-surface">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-[10px] text-nexus-muted truncate">{t.discipline} · {t.age_group || "Open"}</p>
                    </Link>
                  ))}
                </SearchColumn>
                <SearchColumn title="Tournaments" empty="No tournaments">
                  {searchResults.tournaments.map((c: any) => (
                    <Link key={c.id} to={`/competition/${c.id}`} className="block hairline rounded-md p-2 bg-nexus-surface/40 hover:bg-nexus-surface">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-[10px] text-nexus-muted truncate">{c.discipline} · {c.stage || "—"} · {c.status}</p>
                    </Link>
                  ))}
                </SearchColumn>
              </div>
            )}
          </div>

          {/* Stage pathway */}
          <div className="hairline rounded-xl p-4 bg-background">
            <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted font-semibold mb-3">Competition Pathway</p>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setStage("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all btn-click ${stage === "all" ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}
              >
                All Stages <span className="mono opacity-60 ml-1">{comps.length}</span>
              </button>
              {COMPETITION_STAGES.map((s, i) => (
                <div key={s.value} className="flex items-center gap-2">
                  <button
                    onClick={() => setStage(s.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all btn-click ${stage === s.value ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}
                  >
                    {s.label} <span className="mono opacity-60 ml-1">{stageCount(s.value)}</span>
                  </button>
                  {i < COMPETITION_STAGES.length - 1 && <span className="text-nexus-muted/50 text-xs">→</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Fixture builder — role gated */}
          {roleLoading ? null : canBuild ? (
            <InterSchoolFixturesBuilder />
          ) : (
            <div className="hairline rounded-xl p-5 bg-nexus-surface/30">
              <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted font-semibold">Fixture Generation</p>
              <h2 className="display-font text-base font-bold mt-1">Restricted to authorized officials</h2>
              <p className="text-xs text-nexus-muted mt-2">
                Generating inter-school fixtures is limited to school coordinators, coaches, HICs, federation officials,
                and zonal/district/provincial/national administrators. Browse competitions below, or
                {" "}<Link to="/register" className="underline hover:text-foreground">request an official role</Link>.
              </p>
            </div>
          )}

          <div className="hairline rounded-xl p-5 bg-background card-shadow">
            <h2 className="display-font text-base font-bold mb-3">
              {stage === "all" ? "Active School Competitions" : `${COMPETITION_STAGES.find(s => s.value === stage)?.label} Competitions`}
            </h2>
            {filtered.length === 0 ? (
              <p className="text-xs text-nexus-muted">No competitions at this stage yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filtered.map((c: any) => (
                  <Link key={c.id} to={`/competition/${c.id}`} className="hairline rounded-lg p-3 bg-nexus-surface/40 hover:bg-nexus-surface block">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{c.name}</p>
                      {c.stage && (
                        <span className="text-[9px] mono uppercase tracking-wider px-1.5 py-0.5 rounded hairline shrink-0">
                          {COMPETITION_STAGES.find(s => s.value === c.stage)?.short}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-nexus-muted mt-0.5">{c.discipline} · {c.age_group || "Open"} · {c.term || "—"} · {c.status}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <NexusFooter />
    </div>
  );
}

function SearchColumn({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const arr = Array.isArray(children) ? children : [children];
  const has = arr.filter(Boolean).length > 0;
  return (
    <div>
      <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted font-semibold mb-2">{title}</p>
      <div className="space-y-1.5">
        {has ? children : <p className="text-xs text-nexus-muted">{empty}</p>}
      </div>
    </div>
  );
}
