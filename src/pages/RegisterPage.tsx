import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NexusHeader } from "@/components/NexusHeader";

const PROVINCES = ["Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"];
const SPORTS = ["Handball", "Netball", "Football", "Basketball", "Volleyball", "Cricket", "Rugby", "Hockey", "Tennis", "Table Tennis", "Badminton", "Athletics", "Swimming", "Cross Country", "Chess", "Multiple"];
const FEDERATIONS = ["NASH", "NAPH"] as const;

type RoleKey =
  | "viewer" | "athlete" | "parent"
  | "coach" | "school_head" | "hic" | "team_manager" | "school_coordinator"
  | "umpire" | "referee" | "scorer" | "timekeeper" | "technical_delegate"
  | "broadcaster" | "federation_official" | "competition_organiser"
  | "zonal_admin" | "district_admin" | "provincial_admin" | "national_admin";

interface RoleDef {
  value: RoleKey;
  label: string;
  group: "Supporter" | "School Personnel" | "Match Officials" | "Federation & Media" | "Regional Administration";
  auto?: boolean;
  /** Applies to NASH (secondary schools) and/or NAPH (primary schools) — most roles span both federations. */
  federationScoped?: boolean;
  fields: Array<"school" | "sport" | "qualification" | "certification" | "organisation" | "media_house" | "team_name" | "zone" | "district" | "province" | "experience_years" | "federation">;
  weight: number; // higher = more scrutiny required
}

const ROLES: RoleDef[] = [
  { value: "viewer", label: "Supporter / Viewer", group: "Supporter", auto: true, fields: [], weight: 0 },
  { value: "athlete", label: "Athlete", group: "Supporter", fields: ["school", "sport", "federation"], federationScoped: true, weight: 1 },
  { value: "parent", label: "Parent / Guardian", group: "Supporter", fields: ["school"], weight: 1 },

  { value: "coach", label: "School Coach", group: "School Personnel", fields: ["school", "sport", "federation", "qualification", "experience_years"], federationScoped: true, weight: 2 },
  { value: "school_head", label: "School Head", group: "School Personnel", fields: ["school", "federation"], federationScoped: true, weight: 3 },
  { value: "hic", label: "Head in Charge (HIC)", group: "School Personnel", fields: ["school", "sport", "federation"], federationScoped: true, weight: 2 },
  { value: "team_manager", label: "Team Manager", group: "School Personnel", fields: ["school", "team_name", "sport"], weight: 1 },
  { value: "school_coordinator", label: "School Sports Coordinator", group: "School Personnel", fields: ["school", "federation"], federationScoped: true, weight: 2 },

  { value: "umpire", label: "Umpire", group: "Match Officials", fields: ["sport", "certification", "experience_years"], weight: 2 },
  { value: "referee", label: "Referee", group: "Match Officials", fields: ["sport", "certification", "experience_years"], weight: 2 },
  { value: "scorer", label: "Scorer", group: "Match Officials", fields: ["sport"], weight: 1 },
  { value: "timekeeper", label: "Timekeeper", group: "Match Officials", fields: ["sport"], weight: 1 },
  { value: "technical_delegate", label: "Technical Delegate", group: "Match Officials", fields: ["sport", "certification", "experience_years"], weight: 3 },

  { value: "broadcaster", label: "Broadcaster", group: "Federation & Media", fields: ["media_house"], weight: 2 },
  { value: "federation_official", label: "Federation Official", group: "Federation & Media", fields: ["organisation", "federation"], federationScoped: true, weight: 3 },
  { value: "competition_organiser", label: "Competition Organiser", group: "Federation & Media", fields: ["organisation", "sport"], weight: 3 },

  { value: "zonal_admin", label: "Zonal / Cluster Admin", group: "Regional Administration", fields: ["zone", "district", "province", "federation"], federationScoped: true, weight: 3 },
  { value: "district_admin", label: "District Admin", group: "Regional Administration", fields: ["district", "province", "federation"], federationScoped: true, weight: 3 },
  { value: "provincial_admin", label: "Provincial Admin", group: "Regional Administration", fields: ["province", "federation"], federationScoped: true, weight: 4 },
  { value: "national_admin", label: "National Admin (NASH / NAPH Executive)", group: "Regional Administration", fields: ["federation"], federationScoped: true, weight: 4 },
];

const REGIONAL: RoleKey[] = ["zonal_admin", "district_admin", "provincial_admin", "national_admin"];

const inputCls = "mt-1 w-full hairline rounded-md bg-background px-3 py-2 text-sm";

export default function RegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] = useState<RoleKey>("viewer");
  const [payload, setPayload] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => { setPayload({}); }, [requestedRole]);

  const def = ROLES.find(r => r.value === requestedRole)!;
  const needsApproval = !def.auto;

  function setField(k: string, v: string) { setPayload(p => ({ ...p, [k]: v })); }

  function validatePayload(): string | null {
    for (const f of def.fields) {
      if (f === "province" && requestedRole === "national_admin") continue;
      if (!payload[f] || !payload[f].trim()) return `Please provide ${f.replace("_", " ")}.`;
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validatePayload();
    if (err) { toast({ title: "Missing details", description: err, variant: "destructive" }); return; }

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { display_name: displayName, requested_role: requestedRole, phone },
      },
    });

    if (error) { setBusy(false); toast({ title: "Sign up failed", description: error.message, variant: "destructive" }); return; }

    const newUserId = data.user?.id;
    if (newUserId && needsApproval) {
      // Unified role_requests entry (all non-auto roles)
      const { error: rrErr } = await (supabase as any).from("role_requests").insert({
        user_id: newUserId,
        requested_role: requestedRole,
        payload: { ...payload, display_name: displayName, phone },
        notes: notes.trim() || null,
      });
      if (rrErr) console.warn("role_requests insert failed:", rrErr.message);

      // Regional roles also mirror into region_admin_assignments for the existing region UI
      if (REGIONAL.includes(requestedRole)) {
        const level = requestedRole === "zonal_admin" ? "zonal"
          : requestedRole === "district_admin" ? "district"
          : requestedRole === "provincial_admin" ? "provincial" : "national";
        const { error: regErr } = await supabase.from("region_admin_assignments").insert({
          user_id: newUserId,
          level,
          zone_name: payload.zone?.trim() || null,
          district_name: payload.district?.trim() || null,
          province_name: payload.province || null,
          status: "pending",
          notes: notes.trim() || `Self-request via signup as ${requestedRole}`,
        });
        if (regErr) console.warn("region_admin_assignments insert failed:", regErr.message);
      }
    }

    setBusy(false);
    toast({
      title: "Account created",
      description: def.auto
        ? "You're signed in."
        : "Request submitted — a super admin will review and approve from the admin dashboard.",
    });
    navigate("/dashboard", { replace: true });
  }

  // group roles for tidy rendering
  const groups = Array.from(new Set(ROLES.map(r => r.group)));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NexusHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl hairline rounded-xl p-8">
          <h1 className="text-2xl font-semibold mb-1">Create account</h1>
          <p className="text-xs text-nexus-muted mb-6">
            Nexus serves both NASH (secondary schools) and NAPH (primary schools). Choose the role you're applying for — additional details are requested based on its scope, including which federation you belong to. Non-supporter roles need super admin approval.
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Display name</Label>
                <Input id="name" required value={displayName} onChange={e => setDisplayName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+263 …" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Role you are applying for</Label>
              {groups.map(g => (
                <div key={g}>
                  <p className="text-[10px] mono uppercase tracking-wider text-nexus-muted mb-1.5">{g}</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {ROLES.filter(r => r.group === g).map(r => (
                      <button key={r.value} type="button" onClick={() => setRequestedRole(r.value)}
                        className={`hairline rounded-md px-3 py-2 text-xs text-left transition ${requestedRole === r.value ? "bg-foreground text-primary-foreground" : "bg-background hover:bg-nexus-surface"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span>{r.label}</span>
                          <span className="text-[9px] opacity-70">{r.auto ? "instant" : `weight ${r.weight}`}</span>
                        </div>
                        {!r.auto && <div className="text-[9px] opacity-70 mt-0.5">Needs admin approval</div>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {def.fields.length > 0 && (
              <div className="hairline rounded-lg p-4 space-y-3 bg-nexus-surface/40">
                <p className="text-[10px] mono uppercase tracking-wider text-nexus-muted">Required details for {def.label}</p>

                {def.fields.includes("school") && (
                  <div>
                    <Label htmlFor="school">School name</Label>
                    <Input id="school" value={payload.school || ""} onChange={e => setField("school", e.target.value)} placeholder="e.g. Prince Edward School" />
                  </div>
                )}
                {def.fields.includes("team_name") && (
                  <div>
                    <Label htmlFor="team_name">Team name</Label>
                    <Input id="team_name" value={payload.team_name || ""} onChange={e => setField("team_name", e.target.value)} placeholder="e.g. PE Handball U16" />
                  </div>
                )}
                {def.fields.includes("sport") && (
                  <div>
                    <Label htmlFor="sport">Sport</Label>
                    <select id="sport" value={payload.sport || ""} onChange={e => setField("sport", e.target.value)} className={inputCls}>
                      <option value="">Select sport</option>
                      {SPORTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                {def.fields.includes("qualification") && (
                  <div>
                    <Label htmlFor="qualification">Coaching qualification</Label>
                    <Input id="qualification" value={payload.qualification || ""} onChange={e => setField("qualification", e.target.value)} placeholder="e.g. IHF Level 1 / NAPH Level 2" />
                  </div>
                )}
                {def.fields.includes("certification") && (
                  <div>
                    <Label htmlFor="certification">Officiating certification</Label>
                    <Input id="certification" value={payload.certification || ""} onChange={e => setField("certification", e.target.value)} placeholder="Body, grade & year (e.g. IHF C, 2024)" />
                  </div>
                )}
                {def.fields.includes("experience_years") && (
                  <div>
                    <Label htmlFor="experience_years">Years of experience</Label>
                    <Input id="experience_years" type="number" min={0} value={payload.experience_years || ""} onChange={e => setField("experience_years", e.target.value)} />
                  </div>
                )}
                {def.fields.includes("media_house") && (
                  <div>
                    <Label htmlFor="media_house">Media house / publication</Label>
                    <Input id="media_house" value={payload.media_house || ""} onChange={e => setField("media_house", e.target.value)} placeholder="e.g. ZBC Sport" />
                  </div>
                )}
                {def.fields.includes("organisation") && (
                  <div>
                    <Label htmlFor="organisation">Federation / organisation</Label>
                    <Input id="organisation" value={payload.organisation || ""} onChange={e => setField("organisation", e.target.value)} placeholder="e.g. Zimbabwe Handball Federation" />
                  </div>
                )}
                {def.fields.includes("zone") && (
                  <div>
                    <Label htmlFor="zone">Zone / Cluster name</Label>
                    <Input id="zone" value={payload.zone || ""} onChange={e => setField("zone", e.target.value)} placeholder="e.g. Hwange Zone A" />
                  </div>
                )}
                {def.fields.includes("district") && (
                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input id="district" value={payload.district || ""} onChange={e => setField("district", e.target.value)} placeholder="e.g. Hwange District" />
                  </div>
                )}
                {def.fields.includes("province") && (
                  <div>
                    <Label htmlFor="province">Province</Label>
                    <select id="province" value={payload.province || ""} onChange={e => setField("province", e.target.value)} className={inputCls}>
                      <option value="">Select province</option>
                      {PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                )}
                {def.fields.includes("federation") && (
                  <div>
                    <Label htmlFor="federation">Federation</Label>
                    <select id="federation" value={payload.federation || ""} onChange={e => setField("federation", e.target.value)} className={inputCls}>
                      <option value="">Select federation</option>
                      <option value="NASH">NASH — Secondary Schools</option>
                      <option value="NAPH">NAPH — Primary Schools</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {needsApproval && (
              <div>
                <Label htmlFor="notes">Note for reviewer (optional)</Label>
                <textarea id="notes" rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                  className={inputCls} placeholder="Anything that helps the super admin verify your role…" />
              </div>
            )}

            <Button type="submit" disabled={busy} className="w-full">{busy ? "Creating…" : "Create account"}</Button>
          </form>

          <p className="mt-6 text-xs text-center text-nexus-muted">
            Have an account? <Link to="/login" className="underline hover:text-foreground">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
