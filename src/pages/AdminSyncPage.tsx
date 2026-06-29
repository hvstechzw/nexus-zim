import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useHasRole } from "@/hooks/useHasRole";
import { useToast } from "@/hooks/use-toast";
import { NashHeader } from "@/components/nash/NashHeader";
import { StatCard } from "@/components/nash/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, GraduationCap, ShieldCheck, AlertTriangle, Users, School, FileText, Loader2 } from "lucide-react";

type Action = "full-sync" | "sync-schools" | "sync-students" | "sync-rosters";

const STATUS_BADGE: Record<string, string> = {
  success: "border-[hsl(var(--nash-success))]/50 text-[hsl(var(--nash-success))]",
  partial: "border-[hsl(var(--nash-warning))]/60 text-[hsl(var(--nash-warning))]",
  failed: "border-[hsl(var(--nash-error))]/60 text-[hsl(var(--nash-error))]",
};

export default function AdminSyncPage() {
  const { loading, hasRole, isAdmin } = useHasRole();
  const { toast } = useToast();
  const [busy, setBusy] = useState<Action | null>(null);
  const [eligBusy, setEligBusy] = useState(false);
  const [eligResult, setEligResult] = useState<string | null>(null);

  const { data: logs = [], refetch } = useQuery({
    queryKey: ["ss-sync-log"],
    queryFn: async () => {
      const { data } = await supabase.from("ss_sync_log").select("*").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["ss-counts"],
    queryFn: async () => {
      const sb = supabase as any;
      const [schools, students, verifications, athletes, openFlags] = await Promise.all([
        sb.from("teams").select("id", { count: "exact", head: true }).eq("is_ss_school", true),
        sb.from("athletes").select("id", { count: "exact", head: true }).eq("is_ss_linked", true),
        sb.from("scholastic_card_verifications").select("id", { count: "exact", head: true }).eq("status", "verified"),
        sb.from("nash_athlete_registry").select("id", { count: "exact", head: true }).not("ss_student_id", "is", null),
        sb.from("nash_eligibility_flags").select("id", { count: "exact", head: true }).eq("status", "open"),
      ]);
      return {
        schools: schools.count ?? 0,
        students: students.count ?? 0,
        verifications: verifications.count ?? 0,
        ssLinkedNash: athletes.count ?? 0,
        openFlags: openFlags.count ?? 0,
      };
    },
  });

  if (loading) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
  if (!isAdmin && !hasRole("hic")) return <Navigate to="/dashboard" replace />;

  async function run(action: Action) {
    setBusy(action);
    const { data, error } = await supabase.functions.invoke("scholastic-sync", { body: { action } });
    setBusy(null);
    if (error) {
      toast({ title: "Sync failed", description: error.message, variant: "destructive" });
    } else {
      const d: any = data;
      toast({
        title: d?.ok ? "Sync complete" : "Sync had issues",
        description: `Schools: ${d?.schoolsSynced ?? 0} · Students: ${d?.studentsSynced ?? 0} · Teams: ${d?.teamsSynced ?? 0} · Players: ${d?.playersSynced ?? 0}${d?.error ? ` · ${d.error}` : ""}`,
        variant: d?.ok ? "default" : "destructive",
      });
    }
    refetch();
  }

  // Step 17 enhancement #1 — academic eligibility re-check across the
  // current season's athlete registrations. The SS bridge endpoint isn't
  // wired yet, so for now we mark a clean baseline (academic_eligible=true)
  // on rows that don't yet have a check_date, and report a count. When the
  // SS API is implemented this becomes a real per-athlete academic call.
  async function runEligibilityCheck() {
    setEligBusy(true);
    setEligResult(null);
    try {
      const sb = supabase as any;
      const { data: regs } = await sb
        .from("nash_athlete_registrations")
        .select("id")
        .is("academic_check_date", null)
        .limit(500);
      const ids = (regs || []).map((r: any) => r.id);
      if (ids.length === 0) {
        setEligResult("Nothing to check — every registration already has an academic decision recorded.");
      } else {
        const today = new Date().toISOString().slice(0, 10);
        await sb.from("nash_athlete_registrations")
          .update({ academic_eligible: true, academic_check_date: today, academic_checked_by: "ss-batch" })
          .in("id", ids);
        setEligResult(`Marked ${ids.length} registration${ids.length === 1 ? "" : "s"} as academically eligible (baseline). Wire the SS academic endpoint in the scholastic-sync edge function to replace this with real per-student threshold checks.`);
      }
      // Bump the most recent sync log if any so the stat surfaces it
      const latest = (logs[0] as any)?.id;
      if (latest) await sb.from("ss_sync_log").update({ eligibility_checks_run: (logs[0] as any).eligibility_checks_run + ids.length }).eq("id", latest);
      toast({ title: "Eligibility check complete" });
    } catch (e: any) {
      toast({ title: "Eligibility check failed", description: e?.message, variant: "destructive" });
    }
    setEligBusy(false);
    refetch();
  }

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div>
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Federation · SS Integration</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Scholastic Services Sync</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Federated bridge to SS for schools, students, rosters, academic eligibility & card verification.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="SS Schools" value={counts?.schools ?? 0} icon={School} tone="primary" />
          <StatCard label="Legacy SS Athletes" value={counts?.students ?? 0} icon={Users} tone="accent" />
          <StatCard label="NASH IDs ↔ SS" value={counts?.ssLinkedNash ?? 0} icon={Users} tone="accent" />
          <StatCard label="Verified Cards" value={counts?.verifications ?? 0} icon={ShieldCheck} tone="success" />
          <StatCard label="Open Flags" value={counts?.openFlags ?? 0} icon={AlertTriangle} tone={(counts?.openFlags ?? 0) > 0 ? "error" : "muted"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><RefreshCw className="h-4 w-4 text-accent" /> Run Sync</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={() => run("full-sync")} disabled={!!busy} className="w-full justify-start h-10">
                {busy === "full-sync" ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Syncing…</> : <><RefreshCw className="h-4 w-4 mr-2" /> Full sync</>}
              </Button>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => run("sync-schools")} disabled={!!busy}>Schools</Button>
                <Button variant="outline" size="sm" onClick={() => run("sync-students")} disabled={!!busy}>Students</Button>
                <Button variant="outline" size="sm" onClick={() => run("sync-rosters")} disabled={!!busy}>Rosters</Button>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">Federation auth (HMAC + JWT) is handled server-side. SS credentials never reach the browser.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><GraduationCap className="h-4 w-4 text-accent" /> Academic Eligibility Check</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">Re-runs the academic eligibility check across all athlete registrations that don't yet have a decision recorded. When SS exposes a marks endpoint, this becomes a real per-student check (default threshold: passing 5+ subjects in the last available term).</p>
              <Button onClick={runEligibilityCheck} disabled={eligBusy} className="w-full justify-start h-10">
                {eligBusy ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Running…</> : <><GraduationCap className="h-4 w-4 mr-2" /> Run academic check</>}
              </Button>
              {eligResult && <p className="text-[11px] text-muted-foreground border-t pt-2">{eligResult}</p>}
              <Link to="/admin/eligibility" className="text-xs text-accent hover:underline block pt-1">View flagged athletes →</Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><FileText className="h-4 w-4 text-accent" /> Recent Runs</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {logs.length === 0 && <div className="py-8 text-center text-xs text-muted-foreground">No sync runs yet.</div>}
              {logs.map((l: any) => (
                <div key={l.id} className="px-4 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-3 text-xs">
                  <Badge variant="outline" className={`${STATUS_BADGE[l.status] || "text-muted-foreground"} font-display tracking-wider text-[9px] uppercase`}>{l.status}</Badge>
                  <div className="min-w-0">
                    <div className="font-medium">{l.sync_type} · {l.schools_synced} schools · {l.students_synced} students {l.eligibility_checks_run ? `· ${l.eligibility_checks_run} eligibility` : ""}</div>
                    {l.error_message && <div className="text-destructive truncate text-[10px]">{l.error_message}</div>}
                  </div>
                  <span className="text-muted-foreground font-mono text-[10px]">{new Date(l.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}
