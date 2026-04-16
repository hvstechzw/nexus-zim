import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SCHOOL_TIERS, ALL_DISCIPLINES } from "@/lib/schools";

interface Props {
  onTierChange?: (tier: string) => void;
  onSportChange?: (sport: string) => void;
}

const TOP_SPORTS = ["All", "Football", "Rugby", "Cricket", "Athletics", "Swimming", "Netball", "Hockey", "Basketball", "Volleyball", "Tennis", "Chess", "Debate", "Quiz", "Spelling Bee", "Maths Olympiad"];

export function SchoolTierSwitcher({ onTierChange, onSportChange }: Props) {
  const [tier, setTier] = useState("all");
  const [sport, setSport] = useState("All");
  const [showAllSports, setShowAllSports] = useState(false);

  const { data: counts = {} } = useQuery({
    queryKey: ["school-tier-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("level").eq("is_active", true);
      if (!data) return {};
      const c: Record<string, number> = { all: data.length };
      data.forEach((r) => { if (r.level) c[r.level] = (c[r.level] || 0) + 1; });
      return c;
    },
    refetchInterval: 60000,
  });

  const sportsList = showAllSports ? ["All", ...ALL_DISCIPLINES] : TOP_SPORTS;

  return (
    <div className="hairline-b">
      <div className="px-4 sm:px-8 py-3 sm:py-4 hairline-b flex items-center justify-between">
        <p className="text-[10px] sm:text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">Filter by School Tier & Discipline</p>
        <span className="text-[9px] sm:text-[10px] mono text-nexus-muted hairline px-2 py-0.5 rounded-full">Schools-only · Scholastic verified</span>
      </div>

      <div className="overflow-x-auto hairline-b scrollbar-hide">
        <div className="flex min-w-max px-3 sm:px-5 py-3 sm:py-4 gap-1.5 sm:gap-2">
          {SCHOOL_TIERS.map((t) => {
            const count = counts[t.value] ?? (t.value === "all" ? counts.all ?? 0 : 0);
            const active = tier === t.value;
            return (
              <button
                key={t.value}
                onClick={() => { setTier(t.value); onTierChange?.(t.value); }}
                className={`relative px-4 sm:px-6 py-2 sm:py-3 flex flex-col items-start gap-0.5 rounded-xl transition-all duration-200 btn-click
                  ${active ? "bg-foreground shadow-sm" : "bg-nexus-surface hover:bg-nexus-silver/60"}`}
              >
                <span className={`text-[9px] sm:text-[10px] tracking-[0.12em] uppercase font-medium ${active ? "text-primary-foreground/70" : "text-nexus-muted"}`}>
                  {t.label}
                </span>
                <span className={`mono text-sm sm:text-base font-bold ${active ? "text-primary-foreground" : "text-foreground"}`}>
                  {count > 0 ? count.toLocaleString() : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex min-w-max px-3 sm:px-5 py-2.5 sm:py-3 gap-1 sm:gap-1.5 items-center">
          {sportsList.map((s) => (
            <button
              key={s}
              onClick={() => { setSport(s); onSportChange?.(s); }}
              className={`px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs tracking-wide font-medium rounded-full transition-all duration-200 btn-click
                ${sport === s ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted hover:text-foreground hover:bg-nexus-silver/50"}`}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => setShowAllSports((v) => !v)}
            className="px-3 py-1 text-[11px] mono text-nexus-muted hover:text-foreground transition-colors"
          >
            {showAllSports ? "Show less" : `+${ALL_DISCIPLINES.length - TOP_SPORTS.length + 1} more`}
          </button>
        </div>
      </div>
    </div>
  );
}
