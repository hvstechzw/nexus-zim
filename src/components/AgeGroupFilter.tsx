import { useState } from "react";
import { AGE_GROUPS } from "@/lib/schools";

interface Props {
  value?: string;
  onChange?: (group: string) => void;
  allowCustom?: boolean;
}

export function AgeGroupFilter({ value = "All", onChange, allowCustom = true }: Props) {
  const [custom, setCustom] = useState("");
  const [groups, setGroups] = useState<string[]>([...AGE_GROUPS]);

  const select = (g: string) => onChange?.(g);

  const addCustom = () => {
    const c = custom.trim();
    if (!c) return;
    if (!groups.includes(c)) setGroups([...groups, c]);
    select(c);
    setCustom("");
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold">Age Group</p>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => select("All")}
          className={`px-3 py-1.5 text-[11px] mono font-semibold rounded-full transition-colors ${value === "All" ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}
        >
          All
        </button>
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => select(g)}
            className={`px-3 py-1.5 text-[11px] mono font-semibold rounded-full transition-colors ${value === g ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}
          >
            {g}
          </button>
        ))}
      </div>
      {allowCustom && (
        <div className="flex gap-2 mt-1">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Custom (e.g. U15)"
            className="flex-1 bg-nexus-surface hairline rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-foreground/20"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          />
          <button type="button" onClick={addCustom} className="h-8 px-3 text-[11px] font-semibold rounded-lg bg-nexus-surface hover:bg-nexus-silver transition-colors">
            Add
          </button>
        </div>
      )}
    </div>
  );
}
