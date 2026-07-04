import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SCHOOL_TERMS, COMPETITION_STAGES, type CompetitionStage } from "@/lib/schools";
import { AgeGroupFilter } from "@/components/AgeGroupFilter";

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

export function InterSchoolFixturesBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [mode, setMode] = useState<"competition" | "manual">("competition");
  const [competitionId, setCompetitionId] = useState<string>("");

  const [discipline, setDiscipline] = useState<string>("Handball");
  const [ageGroup, setAgeGroup] = useState("U16");
  const [term, setTerm] = useState<string>("Term 1");
  const [stage, setStage] = useState<CompetitionStage>("zonal");
  const [format, setFormat] = useState<"round_robin" | "single_elimination" | "pooled">("round_robin");
  const [poolSize, setPoolSize] = useState<number>(4);
  const [name, setName] = useState("");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  // Load existing competitions for competition-driven mode
  const { data: competitions = [] } = useQuery({
    queryKey: ["builder-competitions"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("competitions")
        .select("id,name,discipline,age_group,gender,tier,status,season")
        .in("status", ["draft", "registration_open", "registration_closed", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  const selectedComp = competitions.find((c: any) => c.id === competitionId);

  // Teams registered to the selected competition (via `registrations`)
  const { data: registeredTeams = [], isLoading: regLoading } = useQuery({
    queryKey: ["builder-registered", competitionId],
    enabled: mode === "competition" && !!competitionId,
    queryFn: async () => {
      const { data: regs } = await (supabase as any)
        .from("registrations")
        .select("school_team_id, status")
        .eq("competition_id", competitionId)
        .in("status", ["approved", "confirmed", "pending"])
        .not("school_team_id", "is", null);
      const ids = Array.from(new Set((regs || []).map((r: any) => r.school_team_id).filter(Boolean)));
      if (ids.length === 0) return [];
      const { data: teams } = await (supabase as any)
        .from("school_teams")
        .select("id, name, school_id, discipline, age_group, gender, school:teams!school_teams_school_id_fkey(id, name, school_name, province)")
        .in("id", ids);
      return teams || [];
    },
  });

  // Manual mode: filter published teams by discipline + age group
  const { data: filteredTeams = [], isLoading: manLoading } = useQuery({
    queryKey: ["builder-filtered", discipline, ageGroup],
    enabled: mode === "manual",
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("school_teams")
        .select("id, name, school_id, discipline, age_group, gender, school:teams!school_teams_school_id_fkey(id, name, school_name, province)")
        .eq("is_published", true)
        .eq("discipline", discipline)
        .order("name")
        .limit(500);
      return (data || []).filter((t: any) => !ageGroup || !t.age_group || t.age_group === ageGroup);
    },
  });

  const sourceTeams = mode === "competition" ? registeredTeams : filteredTeams;
  const teams = useMemo(() => sourceTeams.filter((t: any) => !excluded.has(t.id)), [sourceTeams, excluded]);
  const isLoading = mode === "competition" ? regLoading : manLoading;

  const toggleExclude = (id: string) => {
    const next = new Set(excluded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExcluded(next);
  };

  const generate = async () => {
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    const teamIds = teams.map((t: any) => t.id);
    if (teamIds.length < 2) { toast({ title: "Need at least 2 teams", variant: "destructive" }); return; }

    setBusy(true);
    try {
      const schoolByTeam = new Map(teams.map((t: any) => [t.id, t.school_id]));
      let compId = competitionId;

      // Manual mode → create a competition on the fly
      if (mode === "manual" || !compId) {
        if (!name.trim()) { toast({ title: "Name your competition", variant: "destructive" }); setBusy(false); return; }
        const { data: comp, error: cErr } = await (supabase as any).from("competitions").insert({
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
        }).select().single();
        if (cErr) throw cErr;
        compId = comp.id;
      }

      const pairToFixture = (p: [string, string], extra: Partial<any>) => ({
        competition_id: compId,
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
              group_label: `Pool ${String.fromCharCode(65 + pi)}`,
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

      const { error: fErr } = await (supabase as any).from("fixtures").insert(fixtures);
      if (fErr) throw fErr;

      toast({ title: "Bracket generated", description: `${fixtures.length} fixtures created` });
      qc.invalidateQueries();
      setName(""); setExcluded(new Set());
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hairline rounded-xl p-5 sm:p-6 bg-card card-shadow flex flex-col gap-5">
      <div>
        <p className="display-font text-base sm:text-lg font-bold text-foreground">Fixture Generator</p>
        <p className="text-xs text-nexus-muted mt-0.5">Competition-driven by default. Toggle to manual filter to pick teams by sport + age group.</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        {(["competition", "manual"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${mode === m ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}
          >
            {m === "competition" ? "From Competition" : "Manual Filter"}
          </button>
        ))}
      </div>

      {mode === "competition" ? (
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Competition *</label>
            <select value={competitionId} onChange={(e) => { setCompetitionId(e.target.value); setExcluded(new Set()); }} className={inputCls + " cursor-pointer"}>
              <option value="">— Select a competition —</option>
              {competitions.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.discipline}{c.age_group ? ` · ${c.age_group}` : ""}{c.tier ? ` · ${c.tier}` : ""}
                </option>
              ))}
            </select>
            {selectedComp && <p className="text-[11px] text-nexus-muted">Loading registered teams for <strong>{selectedComp.name}</strong>. Draw settings inherit from the competition.</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as any)} className={inputCls + " cursor-pointer"}>
                <option value="round_robin">Round Robin</option>
                <option value="single_elimination">Knockout</option>
                <option value="pooled">Pooled</option>
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
          </div>
        </div>
      ) : (
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
                  <button type="button" onClick={() => setStage(s.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${stage === s.value ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted hover:text-foreground"}`}>
                    {s.label}
                  </button>
                  {i < COMPETITION_STAGES.length - 1 && <span className="text-nexus-muted/50 text-xs">→</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as any)} className={inputCls + " cursor-pointer"}>
              <option value="round_robin">Round Robin</option>
              <option value="single_elimination">Knockout</option>
              <option value="pooled">Pooled</option>
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
      )}

      {/* Teams list with per-team exclude toggle */}
      <div className="hairline rounded-lg p-4 bg-nexus-surface/40">
        {isLoading ? (
          <p className="text-xs text-nexus-muted">Loading teams…</p>
        ) : sourceTeams.length === 0 ? (
          <div className="text-center space-y-1">
            <p className="text-xs text-nexus-muted">
              {mode === "competition"
                ? competitionId ? "No teams registered to this competition yet." : "Pick a competition to load its registered teams."
                : `No published ${discipline} teams for ${ageGroup} yet.`}
            </p>
            <Link to="/coach/registration" className="text-xs font-semibold underline underline-offset-2 hover:opacity-70">
              Register a team →
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className={labelCls}>{teams.length} of {sourceTeams.length} teams selected</p>
              <button onClick={() => setExcluded(new Set())} className="text-[10px] text-nexus-muted underline underline-offset-2 hover:text-foreground">Reset</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto">
              {sourceTeams.map((t: any) => {
                const off = excluded.has(t.id);
                return (
                  <button key={t.id} onClick={() => toggleExclude(t.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition ${off ? "opacity-40 line-through" : "bg-background hairline"}`}>
                    <span className="w-5 h-5 rounded-full bg-nexus-surface flex items-center justify-center text-[9px] font-semibold shrink-0">
                      {(t.school?.school_name || t.school?.name || "?").charAt(0)}
                    </span>
                    <span className="truncate">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <button onClick={generate} disabled={busy || teams.length < 2} className="h-11 px-6 text-sm font-semibold rounded-xl bg-foreground text-primary-foreground hover:opacity-85 disabled:opacity-50">
        {busy ? "Generating…" : `Generate ${format === "round_robin" ? "Round Robin" : format === "pooled" ? "Pooled" : "Knockout"} — ${teams.length} teams`}
      </button>
    </div>
  );
}
