import { useEffect, useState } from "react";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { ScholasticIntegrationBanner } from "@/components/ScholasticBadge";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { tierLabel, SCHOOL_TIERS } from "@/lib/schools";

const PROVINCES = ["All","Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"];

export default function SchoolsPage() {
  const [tier, setTier] = useState<string>("all");
  const [province, setProvince] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => { document.title = "Schools — Nexus for Schools"; }, []);

  const { data: schools = [], isLoading } = useQuery({
    queryKey: ["all-schools"],
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("*").eq("is_active", true).order("name").limit(1000);
      return data || [];
    },
  });

  const filtered = schools.filter((s) => {
    if (tier !== "all" && s.level !== tier) return false;
    if (province !== "All" && s.province !== province) return false;
    if (search && !((s.school_name || s.name)?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />
      <main className="pt-16 sm:pt-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
          <ScholasticIntegrationBanner />

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-[10px] sm:text-xs mono tracking-[0.25em] uppercase text-nexus-muted">Directory</p>
              <h1 className="display-font text-2xl sm:text-3xl font-bold tracking-tight mt-1">Schools on Nexus</h1>
              <p className="text-xs sm:text-sm text-nexus-muted mt-1">{filtered.length} of {schools.length} schools — all verified by Scholastic Services.</p>
            </div>
          </div>

          {/* Filters */}
          <div className="hairline rounded-xl p-4 bg-background flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <p className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold mb-1.5">Search</p>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="School name…" className="bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-foreground/20" />
            </div>
            <div className="md:w-48">
              <p className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold mb-1.5">Tier</p>
              <select value={tier} onChange={(e) => setTier(e.target.value)} className="bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm w-full cursor-pointer">
                {SCHOOL_TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="md:w-56">
              <p className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold mb-1.5">Province</p>
              <select value={province} onChange={(e) => setProvince(e.target.value)} className="bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm w-full cursor-pointer">
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm mono text-nexus-muted text-center py-8">Loading schools…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm mono text-nexus-muted text-center py-8">No schools match your filters.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {filtered.map((s) => (
                <Link key={s.id} to={`/schools/${s.id}`} className="hairline rounded-xl p-4 bg-background hover:bg-nexus-surface transition-colors flex flex-col gap-2">
                  <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center p-1 hairline">
                    {s.logo_url ? <img src={s.logo_url} alt={s.name} className="w-full h-full object-contain" /> : <span className="text-sm font-bold">{s.name.charAt(0)}</span>}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold line-clamp-2 leading-tight">{s.school_name || s.name}</p>
                  <p className="text-[10px] mono uppercase tracking-wider text-nexus-muted">{tierLabel(s.level)}</p>
                  <p className="text-[10px] text-nexus-muted">{s.province}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <NexusFooter />
    </div>
  );
}
