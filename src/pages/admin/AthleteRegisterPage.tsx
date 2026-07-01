import { useEffect, useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { NashHeader } from "@/components/nash/NashHeader";
import { ProvinceSelector } from "@/components/nash/ProvinceSelector";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { ADMIN_TIER_ROLES } from "@/lib/nashRoles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Check, AlertTriangle, ShieldCheck, UserPlus, Link as LinkIcon } from "lucide-react";

interface Form {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: "male" | "female";
  id_number: string;
  province: string;
  current_school_name: string;
  ss_student_id: string;
  scholastic_card_number: string;
  photo_url: string;
  id_verified: boolean;
}

interface Duplicate {
  id: string;
  nash_id: string;
  first_name: string;
  last_name: string;
  current_school_name: string | null;
  province: string | null;
}

const EMPTY: Form = {
  first_name: "", last_name: "", date_of_birth: "", gender: "male",
  id_number: "", province: "", current_school_name: "",
  ss_student_id: "", scholastic_card_number: "", photo_url: "", id_verified: false,
};

/**
 * Generates a NASH ID in the spec format NASH-YYYY-NNNNNN.
 * Sequence is global per-year — looks up the highest existing NASH-YYYY-* and
 * increments. Acceptable contention model for a manual registration flow;
 * if registrations become bulk/automated, move to a Postgres sequence.
 */
async function nextNashId(): Promise<string> {
  const year = new Date().getFullYear();
  const sb = supabase as any;
  const { data } = await sb.from("nash_athlete_registry")
    .select("nash_id")
    .like("nash_id", `NASH-${year}-%`)
    .order("nash_id", { ascending: false })
    .limit(1);
  let seq = 1;
  if (data && data.length > 0) {
    const last = data[0].nash_id as string;
    const n = parseInt(last.split("-").pop() || "0", 10);
    if (Number.isFinite(n)) seq = n + 1;
  }
  return `NASH-${year}-${String(seq).padStart(6, "0")}`;
}

export default function AthleteRegisterPage() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasRole, loading: rolesLoading } = useHasRole();
  const canManage = !rolesLoading && hasRole(...ADMIN_TIER_ROLES, "coach", "school_head", "school_coordinator");

  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [checkingDup, setCheckingDup] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  // Live dual-enrollment detection — looks up same last_name + date_of_birth
  // matches on the registry. Different school => potential dual enrollment.
  useEffect(() => {
    const ln = form.last_name.trim();
    const dob = form.date_of_birth;
    if (ln.length < 2 || !dob) { setDuplicates([]); return; }
    setCheckingDup(true);
    const t = setTimeout(async () => {
      const { data } = await (supabase as any).from("nash_athlete_registry")
        .select("id,nash_id,first_name,last_name,current_school_name,province")
        .ilike("last_name", ln)
        .eq("date_of_birth", dob)
        .limit(5);
      setDuplicates((data || []) as Duplicate[]);
      setCheckingDup(false);
    }, 400);
    return () => clearTimeout(t);
  }, [form.last_name, form.date_of_birth]);

  async function submit() {
    if (!user) return;
    if (!form.first_name.trim() || !form.last_name.trim() || !form.date_of_birth || !form.gender) {
      toast.error("First name, last name, date of birth and gender are required");
      return;
    }
    setBusy(true);
    try {
      const nash_id = await nextNashId();
      const sb = supabase as any;
      const { data: created, error } = await sb.from("nash_athlete_registry").insert({
        nash_id,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        id_number: form.id_number.trim() || null,
        province: form.province || null,
        current_school_name: form.current_school_name.trim() || null,
        ss_student_id: form.ss_student_id.trim() || null,
        scholastic_card_number: form.scholastic_card_number.trim() || null,
        photo_url: form.photo_url.trim() || null,
        id_verified: form.id_verified,
        is_active: true,
        is_suspended: false,
      }).select("id,nash_id,first_name,last_name").single();

      if (error) throw error;

      // If a same-DOB+last_name match exists at a different school, automatically
      // raise a dual_enrollment flag — exactly the pain point in the brief.
      const conflict = duplicates.find((d) =>
        d.current_school_name && form.current_school_name &&
        d.current_school_name.trim().toLowerCase() !== form.current_school_name.trim().toLowerCase()
      );
      if (conflict) {
        await sb.from("nash_eligibility_flags").insert({
          nash_athlete_id: created.id,
          flag_type: "dual_enrollment",
          description: `Possible dual enrollment: ${form.first_name} ${form.last_name} (DOB ${form.date_of_birth}) also registered at ${conflict.current_school_name} as ${conflict.nash_id}.`,
          raised_by: user.id,
          status: "open",
        });
        toast.warning("Registered with dual-enrollment flag", {
          description: `Auto-raised against existing NASH ID ${conflict.nash_id} — review in /admin/eligibility.`,
        });
      } else {
        toast.success(`Registered as ${created.nash_id}`);
      }
      nav(`/players/${created.nash_id}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Could not register athlete");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || rolesLoading) {
    return <Shell><Card><CardContent className="p-6 text-sm text-muted-foreground">Loading…</CardContent></Card></Shell>;
  }
  if (!user) return <Navigate to="/auth/login" replace />;
  if (!canManage) {
    return <Shell><Card><CardContent className="p-6 text-sm">Only admins, coaches, or school heads can register athletes.</CardContent></Card></Shell>;
  }

  return (
    <Shell>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display tracking-wide flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-accent" /> Athlete Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="First name *"><Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} /></Field>
            <Field label="Last name *"><Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} /></Field>
            <Field label="Date of birth *"><Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} /></Field>
            <Field label="Gender *">
              <Select value={form.gender} onValueChange={(v) => set("gender", v as "male" | "female")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
              </Select>
            </Field>
            <Field label="National ID / Birth Certificate"><Input value={form.id_number} onChange={(e) => set("id_number", e.target.value)} placeholder="63-1234567A89" /></Field>
            <Field label="Province"><ProvinceSelector value={form.province} onChange={(v) => set("province", v)} /></Field>
            <Field label="Current School" className="md:col-span-2"><Input value={form.current_school_name} onChange={(e) => set("current_school_name", e.target.value)} placeholder="e.g. Prince Edward School" /></Field>
          </div>

          <div className="border-t pt-3 space-y-2">
            <p className="text-[10px] font-display tracking-wider uppercase text-accent flex items-center gap-1.5"><LinkIcon className="h-3 w-3" /> Scholastic Services link (optional)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="SS Student ID"><Input value={form.ss_student_id} onChange={(e) => set("ss_student_id", e.target.value)} placeholder="ss-student-uuid" /></Field>
              <Field label="Scholastic Card Number"><Input value={form.scholastic_card_number} onChange={(e) => set("scholastic_card_number", e.target.value)} placeholder="Card serial" /></Field>
              <Field label="Photo URL" className="md:col-span-2"><Input value={form.photo_url} onChange={(e) => set("photo_url", e.target.value)} placeholder="https://…" /></Field>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t pt-3">
            <div>
              <div className="text-sm font-medium">ID Verified</div>
              <div className="text-[11px] text-muted-foreground">Only enable if you've inspected the national ID or birth certificate.</div>
            </div>
            <Switch checked={form.id_verified} onCheckedChange={(v) => set("id_verified", v)} />
          </div>

          {/* Dual-enrollment warning */}
          {duplicates.length > 0 && (
            <Card className="border-[hsl(var(--nash-warning))]/40 bg-[hsl(var(--nash-warning))]/5">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-medium flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-[hsl(var(--nash-warning))]" />
                  {duplicates.length === 1 ? "1 athlete" : `${duplicates.length} athletes`} with the same last name &amp; DOB already in the registry
                </p>
                {duplicates.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 text-xs border border-border/40 rounded p-2">
                    <div className="min-w-0">
                      <div className="font-medium">{d.first_name} {d.last_name}</div>
                      <div className="text-muted-foreground">{d.current_school_name ?? "—"} · {d.province ?? ""}</div>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] text-accent">{d.nash_id}</Badge>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground">If you proceed and a school name differs, a <code>dual_enrollment</code> flag will be raised automatically for review in the Eligibility Engine.</p>
              </CardContent>
            </Card>
          )}
          {checkingDup && <p className="text-[11px] text-muted-foreground">Checking registry for duplicates…</p>}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild><Link to="/admin/athletes"><ArrowLeft className="h-4 w-4 mr-1" /> Back to registry</Link></Button>
        <Button onClick={submit} disabled={busy}>
          {busy ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Registering…</> : <><Check className="h-4 w-4 mr-1" /> Register Athlete</>}
        </Button>
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
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Federation · Registry</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Register Athlete</h1>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Issues a permanent NASH ID and auto-detects potential dual enrollment.
          </p>
        </div>
        {children}
        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
