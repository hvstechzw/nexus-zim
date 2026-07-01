import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NashHeader } from "@/components/nash/NashHeader";
import { CompetitionCard, type Competition } from "@/components/nash/CompetitionCard";
import { SportSelector } from "@/components/nash/SportSelector";
import { ProvinceSelector } from "@/components/nash/ProvinceSelector";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";

export default function ResultsPage() {
  const [comps, setComps] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState("");
  const [province, setProvince] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let q = (supabase as any).from("competitions")
        .select("id,name,discipline,province,tier,age_group,gender,start_date,end_date,host_school_name,total_entries,status,is_nash_sanctioned")
        .in("status", ["completed", "final"])
        .order("end_date", { ascending: false }).limit(200);
      if (sport) q = q.ilike("discipline", `%${sport}%`);
      if (province) q = q.eq("province", province);
      const { data } = await q;
      if (!cancelled) setComps((data || []) as Competition[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [sport, province]);

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div>
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Public · Results</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Latest Results</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Completed competitions across every sport and every level.</p>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><Trophy className="h-4 w-4 text-accent" /> Filters</CardTitle>
              <div className="flex-1" />
              <SportSelector value={sport} onChange={setSport} allOption className="h-9 w-48" />
              <ProvinceSelector value={province} onChange={setProvince} allOption className="h-9 w-48" />
            </div>
          </CardHeader>
        </Card>
        {loading && <p className="text-xs text-muted-foreground text-center py-8">Loading…</p>}
        {!loading && comps.length === 0 && (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No completed competitions yet. Results appear here as competitions finish.</CardContent></Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {comps.map((c) => <CompetitionCard key={c.id} comp={c} />)}
        </div>
        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}
