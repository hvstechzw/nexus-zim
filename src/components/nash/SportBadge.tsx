import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Canonical NASH sport metadata (mirrors public.nash_sports.code)
export const NASH_SPORTS = [
  { code: "HB", name: "Handball" }, { code: "NB", name: "Netball" },
  { code: "FB", name: "Football" }, { code: "AT", name: "Athletics" },
  { code: "BK", name: "Basketball" }, { code: "VB", name: "Volleyball" },
  { code: "SW", name: "Swimming" }, { code: "CR", name: "Cricket" },
  { code: "RG", name: "Rugby" }, { code: "HK", name: "Hockey" },
  { code: "TN", name: "Tennis" }, { code: "XC", name: "Cross Country" },
  { code: "TT", name: "Table Tennis" }, { code: "BD", name: "Badminton" },
  { code: "CH", name: "Chess" },
] as const;

export type SportCode = typeof NASH_SPORTS[number]["code"];

const SPORT_BY_CODE = Object.fromEntries(NASH_SPORTS.map((s) => [s.code, s])) as Record<SportCode, { code: SportCode; name: string }>;

export function sportName(code: string): string {
  return SPORT_BY_CODE[code as SportCode]?.name ?? code;
}

export function SportBadge({ code, className }: { code: string; className?: string }) {
  const s = SPORT_BY_CODE[code as SportCode];
  return (
    <Badge variant="outline" className={cn("font-mono text-[10px] tracking-wider", className)}>
      <span className="text-accent mr-1">{code}</span>
      <span>{s?.name ?? code}</span>
    </Badge>
  );
}
