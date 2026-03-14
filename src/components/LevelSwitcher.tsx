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
        <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">Filter by Level & Discipline</p>
      </div>

      {/* Level pills */}
      <div className="overflow-x-auto hairline-b">
        <div className="flex min-w-max px-5 py-4 gap-2">
          {LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => handleLevel(level.id)}
              className={`relative px-5 py-3 flex flex-col items-start gap-0.5 rounded-xl transition-all duration-200 btn-click
                ${activeLevel === level.id
                  ? "bg-foreground shadow-sm"
                  : "bg-nexus-surface hover:bg-nexus-silver/60"}`}
            >
              <span
                className={`text-[10px] tracking-[0.12em] uppercase font-medium transition-colors duration-200
                  ${activeLevel === level.id ? "text-primary-foreground/70" : "text-nexus-muted"}`}
              >
                {level.label}
              </span>
              <span
                className={`mono text-base font-bold transition-colors duration-200
                  ${activeLevel === level.id ? "text-primary-foreground" : "text-foreground"}`}
              >
                {level.count.toLocaleString()}
              </span>
            </button>
          ))}
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
