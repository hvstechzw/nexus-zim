import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { athleteSchema, teamSchema, officialSchema, ZIM_PROVINCES } from "@/schemas";

const PROVINCES = ZIM_PROVINCES;

// Parse a textarea of "discipline: value (YYYY-MM-DD)" lines into an array of
// { discipline, value, recorded_at } — tolerant of missing dates and extra whitespace.
function parsePersonalBests(raw: string) {
  if (!raw.trim()) return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const dateMatch = line.match(/\((\d{4}-\d{2}-\d{2})\)\s*$/);
      const recorded_at = dateMatch ? dateMatch[1] : null;
      const body = dateMatch ? line.slice(0, line.length - dateMatch[0].length).trim() : line;
      const [discipline, ...rest] = body.split(":");
      const value = rest.join(":").trim();
      return { discipline: discipline.trim(), value, recorded_at };
    })
    .filter((pb) => pb.discipline && pb.value);
}

export function RegistrationPanel() {
  const [tab, setTab] = useState<"athlete" | "team" | "official">("athlete");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: openComps = [] } = useQuery({
    queryKey: ["open-competitions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, name, discipline, level")
        .eq("status", "registration_open")
        .order("name");
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["reg-stats"],
    queryFn: async () => {
      const [athl, teams, officials] = await Promise.all([
        supabase.from("athletes").select("id", { count: "exact", head: true }),
        supabase.from("teams").select("id", { count: "exact", head: true }),
        supabase.from("officials").select("id", { count: "exact", head: true }),
      ]);
      return {
        athletes: athl.count || 0,
        teams: teams.count || 0,
        officials: officials.count || 0,
      };
    },
  });

  const [athleteForm, setAthleteForm] = useState({
    first_name: "",
    last_name: "",
    discipline: "",
    province: "Harare" as (typeof ZIM_PROVINCES)[number],
    school_name: "",
    dob: "",
    medical_waiver_signed: false,
    personal_bests_raw: "",
  });
  const [teamForm, setTeamForm] = useState({ name: "", discipline: "", province: "Harare" as (typeof ZIM_PROVINCES)[number], school_name: "" });
  const [officialForm, setOfficialForm] = useState({ first_name: "", last_name: "", role: "referee", discipline: "", province: "Harare" as (typeof ZIM_PROVINCES)[number] });

  const inputCls = "bg-nexus-surface/60 hairline rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all duration-200 w-full";
  const labelCls = "text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to submit a registration." });
      return;
    }
    setLoading(true);
    try {
      if (tab === "athlete") {
        const personalBests = parsePersonalBests(athleteForm.personal_bests_raw);
        const parsed = athleteSchema.safeParse({
          first_name: athleteForm.first_name,
          last_name: athleteForm.last_name,
          disciplines: [athleteForm.discipline],
          province: athleteForm.province,
          school_name: athleteForm.school_name || null,
          date_of_birth: athleteForm.dob || null,
          medical_waiver_signed: athleteForm.medical_waiver_signed,
          medical_waiver_date: athleteForm.medical_waiver_signed
            ? new Date().toISOString().slice(0, 10)
            : null,
          personal_bests: personalBests,
        });
        if (!parsed.success) {
          throw new Error(parsed.error.issues[0]?.message ?? "Invalid athlete data");
        }
        const { error } = await supabase.from("athletes").insert({
          ...parsed.data,
          user_id: user.id,
        });
        if (error) throw error;
      } else if (tab === "team") {
        const parsed = teamSchema.safeParse({
          name: teamForm.name,
          discipline: teamForm.discipline,
          level: "club_academy",
          province: teamForm.province,
          school_name: teamForm.school_name || null,
        });
        if (!parsed.success) {
          throw new Error(parsed.error.issues[0]?.message ?? "Invalid team data");
        }
        const { error } = await supabase.from("teams").insert({
          ...parsed.data,
          manager_id: user.id,
        });
        if (error) throw error;
      } else {
        const parsed = officialSchema.safeParse({
          first_name: officialForm.first_name,
          last_name: officialForm.last_name,
          role: officialForm.role,
          disciplines: [officialForm.discipline],
          province: officialForm.province,
        });
        if (!parsed.success) {
          throw new Error(parsed.error.issues[0]?.message ?? "Invalid official data");
        }
        const { error } = await supabase.from("officials").insert({
          ...parsed.data,
          user_id: user.id,
        });
        if (error) throw error;
      }
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      toast({ title: "Registration submitted", description: "Your registration has been recorded." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <section id="register" className="hairline-b">
      <div className="px-8 py-5 hairline-b">
        <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">Registration Portal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left — Info */}
        <div className="p-10 md:p-14 hairline-r flex flex-col gap-8">
          <div>
            <h2 className="display-font text-display-lg font-bold text-foreground tracking-tight">Join the National Grid.</h2>
            <p className="mt-4 text-sm leading-relaxed text-nexus-muted max-w-[55ch]">
              Register individuals, teams, or officials across every discipline and level.
              From a Grade 3 chess competitor in Mutare to a National League squad in Harare —
              every entry is tracked, verifiable, and broadcast-ready.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Athlete Profiles", value: stats?.athletes ? `${stats.athletes.toLocaleString()}` : "—" },
              { label: "Registered Teams", value: stats?.teams ? `${stats.teams.toLocaleString()}` : "—" },
              { label: "Certified Officials", value: stats?.officials ? `${stats.officials.toLocaleString()}` : "—" },
              { label: "Open Competitions", value: openComps.length ? `${openComps.length}` : "—" },
            ].map((item) => (
              <div key={item.label} className="hairline rounded-xl p-5 flex flex-col gap-1.5 card-shadow">
                <p className="score-display text-score-md text-foreground">{item.value}</p>
                <p className="text-[10px] mono tracking-[0.12em] uppercase text-nexus-muted">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="hairline rounded-xl p-6 flex flex-col gap-3 bg-nexus-surface/50">
            <p className="text-xs mono tracking-[0.15em] uppercase text-nexus-muted font-semibold mb-1">What you get</p>
            {[
              "Digital competition ID & profile",
              "Real-time scoring integration",
              "Broadcast-ready athlete card",
              "Cross-season performance records",
              "National rankings and seeding",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          {openComps.length > 0 && (
            <div className="hairline rounded-xl p-6 flex flex-col gap-3">
              <p className="text-xs mono tracking-[0.15em] uppercase text-nexus-muted font-semibold mb-1">Open for Registration</p>
              {openComps.slice(0, 4).map((comp: any) => (
                <div key={comp.id} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{comp.name}</span>
                  <span className="text-[10px] mono text-nexus-muted bg-nexus-surface px-2 py-1 rounded-full">{comp.discipline}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Form */}
        <div className="p-10 md:p-14">
          {!user && (
            <div className="mb-6 hairline rounded-xl p-4 bg-nexus-surface/50">
              <p className="text-xs mono text-nexus-muted">⚠ Sign in to submit an official registration to the database.</p>
            </div>
          )}

          <div className="flex gap-1.5 p-1.5 bg-nexus-surface rounded-xl mb-8">
            {(["athlete", "team", "official"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs tracking-wide font-semibold rounded-lg transition-all duration-200 btn-click capitalize
                  ${tab === t ? "bg-background text-foreground shadow-sm" : "text-nexus-muted hover:text-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <motion.form
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >
            {tab === "athlete" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>First Name</label>
                    <input required value={athleteForm.first_name} onChange={e => setAthleteForm(f => ({...f, first_name: e.target.value}))} className={inputCls} placeholder="Tinashe" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Surname</label>
                    <input required value={athleteForm.last_name} onChange={e => setAthleteForm(f => ({...f, last_name: e.target.value}))} className={inputCls} placeholder="Moyo" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Discipline</label>
                  <input required value={athleteForm.discipline} onChange={e => setAthleteForm(f => ({...f, discipline: e.target.value}))} className={inputCls} placeholder="Football, Chess, Debate…" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Province</label>
                    <select value={athleteForm.province} onChange={e => setAthleteForm(f => ({...f, province: e.target.value}))} className={inputCls + " cursor-pointer"}>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Date of Birth</label>
                    <input type="date" value={athleteForm.dob} onChange={e => setAthleteForm(f => ({...f, dob: e.target.value}))} className={inputCls} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>School / Club Name</label>
                  <input value={athleteForm.school_name} onChange={e => setAthleteForm(f => ({...f, school_name: e.target.value}))} className={inputCls} placeholder="e.g. Churchill High School" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Personal Bests (optional)</label>
                  <textarea
                    rows={3}
                    value={athleteForm.personal_bests_raw}
                    onChange={e => setAthleteForm(f => ({...f, personal_bests_raw: e.target.value}))}
                    className={inputCls}
                    placeholder={"One per line — e.g.\n100m: 11.42 (2025-09-14)\nLong Jump: 6.10m"}
                  />
                  <p className="text-[10px] mono text-nexus-muted">Format: <span className="text-foreground">discipline: value (YYYY-MM-DD)</span>. Date optional.</p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={athleteForm.medical_waiver_signed}
                    onChange={e => setAthleteForm(f => ({...f, medical_waiver_signed: e.target.checked}))}
                    className="mt-1 w-4 h-4 accent-foreground"
                  />
                  <span className="text-xs text-foreground leading-relaxed">
                    I confirm the athlete has signed the Nexus medical waiver and is cleared for competition.
                    <span className="block text-[10px] mono text-nexus-muted mt-1">Today's date is auto-recorded on submit.</span>
                  </span>
                </label>
              </>
            )}

            {tab === "team" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Team Name</label>
                  <input required value={teamForm.name} onChange={e => setTeamForm(f => ({...f, name: e.target.value}))} className={inputCls} placeholder="e.g. Dynamos FC" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Discipline</label>
                  <input required value={teamForm.discipline} onChange={e => setTeamForm(f => ({...f, discipline: e.target.value}))} className={inputCls} placeholder="Football, Rugby, Cricket…" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Province</label>
                    <select value={teamForm.province} onChange={e => setTeamForm(f => ({...f, province: e.target.value}))} className={inputCls + " cursor-pointer"}>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>School / Club</label>
                    <input value={teamForm.school_name} onChange={e => setTeamForm(f => ({...f, school_name: e.target.value}))} className={inputCls} placeholder="Optional" />
                  </div>
                </div>
              </>
            )}

            {tab === "official" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>First Name</label>
                    <input required value={officialForm.first_name} onChange={e => setOfficialForm(f => ({...f, first_name: e.target.value}))} className={inputCls} placeholder="Blessing" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Surname</label>
                    <input required value={officialForm.last_name} onChange={e => setOfficialForm(f => ({...f, last_name: e.target.value}))} className={inputCls} placeholder="Chikwanda" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Role</label>
                    <select value={officialForm.role} onChange={e => setOfficialForm(f => ({...f, role: e.target.value}))} className={inputCls + " cursor-pointer"}>
                      {["referee","scorer","judge","coach","administrator","broadcaster"].map(r => (
                        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Discipline</label>
                    <input required value={officialForm.discipline} onChange={e => setOfficialForm(f => ({...f, discipline: e.target.value}))} className={inputCls} placeholder="Football, Chess…" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Province</label>
                  <select value={officialForm.province} onChange={e => setOfficialForm(f => ({...f, province: e.target.value}))} className={inputCls + " cursor-pointer"}>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading || !user}
              className={`h-12 text-sm font-semibold tracking-wide rounded-xl transition-all duration-200 btn-click
                ${done ? "bg-nexus-surface text-nexus-muted" : "bg-foreground text-primary-foreground hover:opacity-85"}
                disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {loading ? "Submitting…" : done ? "✓ Registration Submitted" : `Register ${tab.charAt(0).toUpperCase() + tab.slice(1)}`}
            </button>

            <p className="text-xs mono text-nexus-muted text-center leading-relaxed">
              {user ? "Official confirmation within 24 hours. All submissions reviewed by Nexus officials." : "Sign in to submit an official registration."}
            </p>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
