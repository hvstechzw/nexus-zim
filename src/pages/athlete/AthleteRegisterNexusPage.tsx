import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { NashHeader } from "@/components/nash/NashHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ProvinceSelector } from "@/components/nash/ProvinceSelector";
import { AgeGroupFilter } from "@/components/AgeGroupFilter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Loader2, UserPlus, Upload, Check, ShieldCheck } from "lucide-react";

const SPORTS = ["Handball", "Netball", "Basketball", "Volleyball", "Football", "Rugby", "Athletics", "Hockey"];

export default function AthleteRegisterNexusPage() {
  const { user, loading: authLoading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [existing, setExisting] = useState<any | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    first_name: "", last_name: "", date_of_birth: "", gender: "male" as "male" | "female",
    province: "", school_team_id: "", primary_sport: "Handball", age_group: "U16",
    preferred_position: "", jersey_number: "" as string | number, height_cm: "" as string | number,
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: me }, { data: pubTeams }] = await Promise.all([
        (supabase as any).from("athletes").select("*").eq("user_id", user.id).maybeSingle(),
        (supabase as any).from("school_teams").select("id,name,discipline,age_group,gender,school:school_id(name,school_name,province)").eq("is_published", true).order("name").limit(500),
      ]);
      if (me) {
        setExisting(me);
        setForm((f) => ({
          ...f,
          first_name: me.first_name || "",
          last_name: me.last_name || "",
          date_of_birth: me.date_of_birth || "",
          gender: (me.gender as any) || "male",
          province: me.province || "",
          primary_sport: me.primary_sport || "Handball",
          age_group: me.age_group || "U16",
          preferred_position: me.preferred_position || "",
          jersey_number: me.jersey_number ?? "",
          height_cm: me.height_cm ?? "",
        }));
      }
      setTeams(pubTeams || []);
    })();
  }, [user?.id]);

  if (authLoading) return <Shell><div className="p-8 text-sm text-muted-foreground">Loading…</div></Shell>;
  if (!user) return <Navigate to="/auth/login" replace />;

  const submit = async () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.province) {
      toast.error("Name and province are required"); return;
    }
    setBusy(true);
    try {
      const sb = supabase as any;
      let photo_url: string | null = existing?.photo_url || null;
      if (photoFile) {
        const path = `athlete-media/${user.id}/photo-${Date.now()}-${photoFile.name.replace(/\s+/g, "_")}`;
        const { error } = await sb.storage.from("nexus-media").upload(path, photoFile, { upsert: true });
        if (error) toast.error("Photo upload failed: " + error.message);
        else photo_url = sb.storage.from("nexus-media").getPublicUrl(path).data.publicUrl;
      }

      const payload: any = {
        user_id: user.id,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        display_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender,
        province: form.province,
        primary_sport: form.primary_sport,
        nexus_sport: form.primary_sport.toLowerCase() === "netball" ? "netball" : form.primary_sport.toLowerCase() === "handball" ? "handball" : null,
        disciplines: [form.primary_sport],
        age_group: form.age_group,
        preferred_position: form.preferred_position || null,
        jersey_number: form.jersey_number ? Number(form.jersey_number) : null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        photo_url,
      };

      let athleteId = existing?.id as string | undefined;
      if (existing) {
        const { error } = await sb.from("athletes").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { data: created, error } = await sb.from("athletes").insert(payload).select("id").single();
        if (error) throw error;
        athleteId = created.id;
      }

      // Optional: request to join a team roster (owner/coach still confirms)
      if (form.school_team_id && athleteId) {
        const { error } = await sb.from("school_team_players").insert({
          school_team_id: form.school_team_id,
          athlete_id: athleteId,
          jersey_number: form.jersey_number ? Number(form.jersey_number) : null,
          position: form.preferred_position || null,
        });
        if (error && !`${error.message}`.includes("duplicate")) {
          toast.warning("Saved profile, but couldn't attach to team", { description: error.message });
        }
      }

      toast.success(existing ? "Profile updated" : "Athlete profile created", { description: "Coaches can now add you to team cards." });
      const { data: me } = await sb.from("athletes").select("*").eq("user_id", user.id).maybeSingle();
      setExisting(me);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally { setBusy(false); }
  };

  return (
    <Shell>
      <div>
        <p className="text-xs font-display tracking-[0.2em] uppercase text-foreground">Athlete Registration</p>
        <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Register on Nexus</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Create your athlete profile so coaches can add you to team cards and score sheets.</p>
      </div>

      {existing && (
        <div className="flex items-center gap-2 p-3 rounded border bg-accent/5">
          <ShieldCheck className="h-4 w-4 text-foreground" />
          <span className="text-xs">You already have a profile — updating below will overwrite it.</span>
          <Badge variant="outline" className="ml-auto text-xs">{existing.is_ss_linked ? "SS-linked" : "Nexus-only"}</Badge>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display tracking-wide flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-foreground" /> Athlete Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">First name *</Label>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Last name *</Label>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Date of birth</Label>
            <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Gender</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Province *</Label>
            <ProvinceSelector value={form.province} onChange={(v) => setForm({ ...form, province: v })} /></div>
          <div className="space-y-1"><Label className="text-xs">Primary sport</Label>
            <Select value={form.primary_sport} onValueChange={(v) => setForm({ ...form, primary_sport: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SPORTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <AgeGroupFilter value={form.age_group} onChange={(v) => setForm({ ...form, age_group: v })} />
          </div>
          <div className="space-y-1"><Label className="text-xs">Preferred position</Label>
            <Input value={form.preferred_position} onChange={(e) => setForm({ ...form, preferred_position: e.target.value })} placeholder="e.g. Goal Keeper, Wing" /></div>
          <div className="space-y-1"><Label className="text-xs">Jersey number</Label>
            <Input type="number" value={form.jersey_number} onChange={(e) => setForm({ ...form, jersey_number: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Height (cm)</Label>
            <Input type="number" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Photo</Label>
            <label className="flex items-center justify-center h-10 px-3 border-2 border-dashed rounded cursor-pointer hover:border-border">
              {photoFile ? <span className="text-xs flex items-center gap-1"><Check className="h-3 w-3 text-foreground" /> {photoFile.name}</span>
                : <span className="text-xs text-muted-foreground flex items-center gap-1"><Upload className="h-3 w-3" /> Upload profile photo</span>}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          <div className="space-y-1 md:col-span-2"><Label className="text-xs">Attach to a team (optional)</Label>
            <Select value={form.school_team_id} onValueChange={(v) => setForm({ ...form, school_team_id: v })}>
              <SelectTrigger><SelectValue placeholder="Optional — request roster placement" /></SelectTrigger>
              <SelectContent>
                {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} — {t.school?.school_name || t.school?.name} · {t.age_group}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Only approved (published) teams appear here. Coach still confirms the placement.</p>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" onClick={submit} disabled={busy}>
        {busy ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving…</> : existing ? "Update profile" : "Create profile"}
      </Button>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-4">
        {children}
        <p className="text-xs text-muted-foreground text-center pt-2">Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}
