import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import nexusLogo from "@/assets/nexus-logo.png.asset.json";

// The Nexus pixel-N mark sits on the Aetheris carbon tile so the transparent mark reads on ivory.

export function BrandGlyph({ className = "h-10 w-10 rounded-lg" }: { className?: string }) {
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-primary ${className}`} aria-hidden>
      <img src={nexusLogo.url} alt="" className="h-[70%] w-[70%] object-contain" />
    </span>
  );
}

export function BrandLockup({
  to,
  onClick,
  subtitle = "Inter-School Sports",
  glyphClass,
  wordClass = "text-base",
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
      <span className="flex min-w-0 flex-col leading-tight">
        <span className={`display-font font-bold text-foreground ${wordClass}`}>Nexus</span>
        {subtitle && <span className="truncate text-xs text-supporting">{subtitle}</span>}
      </span>
    </>
  );

  const cls = `flex min-h-11 items-center gap-3 ${className}`;
  return to ? (
    <Link to={to} onClick={onClick} className={cls} aria-label="Nexus home">
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
