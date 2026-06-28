import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NashHeader } from "@/components/nash/NashHeader";
import { StatCard } from "@/components/nash/StatCard";
import { SportBadge } from "@/components/nash/SportBadge";
import { ProvinceSelector } from "@/components/nash/ProvinceSelector";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Search, Plus, AlertTriangle, Award } from "lucide-react";

interface Official {
  id: string; nash_official_id: string; first_name: string; last_name: string;
  primary_role: string | null; grade: string | null; sports: string[] | null;
  province: string | null; district: string | null; phone: string | null;
  is_active: boolean | null; is_verified: boolean | null;
  certification_expiry: string | null; total_matches: number | null;
  performance_rating: number | null;
}

function daysUntil(d: string | null): number | null { if (!d) return null; return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000); }

export default function OfficialRegistryPage() {
  const [rows, setRows] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("");
  const [stats, setStats] = useState({ total: 0, active: 0, verified: 0, expiringSoon: 0 });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const sb = supabase as any;
      let q = sb.from("nash_officials").select("*").order("last_name").limit(1000);
      if (province) q = q.eq("province", province);
      const [main, total, active, verified] = await Promise.all([
        q,
        sb.from("nash_officials").select("id", { count: "exact", head: true }),
        sb.from("nash_officials").select("id", { count: "exact", head: true }).eq("is_active", true),
        sb.from("nash_officials").select("id", { count: "exact", head: true }).eq("is_verified", true),
      ]);
      if (cancelled) return;
      const data = (main.data || []) as Official[];
      setRows(data);
      const expiring = data.filter((o) => { const d = daysUntil(o.certification_expiry); return d !== null && d < 60 && d >= 0; }).length;
      setStats({ total: total.count ?? 0, active: active.count ?? 0, verified: verified.count ?? 0, expiringSoon: expiring });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [province]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
      r.nash_official_id?.toLowerCase().includes(q) ||
      (r.primary_role || "").toLowerCase().includes(q));
  }, [rows, search]);

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Federation · Officials</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Officials Registry</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Referees, umpires, scorers, timekeepers and technical delegates across all sports.</p>
          </div>
          <Button asChild><a href="/admin/officials/new"><Plus className="h-4 w-4 mr-1" /> Register Official</a></Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total" value={stats.total} icon={ShieldCheck} tone="primary" />
          <StatCard label="Active" value={stats.active} icon={Award} tone="success" />
          <StatCard label="Verified" value={stats.verified} icon={ShieldCheck} tone="accent" />
          <StatCard label="Cert Expiring < 60d" value={stats.expiringSoon} icon={AlertTriangle} tone={stats.expiringSoon > 0 ? "warning" : "muted"} />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base font-display tracking-wide">Officials</CardTitle>
              <Badge variant="secondary" className="font-mono">{filtered.length}</Badge>
              <div className="flex-1" />
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="h-9 pl-8 w-64" placeholder="Search name, ID, role" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <ProvinceSelector value={province} onChange={setProvince} allOption className="h-9 w-48" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NASH ID</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead>
                    <TableHead>Grade</TableHead><TableHead>Sports</TableHead><TableHead>Province</TableHead>
                    <TableHead>Matches</TableHead><TableHead>Rating</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && <TableRow><TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">Loading…</TableCell></TableRow>}
                  {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">No officials yet. Districts register officials as they're appointed and certified.</TableCell></TableRow>}
                  {filtered.map((o) => {
                    const d = daysUntil(o.certification_expiry);
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-[11px] text-accent">{o.nash_official_id}</TableCell>
                        <TableCell className="text-sm font-medium">{o.last_name}, {o.first_name}</TableCell>
                        <TableCell className="text-xs capitalize">{o.primary_role?.replace(/_/g, " ")}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] font-display">{o.grade ?? "—"}</Badge></TableCell>
                        <TableCell><div className="flex flex-wrap gap-1">{(o.sports || []).slice(0, 3).map((c) => <SportBadge key={c} code={c} />)}</div></TableCell>
                        <TableCell className="text-xs">{o.province ?? "—"}</TableCell>
                        <TableCell className="tabular-nums text-xs">{o.total_matches ?? 0}</TableCell>
                        <TableCell className="tabular-nums text-xs">{o.performance_rating ?? "—"}</TableCell>
                        <TableCell>
                          {o.is_active ? <Badge variant="outline" className="text-[10px] border-[hsl(var(--nash-success))]/50 text-[hsl(var(--nash-success))]">Active</Badge> : <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                          {d !== null && d < 60 && d >= 0 && <Badge variant="outline" className="ml-1 text-[9px] border-[hsl(var(--nash-warning))]/60 text-[hsl(var(--nash-warning))]">Cert {d}d</Badge>}
                          {d !== null && d < 0 && <Badge variant="destructive" className="ml-1 text-[9px]">Expired</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}
