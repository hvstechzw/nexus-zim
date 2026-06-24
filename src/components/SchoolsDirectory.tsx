import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ScholasticBadge } from "@/components/ScholasticBadge";
import { tierLabel } from "@/lib/schools";
import { isNexusDiscipline, matchesNexusSports } from "@/lib/nexusSports";

export function SchoolsDirectory() {
  const { data: schools = [], isLoading } = useQuery({
    queryKey: ["schools-directory"],
    queryFn: async () => {
      const { data } = await supabase
        .from("teams")
        .select("id, name, school_name, province, level, logo_url, discipline, sports_offered")
        .eq("is_active", true)
        .order("name")
        .limit(200);
      // Only schools fielding handball or netball (or general schools with no sport tag)
      return (data || []).filter((s: any) => {
        if (!s.discipline && !s.sports_offered) return true;
        return isNexusDiscipline(s.discipline) || matchesNexusSports(s.sports_offered);
      }).slice(0, 48);
    },
  });


  return (
    <section id="schools" className="hairline-b bg-background">
      <div className="px-4 sm:px-8 py-6 sm:py-8 hairline-b flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] sm:text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">Schools Directory</p>
          <h2 className="display-font text-xl sm:text-2xl font-bold text-foreground mt-1">Verified Schools on Nexus</h2>
        </div>
        <div className="flex items-center gap-3">
          <ScholasticBadge size="sm" />
          <Link to="/schools" className="hidden sm:flex items-center h-8 px-3 text-[11px] font-semibold tracking-wide bg-foreground text-primary-foreground rounded-lg hover:opacity-85 transition-opacity">
            View All
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-sm mono text-nexus-muted text-center">Loading schools…</div>
      ) : schools.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm mono text-nexus-muted">No schools synced yet.</p>
          <p className="text-xs text-nexus-muted mt-2">Schools are pulled exclusively from <a href="https://scholasticservices.online" target="_blank" rel="noopener noreferrer" className="text-foreground hover:opacity-70 underline">Scholastic Services</a>.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {schools.map((s, i) => (
            <Link
              key={s.id}
              to={`/schools/${s.id}`}
              className={`p-4 sm:p-5 flex flex-col gap-2 hover:bg-nexus-surface transition-colors ${(i + 1) % 2 !== 0 ? "hairline-r sm:hairline-r" : ""} ${i < schools.length - (schools.length % 6 || 6) ? "hairline-b" : ""}`}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white flex items-center justify-center p-1 hairline">
                {s.logo_url ? (
                  <img src={s.logo_url} alt={s.name} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-sm font-bold text-foreground">{s.name.charAt(0)}</span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 leading-tight">{s.school_name || s.name}</p>
              <p className="text-[10px] mono uppercase tracking-wider text-nexus-muted">{tierLabel(s.level)}</p>
              <p className="text-[10px] text-nexus-muted">{s.province}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
