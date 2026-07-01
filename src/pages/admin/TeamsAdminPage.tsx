import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { NashHeader } from "@/components/nash/NashHeader";
import { StatCard } from "@/components/nash/StatCard";
import { SportBadge } from "@/components/nash/SportBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useHasRole, ORGANIZER_ROLES } from "@/hooks/useHasRole";
import { Users, Plus, Trash2, Loader2, Search, Trophy } from "lucide-react";

interface SchoolTeam {
  id: string;
  name: string;
  discipline: string;
  age_group: string | null;
  gender: string | null;
  season: string | null;
  is_published: boolean;
  created_by: string | null;
  school?: { name: string; province: string | null } | null;
}

export default function TeamsAdminPage() {
  const { user } = useAuth();
  const { hasRole, loading: rolesLoading } = useHasRole();
  const canManage = !rolesLoading && hasRole(...ORGANIZER_ROLES);

  const [rows, setRows] = useState<SchoolTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<SchoolTeam | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("school_teams")
      .select("id,name,discipline,age_group,gender,season,is_published,created_by,school:school_id(name,province)")
      .order("created_at", { ascending: false }).limit(500);
    setRows((data || []) as SchoolTeam[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const removeTeam = async () => {
    if (!target) return;
    setBusy(true);
    try {
      const sb = supabase as any;
      // Clean dependent rows first to keep deletion deterministic
      await sb.from("nash_athlete_registrations").delete().eq("school_team_id", target.id);
      await sb.from("registrations").delete().eq("school_team_id", target.id);
      const { error } = await sb.from("school_teams").delete().eq("id", target.id);
      if (error) throw error;
      toast.success(`Deleted "${target.name}"`);
      setRows((prev) => prev.filter((r) => r.id !== target.id));
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete team");
    } finally {
      setBusy(false);
      setTarget(null);
    }
  };

  const filtered = useMemo(() => rows.filter((r) =>
    !search.trim() ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.school?.name || "").toLowerCase().includes(search.toLowerCase())
  ), [rows, search]);

  const stats = useMemo(() => ({
    total: rows.length,
    published: rows.filter((r) => r.is_published).length,
  }), [rows]);

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Federation · Teams</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">School Teams</h1>
            <p className="text-xs text-muted-foreground mt-0.5">All school team rosters across every sport. Create via the team builder, delete here.</p>
          </div>
          {canManage && (
            <Button asChild><Link to="/schools"><Plus className="h-4 w-4 mr-1" /> New Team</Link></Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Total Teams" value={stats.total} icon={Users} tone="primary" />
          <StatCard label="Published" value={stats.published} icon={Trophy} tone="success" />
          <StatCard label="Draft" value={stats.total - stats.published} icon={Users} tone="muted" />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base font-display tracking-wide">All Teams</CardTitle>
              <Badge variant="secondary" className="font-mono">{filtered.length}</Badge>
              <div className="flex-1" />
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="h-9 pl-8 w-64" placeholder="Search by team or school" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">Loading…</TableCell></TableRow>}
                  {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">No teams match. Create teams from a school profile in /schools.</TableCell></TableRow>}
                  {filtered.map((r) => {
                    const canDelete = canManage && r.created_by === user?.id;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-sm">{r.name}</TableCell>
                        <TableCell className="text-xs">{r.school?.name ?? "—"}<div className="text-[10px] text-muted-foreground">{r.school?.province ?? ""}</div></TableCell>
                        <TableCell><SportBadge code={r.discipline.toUpperCase().slice(0, 2)} /></TableCell>
                        <TableCell className="text-xs">{r.age_group} {r.gender}</TableCell>
                        <TableCell className="text-xs">{r.season ?? "—"}</TableCell>
                        <TableCell>
                          {r.is_published
                            ? <Badge variant="outline" className="text-[10px] border-[hsl(var(--nash-success))]/50 text-[hsl(var(--nash-success))]">Published</Badge>
                            : <Badge variant="secondary" className="text-[10px]">Draft</Badge>}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {canDelete && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setTarget(r)} title="Delete team">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
      </div>

      <AlertDialog open={!!target} onOpenChange={(o) => { if (!o) setTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this team?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{target?.name}</strong> and all its registrations will be permanently removed. Athletes in the NASH registry are preserved (they belong to the registry, not the team).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); removeTeam(); }} disabled={busy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
