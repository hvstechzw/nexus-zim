import { useEffect, useMemo, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { NashHeader } from "@/components/nash/NashHeader";
import { SportSelector } from "@/components/nash/SportSelector";
import { ProvinceSelector } from "@/components/nash/ProvinceSelector";
import { SeasonSelector, type NashSeason } from "@/components/nash/SeasonSelector";
import { sportName } from "@/components/nash/SportBadge";
import { TierBadge, type CompetitionTier } from "@/components/nash/TierBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { ORGANIZER_ROLES } from "@/hooks/useHasRole";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronLeft, ChevronRight, Loader2, Trophy, ShieldCheck, Calendar, MapPin, DollarSign, Users, ListChecks, Flag } from "lucide-react";

// ── 11-step wizard state — mirrors the spec verbatim ────────────────────────
interface State {
  federation: "nash" | "naph";
  sportCode: string;          // e.g. 'HB'
  sportId: string | null;     // nash_sports.id
  seasonId: string;
  season?: NashSeason;
  tier: CompetitionTier;
  organisationId: string | null;
  organisationName: string;
  province: string;           // resolved from organisation
  gender: "boys" | "girls" | "mixed";
  ageGroup: "U14" | "U16" | "U18" | "Open";
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  hostSchoolId: string;
  hostSchoolName: string;
  venueId: string;
  format: "round_robin" | "single_elimination" | "double_elimination" | "pooled" | "swiss";
  groupSize: number;
  entryFeePerTeam: number;
  totalBudget: number;
  requiresCardVerification: boolean;
  requiresSsIntegration: boolean;
  isNashSanctioned: boolean;
}

const TIER_LABEL: Record<CompetitionTier, string> = {
  zonal: "Zonal", district: "District", provincial: "Provincial", national: "National",
};

const STEPS = [
  "Federation", "Sport", "Season", "Tier", "Organisation",
  "Division", "Schedule", "Format", "Finance", "Verification", "Review",
] as const;

interface Org { id: string; name: string; type: "nash" | "naph"; level: string; province: string | null; }
interface Venue { id: string; name: string; province: string | null; }

export default function TournamentWizardPage() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasRole, loading: rolesLoading } = useHasRole();
  const canHost = !rolesLoading && hasRole(...ORGANIZER_ROLES);

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [s, setS] = useState<State>({
    federation: "nash",
    sportCode: "",
    sportId: null,
    seasonId: "",
    tier: "zonal",
    organisationId: null,
    organisationName: "",
    province: "",
    gender: "boys",
    ageGroup: "U18",
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    hostSchoolId: "",
    hostSchoolName: "",
    venueId: "",
    format: "round_robin",
    groupSize: 4,
    entryFeePerTeam: 0,
    totalBudget: 0,
    requiresCardVerification: false,
    requiresSsIntegration: false,
    isNashSanctioned: false,
  });

  const set = <K extends keyof State>(k: K, v: State[K]) => setS((prev) => ({ ...prev, [k]: v }));

  // Load orgs & venues once
  useEffect(() => {
    (async () => {
      const sb = supabase as any;
      const [orgRes, venueRes] = await Promise.all([
        sb.from("nash_organisations").select("id,name,type,level,province").eq("is_active", true).order("level").order("name"),
        sb.from("venues").select("id,name,province").eq("is_active", true).order("name"),
      ]);
      setOrgs((orgRes.data || []) as Org[]);
      setVenues((venueRes.data || []) as Venue[]);
    })();
  }, []);

  // When the user picks an organisation, derive the province + tier hint
  useEffect(() => {
    if (!s.organisationId) return;
    const o = orgs.find((x) => x.id === s.organisationId);
    if (o) {
      set("organisationName", o.name);
      if (o.province) set("province", o.province);
    }
  }, [s.organisationId, orgs]);

  // Resolve nash_sports.id from sport code
  useEffect(() => {
    if (!s.sportCode) { set("sportId", null); return; }
    (async () => {
      const { data } = await (supabase as any).from("nash_sports").select("id").eq("code", s.sportCode).maybeSingle();
      set("sportId", data?.id ?? null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.sportCode]);

  // Suggest competition name as fields populate
  useEffect(() => {
    if (s.name) return; // don't overwrite once user edited
    if (s.sportCode && s.tier && s.ageGroup && s.gender && s.organisationName) {
      const parts = [s.organisationName, TIER_LABEL[s.tier], sportName(s.sportCode), s.ageGroup, s.gender === "boys" ? "Boys" : s.gender === "girls" ? "Girls" : "Mixed"];
      set("name", parts.join(" · "));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.sportCode, s.tier, s.ageGroup, s.gender, s.organisationName]);

  // Organisations filtered by tier + federation
  const orgsForTier = useMemo(() => {
    return orgs.filter((o) => o.type === s.federation && (
      s.tier === "national" ? o.level === "national" :
      s.tier === "provincial" ? o.level === "provincial" :
      // district & zonal seeds will be added later; fall back to provincial parent for now
      o.level === "provincial" || o.level === s.tier
    ));
  }, [orgs, s.federation, s.tier]);

  // Per-step validation — keeps the Next button honest
  const stepValid = useMemo((): boolean => {
    switch (step) {
      case 0: return !!s.federation;
      case 1: return !!s.sportCode;
      case 2: return !!s.seasonId;
      case 3: return !!s.tier;
      case 4: return !!s.organisationId;
      case 5: return !!s.gender && !!s.ageGroup;
      case 6: return !!s.name.trim() && !!s.startDate;
      case 7: return !!s.format;
      case 8: return s.entryFeePerTeam >= 0 && s.totalBudget >= 0;
      case 9: return true;
      case 10: return true;
      default: return false;
    }
  }, [step, s]);

  async function publish() {
    if (!user) return;
    setBusy(true);
    try {
      const sb = supabase as any;
      // Generate a NASH sanction number — NASH-[CODE]-[YEAR]-[PROV]-[SEQ]
      const provCode = s.province ? s.province.slice(0, 2).toUpperCase() : "ZZ";
      const year = s.season?.academic_year || String(new Date().getFullYear());
      const sanction = s.isNashSanctioned
        ? `${s.federation.toUpperCase()}-${s.sportCode}-${year}-${provCode}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`
        : null;

      const { data: comp, error: cerr } = await sb.from("competitions").insert({
        name: s.name.trim(),
        discipline: sportName(s.sportCode),
        // legacy level enum — map NASH tier to closest existing value
        level: s.tier === "zonal" ? "primary_school" :
               s.tier === "district" ? "primary_school" :
               s.tier === "provincial" ? "provincial" :
               "national_league",
        season: year,
        province: s.province || null,
        start_date: s.startDate || null,
        end_date: s.endDate || null,
        format: s.format,
        description: s.description || null,
        entry_fee: s.entryFeePerTeam || 0,
        created_by: user.id,
        // NASH extensions
        nash_sport_id: s.sportId,
        season_id: s.seasonId,
        organisation_id: s.organisationId,
        tier: s.tier,
        age_group: s.ageGroup,
        gender: s.gender,
        host_school_id: s.hostSchoolId || null,
        host_school_name: s.hostSchoolName || null,
        venue_id: s.venueId || null,
        requires_card_verification: s.requiresCardVerification,
        entry_fee_per_team: s.entryFeePerTeam || 0,
        is_nash_sanctioned: s.isNashSanctioned,
        nash_sanction_number: sanction,
        status: "scheduled",
      }).select("id").single();
      if (cerr || !comp) throw cerr || new Error("Failed to create competition");

      // Bootstrap the budget row so the finances dashboard has a starting point.
      if (s.totalBudget > 0 || s.entryFeePerTeam > 0) {
        await sb.from("nash_competition_budgets").insert({
          competition_id: comp.id,
          total_budget: s.totalBudget,
        });
      }

      toast.success("Competition created", {
        description: sanction ? `NASH sanction: ${sanction}` : "Schools can now register teams.",
      });
      nav(`/competition/${comp.id}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to create competition");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || rolesLoading) {
    return <Shell><div className="p-8 text-sm text-muted-foreground">Loading…</div></Shell>;
  }
  if (!user) return <Navigate to="/auth/login" replace />;
  if (!canHost) {
    return <Shell><Card><CardContent className="p-6 text-sm">You need an organiser-tier role to create competitions. Contact your district or provincial admin.</CardContent></Card></Shell>;
  }

  return (
    <Shell>
      {/* Progress stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((label, i) => (
          <button
            key={label}
            disabled={i > step}
            onClick={() => i <= step && setStep(i)}
            className={`flex-1 min-w-fit flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] font-display tracking-wider uppercase transition-colors
              ${i === step ? "bg-primary text-primary-foreground"
                : i < step ? "text-accent hover:bg-accent/10"
                : "text-muted-foreground"}`}
          >
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold tabular-nums
              ${i === step ? "bg-accent text-accent-foreground"
                : i < step ? "bg-accent/20 text-accent"
                : "bg-muted text-muted-foreground"}`}>
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display tracking-wide flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" /> Step {step + 1} · {STEPS[step]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 min-h-[280px]">
          {step === 0 && (
            <div className="space-y-3">
              <Label className="text-xs">Federation</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["nash", "naph"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => set("federation", f)}
                    className={`p-4 rounded border-2 text-left transition-all
                      ${s.federation === f ? "border-accent bg-accent/10" : "border-border hover:border-primary/50"}`}
                  >
                    <div className="font-display text-lg font-bold uppercase tracking-wide">{f}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {f === "nash" ? "Secondary schools (Form 1–6)" : "Primary schools (Grade 1–7)"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <Label className="text-xs">Sport</Label>
              <SportSelector value={s.sportCode} onChange={(c) => set("sportCode", c)} placeholder="Choose a sport" />
              {s.sportCode && <p className="text-xs text-muted-foreground">{sportName(s.sportCode)} · code <span className="font-mono text-accent">{s.sportCode}</span></p>}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Label className="text-xs">Season</Label>
              <SeasonSelector value={s.seasonId} onChange={(id, ss) => { set("seasonId", id); set("season", ss); }} />
              {s.season && (
                <p className="text-xs text-muted-foreground">
                  {s.season.name} · Registration deadline: {s.season.registration_deadline ? new Date(s.season.registration_deadline).toLocaleDateString() : "—"}
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <Label className="text-xs">Competition Tier</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(Object.keys(TIER_LABEL) as CompetitionTier[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => set("tier", t)}
                    className={`p-3 rounded border-2 text-center transition-all
                      ${s.tier === t ? "border-accent bg-accent/10" : "border-border hover:border-primary/50"}`}
                  >
                    <TierBadge tier={t} className="mb-1" />
                    <div className="text-xs">{TIER_LABEL[t]}</div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tier determines the registration scope and the verification requirements that apply (set on the Verification step).
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <Label className="text-xs">Hosting Organisation</Label>
              <Select value={s.organisationId ?? ""} onValueChange={(v) => set("organisationId", v)}>
                <SelectTrigger><SelectValue placeholder={orgsForTier.length ? "Select organisation" : "No organisations seeded yet"} /></SelectTrigger>
                <SelectContent>
                  {orgsForTier.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      <span className="font-medium">{o.name}</span>
                      <span className="text-muted-foreground text-xs ml-2">{o.level}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {s.organisationId && (
                <p className="text-xs text-muted-foreground">Hosted by {s.organisationName}{s.province ? ` · ${s.province}` : ""}</p>
              )}
              {!s.province && (
                <div className="space-y-1">
                  <Label className="text-xs">Province (manual override)</Label>
                  <ProvinceSelector value={s.province} onChange={(v) => set("province", v)} />
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Gender</Label>
                <Select value={s.gender} onValueChange={(v) => set("gender", v as State["gender"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boys">Boys</SelectItem>
                    <SelectItem value="girls">Girls</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Age Group</Label>
                <Select value={s.ageGroup} onValueChange={(v) => set("ageGroup", v as State["ageGroup"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="U14">U14</SelectItem>
                    <SelectItem value="U16">U16</SelectItem>
                    <SelectItem value="U18">U18</SelectItem>
                    <SelectItem value="Open">Open / Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Competition Name <span className="text-muted-foreground">(auto-suggested from earlier fields, edit freely)</span></Label>
                <Input value={s.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Harare District Handball U18 Boys 2026" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Start date</Label><Input type="date" value={s.startDate} onChange={(e) => set("startDate", e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-xs">End date</Label><Input type="date" value={s.endDate} onChange={(e) => set("endDate", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Host School Name</Label>
                  <Input value={s.hostSchoolName} onChange={(e) => set("hostSchoolName", e.target.value)} placeholder="School hosting the event" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Venue</Label>
                  <Select value={s.venueId} onValueChange={(v) => set("venueId", v === "__none__" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder={venues.length ? "Select venue (optional)" : "No venues registered yet"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— None / TBA</SelectItem>
                      {venues.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}{v.province ? ` · ${v.province}` : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description / notes (optional)</Label>
                <Textarea value={s.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Anything participants need to know" />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3">
              <Label className="text-xs">Tournament Format</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {([
                  { v: "round_robin", l: "Round Robin", h: "All teams play each other once" },
                  { v: "single_elimination", l: "Knockout", h: "Single-elimination bracket" },
                  { v: "double_elimination", l: "Double KO", h: "Losers' bracket option" },
                  { v: "pooled", l: "Pooled + KO", h: "Group stage then knockout" },
                  { v: "swiss", l: "Swiss", h: "Rating-driven round pairings" },
                ] as const).map((f) => (
                  <button
                    key={f.v}
                    onClick={() => set("format", f.v as State["format"])}
                    className={`p-3 rounded border-2 text-left transition-all
                      ${s.format === f.v ? "border-accent bg-accent/10" : "border-border hover:border-primary/50"}`}
                  >
                    <div className="text-sm font-medium">{f.l}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">{f.h}</p>
                  </button>
                ))}
              </div>
              {s.format === "pooled" && (
                <div className="space-y-1 max-w-xs">
                  <Label className="text-xs">Pool size</Label>
                  <Input type="number" min={2} max={8} value={s.groupSize} onChange={(e) => set("groupSize", parseInt(e.target.value) || 4)} />
                </div>
              )}
            </div>
          )}

          {step === 8 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Entry fee per team (USD)</Label>
                <Input type="number" min={0} step="0.01" value={s.entryFeePerTeam} onChange={(e) => set("entryFeePerTeam", parseFloat(e.target.value) || 0)} />
                <p className="text-[10px] text-muted-foreground">Tracked in nash_entry_fee_payments. 15% Nexus / 85% organiser split applies automatically.</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Total budget (USD)</Label>
                <Input type="number" min={0} step="0.01" value={s.totalBudget} onChange={(e) => set("totalBudget", parseFloat(e.target.value) || 0)} />
                <p className="text-[10px] text-muted-foreground">Bootstraps a row in nash_competition_budgets; line items entered later.</p>
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-3">
              <Row label="Scholastic Card verification required at gate" hint="Players must scan their Scholastic Card to be eligible">
                <Switch checked={s.requiresCardVerification} onCheckedChange={(v) => set("requiresCardVerification", v)} />
              </Row>
              <Row label="Scholastic Services integration required" hint="School must be on SS Standard+ to register teams">
                <Switch checked={s.requiresSsIntegration} onCheckedChange={(v) => set("requiresSsIntegration", v)} />
              </Row>
              <Row label="NASH-sanctioned competition" hint="Generates a NASH sanction number for official record">
                <Switch checked={s.isNashSanctioned} onCheckedChange={(v) => set("isNashSanctioned", v)} />
              </Row>
            </div>
          )}

          {step === 10 && (
            <div className="space-y-3 text-sm">
              <SummaryRow icon={Flag} label="Federation" value={s.federation.toUpperCase()} />
              <SummaryRow icon={Trophy} label="Sport" value={sportName(s.sportCode)} />
              <SummaryRow icon={Calendar} label="Season" value={s.season?.name ?? "—"} />
              <SummaryRow icon={ShieldCheck} label="Tier" value={<TierBadge tier={s.tier} />} />
              <SummaryRow icon={Users} label="Organisation" value={s.organisationName || "—"} />
              <SummaryRow icon={Flag} label="Division" value={`${s.ageGroup} · ${s.gender}`} />
              <SummaryRow icon={MapPin} label="Schedule" value={`${s.startDate || "?"}${s.endDate ? ` → ${s.endDate}` : ""}${s.hostSchoolName ? ` @ ${s.hostSchoolName}` : ""}`} />
              <SummaryRow icon={ListChecks} label="Format" value={s.format.replace(/_/g, " ")} />
              <SummaryRow icon={DollarSign} label="Finance" value={`$${s.entryFeePerTeam} entry · $${s.totalBudget} budget`} />
              <SummaryRow icon={ShieldCheck} label="Verification" value={
                <span className="flex flex-wrap gap-1">
                  {s.requiresCardVerification && <Badge variant="outline" className="text-[10px]">Card</Badge>}
                  {s.requiresSsIntegration && <Badge variant="outline" className="text-[10px]">SS</Badge>}
                  {s.isNashSanctioned && <Badge variant="outline" className="text-[10px] border-accent text-accent">NASH-Sanctioned</Badge>}
                  {!s.requiresCardVerification && !s.requiresSsIntegration && !s.isNashSanctioned && <span className="text-muted-foreground text-xs">None</span>}
                </span>
              } />
              <div className="border-t pt-3 mt-3">
                <p className="text-xs font-medium mb-1">{s.name}</p>
                <p className="text-[11px] text-muted-foreground">{s.description || "No description"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" disabled={step === 0 || busy} onClick={() => setStep((p) => Math.max(0, p - 1))}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={!stepValid} onClick={() => setStep((p) => p + 1)}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button disabled={!stepValid || busy} onClick={publish}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Creating…</> : <><Check className="h-4 w-4 mr-1" /> Create Competition</>}
          </Button>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-4">
        <div>
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Tournament Wizard</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Create Competition</h1>
          <p className="text-xs text-muted-foreground mt-0.5">11 focused steps to register a sanctioned NASH/NAPH competition with all metadata.</p>
        </div>
        {children}
        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-border/40 last:border-0">
      <span className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className="h-3.5 w-3.5 text-accent" /> {label}
      </span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
