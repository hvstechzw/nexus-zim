import type { ReactNode } from "react";
import { Link } from "react-router-dom";

// Theme-aware Nexus brand system. The supplied PNG logos are single-colour on
// transparent (one needs a light bg, the other a dark bg), so they can't sit on
// a translucent header or adapt to dark mode without hacks. This markup wordmark
// reads crisply at any size and inverts automatically with the theme. The small
// accent square nods to the pixel-"N" motif in the full logo.

export function BrandGlyph({ className = "w-8 h-8 text-[15px] rounded-lg" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center bg-foreground text-background font-bold display-font tracking-tighter flex-shrink-0 ${className}`}
      aria-hidden
    >
      N
      <span className="absolute top-[15%] right-[15%] w-[14%] h-[14%] bg-background/70 rounded-[1px]" />
    </span>
  );
}

export function BrandLockup({
  to,
  onClick,
  subtitle = "Inter-School Sports",
  glyphClass,
  wordClass = "text-[15px]",
  className = "",
}: {
  to?: string;
  onClick?: () => void;
  subtitle?: ReactNode;
  glyphClass?: string;
  wordClass?: string;
  className?: string;
}) {
  const inner = (
    <>
      <BrandGlyph className={glyphClass} />
      <span className="flex flex-col leading-none min-w-0">
        <span className={`display-font font-bold tracking-tight text-foreground ${wordClass}`}>Nexus</span>
        {subtitle && (
          <span className="text-[8px] sm:text-[9px] mono tracking-[0.16em] uppercase text-nexus-muted mt-1 truncate">
            {subtitle}
          </span>
        )}
      </span>
    </>
  );

  const cls = `flex items-center gap-2.5 ${className}`;
  return to ? (
    <Link to={to} onClick={onClick} className={cls} aria-label="Nexus school sports network — home">
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
