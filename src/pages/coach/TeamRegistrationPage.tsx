import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { NashHeader } from "@/components/nash/NashHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProvinceSelector } from "@/components/nash/ProvinceSelector";
import { AgeGroupFilter } from "@/components/AgeGroupFilter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Check, ChevronLeft, ChevronRight, Upload, Users, ShieldCheck } from "lucide-react";

const SPORTS = ["Handball", "Netball", "Basketball", "Volleyball", "Football", "Rugby", "Athletics", "Hockey", "Cricket", "Tennis", "Table Tennis", "Badminton", "Chess", "Swimming"];

const STEPS = ["School", "Team Details", "Media", "Review"] as const;

interface School { id: string; name: string; school_name: string | null; province: string | null; }

export default function TeamRegistrationPage() {
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [myTeams, setMyTeams] = useState<any[]>([]);

  const [schoolMode, setSchoolMode] = useState<"existing" | "new">("existing");
  const [schoolId, setSchoolId] = useState("");
  const [newSchool, setNewSchool] = useState({ name: "", province: "", is_ss: false });

  const [team, setTeam] = useState({
    name: "", discipline: "Handball", age_group: "U16", gender: "boys" as "boys" | "girls" | "mixed",
    season: String(new Date().getFullYear()), coach_name: "", notes: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: sc }, { data: mt }] = await Promise.all([
        (supabase as any).from("teams").select("id,name,school_name,province").order("name").limit(500),
        user ? (supabase as any).from("school_teams").select("id,name,discipline,age_group,gender,is_published,created_at,school:school_id(name,school_name)").eq("created_by", user.id).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
      ]);
      setSchools((sc || []) as School[]);
      setMyTeams(mt || []);
    })();
  }, [user?.id]);

  if (authLoading) return <Shell><div className="p-8 text-sm text-muted-foreground">Loading…</div></Shell>;
  if (!user) return <Navigate to="/auth/login" replace />;

  const canNext = () => {
    if (step === 0) return schoolMode === "existing" ? !!schoolId : (newSchool.name.trim() && newSchool.province);
    if (step === 1) return team.name.trim() && team.discipline && team.age_group;
    return true;
  };

  const uploadFile = async (f: File, prefix: string) => {
    const path = `team-media/${user.id}/${prefix}-${Date.now()}-${f.name.replace(/\s+/g, "_")}`;
    const { error } = await (supabase as any).storage.from("nexus-media").upload(path, f, { upsert: false });
    if (error) throw error;
    const { data } = (supabase as any).storage.from("nexus-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const submit = async () => {
    setBusy(true);
    try {
      const sb = supabase as any;
      let sid = schoolId;

      if (schoolMode === "new") {
        const { data: created, error } = await sb.from("teams").insert({
          name: newSchool.name.trim(),
          school_name: newSchool.name.trim(),
          discipline: team.discipline,
          province: newSchool.province,
          is_ss_school: newSchool.is_ss,
          manager_id: user.id,
          sport: "general",
        }).select("id").single();
        if (error) throw error;
        sid = created.id;
      }

      let logo_url: string | null = null;
      let photo_url: string | null = null;
      if (logoFile) { try { logo_url = await uploadFile(logoFile, "logo"); } catch (e: any) { toast.error("Logo upload failed: " + e.message); } }
      if (photoFile) { try { photo_url = await uploadFile(photoFile, "photo"); } catch (e: any) { toast.error("Photo upload failed: " + e.message); } }

      if (logo_url && schoolMode === "new") {
        await sb.from("teams").update({ logo_url }).eq("id", sid);
      }

      const { error: stErr } = await sb.from("school_teams").insert({
        school_id: sid,
        name: team.name.trim(),
        discipline: team.discipline,
        age_group: team.age_group,
        gender: team.gender,
        season: team.season,
        coach_name: team.coach_name || null,
        team_photo_url: photo_url,
        is_published: false,
        created_by: user.id,
      });
      if (stErr) throw stErr;

      toast.success("Team submitted for approval", { description: "A NASH admin will review and publish it." });
      setStep(0);
      setTeam({ ...team, name: "" });
      setLogoFile(null); setPhotoFile(null);
      const { data: mt } = await sb.from("school_teams").select("id,name,discipline,age_group,gender,is_published,created_at,school:school_id(name,school_name)").eq("created_by", user.id).order("created_at", { ascending: false });
      setMyTeams(mt || []);
    } catch (e: any) {
      toast.error(e?.message || "Submission failed");
    } finally { setBusy(false); }
  };

  return (
    <Shell>
      <div>
        <p className="text-xs font-display tracking-[0.2em] uppercase text-foreground">Team Registration</p>
        <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Register a Team</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Any school (SS-linked or independent) can submit a team. A NASH admin approves it before it appears in fixture generators.</p>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((label, i) => (
          <button key={label} disabled={i > step} onClick={() => i <= step && setStep(i)}
            className={`flex-1 min-w-fit px-3 py-1.5 rounded text-xs font-display tracking-wider uppercase transition-colors ${i === step ? "bg-primary text-primary-foreground" : i < step ? "text-foreground hover:bg-accent/10" : "text-muted-foreground"}`}>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-1.5">
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </span>{label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display tracking-wide flex items-center gap-2">
            <Users className="h-4 w-4 text-foreground" /> Step {step + 1} · {STEPS[step]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 min-h-[280px]">
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setSchoolMode("existing")}
                  className={`p-3 rounded border-2 text-left transition ${schoolMode === "existing" ? "border-border bg-accent/10" : "border-border"}`}>
                  <div className="text-sm font-medium">Existing school</div>
                  <div className="text-xs text-muted-foreground">Pick from the registry</div>
                </button>
                <button onClick={() => setSchoolMode("new")}
                  className={`p-3 rounded border-2 text-left transition ${schoolMode === "new" ? "border-border bg-accent/10" : "border-border"}`}>
                  <div className="text-sm font-medium">New / non-SS school</div>
                  <div className="text-xs text-muted-foreground">Register a school not yet in Nexus</div>
                </button>
              </div>
              {schoolMode === "existing" ? (
                <div className="space-y-2">
                  <Label className="text-xs">School *</Label>
                  <Select value={schoolId} onValueChange={setSchoolId}>
                    <SelectTrigger><SelectValue placeholder={schools.length ? "Select school" : "Loading schools…"} /></SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.school_name || s.name}{s.province ? ` · ${s.province}` : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">School name *</Label>
                    <Input value={newSchool.name} onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Province *</Label>
                    <ProvinceSelector value={newSchool.province} onChange={(v) => setNewSchool({ ...newSchool, province: v })} /></div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1 md:col-span-2"><Label className="text-xs">Team name *</Label>
                <Input value={team.name} onChange={(e) => setTeam({ ...team, name: e.target.value })} placeholder="e.g. St George's U16 Boys Handball" /></div>
              <div className="space-y-1"><Label className="text-xs">Sport *</Label>
                <Select value={team.discipline} onValueChange={(v) => setTeam({ ...team, discipline: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SPORTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Gender</Label>
                <Select value={team.gender} onValueChange={(v) => setTeam({ ...team, gender: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boys">Boys</SelectItem>
                    <SelectItem value="girls">Girls</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <AgeGroupFilter value={team.age_group} onChange={(v) => setTeam({ ...team, age_group: v })} />
              </div>
              <div className="space-y-1"><Label className="text-xs">Season</Label>
                <Input value={team.season} onChange={(e) => setTeam({ ...team, season: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Head Coach</Label>
                <Input value={team.coach_name} onChange={(e) => setTeam({ ...team, coach_name: e.target.value })} placeholder="Coach full name" /></div>
              <div className="space-y-1 md:col-span-2"><Label className="text-xs">Notes for the approver</Label>
                <Textarea rows={2} value={team.notes} onChange={(e) => setTeam({ ...team, notes: e.target.value })} placeholder="Any context that helps NASH validate this team" /></div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileField label="Team crest / logo" file={logoFile} onFile={setLogoFile} accept="image/*" hint="PNG or SVG, ideally square." />
              <FileField label="Team photo" file={photoFile} onFile={setPhotoFile} accept="image/*" hint="Full squad group photo." />
              <p className="md:col-span-2 text-xs text-muted-foreground">Media is optional; you can upload later from the coach dashboard.</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2 text-sm">
              <Row label="School" value={schoolMode === "existing" ? (schools.find((s) => s.id === schoolId)?.school_name || schools.find((s) => s.id === schoolId)?.name || "—") : `${newSchool.name} (new)`} />
              <Row label="Team" value={team.name} />
              <Row label="Sport" value={team.discipline} />
              <Row label="Division" value={`${team.age_group} · ${team.gender}`} />
              <Row label="Season" value={team.season} />
              <Row label="Coach" value={team.coach_name || "—"} />
              <Row label="Media" value={`${logoFile ? "Logo ✓" : "—"} · ${photoFile ? "Photo ✓" : "—"}`} />
              <p className="text-xs text-muted-foreground pt-2">Submitting sends this to the NASH admin queue. Athletes can be added to the roster once approved.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" disabled={step === 0 || busy} onClick={() => setStep((p) => Math.max(0, p - 1))}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={!canNext()} onClick={() => setStep((p) => p + 1)}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
        ) : (
          <Button disabled={busy} onClick={submit}>{busy ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Submitting…</> : <><ShieldCheck className="h-4 w-4 mr-1" /> Submit for approval</>}</Button>
        )}
      </div>

      {myTeams.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display tracking-wide">My Team Submissions</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {myTeams.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2 py-2 border-b border-border/40 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.school?.school_name || t.school?.name} · {t.discipline} · {t.age_group} {t.gender}</div>
                  </div>
                  {t.is_published
                    ? <Badge variant="outline" className="text-xs border-[hsl(var(--nash-success))]/50 text-[hsl(var(--nash-success))]">Approved</Badge>
                    : <Badge variant="secondary" className="text-xs">Pending review</Badge>}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Once approved, add players via <Link to="/athlete/register-nexus" className="underline">athlete registration</Link>, then attach them from the coach dashboard.</p>
          </CardContent>
        </Card>
      )}
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function FileField({ label, file, onFile, accept, hint }: { label: string; file: File | null; onFile: (f: File | null) => void; accept: string; hint: string; }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded cursor-pointer hover:border-border transition">
        {file ? (
          <>
            <Check className="h-5 w-5 text-foreground mb-1" />
            <span className="text-xs">{file.name}</span>
            <button type="button" onClick={(e) => { e.preventDefault(); onFile(null); }} className="text-xs text-destructive mt-1">Remove</button>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">Click to upload</span>
          </>
        )}
        <input type="file" accept={accept} className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
      </label>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-4">
        {children}
        <p className="text-xs text-muted-foreground text-center pt-2">Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}
