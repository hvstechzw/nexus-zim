import { useEffect, useState } from "react";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { InterSchoolFixturesBuilder } from "@/components/InterSchoolFixturesBuilder";
import { ScholasticIntegrationBanner } from "@/components/ScholasticBadge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { COMPETITION_STAGES, type CompetitionStage } from "@/lib/schools";

export default function InterSchoolPage() {
  useEffect(() => { document.title = "Inter-School Fixtures — Nexus"; }, []);
  const [stage, setStage] = useState<CompetitionStage | "all">("all");

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
            <p className="text-xs sm:text-sm text-nexus-muted mt-1">Build the pathway: Zonal/Cluster → District → Provincial → National.</p>
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

          <InterSchoolFixturesBuilder />

          <div className="hairline rounded-xl p-5 bg-background card-shadow">
            <p className="display-font text-base font-bold mb-3">
              {stage === "all" ? "Active School Competitions" : `${COMPETITION_STAGES.find(s => s.value === stage)?.label} Competitions`}
            </p>
            {filtered.length === 0 ? (
              <p className="text-xs text-nexus-muted">No competitions at this stage yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filtered.map((c: any) => (
                  <div key={c.id} className="hairline rounded-lg p-3 bg-nexus-surface/40">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{c.name}</p>
                      {c.stage && (
                        <span className="text-[9px] mono uppercase tracking-wider px-1.5 py-0.5 rounded hairline shrink-0">
                          {COMPETITION_STAGES.find(s => s.value === c.stage)?.short}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-nexus-muted mt-0.5">{c.discipline} · {c.age_group || "Open"} · {c.term || "—"} · {c.status}</p>
                  </div>
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
