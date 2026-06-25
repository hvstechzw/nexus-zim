import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useHasRole } from "@/hooks/useHasRole";

// Always-live Scholastic Services sync widget.
// - Subscribes to ss_sync_log, teams and athletes via realtime so every
//   browser sees the latest counts within seconds.
// - Auto-runs a full sync on mount and every AUTO_INTERVAL_MS while open
//   (only when the signed-in user has permission to call the edge function).
// - Manual "Sync now" remains for forced refreshes.

const AUTO_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

export function SyncStatusWidget({ autoSyncIfEmpty = true }: { autoSyncIfEmpty?: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { isAdmin, hasRole } = useHasRole();
  const canSync = isAdmin || hasRole("hic");
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(() => localStorage.getItem("nexus_last_scholastic_sync"));
  const ranInitial = useRef(false);

  const { data: counts } = useQuery({
    queryKey: ["sync-counts"],
    queryFn: async () => {
      const [schools, students] = await Promise.all([
        supabase.from("teams").select("id", { count: "exact", head: true }),
        supabase.from("athletes").select("id", { count: "exact", head: true }),
      ]);
      return { schools: schools.count || 0, students: students.count || 0 };
    },
    refetchInterval: 15000,
  });

  const runSync = async (silent = false) => {
    if (!canSync) return;
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("scholastic-sync", {
        body: { action: "full-sync" },
      });
      if (error) throw error;
      const stamp = new Date().toISOString();
      localStorage.setItem("nexus_last_scholastic_sync", stamp);
      setLastSync(stamp);
      qc.invalidateQueries();
      if (!silent) {
        toast({
          title: "Scholastic sync complete",
          description: `Schools: ${(data as any)?.schoolsSynced ?? 0} · Students: ${(data as any)?.studentsSynced ?? 0}`,
        });
      }
    } catch (e: any) {
      if (!silent) toast({ title: "Sync failed", description: e.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  // Realtime: refresh counts + lastSync the instant any client completes a sync.
  useEffect(() => {
    const channel = supabase
      .channel("ss-sync-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ss_sync_log" }, (payload: any) => {
        const row = payload.new;
        if (row?.created_at) setLastSync(row.created_at);
        qc.invalidateQueries({ queryKey: ["sync-counts"] });
        qc.invalidateQueries({ queryKey: ["ss-sync-log"] });
        qc.invalidateQueries({ queryKey: ["ss-counts"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => {
        qc.invalidateQueries({ queryKey: ["sync-counts"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "athletes" }, () => {
        qc.invalidateQueries({ queryKey: ["sync-counts"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  // Auto-sync loop (only when caller has permission).
  useEffect(() => {
    if (!canSync) return;
    if (!ranInitial.current) {
      ranInitial.current = true;
      // initial silent sync; if data is empty we still sync, otherwise refresh in background.
      if (autoSyncIfEmpty || (counts && counts.schools === 0)) runSync(true);
    }
    const id = setInterval(() => runSync(true), AUTO_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSync]);

  return (
    <div className="hairline rounded-xl p-4 sm:p-5 bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-shadow">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${syncing ? "bg-foreground/10 animate-pulse" : "bg-emerald-500/10"}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${syncing ? "bg-foreground animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground flex items-center gap-2">
            Scholastic Services Sync
            <span className="text-[9px] mono uppercase tracking-widest text-emerald-600">● Live</span>
          </p>
          <p className="text-[10px] text-nexus-muted mt-0.5">
            {syncing
              ? "Syncing…"
              : lastSync
                ? `Auto-sync every 2 min · last: ${new Date(lastSync).toLocaleTimeString()}`
                : canSync ? "Auto-sync every 2 min" : "Realtime · admin sign-in required to push"}
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
          disabled={syncing || !canSync}
          className="h-9 px-4 text-xs font-semibold rounded-lg bg-foreground text-primary-foreground hover:opacity-85 transition-opacity btn-click disabled:opacity-50"
        >
          {syncing ? "Syncing…" : "Sync now"}
        </button>
      </div>
    </div>
  );
}
