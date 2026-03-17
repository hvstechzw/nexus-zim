import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const LEVEL_MAP: Record<string, string> = {
  all: "All Levels",
  primary_school: "Primary Schools",
  secondary_school: "Secondary Schools",
  club_academy: "Club / Academy",
  provincial: "Provincial",
  national_league: "National League",
  national_cup: "Cups & Knockouts",
  international: "International",
};

const SPORTS = [
  "All", "Football", "Rugby", "Cricket", "Athletics", "Swimming",
  "Basketball", "Volleyball", "Tennis", "Chess", "Debate", "Quiz",
  "Netball", "Hockey", "Boxing", "Judo", "Cycling", "Triathlon",
];

interface LevelSwitcherProps {
  onLevelChange?: (level: string) => void;
  onSportChange?: (sport: string) => void;
}

export function LevelSwitcher({ onLevelChange, onSportChange }: LevelSwitcherProps) {
  const [activeLevel, setActiveLevel] = useState("all");
  const [activeSport, setActiveSport] = useState("All");

  // Fetch live counts from database grouped by level
  const { data: levelCounts = {} } = useQuery({
    queryKey: ["level-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("level")
        .neq("status", "cancelled");
      if (!data) return {};
      const counts: Record<string, number> = { all: data.length };
      data.forEach(row => {
        counts[row.level] = (counts[row.level] || 0) + 1;
      });
      return counts;
    },
    refetchInterval: 30000,
  });

  const LEVELS = Object.keys(LEVEL_MAP);

  const handleLevel = (id: string) => {
    setActiveLevel(id);
    onLevelChange?.(id);
  };

  const handleSport = (sport: string) => {
    setActiveSport(sport);
    onSportChange?.(sport);
  };

  return (
    <div className="hairline-b">
      <div className="px-8 py-4 hairline-b">
        <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">Filter by Level & Discipline</p>
      </div>

      {/* Level pills — live counts */}
      <div className="overflow-x-auto hairline-b">
        <div className="flex min-w-max px-5 py-4 gap-2">
          {LEVELS.map((level) => {
            const count = levelCounts[level] ?? 0;
            const active = activeLevel === level;
            return (
              <button
                key={level}
                onClick={() => handleLevel(level)}
                className={`relative px-5 py-3 flex flex-col items-start gap-0.5 rounded-xl transition-all duration-200 btn-click
                  ${active ? "bg-foreground shadow-sm" : "bg-nexus-surface hover:bg-nexus-silver/60"}`}
              >
                <span className={`text-[10px] tracking-[0.12em] uppercase font-medium transition-colors duration-200 ${active ? "text-primary-foreground/70" : "text-nexus-muted"}`}>
                  {LEVEL_MAP[level]}
                </span>
                <span className={`mono text-base font-bold transition-colors duration-200 ${active ? "text-primary-foreground" : "text-foreground"}`}>
                  {count > 0 ? count.toLocaleString() : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sport filter pills */}
      <div className="overflow-x-auto">
        <div className="flex min-w-max px-5 py-3 gap-1.5">
          {SPORTS.map((sport) => (
            <button
              key={sport}
              onClick={() => handleSport(sport)}
              className={`px-4 py-1.5 text-xs tracking-wide font-medium rounded-full transition-all duration-200 btn-click
                ${activeSport === sport
                  ? "bg-foreground text-primary-foreground"
                  : "bg-nexus-surface text-nexus-muted hover:text-foreground hover:bg-nexus-silver/50"
                }`}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
