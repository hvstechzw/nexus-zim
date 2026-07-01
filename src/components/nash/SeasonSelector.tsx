import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export interface NashSeason {
  id: string;
  academic_year: string;
  term: number;
  name: string | null;
  is_current: boolean | null;
  is_active: boolean | null;
  registration_deadline?: string | null;
}

interface Props {
  value?: string;
  onChange?: (id: string, season?: NashSeason) => void;
  className?: string;
  /** Auto-select the current season once seasons load. */
  autoSelectCurrent?: boolean;
}

/**
 * Reads `public.nash_seasons` and renders a season picker. Cached for the
 * page lifetime; falls back gracefully if the table is empty (the seed
 * migration creates Term 3 2026 as the initial current season).
 */
export function SeasonSelector({ value, onChange, className, autoSelectCurrent = true }: Props) {
  const [seasons, setSeasons] = useState<NashSeason[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Cast: nash_seasons isn't in the generated types.ts yet (regen runs in Lovable).
      const { data, error } = await (supabase as any)
        .from("nash_seasons")
        .select("id, academic_year, term, name, is_current, is_active")
        .order("academic_year", { ascending: false })
        .order("term", { ascending: false });
      if (cancelled) return;
      if (error) {
        console.error("SeasonSelector: failed to load nash_seasons", error.message, error);
      } else if (Array.isArray(data)) {
        setSeasons(data as NashSeason[]);
        if (autoSelectCurrent && !value && data.length > 0) {
          const current = (data as NashSeason[]).find((s) => s.is_current) ?? data[0];
          if (current) onChange?.(current.id, current);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Select value={value} onValueChange={(id) => onChange?.(id, seasons.find((s) => s.id === id))} disabled={loading}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={loading ? "Loading seasons…" : seasons.length === 0 ? "No seasons configured" : "Select season"} />
      </SelectTrigger>
      <SelectContent>
        {seasons.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name ?? `${s.academic_year} · Term ${s.term}`}{s.is_current ? " · Current" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
