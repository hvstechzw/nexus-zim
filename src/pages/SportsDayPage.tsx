import { useEffect, useState } from "react";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { ScholasticIntegrationBanner } from "@/components/ScholasticBadge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AGE_GROUPS } from "@/lib/schools";

const inputCls = "bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-foreground/20";

export default function SportsDayPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedComp, setSelectedComp] = useState<string>("");
  const [eventName, setEventName] = useState("");
  const [eventAge, setEventAge] = useState("U16");
  const [createName, setCreateName] = useState("");

  useEffect(() => { document.title = "Sports Day Console — Nexus"; }, []);

  const { data: sportsDays = [] } = useQuery({
    queryKey: ["sports-days"],
    queryFn: async () => {
      const { data } = await supabase.from("competitions").select("id, name, discipline, status, start_date").eq("is_sports_day", true).order("start_date", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["sports-day-events", selectedComp],
    queryFn: async () => {
      if (!selectedComp) return [];
      const { data } = await supabase.from("fixtures").select("*").eq("competition_id", selectedComp).order("round_number");
      return data || [];
    },
    enabled: !!selectedComp,
    refetchInterval: 5000,
  });

  const { data: standings = [] } = useQuery({
    queryKey: ["sports-day-standings", selectedComp],
    queryFn: async () => {
      if (!selectedComp) return [];
      const { data } = await supabase.from("standings").select("*, team:teams(name, school_name)").eq("competition_id", selectedComp).order("points", { ascending: false }).limit(50);
      return data || [];
    },
    enabled: !!selectedComp,
    refetchInterval: 5000,
  });

  const createSportsDay = async () => {
    if (!user || !createName.trim()) return;
    const { error } = await supabase.from("competitions").insert({
      name: createName.trim(),
      discipline: "Athletics",
      level: "secondary_school",
      format: "custom_heats",
      status: "ongoing",
      season: new Date().getFullYear().toString(),
      is_sports_day: true,
      start_date: new Date().toISOString().slice(0, 10),
      created_by: user.id,
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Sports Day created" }); setCreateName(""); qc.invalidateQueries({ queryKey: ["sports-days"] }); }
  };

  const addEvent = async () => {
    if (!selectedComp || !eventName.trim()) return;
    const { error } = await supabase.from("fixtures").insert({
      competition_id: selectedComp,
      round_label: `${eventName} · ${eventAge}`,
      round_number: events.length + 1,
      status: "scheduled",
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { setEventName(""); qc.invalidateQueries({ queryKey: ["sports-day-events", selectedComp] }); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />
      <main className="pt-16 sm:pt-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
          <ScholasticIntegrationBanner />
          <div>
            <p className="text-[10px] sm:text-xs mono tracking-[0.25em] uppercase text-nexus-muted">Sports Day</p>
            <h1 className="display-font text-2xl sm:text-3xl font-bold mt-1 tracking-tight">Sports Day Console</h1>
            <p className="text-xs sm:text-sm text-nexus-muted mt-1">One-day, multi-event meets with live points table per school.</p>
          </div>

          {/* Create */}
          <div className="hairline rounded-xl p-5 bg-background card-shadow flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <p className="text-[10px] mono uppercase tracking-wider text-nexus-muted font-semibold mb-1.5">New Sports Day</p>
              <input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="St. Mary's Annual Sports Day 2026" className={inputCls} />
            </div>
            <button onClick={createSportsDay} disabled={!createName.trim()} className="h-11 px-5 text-sm font-semibold rounded-xl bg-foreground text-primary-foreground hover:opacity-85 disabled:opacity-50 btn-click">Create</button>
          </div>

          {/* Selector */}
          <div className="hairline rounded-xl p-4 bg-background flex flex-col sm:flex-row gap-3 sm:items-center">
            <p className="text-[10px] mono uppercase tracking-wider text-nexus-muted font-semibold">Active Sports Day:</p>
            <select value={selectedComp} onChange={(e) => setSelectedComp(e.target.value)} className={inputCls + " sm:max-w-md"}>
              <option value="">— Select —</option>
              {sportsDays.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {selectedComp && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Event queue */}
              <div className="hairline rounded-xl p-5 bg-background card-shadow">
                <h2 className="display-font text-base font-bold mb-3">Event Queue</h2>
                <div className="flex gap-2 mb-3">
                  <input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="100m Sprint" className={inputCls} />
                  <select value={eventAge} onChange={(e) => setEventAge(e.target.value)} className={inputCls + " w-28"}>
                    {AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
                  </select>
                  <button onClick={addEvent} className="h-10 px-4 text-xs font-semibold rounded-lg bg-foreground text-primary-foreground hover:opacity-85">Add</button>
                </div>
                {events.length === 0 ? (
                  <p className="text-xs text-nexus-muted">No events queued.</p>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto">
                    {events.map((e: any, i: number) => (
                      <div key={e.id} className="flex items-center justify-between hairline rounded-lg px-3 py-2 bg-nexus-surface/40">
                        <span className="text-sm font-medium">#{i + 1} · {e.round_label}</span>
                        <span className="text-[10px] mono uppercase text-nexus-muted">{e.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Live points table */}
              <div className="hairline rounded-xl p-5 bg-background card-shadow">
                <h2 className="display-font text-base font-bold mb-3">Live Points (per school)</h2>
                {standings.length === 0 ? (
                  <p className="text-xs text-nexus-muted">No points yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-[10px] mono uppercase text-nexus-muted">
                      <tr><th className="text-left py-1">#</th><th className="text-left py-1">School</th><th className="text-right py-1">Pts</th></tr>
                    </thead>
                    <tbody>
                      {standings.map((s: any, i: number) => (
                        <tr key={s.id} className="hairline-b last:border-0">
                          <td className="py-2 mono">{i + 1}</td>
                          <td className="py-2">{s.team?.school_name || s.team?.name || "—"}</td>
                          <td className="py-2 text-right score-display">{s.points || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <NexusFooter />
    </div>
  );
}
