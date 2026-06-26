// Renders a shareable score/highlight card and copies/downloads it.
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShareCard({
  title, subtitle, home, away, homeScore, awayScore, accent = "var(--sport-handball)", footer,
}: {
  title: string;
  subtitle?: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  accent?: string;
  footer?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch { toast.error("Copy failed"); }
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `${home} ${homeScore} — ${awayScore} ${away}`, url: window.location.href });
      } else {
        await copyLink();
      }
    } catch { /* user cancelled */ }
  };

  return (
    <div className="space-y-3">
      <div
        ref={ref}
        className="relative overflow-hidden rounded-2xl border bg-card/70 backdrop-blur p-6"
        style={{ background: `radial-gradient(80% 80% at 50% 0%, ${accent}22, transparent 60%), hsl(var(--card))` }}
      >
        <div className="flex items-center justify-between text-xs uppercase tracking-wider opacity-70">
          <span>Nexus · Scholastic Services</span>
          <span style={{ color: accent }}>FULL TIME</span>
        </div>
        <h3 className="mt-3 text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
        <div className="mt-5 grid grid-cols-3 items-center gap-2">
          <div className="text-right">
            <div className="text-sm truncate">{home}</div>
            <div className="text-5xl font-bold tabular-nums">{homeScore}</div>
          </div>
          <div className="text-center text-xs opacity-50">vs</div>
          <div className="text-left">
            <div className="text-sm truncate">{away}</div>
            <div className="text-5xl font-bold tabular-nums">{awayScore}</div>
          </div>
        </div>
        {footer && <div className="mt-5 text-[10px] opacity-60 text-center">{footer}</div>}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={share}>Share</Button>
        <Button size="sm" variant="outline" onClick={copyLink}>Copy link</Button>
      </div>
    </div>
  );
}
