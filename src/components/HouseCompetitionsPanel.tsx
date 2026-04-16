import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { HOUSE_DEFAULTS } from "@/lib/schools";

const inputCls = "bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-foreground/20";
const labelCls = "text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold";

export function HouseCompetitionsPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [schoolId, setSchoolId] = useState("");
  const [discipline, setDiscipline] = useState("Athletics");
  const [houses, setHouses] = useState<string[]>(HOUSE_DEFAULTS);
  const [newHouse, setNewHouse] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: schools = [] } = useQuery({
    queryKey: ["house-schools"],
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("id, name, school_name").eq("is_active", true).order("name").limit(500);
      return data || [];
    },
  });

  const addHouse = () => {
    const h = newHouse.trim();
    if (h && !houses.includes(h)) setHouses([...houses, h]);
    setNewHouse("");
  };

  const create = async () => {
    if (!user || !schoolId) { toast({ title: "Pick a school", variant: "destructive" }); return; }
    if (houses.length < 2) { toast({ title: "Need at least 2 houses", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const school = schools.find((s) => s.id === schoolId);
      const { data: comp, error: cErr } = await supabase.from("competitions").insert({
        name: `${school?.school_name || school?.name} — ${discipline} House Competition`,
        discipline,
        level: "primary_school",
        format: "round_robin",
        status: "ongoing",
        season: new Date().getFullYear().toString(),
        is_house_competition: true,
        created_by: user.id,
      }).select().single();
      if (cErr) throw cErr;

      const houseTeams = houses.map((h) => ({
        name: `${school?.school_name || school?.name} — ${h}`,
        short_name: h,
        school_name: school?.school_name || school?.name,
        discipline,
        level: "primary_school" as const,
        is_active: true,
      }));
      const { data: created, error: tErr } = await supabase.from("teams").insert(houseTeams).select();
      if (tErr) throw tErr;

      // Round-robin houses
      const ids = created.map((t) => t.id);
      const fixtures: any[] = [];
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          fixtures.push({ competition_id: comp.id, home_team_id: ids[i], away_team_id: ids[j], status: "scheduled", round_label: "House Round" });
        }
      }
      await supabase.from("fixtures").insert(fixtures);

      toast({ title: "House competition created", description: `${houses.length} houses · ${fixtures.length} fixtures` });
      qc.invalidateQueries();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hairline rounded-xl p-5 sm:p-6 bg-background card-shadow flex flex-col gap-5">
      <div>
        <p className="display-font text-base sm:text-lg font-bold text-foreground">House Competitions</p>
        <p className="text-xs text-nexus-muted mt-0.5">Run an internal competition between school houses (Red/Blue/Green/Yellow…).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>School *</label>
          <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className={inputCls + " cursor-pointer"}>
            <option value="">Choose school</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.school_name || s.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Discipline</label>
          <input value={discipline} onChange={(e) => setDiscipline(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <p className={labelCls + " mb-2"}>Houses</p>
        <div className="flex flex-wrap gap-2">
          {houses.map((h) => (
            <span key={h} className="inline-flex items-center gap-2 px-3 py-1.5 hairline rounded-full text-xs font-semibold bg-nexus-surface">
              {h}
              <button onClick={() => setHouses(houses.filter((x) => x !== h))} className="text-nexus-muted hover:text-foreground">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input value={newHouse} onChange={(e) => setNewHouse(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHouse())} placeholder="Add house (e.g. Purple)" className={inputCls} />
          <button onClick={addHouse} className="h-10 px-4 text-xs font-semibold rounded-lg bg-nexus-surface hover:bg-nexus-silver">Add</button>
        </div>
      </div>

      <button onClick={create} disabled={busy} className="h-11 px-6 text-sm font-semibold rounded-xl bg-foreground text-primary-foreground hover:opacity-85 disabled:opacity-50 btn-click">
        {busy ? "Creating…" : "Create House Competition"}
      </button>
    </div>
  );
}
