// Sports-director team builder. Creates a school_teams row, uploads team photo,
// assigns coach from synced school_staff, and seeds the roster from athletes
// already mirrored from Scholastic Services for THIS school only.

import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { useToast } from "@/hooks/use-toast";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type Athlete = { id: string; first_name: string; last_name: string; photo_url: string | null; date_of_birth: string | null; gender: string | null; nexus_sport: string | null; scholastic_card_verified: boolean };
type Staff = { id: string; ss_staff_id: string; name: string; primary_role: string | null; sports: string[] };

export default function TeamBuilderPage() {
  const { id: schoolId } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { loading: roleLoading, isAdmin, hasRole } = useHasRole();
  const { toast } = useToast();
  const nav = useNavigate();

  const [school, setSchool] = useState<any>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [name, setName] = useState("");
  const [discipline, setDiscipline] = useState<"handball" | "netball">("handball");
  const [ageGroup, setAgeGroup] = useState("U16");
  const [gender, setGender] = useState<"male" | "female" | "mixed">("mixed");
  const [season, setSeason] = useState(String(new Date().getFullYear()));
  const [coachStaffId, setCoachStaffId] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [publish, setPublish] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      const [{ data: s }, { data: a }, { data: st }] = await Promise.all([
        supabase.from("teams").select("id, name, school_name, external_school_id, logo_url, province").eq("id", schoolId).maybeSingle(),
        supabase.from("athletes").select("id, first_name, last_name, photo_url, date_of_birth, gender, nexus_sport, scholastic_card_verified, ss_school_id, school_name").order("last_name"),
        supabase.from("school_staff").select("id, ss_staff_id, name, primary_role, sports, ss_school_id").eq("sport_relevant", true),
      ]);
      setSchool(s);
      const ssId = (s as any)?.external_school_id;
      const filtered = (a || []).filter((x: any) =>
        (ssId && x.ss_school_id === ssId) || ((s as any)?.name && x.school_name === (s as any).name)
      );
      setAthletes(filtered as Athlete[]);
      setStaff(((st || []) as any[]).filter((x: any) => !ssId || x.ss_school_id === ssId) as Staff[]);
    })();
  }, [schoolId]);

  const eligible = useMemo(
    () => athletes.filter((a) => !a.nexus_sport || a.nexus_sport === discipline || a.nexus_sport === "both"),
    [athletes, discipline],
  );

  if (authLoading || roleLoading) return <div className="p-12 text-center text-nexus-muted">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin && !hasRole("hic", "coach", "school_coordinator", "team_manager")) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <NexusHeader />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="hairline rounded-xl p-8 max-w-md text-center">
            <p className="text-sm font-semibold mb-2">Sports staff only</p>
            <p className="text-xs text-nexus-muted">Only verified sports directors, coaches and HICs can build school teams. Your account isn't linked to a Scholastic Services sports staff record yet.</p>
            <Link to="/dashboard" className="text-xs mono mt-4 inline-block hover:underline">← Back to dashboard</Link>
          </div>
        </main>
        <NexusFooter />
      </div>
    );
  }

  function toggle(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  async function submit() {
    if (!schoolId || !name.trim()) {
      toast({ title: "Missing fields", description: "Team name required.", variant: "destructive" });
      return;
    }
    setBusy(true);
    let team_photo_url: string | null = null;
    if (photoFile) {
      const ext = photoFile.name.split(".").pop() || "jpg";
      const path = `team-photos/${schoolId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("nexus-media").upload(path, photoFile, { upsert: true });
      if (upErr) { setBusy(false); toast({ title: "Photo upload failed", description: upErr.message, variant: "destructive" }); return; }
      team_photo_url = supabase.storage.from("nexus-media").getPublicUrl(path).data.publicUrl;
    }
    const coach = staff.find((s) => s.ss_staff_id === coachStaffId);
    const { data: team, error: teamErr } = await supabase.from("school_teams").insert({
      school_id: schoolId,
      name: name.trim(),
      discipline,
      age_group: ageGroup,
      gender,
      season,
      team_photo_url,
      coach_ss_staff_id: coachStaffId || null,
      coach_name: coach?.name || null,
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
      created_by: user!.id,
    } as any).select("id").single();

    if (teamErr || !team) { setBusy(false); toast({ title: "Could not create team", description: teamErr?.message, variant: "destructive" }); return; }

    if (selected.size > 0) {
      const rows = Array.from(selected).map((athlete_id) => ({ school_team_id: team.id, athlete_id, added_by: user!.id }));
      const { error: rosterErr } = await supabase.from("school_team_players").insert(rows);
      if (rosterErr) toast({ title: "Roster partial", description: rosterErr.message, variant: "destructive" });
    }
    setBusy(false);
    toast({ title: "Team created", description: `${name} • ${selected.size} player(s)` });
    nav(`/schools/${schoolId}`);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NexusHeader />
      <main className="flex-1 px-4 sm:px-8 py-8 max-w-4xl w-full mx-auto">
        <div className="text-xs mono text-nexus-muted mb-4">
          <Link to={`/schools/${schoolId}`} className="hover:text-foreground">← {school?.school_name || school?.name || "School"}</Link>
        </div>
        <h1 className="display-font text-2xl font-bold">New School Team</h1>
        <p className="text-sm text-nexus-muted mb-6">Players are sourced exclusively from {school?.name || "this school"}'s Scholastic Services roster. Coach is picked from synced school staff.</p>

        <div className="grid gap-4 hairline rounded-xl p-5 mb-6">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Team name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Marist Handball U16" /></div>
            <div><Label>Season</Label><Input value={season} onChange={(e) => setSeason(e.target.value)} /></div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Sport</Label>
              <Select value={discipline} onValueChange={(v: any) => setDiscipline(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="handball">Handball</SelectItem><SelectItem value="netball">Netball</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>Age group</Label>
              <Select value={ageGroup} onValueChange={setAgeGroup}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["U13","U14","U15","U16","U17","U18","U19","Open"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={gender} onValueChange={(v: any) => setGender(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="male">Boys</SelectItem><SelectItem value="female">Girls</SelectItem><SelectItem value="mixed">Mixed</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Coach (from synced school staff)</Label>
              <Select value={coachStaffId} onValueChange={setCoachStaffId}>
                <SelectTrigger><SelectValue placeholder={staff.length ? "Select coach" : "No synced staff yet"} /></SelectTrigger>
                <SelectContent>
                  {staff.map((s) => <SelectItem key={s.ss_staff_id} value={s.ss_staff_id}>{s.name}{s.primary_role ? ` · ${s.primary_role}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Team photo</Label>
              <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            </div>
          </div>
        </div>

        <div className="hairline rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Roster</p>
            <span className="text-[10px] mono text-nexus-muted">{selected.size} selected · {eligible.length} eligible from SS</span>
          </div>
          {eligible.length === 0 ? (
            <p className="text-xs text-nexus-muted">No Scholastic Services students mirrored for this school yet. Run a sync from Admin first.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-1.5 max-h-96 overflow-y-auto">
              {eligible.map((a) => (
                <label key={a.id} className="flex items-center gap-2 p-2 hairline rounded-md hover:bg-nexus-surface cursor-pointer">
                  <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggle(a.id)} />
                  <div className="w-8 h-8 rounded-full bg-nexus-surface overflow-hidden flex items-center justify-center text-xs text-nexus-muted">
                    {a.photo_url ? <img src={a.photo_url} alt="" className="w-full h-full object-cover" /> : (a.first_name?.[0] || "?")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{a.first_name} {a.last_name}</p>
                    <p className="text-[10px] text-nexus-muted">{a.gender || "—"}{a.scholastic_card_verified ? " · verified" : ""}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 justify-between">
          <label className="flex items-center gap-2 text-xs"><Checkbox checked={publish} onCheckedChange={(v) => setPublish(v === true)} /> Publish to Nexus immediately</label>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => nav(`/schools/${schoolId}`)}>Cancel</Button>
            <Button onClick={submit} disabled={busy || !name.trim()}>{busy ? "Saving…" : "Create team"}</Button>
          </div>
        </div>
      </main>
      <NexusFooter />
    </div>
  );
}
