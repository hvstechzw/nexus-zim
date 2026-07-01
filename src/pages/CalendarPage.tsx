import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NashHeader } from "@/components/nash/NashHeader";
import { CompetitionCard, type Competition } from "@/components/nash/CompetitionCard";
import { SportSelector } from "@/components/nash/SportSelector";
import { ProvinceSelector } from "@/components/nash/ProvinceSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalIcon } from "lucide-react";

export default function CalendarPage() {
  const [comps, setComps] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState("");
  const [province, setProvince] = useState("");
  const [tier, setTier] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await (supabase as any)
        .from("competitions")
        .select("id,name,discipline,province,tier,age_group,gender,start_date,end_date,host_school_name,total_entries,status,is_nash_sanctioned")
        .order("start_date", { ascending: true })
        .limit(500);
      if (!cancelled) setComps((data || []) as Competition[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => comps.filter((c) =>
    (!sport || c.discipline?.toUpperCase().startsWith(sport)) &&
    (!province || c.province === province) &&
    (!tier || c.tier === tier)
  ), [comps, sport, province, tier]);

  // Group by month
  const groups = useMemo(() => {
    const m = new Map<string, Competition[]>();
    filtered.forEach((c) => {
      const key = c.start_date ? new Date(c.start_date).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "Unscheduled";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(c);
    });
    return Array.from(m.entries());
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div>
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Public · Calendar</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Competition Calendar</h1>
          <p className="text-xs text-muted-foreground mt-0.5">All NASH/NAPH competitions across all provinces, levels and sports.</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><CalIcon className="h-4 w-4 text-accent" /> Filters</CardTitle>
              <div className="flex-1" />
              <SportSelector value={sport} onChange={setSport} allOption className="h-9 w-48" />
              <ProvinceSelector value={province} onChange={setProvince} allOption className="h-9 w-48" />
              <Select value={tier || "__all__"} onValueChange={(v) => setTier(v === "__all__" ? "" : v)}>
                <SelectTrigger className="h-9 w-40"><SelectValue placeholder="All Tiers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Tiers</SelectItem>
                  <SelectItem value="zonal">Zonal</SelectItem>
                  <SelectItem value="district">District</SelectItem>
                  <SelectItem value="provincial">Provincial</SelectItem>
                  <SelectItem value="national">National</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {loading && <p className="text-xs text-muted-foreground text-center py-8">Loading…</p>}
        {!loading && filtered.length === 0 && (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No competitions match the current filters.</CardContent></Card>
        )}

        {groups.map(([month, items]) => (
          <div key={month} className="space-y-3">
            <h2 className="text-sm font-display tracking-[0.15em] uppercase text-accent border-b border-border pb-1">{month}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((c) => <CompetitionCard key={c.id} comp={c} />)}
            </div>
          </div>
        ))}

        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}
