import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

// Public-safe trigger: kicks the scholastic-sync edge function on mount.
// Edge function throttles anonymous callers to once per 90s, so it's safe to mount widely.
// Also subscribes to realtime teams/athletes/ss_sync_log changes to refresh queries.
export function useScholasticAutoSync(intervalMs = 2 * 60 * 1000) {
  const qc = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    const fire = async () => {
      try {
        await supabase.functions.invoke("scholastic-sync", { body: { action: "full-sync" } });
        qc.invalidateQueries();
      } catch { /* silent */ }
    };
    if (!ran.current) {
      ran.current = true;
      fire();
    }
    const id = setInterval(fire, intervalMs);
    return () => clearInterval(id);
  }, [qc, intervalMs]);

  useEffect(() => {
    const channel = supabase
      .channel("ss-public-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => {
        qc.invalidateQueries();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "athletes" }, () => {
        qc.invalidateQueries();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ss_sync_log" }, () => {
        qc.invalidateQueries();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);
}
