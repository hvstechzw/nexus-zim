import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useHasRole } from "@/hooks/useHasRole";
import { useToast } from "@/hooks/use-toast";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { Button } from "@/components/ui/button";

type Action = "full-sync" | "sync-schools" | "sync-students" | "sync-rosters";

export default function AdminSyncPage() {
  const { loading, hasRole, isAdmin } = useHasRole();
  const { toast } = useToast();
  const [busy, setBusy] = useState<Action | null>(null);

  const { data: logs = [], refetch } = useQuery({
    queryKey: ["ss-sync-log"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ss_sync_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["ss-counts"],
    queryFn: async () => {
      const [schools, students, verifications] = await Promise.all([
        supabase.from("teams").select("id", { count: "exact", head: true }).eq("is_ss_school", true),
        supabase.from("athletes").select("id", { count: "exact", head: true }).eq("is_ss_linked", true),
        supabase.from("scholastic_card_verifications").select("id", { count: "exact", head: true }).eq("status", "verified"),
      ]);
      return {
        schools: schools.count ?? 0,
        students: students.count ?? 0,
        verifications: verifications.count ?? 0,
      };
    },
  });

  if (loading) return <div className="p-12 text-center text-nexus-muted">Loading…</div>;
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NexusHeader />
      <main className="flex-1 px-4 sm:px-8 py-8 max-w-5xl w-full mx-auto">
        <div className="mb-6 text-xs mono text-nexus-muted">
          <Link to="/admin" className="hover:text-foreground">← Admin</Link>
        </div>
        <header className="mb-6">
          <p className="text-[10px] mono tracking-widest uppercase text-nexus-muted">Admin · Scholastic Sync</p>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-1">Sync with Scholastic Services</h1>
          <p className="text-sm text-nexus-muted mt-1">Pull schools and student athletes from the federated SS bridge.</p>
        </header>

        <section className="grid grid-cols-3 gap-3 mb-6">
          <Stat label="SS Schools" value={counts?.schools ?? 0} />
          <Stat label="SS Athletes" value={counts?.students ?? 0} />
          <Stat label="Verified Cards" value={counts?.verifications ?? 0} />
        </section>

        <section className="hairline rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold mb-3">Run sync</h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => run("full-sync")} disabled={!!busy}>
              {busy === "full-sync" ? "Syncing…" : "Full sync"}
            </Button>
            <Button variant="outline" onClick={() => run("sync-schools")} disabled={!!busy}>
              {busy === "sync-schools" ? "Syncing…" : "Schools only"}
            </Button>
            <Button variant="outline" onClick={() => run("sync-students")} disabled={!!busy}>
              {busy === "sync-students" ? "Syncing…" : "Students only"}
            </Button>
            <Button variant="outline" onClick={() => run("sync-rosters")} disabled={!!busy}>
              {busy === "sync-rosters" ? "Syncing…" : "Rosters only"}
            </Button>
          </div>
          <p className="text-xs text-nexus-muted mt-3">
            Federation auth (HMAC + JWT) is handled server-side. SS credentials are never exposed to the browser.
          </p>
        </section>

        <section className="hairline rounded-xl overflow-hidden">
          <header className="px-4 py-2.5 hairline-b bg-nexus-surface/40">
            <h3 className="text-[10px] mono tracking-widest uppercase text-nexus-muted">Recent runs ({logs.length})</h3>
          </header>
          <div className="divide-y" style={{ borderColor: "hsl(var(--silver-line))" }}>
            {logs.length === 0 && <div className="py-8 text-center text-xs text-nexus-muted">No sync runs yet.</div>}
            {logs.map((l: any) => (
              <div key={l.id} className="px-4 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-4 text-xs">
                <span className={`mono uppercase px-2 py-0.5 rounded text-[9px] ${l.status === "success" ? "bg-nexus-live/10 text-nexus-live" : l.status === "partial" ? "bg-yellow-500/10 text-yellow-600" : "bg-destructive/10 text-destructive"}`}>{l.status}</span>
                <div className="min-w-0">
                  <div className="font-medium">{l.sync_type} · {l.schools_synced} schools · {l.students_synced} students</div>
                  {l.error_message && <div className="text-destructive truncate text-[10px]">{l.error_message}</div>}
                </div>
                <span className="text-nexus-muted mono text-[10px]">{new Date(l.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
      <NexusFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="hairline rounded-xl p-5">
      <p className="text-[10px] mono tracking-widest uppercase text-nexus-muted">{label}</p>
      <p className="score-display text-3xl text-foreground mt-2">{value}</p>
    </div>
  );
}
