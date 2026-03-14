import { useState } from "react";
import { motion } from "framer-motion";

const LEVELS = [
  { id: "primary", label: "Primary Schools", count: 1840 },
  { id: "secondary", label: "Secondary Schools", count: 924 },
  { id: "club", label: "Club / Academy", count: 613 },
  { id: "provincial", label: "Provincial", count: 210 },
  { id: "national", label: "National League", count: 48 },
  { id: "cups", label: "Cups & Knockouts", count: 72 },
];

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
  const [activeLevel, setActiveLevel] = useState("national");
  const [activeSport, setActiveSport] = useState("All");

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
      {/* Section label */}
      <div className="px-8 py-4 hairline-b">
        <p className="text-xs mono tracking-[0.2em] uppercase text-nexus-muted">Filter by Level & Discipline</p>
      </div>

      {/* Level ruler */}
      <div className="overflow-x-auto hairline-b">
        <div className="flex min-w-max">
          {LEVELS.map((level, i) => (
            <button
              key={level.id}
              onClick={() => handleLevel(level.id)}
              className={`relative px-8 py-5 flex flex-col items-start gap-1 transition-colors duration-200 btn-click
                ${i < LEVELS.length - 1 ? "hairline-r" : ""}
                ${activeLevel === level.id ? "bg-foreground" : "bg-background hover:bg-nexus-surface"}`}
            >
              <span
                className={`text-xs tracking-[0.15em] uppercase font-medium transition-colors duration-200
                  ${activeLevel === level.id ? "text-primary-foreground" : "text-nexus-muted"}`}
              >
                {level.label}
              </span>
              <span
                className={`mono text-lg font-semibold transition-colors duration-200
                  ${activeLevel === level.id ? "text-primary-foreground" : "text-foreground"}`}
              >
                {level.count.toLocaleString()}
              </span>
              {activeLevel === level.id && (
                <motion.div
                  layoutId="level-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-nexus-live"
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sport filter strip */}
      <div className="overflow-x-auto">
        <div className="flex min-w-max px-2 py-3 gap-0">
          {SPORTS.map((sport) => (
            <button
              key={sport}
              onClick={() => handleSport(sport)}
              className={`px-5 py-2 text-xs tracking-[0.12em] uppercase font-medium transition-all duration-200 btn-click mx-1
                ${activeSport === sport
                  ? "bg-foreground text-primary-foreground"
                  : "bg-transparent text-nexus-muted hover:text-foreground hairline"
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
