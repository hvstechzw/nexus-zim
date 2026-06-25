import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SCHOOL_TERMS, COMPETITION_STAGES, type CompetitionStage } from "@/lib/schools";
import { AgeGroupFilter } from "@/components/AgeGroupFilter";

// Nexus is scoped to handball + netball only.
const NEXUS_DISCIPLINES = ["Handball", "Netball"] as const;

const inputCls = "bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all w-full";
const labelCls = "text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold";

function roundRobin(ids: string[]): Array<[string, string]> {
  const list = [...ids];
  if (list.length % 2 === 1) list.push("BYE");
  const n = list.length;
  const rounds: Array<[string, string]> = [];
  for (let r = 0; r < n - 1; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = list[i], b = list[n - 1 - i];
      if (a !== "BYE" && b !== "BYE") rounds.push([a, b]);
    }
    list.splice(1, 0, list.pop()!);
  }
  return rounds;
}

function knockout(ids: string[]): Array<[string, string]> {
  const list = [...ids];
  while ((list.length & (list.length - 1)) !== 0) list.push("BYE");
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < list.length; i += 2) {
    if (list[i] !== "BYE" && list[i + 1] !== "BYE") pairs.push([list[i], list[i + 1]]);
  }
  return pairs;
}

export function InterSchoolFixturesBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [discipline, setDiscipline] = useState<string>("Handball");
  const [ageGroup, setAgeGroup] = useState("U16");
  const [term, setTerm] = useState<string>("Term 1");
  const [stage, setStage] = useState<CompetitionStage>("zonal");
  const [format, setFormat] = useState<"round_robin" | "single_elimination" | "pooled">("round_robin");
  const [poolSize, setPoolSize] = useState<number>(4);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // Pick school teams (e.g. "Marist Handball U16"), filtered to the chosen
  // discipline + age group. Only PUBLISHED teams are eligible for fixtures.
  const { data: schoolTeams = [] } = useQuery({
    queryKey: ["builder-school-teams", discipline, ageGroup],
    queryFn: async () => {
      const { data } = await supabase
        .from("school_teams")
        .select("id, name, school_id, discipline, age_group, gender, school:teams!school_teams_school_id_fkey(id, name, school_name, province)")
        .eq("is_published", true)
        .eq("discipline", discipline)
        .order("name")
        .limit(500);
      return (data || []).filter((t: any) => !ageGroup || !t.age_group || t.age_group === ageGroup);
    },
  });

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const generate = async () => {
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    if (selected.length < 2) { toast({ title: "Pick at least 2 schools", variant: "destructive" }); return; }
    if (!name.trim()) { toast({ title: "Name your competition", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const { data: comp, error: cErr } = await supabase.from("competitions").insert({
        name: name.trim(),
        discipline,
        level: "secondary_school",
        stage,
        format,
        status: "registration_closed",
        season: new Date().getFullYear().toString(),
        age_group: ageGroup,
        term,
        created_by: user.id,
      } as any).select().single();
      if (cErr) throw cErr;

      // selected[] are school_team ids. Look up their parent school for home_team_id/away_team_id.
      const schoolByTeam = new Map(schoolTeams.map((t: any) => [t.id, t.school_id]));

      const pairToFixture = (p: [string, string], extra: Partial<any>) => ({
        competition_id: comp.id,
        home_team_id: schoolByTeam.get(p[0]) || null,
        away_team_id: schoolByTeam.get(p[1]) || null,
        home_school_team_id: p[0],
        away_school_team_id: p[1],
        status: "scheduled" as const,
        ...extra,
      });

      let fixtures: any[] = [];
      if (format === "pooled") {
        const shuffled = [...selected];
        const numPools = Math.max(1, Math.ceil(shuffled.length / poolSize));
        const pools: string[][] = Array.from({ length: numPools }, () => []);
        shuffled.forEach((id, i) => pools[i % numPools].push(id));
        pools.forEach((pool, pi) => {
          const poolPairs = roundRobin(pool);
          const half = Math.max(1, Math.floor(pool.length / 2));
          poolPairs.forEach((p, i) => {
            fixtures.push(pairToFixture(p, {
              round_number: Math.floor(i / half) + 1,
              round_label: `Pool ${String.fromCharCode(65 + pi)} · R${Math.floor(i / half) + 1}`,
            }));
          });
        });
      } else {
        const pairs = format === "round_robin" ? roundRobin(selected) : knockout(selected);
        const half = Math.max(1, Math.floor(selected.length / 2));
        fixtures = pairs.map((p, i) => pairToFixture(p, {
          round_number: format === "single_elimination" ? 1 : Math.floor(i / half) + 1,
          round_label: format === "single_elimination" ? "Round 1" : `Round ${Math.floor(i / half) + 1}`,
        }));
      }

      const { error: fErr } = await supabase.from("fixtures").insert(fixtures);
      if (fErr) throw fErr;

      toast({ title: "Bracket generated", description: `${comp.name} · ${fixtures.length} fixtures` });
      qc.invalidateQueries();
      setSelected([]);
      setName("");
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hairline rounded-xl p-5 sm:p-6 bg-background card-shadow flex flex-col gap-5">
      <div>
        <p className="display-font text-base sm:text-lg font-bold text-foreground">Inter-School Fixtures Builder</p>
        <p className="text-xs text-nexus-muted mt-0.5">Pick schools, set discipline + age group → auto-build the draw.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Competition Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Term 1 Handball League — U16" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Discipline</label>
          <select value={discipline} onChange={(e) => setDiscipline(e.target.value)} className={inputCls + " cursor-pointer"}>
            {NEXUS_DISCIPLINES.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Term</label>
          <select value={term} onChange={(e) => setTerm(e.target.value)} className={inputCls + " cursor-pointer"}>
            {SCHOOL_TERMS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className={labelCls}>Stage *</label>
          <div className="flex flex-wrap gap-2">
            {COMPETITION_STAGES.map((s, i) => (
              <div key={s.value} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStage(s.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all btn-click ${stage === s.value ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}
                >
                  {s.label}
                </button>
                {i < COMPETITION_STAGES.length - 1 && <span className="text-nexus-muted/50 text-xs">→</span>}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-nexus-muted mt-1">Pathway: Zonal/Cluster → District → Provincial → National. Winners progress to the next stage.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value as any)} className={inputCls + " cursor-pointer"}>
            <option value="round_robin">Round Robin (everyone plays everyone)</option>
            <option value="single_elimination">Knockout (single elimination)</option>
            <option value="pooled">Pooled (group stage → playoffs)</option>
          </select>
        </div>
        {format === "pooled" && (
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Teams per Pool</label>
            <select value={poolSize} onChange={(e) => setPoolSize(Number(e.target.value))} className={inputCls + " cursor-pointer"}>
              {[3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} teams</option>)}
            </select>
          </div>
        )}
        <div className="md:col-span-2">
          <AgeGroupFilter value={ageGroup} onChange={setAgeGroup} />
        </div>
      </div>

      <div>
        <p className={labelCls + " mb-2"}>School Teams ({discipline} · {ageGroup}) — Selected: {selected.length}</p>
        <div className="hairline rounded-lg max-h-64 overflow-y-auto">
          {schoolTeams.length === 0 ? (
            <div className="p-5 flex flex-col items-center gap-2 text-center">
              <p className="text-xs text-nexus-muted">No published {discipline} teams for {ageGroup}.</p>
              <p className="text-[11px] text-nexus-muted">Sports directors publish teams from the coach console. Fixtures list real teams (e.g. "Marist Handball U16"), not schools.</p>
              <Link to="/admin/sync" className="text-xs font-semibold underline underline-offset-2 hover:opacity-70">
                Sync schools from Scholastic Services →
              </Link>
            </div>
          ) : (
            schoolTeams.map((t: any, i: number) => (
              <label key={t.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-nexus-surface transition-colors ${i < schoolTeams.length - 1 ? "hairline-b" : ""}`}>
                <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggle(t.id)} className="w-3.5 h-3.5" />
                <span className="text-sm text-foreground flex-1">{t.name} <span className="text-nexus-muted text-xs">· {t.school?.school_name || t.school?.name}</span></span>
                <span className="text-[10px] mono uppercase text-nexus-muted">{t.school?.province}</span>
              </label>
            ))
          )}
        </div>
      </div>


      <button onClick={generate} disabled={busy} className="h-11 px-6 text-sm font-semibold rounded-xl bg-foreground text-primary-foreground hover:opacity-85 disabled:opacity-50 btn-click">
        {busy ? "Generating…" : `Generate ${format === "round_robin" ? "Round Robin" : format === "pooled" ? "Pooled Draw" : "Knockout"} Draw`}
      </button>
    </div>
  );
}
