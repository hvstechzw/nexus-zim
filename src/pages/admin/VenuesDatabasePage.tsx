import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { NashHeader } from "@/components/nash/NashHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/nash/StatCard";
import { ProvinceSelector } from "@/components/nash/ProvinceSelector";
import { supabase } from "@/integrations/supabase/client";
import { useHasRole } from "@/hooks/useHasRole";
import { MapPin, Plus, Pencil, Trash2, Loader2, Search, Building2, ShieldCheck } from "lucide-react";

interface Venue {
  id: string;
  name: string;
  type: string;
  province: string;
  city: string;
  address: string | null;
  capacity: number | null;
  spectator_capacity: number | null;
  sports_supported: string[] | null;
  surface_type: string | null;
  has_changing_rooms: boolean | null;
  has_medical_room: boolean | null;
  has_spectator_seating: boolean | null;
  has_floodlights: boolean | null;
  contact_person: string | null;
  contact_phone: string | null;
  booking_notes: string | null;
  is_active: boolean | null;
  nash_approved: boolean | null;
}

const VENUE_TYPES = ["Indoor Court", "Outdoor Court", "Stadium", "School Hall", "Multi-Purpose", "Field"];
const SPORTS = ["Handball", "Netball", "Basketball", "Volleyball", "Football", "Rugby", "Athletics", "Hockey"];

const empty = (): Partial<Venue> => ({
  name: "", type: "Indoor Court", province: "", city: "", address: "",
  capacity: null, spectator_capacity: null, sports_supported: [], surface_type: "",
  has_changing_rooms: false, has_medical_room: false, has_spectator_seating: false, has_floodlights: false,
  contact_person: "", contact_phone: "", booking_notes: "",
  is_active: true, nash_approved: false,
});

export default function VenuesDatabasePage() {
  const { isAdmin, loading: rolesLoading } = useHasRole();
  const [rows, setRows] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Venue> | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Venue | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from("venues").select("*").order("name");
    if (error) toast.error(error.message);
    setRows((data || []) as Venue[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) =>
    !search.trim() ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.city.toLowerCase().includes(search.toLowerCase()) ||
    r.province.toLowerCase().includes(search.toLowerCase())
  ), [rows, search]);

  const stats = useMemo(() => ({
    total: rows.length,
    approved: rows.filter((r) => r.nash_approved).length,
    active: rows.filter((r) => r.is_active).length,
  }), [rows]);

  const openNew = () => { setEditing(empty()); setOpen(true); };
  const openEdit = (v: Venue) => { setEditing({ ...v }); setOpen(true); };

  const save = async () => {
    if (!editing) return;
    if (!editing.name?.trim() || !editing.province || !editing.city?.trim()) {
      toast.error("Name, province and city are required"); return;
    }
    setBusy(true);
    try {
      const payload: any = {
        name: editing.name.trim(),
        type: editing.type,
        province: editing.province,
        city: editing.city.trim(),
        address: editing.address || null,
        capacity: editing.capacity || null,
        spectator_capacity: editing.spectator_capacity || null,
        sports_supported: editing.sports_supported || [],
        surface_type: editing.surface_type || null,
        has_changing_rooms: editing.has_changing_rooms || false,
        has_medical_room: editing.has_medical_room || false,
        has_spectator_seating: editing.has_spectator_seating || false,
        has_floodlights: editing.has_floodlights || false,
        contact_person: editing.contact_person || null,
        contact_phone: editing.contact_phone || null,
        booking_notes: editing.booking_notes || null,
        is_active: editing.is_active !== false,
        nash_approved: editing.nash_approved || false,
      };
      const sb = supabase as any;
      if (editing.id) {
        const { error } = await sb.from("venues").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Venue updated");
      } else {
        const { error } = await sb.from("venues").insert(payload);
        if (error) throw error;
        toast.success("Venue created");
      }
      setOpen(false); setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!confirmDel) return;
    setBusy(true);
    try {
      const { error } = await (supabase as any).from("venues").delete().eq("id", confirmDel.id);
      if (error) throw error;
      toast.success("Venue deleted");
      setRows((prev) => prev.filter((r) => r.id !== confirmDel.id));
      setConfirmDel(null);
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    } finally { setBusy(false); }
  };

  const toggleSport = (sport: string) => {
    if (!editing) return;
    const cur = editing.sports_supported || [];
    setEditing({ ...editing, sports_supported: cur.includes(sport) ? cur.filter((s) => s !== sport) : [...cur, sport] });
  };

  if (rolesLoading) return <Shell><div className="p-8 text-sm text-muted-foreground">Loading…</div></Shell>;

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-display tracking-[0.2em] uppercase text-foreground">Federation · Venues</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Venues Database</h1>
          <p className="text-xs text-muted-foreground mt-0.5">National catalogue of venues available for competition selection.</p>
        </div>
        {isAdmin && <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New Venue</Button>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Venues" value={stats.total} icon={Building2} tone="primary" />
        <StatCard label="NASH Approved" value={stats.approved} icon={ShieldCheck} tone="success" />
        <StatCard label="Active" value={stats.active} icon={MapPin} tone="muted" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base font-display tracking-wide">All Venues</CardTitle>
            <Badge variant="secondary" className="font-mono">{filtered.length}</Badge>
            <div className="flex-1" />
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="min-h-11 pl-8 w-64" placeholder="Search name, city, province" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Sports</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">Loading…</TableCell></TableRow>}
                {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">No venues yet. Click "New Venue" to add the first.</TableCell></TableRow>}
                {filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium text-sm">{v.name}</TableCell>
                    <TableCell className="text-xs">{v.type}</TableCell>
                    <TableCell className="text-xs">{v.city}<div className="text-xs text-muted-foreground">{v.province}</div></TableCell>
                    <TableCell className="text-xs">{(v.sports_supported || []).join(", ") || "—"}</TableCell>
                    <TableCell className="text-xs tabular-nums">{v.spectator_capacity ?? v.capacity ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {v.nash_approved && <Badge variant="outline" className="text-xs border-border text-foreground w-fit">NASH</Badge>}
                        {!v.is_active && <Badge variant="secondary" className="text-xs w-fit">Inactive</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" className="min-h-11 w-11" onClick={() => openEdit(v)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="min-h-11 w-11 text-destructive" onClick={() => setConfirmDel(v)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit Venue" : "New Venue"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1 md:col-span-2"><Label className="text-xs">Name *</Label>
                <Input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Rufaro Stadium" /></div>
              <div className="space-y-1"><Label className="text-xs">Type</Label>
                <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VENUE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Surface</Label>
                <Input value={editing.surface_type || ""} onChange={(e) => setEditing({ ...editing, surface_type: e.target.value })} placeholder="Parquet / Grass / Astroturf" /></div>
              <div className="space-y-1"><Label className="text-xs">Province *</Label>
                <ProvinceSelector value={editing.province || ""} onChange={(v) => setEditing({ ...editing, province: v })} /></div>
              <div className="space-y-1"><Label className="text-xs">City *</Label>
                <Input value={editing.city || ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} placeholder="Harare" /></div>
              <div className="space-y-1 md:col-span-2"><Label className="text-xs">Address</Label>
                <Input value={editing.address || ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Playing Capacity</Label>
                <Input type="number" value={editing.capacity ?? ""} onChange={(e) => setEditing({ ...editing, capacity: parseInt(e.target.value) || null })} /></div>
              <div className="space-y-1"><Label className="text-xs">Spectator Capacity</Label>
                <Input type="number" value={editing.spectator_capacity ?? ""} onChange={(e) => setEditing({ ...editing, spectator_capacity: parseInt(e.target.value) || null })} /></div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs">Sports Supported</Label>
                <div className="flex flex-wrap gap-1.5">
                  {SPORTS.map((s) => {
                    const on = (editing.sports_supported || []).includes(s);
                    return (
                      <button key={s} type="button" onClick={() => toggleSport(s)}
                        className={`px-3 py-1 text-xs rounded-full border transition ${on ? "border-border bg-accent/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="md:col-span-2 grid grid-cols-2 gap-3">
                <Row label="Changing rooms"><Switch checked={!!editing.has_changing_rooms} onCheckedChange={(v) => setEditing({ ...editing, has_changing_rooms: v })} /></Row>
                <Row label="Medical room"><Switch checked={!!editing.has_medical_room} onCheckedChange={(v) => setEditing({ ...editing, has_medical_room: v })} /></Row>
                <Row label="Spectator seating"><Switch checked={!!editing.has_spectator_seating} onCheckedChange={(v) => setEditing({ ...editing, has_spectator_seating: v })} /></Row>
                <Row label="Floodlights"><Switch checked={!!editing.has_floodlights} onCheckedChange={(v) => setEditing({ ...editing, has_floodlights: v })} /></Row>
              </div>
              <div className="space-y-1"><Label className="text-xs">Contact Person</Label>
                <Input value={editing.contact_person || ""} onChange={(e) => setEditing({ ...editing, contact_person: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Contact Phone</Label>
                <Input value={editing.contact_phone || ""} onChange={(e) => setEditing({ ...editing, contact_phone: e.target.value })} /></div>
              <div className="space-y-1 md:col-span-2"><Label className="text-xs">Booking notes</Label>
                <Textarea rows={2} value={editing.booking_notes || ""} onChange={(e) => setEditing({ ...editing, booking_notes: e.target.value })} /></div>
              <div className="md:col-span-2 grid grid-cols-2 gap-3 pt-2 border-t">
                <Row label="Active (available for booking)"><Switch checked={editing.is_active !== false} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /></Row>
                <Row label="NASH-approved venue"><Switch checked={!!editing.nash_approved} onCheckedChange={(v) => setEditing({ ...editing, nash_approved: v })} /></Row>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete venue?</DialogTitle></DialogHeader>
          <p className="text-sm">Delete <strong>{confirmDel?.name}</strong>? Competitions & fixtures referencing it will lose the venue link.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDel(null)} disabled={busy}>Cancel</Button>
            <Button variant="destructive" onClick={remove} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs">{label}</span>{children}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-workspace mx-auto px-4 md:px-6 py-6 space-y-6">
        {children}
        <p className="text-xs text-muted-foreground text-center pt-2">Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}
