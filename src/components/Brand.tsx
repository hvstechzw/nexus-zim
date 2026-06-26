import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import nexusLogo from "@/assets/nexus-logo.png.asset.json";

// Brand uses the official Nexus pixel-N mark on a dark tile so it reads in both themes.

export function BrandGlyph({ className = "w-9 h-9 rounded-lg" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center bg-foreground flex-shrink-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <img src={nexusLogo.url} alt="" className="w-[70%] h-[70%] object-contain" />
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
