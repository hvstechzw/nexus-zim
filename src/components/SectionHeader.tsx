import type { ReactNode } from "react";

// Shared editorial section header: a mono eyebrow, an optional display title,
// and an optional right-hand slot (counts, filters, "view all"). Codifies the
// hierarchy that was previously hand-rolled per section so the homepage and the
// inner pages read with one consistent rhythm.
export function SectionHeader({
  eyebrow,
  title,
  live = false,
  right,
  className = "",
}: {
  eyebrow: string;
  title?: string;
  live?: boolean;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[10px] sm:text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">
          {live && <span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse" />}
          {eyebrow}
        </p>
        {title && (
          <h2 className="display-font text-xl sm:text-2xl font-bold text-foreground mt-1 tracking-tight">{title}</h2>
        )}
      </div>
      {right && <div className="flex items-center gap-3 flex-shrink-0">{right}</div>}
    </div>
  );
}
