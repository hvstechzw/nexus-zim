import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SCHOOL_TERMS, COMPETITION_STAGES, type CompetitionStage } from "@/lib/schools";
import { AgeGroupFilter } from "@/components/AgeGroupFilter";

// All 15 sports NASH/NAPH sanctions — the generator is sport-agnostic, it
// just needs a discipline string to filter school_teams by.
const NEXUS_DISCIPLINES = [
  "Handball", "Netball", "Football", "Basketball", "Volleyball", "Cricket",
  "Rugby", "Hockey", "Tennis", "Table Tennis", "Badminton", "Athletics",
  "Swimming", "Cross Country", "Chess",
] as const;

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

/**
 * NASH/NAPH fixture wizard: set discipline + age group and the draw builds
 * itself from every published school_teams row that matches — no manual
 * school/team picking step.
 */
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
  const [busy, setBusy] = useState(false);

  // Every published school team matching discipline + age group — the draw
  // auto-builds from this set, no manual selection.
  const { data: schoolTeams = [], isLoading } = useQuery({
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

  const generate = async () => {
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    if (!name.trim()) { toast({ title: "Name your competition", variant: "destructive" }); return; }
    const teamIds = schoolTeams.map((t: any) => t.id);
    if (teamIds.length < 2) { toast({ title: `Need at least 2 published ${discipline} ${ageGroup} teams`, variant: "destructive" }); return; }
    setBusy(true);
    try {
      const schoolByTeam = new Map(schoolTeams.map((t: any) => [t.id, t.school_id]));

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
        const numPools = Math.max(1, Math.ceil(teamIds.length / poolSize));
        const pools: string[][] = Array.from({ length: numPools }, () => []);
        teamIds.forEach((id, i) => pools[i % numPools].push(id));
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
        const pairs = format === "round_robin" ? roundRobin(teamIds) : knockout(teamIds);
        const half = Math.max(1, Math.floor(teamIds.length / 2));
        fixtures = pairs.map((p, i) => pairToFixture(p, {
          round_number: format === "single_elimination" ? 1 : Math.floor(i / half) + 1,
          round_label: format === "single_elimination" ? "Round 1" : `Round ${Math.floor(i / half) + 1}`,
        }));
      }

      const { error: fErr } = await supabase.from("fixtures").insert(fixtures);
      if (fErr) throw fErr;

      toast({ title: "Bracket generated", description: `${comp.name} · ${fixtures.length} fixtures` });
      qc.invalidateQueries();
      setName("");
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hairline rounded-xl p-5 sm:p-6 bg-card card-shadow flex flex-col gap-5">
      <div>
        <p className="display-font text-base sm:text-lg font-bold text-foreground">NASH / NAPH Fixture Wizard</p>
        <p className="text-xs text-nexus-muted mt-0.5">Set discipline + age group — the draw auto-builds from every published team.</p>
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

      <div className="hairline rounded-lg p-4 bg-nexus-surface/40">
        {isLoading ? (
          <p className="text-xs text-nexus-muted">Checking published teams…</p>
        ) : schoolTeams.length === 0 ? (
          <div className="text-center space-y-1">
            <p className="text-xs text-nexus-muted">No published {discipline} teams for {ageGroup} yet.</p>
            <p className="text-[11px] text-nexus-muted">Schools publish their team sheet from the Coach Dashboard — once at least 2 teams are published for this discipline/age group, the draw builds automatically.</p>
            <Link to="/admin/teams" className="text-xs font-semibold underline underline-offset-2 hover:opacity-70">
              Open team registry →
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className={labelCls}>{schoolTeams.length} published {discipline} · {ageGroup} teams found</p>
            <div className="flex -space-x-1">
              {schoolTeams.slice(0, 6).map((t: any) => (
                <span key={t.id} title={t.school?.school_name || t.school?.name} className="w-6 h-6 rounded-full bg-background hairline flex items-center justify-center text-[9px] font-semibold">
                  {(t.school?.school_name || t.school?.name || "?").charAt(0)}
                </span>
              ))}
              {schoolTeams.length > 6 && <span className="text-[10px] text-nexus-muted ml-2">+{schoolTeams.length - 6} more</span>}
            </div>
          </div>
        )}
      </div>

      <button onClick={generate} disabled={busy || schoolTeams.length < 2} className="h-11 px-6 text-sm font-semibold rounded-xl bg-foreground text-primary-foreground hover:opacity-85 disabled:opacity-50 btn-click">
        {busy ? "Generating…" : `Generate ${format === "round_robin" ? "Round Robin" : format === "pooled" ? "Pooled Draw" : "Knockout"} Draw`}
      </button>
    </div>
  );
}
