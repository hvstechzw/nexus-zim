import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";

interface Latest {
  status: "success" | "failed" | "partial";
  created_at: string;
  schools_synced?: number | null;
  students_synced?: number | null;
}

/**
 * Compact Scholastic Services sync indicator — drops into admin dashboards
 * and gives a real-time read of the most recent ss_sync_log entry. Click-
 * through goes to the full sync console.
 */
export function SyncStatusBanner() {
  const [latest, setLatest] = useState<Latest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("ss_sync_log")
        .select("status,created_at,schools_synced,students_synced")
        .order("created_at", { ascending: false })
        .limit(1).maybeSingle();
      setLatest(data as Latest | null);
      setLoading(false);
    })();
  }, []);

  const stale = latest?.created_at
    ? (Date.now() - new Date(latest.created_at).getTime()) > 7 * 24 * 60 * 60 * 1000 // 7 days
    : true;

  return (
    <Link to="/admin/sync" className="block">
      <Card className={stale ? "border-[hsl(var(--nash-warning))]/40 bg-[hsl(var(--nash-warning))]/5" : "border-border"}>
        <CardContent className="p-3 flex items-center gap-3">
          <RefreshCw className={`h-4 w-4 ${stale ? "text-[hsl(var(--nash-warning))]" : "text-accent"}`} />
          <div className="flex-1 min-w-0 text-sm">
            <div className="font-medium text-xs flex items-center gap-2">
              Scholastic Services Sync
              {loading ? <Badge variant="secondary" className="text-[9px]">checking…</Badge>
                : latest?.status === "success" ? <Badge variant="outline" className="text-[9px] border-[hsl(var(--nash-success))]/50 text-[hsl(var(--nash-success))] gap-1"><CheckCircle2 className="h-2.5 w-2.5" />OK</Badge>
                : latest?.status === "partial" ? <Badge variant="outline" className="text-[9px] border-[hsl(var(--nash-warning))]/60 text-[hsl(var(--nash-warning))]">PARTIAL</Badge>
                : latest?.status === "failed" ? <Badge variant="destructive" className="text-[9px]">FAILED</Badge>
                : <Badge variant="secondary" className="text-[9px]">no syncs yet</Badge>}
              {stale && latest && <Badge variant="outline" className="text-[9px] border-[hsl(var(--nash-warning))]/60 text-[hsl(var(--nash-warning))] gap-1"><AlertTriangle className="h-2.5 w-2.5" />stale</Badge>}
            </div>
            {latest && (
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Last sync {new Date(latest.created_at).toLocaleString()} · {latest.schools_synced ?? 0} schools · {latest.students_synced ?? 0} students
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
