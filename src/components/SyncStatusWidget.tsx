import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function SyncStatusWidget({ autoSyncIfEmpty = true }: { autoSyncIfEmpty?: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(() => localStorage.getItem("nexus_last_scholastic_sync"));

  const { data: counts } = useQuery({
    queryKey: ["sync-counts"],
    queryFn: async () => {
      const [schools, students] = await Promise.all([
        supabase.from("teams").select("id", { count: "exact", head: true }),
        supabase.from("athletes").select("id", { count: "exact", head: true }),
      ]);
      return { schools: schools.count || 0, students: students.count || 0 };
    },
    refetchInterval: 30000,
  });

  const runSync = async (silent = false) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("scholastic-sync?action=sync-all" as any, { method: "POST" });
      if (error) throw error;
      const stamp = new Date().toISOString();
      localStorage.setItem("nexus_last_scholastic_sync", stamp);
      setLastSync(stamp);
      qc.invalidateQueries();
      if (!silent) toast({ title: "Scholastic sync complete", description: `Schools: ${data?.schools?.synced ?? 0} · Students: ${data?.students?.synced ?? 0}` });
    } catch (e: any) {
      if (!silent) toast({ title: "Sync failed", description: e.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (autoSyncIfEmpty && counts && counts.schools === 0 && !syncing && !lastSync) {
      runSync(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts?.schools, autoSyncIfEmpty]);

  return (
    <div className="hairline rounded-xl p-4 sm:p-5 bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-shadow">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${syncing ? "bg-foreground/10 animate-pulse" : "bg-emerald-500/10"}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${syncing ? "bg-foreground animate-pulse" : "bg-emerald-500"}`} />
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">Scholastic Services Sync</p>
          <p className="text-[10px] text-nexus-muted mt-0.5">
            {syncing ? "Syncing…" : lastSync ? `Last sync: ${new Date(lastSync).toLocaleString()}` : "Never synced"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="text-right">
          <p className="score-display text-base sm:text-lg text-foreground">{counts?.schools ?? "—"}</p>
          <p className="text-[9px] mono uppercase tracking-wider text-nexus-muted">Schools</p>
        </div>
        <div className="text-right">
          <p className="score-display text-base sm:text-lg text-foreground">{counts?.students ?? "—"}</p>
          <p className="text-[9px] mono uppercase tracking-wider text-nexus-muted">Students</p>
        </div>
        <button
          onClick={() => runSync(false)}
          disabled={syncing}
          className="h-9 px-4 text-xs font-semibold rounded-lg bg-foreground text-primary-foreground hover:opacity-85 transition-opacity btn-click disabled:opacity-50"
        >
          {syncing ? "Syncing…" : "Sync now"}
        </button>
      </div>
    </div>
  );
}
