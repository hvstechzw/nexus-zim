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
import { TierBadge, type CompetitionTier } from "@/components/nash/TierBadge";
import { SportBadge } from "@/components/nash/SportBadge";
import { SportSelector } from "@/components/nash/SportSelector";
import { ProvinceSelector } from "@/components/nash/ProvinceSelector";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useHasRole, ORGANIZER_ROLES } from "@/hooks/useHasRole";
import { Trophy, Plus, Trash2, ChevronDown, ChevronRight, Loader2, Search, ShieldCheck, Activity, Edit3 } from "lucide-react";

interface Comp {
  id: string;
  name: string;
  discipline: string | null;
  province: string | null;
  tier: string | null;
  age_group: string | null;
  gender: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  is_nash_sanctioned: boolean | null;
  nash_sanction_number: string | null;
  created_by: string | null;
  total_entries: number | null;
}

interface Fixture {
  id: string;
  status: string;
  scheduled_at: string | null;
  round_label: string | null;
  home_score: number | null;
  away_score: number | null;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
}

const STATUS_TONE: Record<string, string> = {
  scheduled: "border-muted-foreground/40 text-muted-foreground",
  in_progress: "border-[hsl(var(--nash-error))]/60 text-[hsl(var(--nash-error))]",
  active: "border-[hsl(var(--nash-error))]/60 text-[hsl(var(--nash-error))]",
  completed: "border-[hsl(var(--nash-success))]/50 text-[hsl(var(--nash-success))]",
  final: "border-[hsl(var(--nash-success))]/50 text-[hsl(var(--nash-success))]",
  draft: "border-accent/50 text-accent",
  cancelled: "border-destructive/60 text-destructive",
};

export default function CompetitionsAdminPage() {
  const { user } = useAuth();
  const { hasRole, loading: rolesLoading } = useHasRole();
  const canManage = !rolesLoading && hasRole(...ORGANIZER_ROLES);

  const [comps, setComps] = useState<Comp[]>([]);
  const [fixtures, setFixtures] = useState<Record<string, Fixture[]>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("");
  const [province, setProvince] = useState("");
  const [deleteCompTarget, setDeleteCompTarget] = useState<Comp | null>(null);
  const [deleteFixtureTarget, setDeleteFixtureTarget] = useState<Fixture | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("competitions")
      .select("id,name,discipline,province,tier,age_group,gender,start_date,end_date,status,is_nash_sanctioned,nash_sanction_number,created_by,total_entries")
      .order("start_date", { ascending: false }).limit(500);
    setComps((data || []) as Comp[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadFixturesFor = async (competitionId: string) => {
    if (fixtures[competitionId]) return;
    const { data } = await (supabase as any)
      .from("fixtures")
      .select("id,status,scheduled_at,round_label,home_score,away_score,home_team:home_school_team_id(name),away_team:away_school_team_id(name)")
      .eq("competition_id", competitionId)
      .order("scheduled_at", { ascending: true });
    setFixtures((prev) => ({ ...prev, [competitionId]: (data || []) as Fixture[] }));
  };

  const toggleExpand = async (c: Comp) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(c.id) ? next.delete(c.id) : next.add(c.id);
      return next;
    });
    await loadFixturesFor(c.id);
  };

  const deleteCompetition = async () => {
    if (!deleteCompTarget) return;
    setBusy(true);
    try {
      const sb = supabase as any;
      // Clean dependent rows first — fixtures, registrations, budgets, awards.
      // FK cascades on the schema cover most of this, but explicit deletes keep
      // the order deterministic and let us toast a useful count.
      const { error: fxErr } = await sb.from("fixtures").delete().eq("competition_id", deleteCompTarget.id);
      if (fxErr && !String(fxErr.message).includes("does not exist")) throw fxErr;
      const { error } = await sb.from("competitions").delete().eq("id", deleteCompTarget.id);
      if (error) throw error;
      toast.success(`Deleted "${deleteCompTarget.name}"`);
      setComps((prev) => prev.filter((c) => c.id !== deleteCompTarget.id));
      setFixtures((prev) => { const next = { ...prev }; delete next[deleteCompTarget.id]; return next; });
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete competition");
    } finally {
      setBusy(false);
      setDeleteCompTarget(null);
    }
  };

  const deleteFixture = async () => {
    if (!deleteFixtureTarget) return;
    setBusy(true);
    try {
      const sb = supabase as any;
      await sb.from("score_entries").delete().eq("fixture_id", deleteFixtureTarget.id); // tolerate missing
      const { error } = await sb.from("fixtures").delete().eq("id", deleteFixtureTarget.id);
      if (error) throw error;
      toast.success("Fixture deleted");
      // Find which competition it belonged to in our cache and remove it
      setFixtures((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(next)) {
          next[k] = next[k].filter((f) => f.id !== deleteFixtureTarget.id);
        }
        return next;
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete fixture");
    } finally {
      setBusy(false);
      setDeleteFixtureTarget(null);
    }
  };

  const filtered = useMemo(() => comps.filter((c) =>
    (!search.trim() || c.name.toLowerCase().includes(search.toLowerCase())) &&
    (!sport || (c.discipline || "").toLowerCase().includes(sport.toLowerCase())) &&
    (!province || c.province === province)
  ), [comps, search, sport, province]);

  const stats = useMemo(() => ({
    total: comps.length,
    active: comps.filter((c) => c.status === "in_progress" || c.status === "active").length,
    sanctioned: comps.filter((c) => c.is_nash_sanctioned).length,
  }), [comps]);

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Federation · Competitions</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Competitions</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Create, manage, and delete sanctioned competitions across every NASH sport and tier.</p>
          </div>
          {canManage && (
            <Button asChild><Link to="/admin/competitions/new"><Plus className="h-4 w-4 mr-1" /> Create Competition</Link></Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Total Competitions" value={stats.total} icon={Trophy} tone="primary" />
          <StatCard label="Active / Live" value={stats.active} icon={Activity} tone={stats.active > 0 ? "error" : "muted"} />
          <StatCard label="NASH-Sanctioned" value={stats.sanctioned} icon={ShieldCheck} tone="accent" />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base font-display tracking-wide">All Competitions</CardTitle>
              <Badge variant="secondary" className="font-mono">{filtered.length}</Badge>
              <div className="flex-1" />
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="h-9 pl-8 w-56" placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <SportSelector value={sport} onChange={setSport} allOption className="h-9 w-44" />
              <ProvinceSelector value={province} onChange={setProvince} allOption className="h-9 w-44" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && <TableRow><TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">Loading…</TableCell></TableRow>}
                  {!loading && filtered.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">
                      No competitions match. {canManage && <Link to="/admin/competitions/new" className="text-accent hover:underline">Create one →</Link>}
                    </TableCell></TableRow>
                  )}
                  {filtered.map((c) => {
                    const isOpen = expanded.has(c.id);
                    const isMine = c.created_by === user?.id;
                    const canDelete = canManage && isMine; // safety: only allow creator (or true admins via RLS) to delete
                    return (
                      <>
                        <TableRow key={c.id} className="cursor-pointer hover:bg-accent/5">
                          <TableCell className="text-muted-foreground" onClick={() => toggleExpand(c)}>
                            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </TableCell>
                          <TableCell className="font-medium" onClick={() => toggleExpand(c)}>
                            <div>{c.name}</div>
                            {c.nash_sanction_number && <div className="text-[10px] font-mono text-accent">{c.nash_sanction_number}</div>}
                          </TableCell>
                          <TableCell>{c.discipline && <SportBadge code={c.discipline.toUpperCase().slice(0, 2)} />}</TableCell>
                          <TableCell>{c.tier && <TierBadge tier={c.tier as CompetitionTier} />}</TableCell>
                          <TableCell className="text-xs">{c.age_group} {c.gender}</TableCell>
                          <TableCell className="text-xs">{c.province ?? "—"}</TableCell>
                          <TableCell className="text-xs">{c.start_date ?? "—"}{c.end_date ? ` → ${c.end_date}` : ""}</TableCell>
                          <TableCell><Badge variant="outline" className={`${STATUS_TONE[c.status] || ""} text-[10px] font-display uppercase`}>{c.status}</Badge></TableCell>
                          <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8"><Link to={`/competition/${c.id}`} title="View"><Edit3 className="h-3.5 w-3.5" /></Link></Button>
                            {canDelete && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete" onClick={() => setDeleteCompTarget(c)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow key={`${c.id}-fx`}>
                            <TableCell colSpan={9} className="bg-muted/30 p-3">
                              <FixtureList list={fixtures[c.id]} canManage={canManage} onDelete={(f) => setDeleteFixtureTarget(f)} />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
      </div>

      {/* Competition delete confirm */}
      <AlertDialog open={!!deleteCompTarget} onOpenChange={(o) => { if (!o) setDeleteCompTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this competition?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteCompTarget?.name}</strong> and all its fixtures, registrations, scores, and budget rows will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); deleteCompetition(); }} disabled={busy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fixture delete confirm */}
      <AlertDialog open={!!deleteFixtureTarget} onOpenChange={(o) => { if (!o) setDeleteFixtureTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this fixture?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteFixtureTarget?.home_team?.name} vs {deleteFixtureTarget?.away_team?.name} will be removed along with any score entries. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); deleteFixture(); }} disabled={busy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />} Delete fixture
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FixtureList({ list, canManage, onDelete }: { list?: Fixture[]; canManage: boolean; onDelete: (f: Fixture) => void }) {
  if (!list) return <div className="text-xs text-muted-foreground">Loading fixtures…</div>;
  if (list.length === 0) return <div className="text-xs text-muted-foreground py-2 text-center">No fixtures yet for this competition.</div>;
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-display tracking-wider uppercase text-muted-foreground mb-1">Fixtures ({list.length})</div>
      {list.map((f) => (
        <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded border border-border/40 bg-background text-sm">
          <span className="text-[10px] font-mono text-muted-foreground w-12 shrink-0">{f.round_label ?? "—"}</span>
          <span className="flex-1 min-w-0 truncate">{f.home_team?.name ?? "TBD"} <span className="text-accent font-mono mx-1">{f.home_score ?? 0} – {f.away_score ?? 0}</span> {f.away_team?.name ?? "TBD"}</span>
          <Badge variant="outline" className="text-[9px]">{f.status}</Badge>
          {canManage && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(f)} title="Delete fixture">
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
