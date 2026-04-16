import { useEffect } from "react";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { InterSchoolFixturesBuilder } from "@/components/InterSchoolFixturesBuilder";
import { ScholasticIntegrationBanner } from "@/components/ScholasticBadge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function InterSchoolPage() {
  useEffect(() => { document.title = "Inter-School Fixtures — Nexus"; }, []);

  const { data: comps = [] } = useQuery({
    queryKey: ["inter-school-comps"],
    queryFn: async () => {
      const { data } = await supabase.from("competitions").select("id, name, discipline, age_group, term, status, level").in("level", ["primary_school", "secondary_school", "club_academy"]).order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />
      <main className="pt-16 sm:pt-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
          <ScholasticIntegrationBanner />
          <div>
            <p className="text-[10px] sm:text-xs mono tracking-[0.25em] uppercase text-nexus-muted">Inter-School</p>
            <h1 className="display-font text-2xl sm:text-3xl font-bold mt-1 tracking-tight">Inter-School Fixtures</h1>
            <p className="text-xs sm:text-sm text-nexus-muted mt-1">Build leagues and knockouts between schools, age groups and terms.</p>
          </div>

          <InterSchoolFixturesBuilder />

          <div className="hairline rounded-xl p-5 bg-background card-shadow">
            <p className="display-font text-base font-bold mb-3">Active School Competitions</p>
            {comps.length === 0 ? (
              <p className="text-xs text-nexus-muted">No school competitions yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {comps.map((c) => (
                  <div key={c.id} className="hairline rounded-lg p-3 bg-nexus-surface/40">
                    <p className="text-sm font-semibold">{c.name}</p>
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
