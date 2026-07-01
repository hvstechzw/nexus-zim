import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { NashHeader } from "@/components/nash/NashHeader";
import { StatCard } from "@/components/nash/StatCard";
import { EligibilityIndicator } from "@/components/nash/EligibilityIndicator";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { ADMIN_TIER_ROLES } from "@/lib/nashRoles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, XCircle, Search, RefreshCw, ShieldAlert } from "lucide-react";

const FLAG_LABEL: Record<string, string> = {
  overage: "Overage",
  dual_enrollment: "Dual Enrollment",
  academic_fail: "Academic Failure",
  medical_unfit: "Medical Unfit",
  suspended: "Suspended",
  fake_id: "Suspected Fake ID",
  other: "Other",
};

interface Flag {
  id: string;
  nash_athlete_id: string | null;
  registration_id: string | null;
  flag_type: string | null;
  description: string | null;
  raised_by: string | null;
  raised_at: string | null;
  status: string;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  athlete?: { first_name: string; last_name: string; nash_id: string; current_school_name: string | null; province: string | null } | null;
}

/**
 * Eligibility Engine — federation-tier review console for nash_eligibility_flags.
 * Lists open/all flags with athlete context, filters, and a resolve/dismiss modal
 * that writes back to the database with the actor's auth.uid as resolver.
 */
export default function EligibilityFlagsPage() {
  const { user } = useAuth();
  const { hasRole, loading: rolesLoading } = useHasRole();
  const { toast } = useToast();
  const canManage = !rolesLoading && hasRole(...ADMIN_TIER_ROLES);

  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"open" | "resolved" | "dismissed" | "all">("open");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ open: 0, resolved: 0, dismissed: 0 });
  const [active, setActive] = useState<Flag | null>(null);
  const [resolution, setResolution] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const sb = supabase as any;
    let q = sb
      .from("nash_eligibility_flags")
      .select("id,nash_athlete_id,registration_id,flag_type,description,raised_by,raised_at,status,resolved_by,resolved_at,resolution_notes,athlete:nash_athlete_id(first_name,last_name,nash_id,current_school_name,province)")
      .order("raised_at", { ascending: false })
      .limit(500);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (typeFilter !== "all") q = q.eq("flag_type", typeFilter);
    const { data, error } = await q;
    if (error) {
      toast({ title: "Failed to load flags", description: error.message, variant: "destructive" });
    } else {
      setFlags((data || []) as Flag[]);
    }
    // Stats query (independent of filters)
    const [openCount, resolvedCount, dismissedCount] = await Promise.all([
      sb.from("nash_eligibility_flags").select("id", { count: "exact", head: true }).eq("status", "open"),
      sb.from("nash_eligibility_flags").select("id", { count: "exact", head: true }).eq("status", "resolved"),
      sb.from("nash_eligibility_flags").select("id", { count: "exact", head: true }).eq("status", "dismissed"),
    ]);
    setStats({
      open: openCount.count ?? 0,
      resolved: resolvedCount.count ?? 0,
      dismissed: dismissedCount.count ?? 0,
    });
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter, typeFilter]);

  const resolve = async (newStatus: "resolved" | "dismissed") => {
    if (!active) return;
    setBusy(true);
    const sb = supabase as any;
    const { error } = await sb
      .from("nash_eligibility_flags")
      .update({
        status: newStatus,
        resolved_by: user?.id ?? null,
        resolved_at: new Date().toISOString(),
        resolution_notes: resolution.trim() || null,
      })
      .eq("id", active.id);
    if (error) {
      toast({ title: "Could not update flag", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Flag ${newStatus}`, description: `${active.athlete?.first_name ?? "Athlete"} — case closed.` });
      setActive(null);
      setResolution("");
      await load();
    }
    setBusy(false);
  };

  const filtered = flags.filter((f) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (f.athlete?.first_name || "").toLowerCase().includes(q) ||
      (f.athlete?.last_name || "").toLowerCase().includes(q) ||
      (f.athlete?.nash_id || "").toLowerCase().includes(q) ||
      (f.description || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div>
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Federation · Eligibility</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Eligibility Engine</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Age fraud, dual enrollment, academic, medical and suspension flags across all competitions.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Open" value={stats.open} icon={AlertTriangle} tone={stats.open > 0 ? "error" : "muted"} />
          <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} tone="success" />
          <StatCard label="Dismissed" value={stats.dismissed} icon={XCircle} tone="muted" />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base flex items-center gap-2 font-display tracking-wide">
                <ShieldAlert className="h-4 w-4 text-accent" /> Flag Queue
              </CardTitle>
              <div className="flex-1" />
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="h-9 pl-8 w-56" placeholder="Search athlete, NASH ID, description" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-44"><SelectValue placeholder="All flag types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(FLAG_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-9" onClick={load}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Athlete</TableHead>
                    <TableHead>NASH ID</TableHead>
                    <TableHead>School / Province</TableHead>
                    <TableHead>Flag</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Raised</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">Loading…</TableCell></TableRow>
                  )}
                  {!loading && filtered.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">No flags match the current filters.</TableCell></TableRow>
                  )}
                  {filtered.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium text-sm">
                        {f.athlete ? `${f.athlete.first_name} ${f.athlete.last_name}` : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">{f.athlete?.nash_id ?? "—"}</TableCell>
                      <TableCell className="text-xs">
                        <div>{f.athlete?.current_school_name ?? "—"}</div>
                        <div className="text-muted-foreground">{f.athlete?.province ?? ""}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-display tracking-wider">
                          {FLAG_LABEL[f.flag_type || "other"] ?? f.flag_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-sm truncate" title={f.description ?? undefined}>{f.description}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">
                        {f.raised_at ? new Date(f.raised_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <EligibilityIndicator
                          status={f.status === "open" ? "flagged" : f.status === "resolved" ? "clear" : "suspended"}
                          reason={f.resolution_notes ?? undefined}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {f.status === "open" && canManage ? (
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setActive(f)}>
                            Review
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">{f.status === "open" ? "—" : "closed"}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => { if (!o) { setActive(null); setResolution(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Flag</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Athlete: </span>
                <span className="font-medium">{active.athlete ? `${active.athlete.first_name} ${active.athlete.last_name}` : "—"}</span>
                <span className="text-muted-foreground font-mono text-xs"> ({active.athlete?.nash_id})</span>
              </div>
              <div>
                <span className="text-muted-foreground">Flag: </span>
                <Badge variant="outline" className="text-[10px]">{FLAG_LABEL[active.flag_type || "other"] ?? active.flag_type}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Description: </span>
                <span>{active.description ?? "—"}</span>
              </div>
              <Textarea
                placeholder="Resolution notes — what action was taken? (optional but recommended)"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { setActive(null); setResolution(""); }}>Cancel</Button>
            <Button variant="outline" disabled={busy} onClick={() => resolve("dismissed")}>
              <XCircle className="h-4 w-4 mr-1" /> Dismiss
            </Button>
            <Button disabled={busy} onClick={() => resolve("resolved")}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
