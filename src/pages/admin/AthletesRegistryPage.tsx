import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NashHeader } from "@/components/nash/NashHeader";
import { StatCard } from "@/components/nash/StatCard";
import { ProvinceSelector } from "@/components/nash/ProvinceSelector";
import { EligibilityIndicator } from "@/components/nash/EligibilityIndicator";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShieldCheck, AlertTriangle, Search, Plus, Link as LinkIcon } from "lucide-react";

interface Athlete {
  id: string;
  nash_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  current_school_name: string | null;
  province: string | null;
  is_active: boolean | null;
  is_suspended: boolean | null;
  ss_student_id: string | null;
  id_verified: boolean | null;
  photo_url: string | null;
}

function age(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

/**
 * National Athlete Registry — the persistent player database that finally
 * gives NASH continuity across seasons. Search, filter, and see at a glance
 * who's verified, who's SS-linked, and who's suspended.
 */
export default function AthletesRegistryPage() {
  const [rows, setRows] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("");
  const [stats, setStats] = useState({ total: 0, verified: 0, suspended: 0, ssLinked: 0 });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const sb = supabase as any;
      let q = sb.from("nash_athlete_registry").select("*").order("last_name").limit(1000);
      if (province) q = q.eq("province", province);
      const [main, total, verified, suspended, ssLinked] = await Promise.all([
        q,
        sb.from("nash_athlete_registry").select("id", { count: "exact", head: true }),
        sb.from("nash_athlete_registry").select("id", { count: "exact", head: true }).eq("id_verified", true),
        sb.from("nash_athlete_registry").select("id", { count: "exact", head: true }).eq("is_suspended", true),
        sb.from("nash_athlete_registry").select("id", { count: "exact", head: true }).not("ss_student_id", "is", null),
      ]);
      if (cancelled) return;
      setRows((main.data || []) as Athlete[]);
      setStats({
        total: total.count ?? 0,
        verified: verified.count ?? 0,
        suspended: suspended.count ?? 0,
        ssLinked: ssLinked.count ?? 0,
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [province]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      r.first_name.toLowerCase().includes(q) ||
      r.last_name.toLowerCase().includes(q) ||
      r.nash_id.toLowerCase().includes(q) ||
      (r.current_school_name || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Federation · Registry</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">National Athlete Registry</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Persistent NASH IDs across seasons · linked to Scholastic Services where available.</p>
          </div>
          <Button asChild>
            <Link to="/admin/athletes/new"><Plus className="h-4 w-4 mr-1" /> Register Athlete</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Athletes" value={stats.total} icon={Users} tone="primary" />
          <StatCard label="ID Verified" value={stats.verified} icon={ShieldCheck} tone="success" />
          <StatCard label="SS Linked" value={stats.ssLinked} icon={LinkIcon} tone="accent" />
          <StatCard label="Suspended" value={stats.suspended} icon={AlertTriangle} tone={stats.suspended > 0 ? "error" : "muted"} />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base font-display tracking-wide">Athletes</CardTitle>
              <Badge variant="secondary" className="font-mono">{filtered.length}</Badge>
              <div className="flex-1" />
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="h-9 pl-8 w-64" placeholder="Search name, NASH ID, school" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <ProvinceSelector value={province} onChange={setProvince} allOption className="h-9 w-48" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NASH ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>SS Link</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && <TableRow><TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">Loading…</TableCell></TableRow>}
                  {!loading && filtered.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">No athletes match the current filters. The registry is populated as schools register teams or sync from Scholastic Services.</TableCell></TableRow>
                  )}
                  {filtered.map((a) => {
                    const yrs = age(a.date_of_birth);
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-[11px] text-accent">{a.nash_id}</TableCell>
                        <TableCell>
                          <Link to={`/players/${a.nash_id}`} className="text-sm font-medium hover:underline">
                            {a.last_name}, {a.first_name}
                          </Link>
                        </TableCell>
                        <TableCell className="tabular-nums text-xs">{yrs ?? "—"}</TableCell>
                        <TableCell className="text-xs capitalize">{a.gender ?? "—"}</TableCell>
                        <TableCell className="text-xs">{a.current_school_name ?? "—"}</TableCell>
                        <TableCell className="text-xs">{a.province ?? "—"}</TableCell>
                        <TableCell>
                          {a.id_verified ? <Badge variant="outline" className="text-[10px] border-[hsl(var(--nash-success))]/50 text-[hsl(var(--nash-success))]">Verified</Badge> : <span className="text-[11px] text-muted-foreground">Pending</span>}
                        </TableCell>
                        <TableCell>
                          {a.ss_student_id ? <Badge variant="outline" className="text-[10px] border-accent/50 text-accent">SS</Badge> : <span className="text-[11px] text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <EligibilityIndicator
                            status={a.is_suspended ? "suspended" : a.is_active ? "clear" : "flagged"}
                          />
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
    </div>
  );
}
