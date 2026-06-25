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

const ROLE_OPTIONS = [
  { value: "viewer", label: "Supporter / Viewer", auto: true, region: null as null | "zone" | "district" | "province" },
  { value: "coach", label: "Coach", auto: false, region: null },
  { value: "umpire", label: "Umpire / Referee", auto: false, region: null },
  { value: "hic", label: "Head in Charge (HIC)", auto: false, region: null },
  { value: "zonal_admin", label: "Zonal / Cluster Admin", auto: false, region: "zone" as const },
  { value: "district_admin", label: "District Admin", auto: false, region: "district" as const },
  { value: "provincial_admin", label: "Provincial Admin", auto: false, region: "province" as const },
  { value: "national_admin", label: "National Admin", auto: false, region: null },
];

export default function RegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] = useState("viewer");
  const [zone, setZone] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  const opt = ROLE_OPTIONS.find(r => r.value === requestedRole)!;
  const isRegional = ["zonal_admin", "district_admin", "provincial_admin", "national_admin"].includes(requestedRole);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate region fields
    if (requestedRole === "zonal_admin" && (!zone.trim() || !district.trim() || !province)) {
      toast({ title: "Region required", description: "Provide zone, district and province.", variant: "destructive" }); return;
    }
    if (requestedRole === "district_admin" && (!district.trim() || !province)) {
      toast({ title: "Region required", description: "Provide district and province.", variant: "destructive" }); return;
    }
    if (requestedRole === "provincial_admin" && !province) {
      toast({ title: "Region required", description: "Select province.", variant: "destructive" }); return;
    }

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { display_name: displayName, requested_role: requestedRole },
      },
    });

    if (error) { setBusy(false); toast({ title: "Sign up failed", description: error.message, variant: "destructive" }); return; }

    // If session exists (auto-confirm) and role is regional, file a pending request
    if (isRegional && data.user) {
      const level = requestedRole === "zonal_admin" ? "zonal"
        : requestedRole === "district_admin" ? "district"
        : requestedRole === "provincial_admin" ? "provincial" : "national";
      const { error: reqErr } = await supabase.from("region_admin_assignments").insert({
        user_id: data.user.id,
        level,
        zone_name: zone.trim() || null,
        district_name: district.trim() || null,
        province_name: province || null,
        status: "pending",
        notes: `Self-request via signup as ${requestedRole}`,
      });
      if (reqErr) console.warn("region request insert failed:", reqErr.message);
    }

    setBusy(false);
    toast({
      title: "Account created",
      description: opt.auto
        ? "You're signed in."
        : isRegional
          ? "Regional admin request submitted — a super admin will review and approve."
          : "Role request submitted — an admin will review and approve.",
    });
    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NexusHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg hairline rounded-xl p-8">
          <h1 className="text-2xl font-semibold mb-1">Create account</h1>
          <p className="text-xs text-nexus-muted mb-6">Join Nexus as a supporter, coach, umpire, HIC, or regional administrator.</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Display name</Label>
              <Input id="name" required value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <div>
              <Label>Role</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {ROLE_OPTIONS.map(r => (
                  <button key={r.value} type="button" onClick={() => setRequestedRole(r.value)}
                    className={`hairline rounded-md px-3 py-2 text-xs text-left transition ${requestedRole === r.value ? "bg-foreground text-primary-foreground" : "bg-background hover:bg-nexus-surface"}`}>
                    {r.label}
                    {!r.auto && <div className="text-[9px] opacity-70 mt-0.5">Needs admin approval</div>}
                  </button>
                ))}
              </div>
            </div>

            {isRegional && (
              <div className="hairline rounded-lg p-3 space-y-3 bg-nexus-surface/40">
                <p className="text-[10px] mono uppercase tracking-wider text-nexus-muted">Region you will administer</p>
                {requestedRole === "zonal_admin" && (
                  <div>
                    <Label htmlFor="zone">Zone / Cluster name</Label>
                    <Input id="zone" required value={zone} onChange={e => setZone(e.target.value)} placeholder="e.g. Hwange Zone A" />
                  </div>
                )}
                {(requestedRole === "zonal_admin" || requestedRole === "district_admin") && (
                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input id="district" required value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Hwange District" />
                  </div>
                )}
                {requestedRole !== "national_admin" && (
                  <div>
                    <Label htmlFor="province">Province</Label>
                    <select id="province" required value={province} onChange={e => setProvince(e.target.value)}
                      className="mt-1 w-full hairline rounded-md bg-background px-3 py-2 text-sm">
                      <option value="">Select province</option>
                      {PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                )}
                <p className="text-[10px] text-nexus-muted">Regional admins authorise fixtures, assign zone/district/provincial members, and approve sporting activities within their jurisdiction once a super admin verifies the request.</p>
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
