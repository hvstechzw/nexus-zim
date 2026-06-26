import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { roundRobin, singleElimination, doubleElimination, pooled, type PendingFixture, type Side } from "@/lib/tournament";

type WizardState = {
  name: string;
  discipline: "Handball" | "Netball";
  level: "zonal" | "district" | "provincial" | "national";
  season: string;
  province: string;
  start_date: string;
  end_date: string;
  format: "league" | "single_ko" | "double_ko" | "pooled";
  group_size: number;
  points_win: number;
  points_draw: number;
  points_loss: number;
  teamIds: string[];
};

const STEP_LABELS = ["Basics", "Format", "Teams", "Schedule", "Review"];

export default function TournamentWizardPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { hasRole, loading: rolesLoading } = useHasRole();
  const canHost = hasRole("super_admin", "admin", "national_admin", "provincial_admin", "district_admin", "zonal_admin", "hic");

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [s, setS] = useState<WizardState>({
    name: "",
    discipline: "Handball",
    level: "zonal",
    season: String(new Date().getFullYear()),
    province: "",
    start_date: "",
    end_date: "",
    format: "league",
    group_size: 4,
    points_win: 3,
    points_draw: 1,
    points_loss: 0,
    teamIds: [],
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["wizard-school-teams", s.discipline],
    queryFn: async () => {
      const { data } = await supabase
        .from("school_teams")
        .select("id, name, age_group, gender, season, school_id, is_published, teams!school_teams_school_id_fkey(name, province)")
        .eq("discipline", s.discipline)
        .eq("is_published", true)
        .order("name");
      return (data || []) as any[];
    },
  });

  const previewFixtures = useMemo<PendingFixture[]>(() => {
    const sides: Side[] = s.teamIds.map((id) => ({ school_team_id: id }));
    if (sides.length < 2) return [];
    switch (s.format) {
      case "league": return roundRobin(sides);
      case "single_ko": return singleElimination(sides);
      case "double_ko": return doubleElimination(sides);
      case "pooled": return pooled(sides, Math.max(2, s.group_size));
    }
  }, [s.teamIds, s.format, s.group_size]);

  async function publish() {
    if (!user) return;
    setBusy(true);
    try {
      const { data: comp, error: cerr } = await supabase
        .from("competitions")
        .insert({
          name: s.name, discipline: s.discipline, level: s.level as any,
          season: s.season, province: s.province || null,
          start_date: s.start_date || null, end_date: s.end_date || null,
          format: s.format as any, group_size: s.format === "pooled" ? s.group_size : null,
          points_config: { win: s.points_win, draw: s.points_draw, loss: s.points_loss },
          status: "scheduled" as any, created_by: user.id,
        }).select("id").single();
      if (cerr || !comp) throw cerr || new Error("competition insert failed");

      // Registrations
      if (s.teamIds.length) {
        await supabase.from("registrations").insert(
          s.teamIds.map((id) => ({
            competition_id: comp.id, school_team_id: id,
            registration_type: "school_team", status: "approved" as any,
            submitted_by: user.id,
          })),
        );
      }

      // Fixtures (two-pass for advances_to_fixture_id resolution)
      const pending = previewFixtures;
      if (pending.length) {
        const rows = pending.map((p) => ({
          competition_id: comp.id,
          home_school_team_id: p.home_school_team_id,
          away_school_team_id: p.away_school_team_id,
          round_number: p.round_number,
          round_label: p.round_label,
          group_label: p.group_label,
          bracket_round: p.bracket_round,
          bracket_slot: p.bracket_slot,
          status: "scheduled" as any,
        }));
        const { data: inserted, error: ferr } = await supabase
          .from("fixtures").insert(rows).select("id");
        if (ferr) throw ferr;

        // Resolve advances_to via tempId mapping
        const idByTemp = new Map<string, string>();
        pending.forEach((p, i) => idByTemp.set(p._tempId, inserted![i].id));
        const updates = pending
          .map((p, i) => p._advancesToTempId ? { id: inserted![i].id, to: idByTemp.get(p._advancesToTempId)! } : null)
          .filter(Boolean) as { id: string; to: string }[];
        for (const u of updates) {
          await supabase.from("fixtures").update({ advances_to_fixture_id: u.to }).eq("id", u.id);
        }
      }

      toast.success("Tournament published");
      nav(`/competition/${comp.id}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to publish");
    } finally {
      setBusy(false);
    }
  }

  if (rolesLoading) return <Shell><div className="p-8 text-nexus-muted mono text-sm">Loading…</div></Shell>;
  if (!user) return <Shell><div className="p-8 text-nexus-muted mono text-sm">Sign in required.</div></Shell>;
  if (!canHost) return <Shell><div className="p-8 text-nexus-muted mono text-sm">Verified admins or HICs only.</div></Shell>;

  const canNext = (() => {
    if (step === 0) return s.name.trim() && s.season && s.start_date;
    if (step === 2) return s.teamIds.length >= 2;
    return true;
  })();

  return (
    <Shell>
      <Helmet><title>Host a tournament — Nexus</title></Helmet>
      <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-20 pb-16">
        <Link to="/admin" className="text-xs mono text-nexus-muted hover:text-foreground">← Admin</Link>
        <h1 className="display-font text-display-md font-bold mt-2 mb-6">Host a tournament</h1>

        <ol className="flex gap-2 mb-8 text-[10px] mono tracking-[0.15em] uppercase">
          {STEP_LABELS.map((l, i) => (
            <li key={l} className={`px-3 py-1.5 rounded-full hairline ${i === step ? "bg-foreground text-primary-foreground" : "text-nexus-muted"}`}>{i + 1}. {l}</li>
          ))}
        </ol>

        {step === 0 && (
          <div className="space-y-4">
            <Field label="Name"><Input value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} placeholder="2026 Mash East Zonal Handball" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Discipline">
                <Select value={s.discipline} onValueChange={(v: any) => setS({ ...s, discipline: v, teamIds: [] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Handball">Handball</SelectItem><SelectItem value="Netball">Netball</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label="Level">
                <Select value={s.level} onValueChange={(v: any) => setS({ ...s, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zonal">Zonal / Cluster</SelectItem>
                    <SelectItem value="district">District</SelectItem>
                    <SelectItem value="provincial">Provincial</SelectItem>
                    <SelectItem value="national">National</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Season"><Input value={s.season} onChange={(e) => setS({ ...s, season: e.target.value })} /></Field>
              <Field label="Province (optional)"><Input value={s.province} onChange={(e) => setS({ ...s, province: e.target.value })} /></Field>
              <Field label="Start date"><Input type="date" value={s.start_date} onChange={(e) => setS({ ...s, start_date: e.target.value })} /></Field>
              <Field label="End date"><Input type="date" value={s.end_date} onChange={(e) => setS({ ...s, end_date: e.target.value })} /></Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Field label="Format">
              <Select value={s.format} onValueChange={(v: any) => setS({ ...s, format: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="league">League (round-robin)</SelectItem>
                  <SelectItem value="single_ko">Single elimination</SelectItem>
                  <SelectItem value="double_ko">Double elimination</SelectItem>
                  <SelectItem value="pooled">Pooled (groups → KO)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {s.format === "pooled" && (
              <Field label="Group size"><Input type="number" min={2} max={8} value={s.group_size} onChange={(e) => setS({ ...s, group_size: Number(e.target.value) })} /></Field>
            )}
            <div className="grid grid-cols-3 gap-3">
              <Field label="Win pts"><Input type="number" value={s.points_win} onChange={(e) => setS({ ...s, points_win: Number(e.target.value) })} /></Field>
              <Field label="Draw pts"><Input type="number" value={s.points_draw} onChange={(e) => setS({ ...s, points_draw: Number(e.target.value) })} /></Field>
              <Field label="Loss pts"><Input type="number" value={s.points_loss} onChange={(e) => setS({ ...s, points_loss: Number(e.target.value) })} /></Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-xs text-nexus-muted mb-3 mono">{s.teamIds.length} / {teams.length} selected · published Scholastic-verified teams only</p>
            <div className="hairline rounded-xl max-h-[400px] overflow-y-auto divide-y divide-border/40">
              {teams.length === 0 && <p className="text-nexus-muted text-sm p-6 text-center">No published {s.discipline} teams yet.</p>}
              {teams.map((t) => {
                const sel = s.teamIds.includes(t.id);
                return (
                  <label key={t.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-nexus-surface/40">
                    <Checkbox checked={sel} onCheckedChange={(v) => {
                      setS({ ...s, teamIds: v ? [...s.teamIds, t.id] : s.teamIds.filter((x) => x !== t.id) });
                    }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-[10px] mono text-nexus-muted">{t.teams?.name || "—"} · {t.age_group || "Open"} · {t.gender || "Mixed"}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="text-xs text-nexus-muted mb-3 mono">Generated {previewFixtures.length} fixture{previewFixtures.length === 1 ? "" : "s"} · venues and slot times can be edited per fixture after publish.</p>
            <div className="hairline rounded-xl max-h-[400px] overflow-y-auto divide-y divide-border/40">
              {previewFixtures.map((f, i) => {
                const home = teams.find((t) => t.id === f.home_school_team_id);
                const away = teams.find((t) => t.id === f.away_school_team_id);
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="text-[10px] mono text-nexus-muted w-28 truncate">{f.group_label || f.round_label}</span>
                    <span className="flex-1 truncate">{home?.name || "TBD"}</span>
                    <span className="text-nexus-muted mono text-xs">vs</span>
                    <span className="flex-1 truncate text-right">{away?.name || "TBD"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3 text-sm">
            <Row k="Name" v={s.name} />
            <Row k="Discipline" v={`${s.discipline} · ${s.level}`} />
            <Row k="Season / window" v={`${s.season} · ${s.start_date || "—"} → ${s.end_date || "—"}`} />
            <Row k="Format" v={`${s.format}${s.format === "pooled" ? ` (groups of ${s.group_size})` : ""}`} />
            <Row k="Points" v={`W ${s.points_win} · D ${s.points_draw} · L ${s.points_loss}`} />
            <Row k="Teams" v={`${s.teamIds.length}`} />
            <Row k="Fixtures" v={`${previewFixtures.length}`} />
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={() => setStep((x) => Math.max(0, x - 1))} disabled={step === 0 || busy}>Back</Button>
          {step < STEP_LABELS.length - 1 ? (
            <Button onClick={() => setStep((x) => x + 1)} disabled={!canNext}>Next</Button>
          ) : (
            <Button onClick={publish} disabled={busy || s.teamIds.length < 2}>{busy ? "Publishing…" : "Publish tournament"}</Button>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />
      {children}
      <NexusFooter />
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted">{label}</Label>{children}</div>;
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between hairline-b py-2"><span className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted">{k}</span><span>{v}</span></div>;
}
