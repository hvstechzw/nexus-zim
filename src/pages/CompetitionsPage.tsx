import { useState } from "react";
import { motion } from "framer-motion";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const DISCIPLINES = ["Football","Rugby","Cricket","Athletics","Swimming","Basketball","Volleyball","Tennis","Chess","Debate","Quiz","Netball","Hockey","Boxing","Judo","Cycling"];
const LEVELS = ["primary_school","secondary_school","club_academy","provincial","national_league","national_cup"];

export default function CompetitionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterDiscipline, setFilterDiscipline] = useState("all");

  const { data: competitions, isLoading } = useQuery({
    queryKey: ["competitions-page", filterLevel, filterDiscipline],
    queryFn: async () => {
      let query = supabase.from("competitions").select("*").order("created_at", { ascending: false });
      if (filterLevel !== "all") query = query.eq("level", filterLevel);
      if (filterDiscipline !== "all") query = query.eq("discipline", filterDiscipline);
      const { data } = await query;
      return data || [];
    },
  });

  const filtered = (competitions || []).filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.discipline.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const STATUS_STYLES: Record<string, string> = {
    draft: "bg-nexus-surface text-nexus-muted",
    registration_open: "bg-foreground text-primary-foreground",
    registration_closed: "bg-nexus-surface text-nexus-muted",
    ongoing: "bg-nexus-live text-primary-foreground",
    completed: "bg-nexus-surface text-nexus-muted",
    cancelled: "bg-nexus-surface text-nexus-muted",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />
      <div className="max-w-[1400px] mx-auto pt-20">
        {/* Header */}
        <div className="px-8 py-10 hairline-b">
          <p className="text-[10px] mono tracking-[0.25em] uppercase text-nexus-muted">Platform</p>
          <h1 className="display-font text-display-lg font-bold text-foreground mt-1">Competitions</h1>
          <p className="text-sm text-nexus-muted mt-2 max-w-[55ch]">All active, upcoming, and archived competitions across every discipline and level in Zimbabwe.</p>
        </div>

        {/* Filters */}
        <div className="px-8 py-5 hairline-b flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search competitions…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-nexus-surface hairline rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all w-64"
          />
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="bg-nexus-surface hairline rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Levels</option>
            {LEVELS.map(l => <option key={l} value={l}>{l.replace(/_/g," ")}</option>)}
          </select>
          <select
            value={filterDiscipline}
            onChange={e => setFilterDiscipline(e.target.value)}
            className="bg-nexus-surface hairline rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Disciplines</option>
            {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <span className="text-xs mono text-nexus-muted ml-auto">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6 md:p-8">
          {isLoading && Array.from({length: 6}).map((_, i) => (
            <div key={i} className="hairline rounded-xl p-6 animate-pulse">
              <div className="h-3 bg-nexus-surface rounded w-1/3 mb-3" />
              <div className="h-5 bg-nexus-surface rounded w-3/4 mb-2" />
              <div className="h-3 bg-nexus-surface rounded w-1/2" />
            </div>
          ))}

          {!isLoading && filtered.map((comp, i) => (
            <motion.div
              key={comp.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="hairline rounded-xl p-6 flex flex-col gap-4 hover:bg-nexus-surface/50 transition-colors cursor-pointer card-shadow bg-background"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-2.5 py-1 rounded-full">{comp.discipline}</span>
                  <span className="text-[10px] mono tracking-widest uppercase text-nexus-muted/70 bg-nexus-surface px-2.5 py-1 rounded-full">{comp.level?.replace(/_/g," ")}</span>
                </div>
                <span className={`text-[10px] mono tracking-widest uppercase px-2.5 py-1 rounded-full ${STATUS_STYLES[comp.status || "draft"] || "bg-nexus-surface text-nexus-muted"}`}>
                  {comp.status?.replace(/_/g," ")}
                </span>
              </div>

              <h3 className="display-font text-sm font-semibold text-foreground leading-snug">{comp.name}</h3>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] mono text-nexus-muted hairline px-2 py-1 rounded-md">{comp.format?.replace(/_/g," ")}</span>
                {comp.season && <span className="text-[11px] mono text-nexus-muted hairline px-2 py-1 rounded-md">{comp.season}</span>}
                {comp.province && <span className="text-[11px] mono text-nexus-muted hairline px-2 py-1 rounded-md">{comp.province}</span>}
              </div>

              {comp.description && (
                <p className="text-xs text-nexus-muted leading-relaxed line-clamp-2">{comp.description}</p>
              )}

              <div className="pt-3 hairline-t flex items-center justify-between">
                {comp.start_date && (
                  <span className="text-xs mono text-nexus-muted">
                    {new Date(comp.start_date).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
                {comp.prize_pool && comp.prize_pool > 0 && (
                  <span className="text-xs mono text-foreground font-semibold">Prize: ${comp.prize_pool.toLocaleString()}</span>
                )}
              </div>
            </motion.div>
          ))}

          {!isLoading && filtered.length === 0 && (
            <div className="col-span-3 py-20 text-center">
              <p className="text-nexus-muted mono text-sm">No competitions found matching your filters.</p>
              <p className="text-nexus-muted mono text-xs mt-2">Try creating one from the Admin Dashboard.</p>
            </div>
          )}
        </div>
      </div>
      <NexusFooter />
    </div>
  );
}
