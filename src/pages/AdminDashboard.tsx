import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { NashHeader } from "@/components/nash/NashHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { ScholasticIntegrationBanner } from "@/components/ScholasticBadge";
import { SyncStatusWidget } from "@/components/SyncStatusWidget";
import { InterSchoolFixturesBuilder } from "@/components/InterSchoolFixturesBuilder";
import { SchoolsDirectory } from "@/components/SchoolsDirectory";
import { SportingCalendar } from "@/components/admin/SportingCalendar";
import { UsersRolesPanel } from "@/components/admin/UsersRolesPanel";
import { RegionRequestsPanel } from "@/components/admin/RegionRequestsPanel";
import { RoleRequestsPanel } from "@/components/admin/RoleRequestsPanel";
import { StatCard as NashStatCard } from "@/components/nash/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { School, Users, Trophy, CalendarDays, MapPin, ShieldCheck, ClipboardList, Handshake, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useHasRole, AppRole, ORGANIZER_ROLES } from "@/hooks/useHasRole";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

type TabId =
  | "overview"
  | "schools"
  | "competitions"
  | "calendar"
  | "fixtures"
  | "officials"
  | "standings"
  | "broadcasts"
  | "users"
  | "role_requests"
  | "regions"
  | "federation";

interface TabDef {
  id: TabId;
  label: string;
  roles: AppRole[]; // empty = any admin role
}

// Admin-tier roles allowed in /admin — covers the full NASH/NAPH hierarchy
// (platform, federation, provincial, district, zonal + legacy roles) plus the
// competition-organiser tier, so newly seeded NASH/NAPH accounts aren't 403'd.
const ADMIN_ROLES: AppRole[] = Array.from(new Set([
  "super_admin",
  "admin",
  "national_admin",
  "provincial_admin",
  "district_admin",
  "zonal_admin",
  ...ORGANIZER_ROLES,
])) as AppRole[];

const ALL_TABS: TabDef[] = [
  { id: "overview", label: "Overview", roles: ADMIN_ROLES },
  { id: "schools", label: "Schools & Teams", roles: ADMIN_ROLES },
  { id: "competitions", label: "Competitions", roles: ADMIN_ROLES },
  { id: "calendar", label: "Sporting Calendar", roles: ADMIN_ROLES },
  { id: "fixtures", label: "Fixtures & Scoring", roles: ADMIN_ROLES },
  { id: "officials", label: "Officials", roles: ["super_admin", "admin", "national_admin", "provincial_admin"] },
  { id: "standings", label: "Standings & Records", roles: ADMIN_ROLES },
  { id: "broadcasts", label: "Broadcasts & Media", roles: ["super_admin", "admin", "national_admin"] },
  { id: "users", label: "Users & Roles", roles: ["super_admin"] },
  { id: "role_requests", label: "Role Applications", roles: ["super_admin", "admin"] },
  { id: "regions", label: "Region Requests", roles: ["super_admin"] },
  { id: "federation", label: "Federation Sync", roles: ["super_admin", "admin"] },
];

const inputCls = "bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all w-full";
const labelCls = "text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold";
const PROVINCES = ["Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"];
const LEVELS = ["primary_school","secondary_school","club_academy","provincial","national_league","national_cup","international"] as const;
const FORMATS = ["round_robin","single_elimination","double_elimination","swiss","league","ladder","custom_heats"] as const;
const STATUSES = ["draft","registration_open","registration_closed","ongoing","completed","cancelled"] as const;
const DISCIPLINES = ["Handball","Netball","Football","Basketball","Volleyball","Cricket","Rugby","Hockey","Tennis","Table Tennis","Badminton","Athletics","Swimming","Cross Country","Chess"];


// ── File upload helper ────────────────────────────────────────────
async function uploadFile(file: File, folder: string): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("nexus-media").upload(path, file, { upsert: true });
  if (error) { console.error("Upload error:", error); return null; }
  const { data } = supabase.storage.from("nexus-media").getPublicUrl(path);
  return data.publicUrl;
}

function FileUploadField({ label, value, onChange, folder }: { label: string; value: string; onChange: (url: string) => void; folder: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file, folder);
    if (url) onChange(url);
    setUploading(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls}>{label}</label>
      <div className="flex gap-2">
        <input value={value} onChange={e => onChange(e.target.value)} className={inputCls} placeholder="URL or upload..." />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex-shrink-0 h-10 px-4 text-xs font-semibold rounded-lg bg-nexus-surface hover:bg-nexus-silver transition-colors disabled:opacity-50">
          {uploading ? "..." : "Upload"}
        </button>
      </div>
      {value && <img src={value} alt="" className="w-10 h-10 rounded-lg object-cover mt-1 bg-white" />}
    </div>
  );
}

// ── Competition Form ──────────────────────────────────────────────
function CompetitionForm({ onSuccess, competitions }: { onSuccess: () => void; competitions: any[] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", discipline: "", level: "national_league", format: "round_robin", status: "draft", season: new Date().getFullYear().toString(), province: "", description: "", start_date: "", end_date: "", registration_deadline: "", max_participants: "", entry_fee: "", prize_pool: "", sponsor: "", parent_id: "", logo_url: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    setLoading(true);
    const { error } = await supabase.from("competitions").insert({
      name: form.name, discipline: form.discipline, level: form.level as typeof LEVELS[number],
      format: form.format as typeof FORMATS[number], status: form.status as typeof STATUSES[number],
      season: form.season, province: form.province || null, description: form.description || null,
      start_date: form.start_date || null, end_date: form.end_date || null,
      registration_deadline: form.registration_deadline || null,
      max_participants: form.max_participants ? Number(form.max_participants) : null,
      entry_fee: form.entry_fee ? Number(form.entry_fee) : 0,
      prize_pool: form.prize_pool ? Number(form.prize_pool) : 0,
      sponsor: form.sponsor || null, parent_id: form.parent_id || null, created_by: user.id,
      logo_url: form.logo_url || null,
    });
    setLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Competition created" });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="flex flex-col gap-1.5 md:col-span-2"><label className={labelCls}>Name *</label><input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={inputCls} placeholder="Premier Soccer League 2026" /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Discipline *</label>
        <select required value={form.discipline} onChange={e => setForm(f => ({...f, discipline: e.target.value}))} className={inputCls + " cursor-pointer"}>
          <option value="">Select</option>
          {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Level</label>
        <select value={form.level} onChange={e => setForm(f => ({...f, level: e.target.value}))} className={inputCls + " cursor-pointer"}>
          {LEVELS.map(l => <option key={l} value={l}>{l.replace(/_/g," ")}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Format</label>
        <select value={form.format} onChange={e => setForm(f => ({...f, format: e.target.value}))} className={inputCls + " cursor-pointer"}>
          {FORMATS.map(f => <option key={f} value={f}>{f.replace(/_/g," ")}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Status</label>
        <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={inputCls + " cursor-pointer"}>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Season</label><input value={form.season} onChange={e => setForm(f => ({...f, season: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Province</label>
        <select value={form.province} onChange={e => setForm(f => ({...f, province: e.target.value}))} className={inputCls + " cursor-pointer"}>
          <option value="">National</option>
          {PROVINCES.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Start Date</label><input type="date" value={form.start_date} onChange={e => setForm(f => ({...f, start_date: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>End Date</label><input type="date" value={form.end_date} onChange={e => setForm(f => ({...f, end_date: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Reg. Deadline</label><input type="date" value={form.registration_deadline} onChange={e => setForm(f => ({...f, registration_deadline: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Max Participants</label><input type="number" value={form.max_participants} onChange={e => setForm(f => ({...f, max_participants: e.target.value}))} className={inputCls} placeholder="16" /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Entry Fee (USD)</label><input type="number" value={form.entry_fee} onChange={e => setForm(f => ({...f, entry_fee: e.target.value}))} className={inputCls} placeholder="0" /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Prize Pool (USD)</label><input type="number" value={form.prize_pool} onChange={e => setForm(f => ({...f, prize_pool: e.target.value}))} className={inputCls} placeholder="0" /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Sponsor</label><input value={form.sponsor} onChange={e => setForm(f => ({...f, sponsor: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Parent Competition</label>
        <select value={form.parent_id} onChange={e => setForm(f => ({...f, parent_id: e.target.value}))} className={inputCls + " cursor-pointer"}>
          <option value="">None (Top-Level)</option>
          {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="md:col-span-2">
        <FileUploadField label="Competition Logo" value={form.logo_url} onChange={url => setForm(f => ({...f, logo_url: url}))} folder="competitions" />
      </div>
      <div className="flex flex-col gap-1.5 md:col-span-2"><label className={labelCls}>Description</label><textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className={inputCls} rows={2} /></div>
      <div className="md:col-span-2"><button type="submit" disabled={loading} className="h-11 px-8 text-sm font-semibold tracking-wide rounded-xl bg-foreground text-primary-foreground hover:opacity-85 transition-opacity btn-click disabled:opacity-50">{loading ? "Creating..." : "Create Competition"}</button></div>
    </form>
  );
}

// ── Fixture Form ──────────────────────────────────────────────────
function FixtureForm({ onSuccess, competitions }: { onSuccess: () => void; competitions: any[] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ competition_id: "", round_label: "", round_number: "", scheduled_at: "", home_team: "", away_team: "", venue_id: "" });
  const [loading, setLoading] = useState(false);

  const { data: teams = [] } = useQuery({ queryKey: ["form-teams"], queryFn: async () => { const { data } = await supabase.from("teams").select("id, name").limit(100); return data || []; } });
  const { data: venues = [] } = useQuery({ queryKey: ["form-venues"], queryFn: async () => { const { data } = await supabase.from("venues").select("id, name, city"); return data || []; } });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    setLoading(true);
    const { error } = await supabase.from("fixtures").insert({
      competition_id: form.competition_id,
      round_label: form.round_label || null,
      round_number: form.round_number ? Number(form.round_number) : null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      home_team_id: form.home_team || null,
      away_team_id: form.away_team || null,
      venue_id: form.venue_id || null,
      referee_id: user.id,
    });
    setLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Fixture created" });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="flex flex-col gap-1.5 md:col-span-2"><label className={labelCls}>Competition *</label>
        <select required value={form.competition_id} onChange={e => setForm(f => ({...f, competition_id: e.target.value}))} className={inputCls + " cursor-pointer"}>
          <option value="">Select competition</option>
          {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Round Label</label><input value={form.round_label} onChange={e => setForm(f => ({...f, round_label: e.target.value}))} className={inputCls} placeholder="Quarter Final..." /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Round Number</label><input type="number" value={form.round_number} onChange={e => setForm(f => ({...f, round_number: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Scheduled Date & Time</label><input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({...f, scheduled_at: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Venue</label>
        <select value={form.venue_id} onChange={e => setForm(f => ({...f, venue_id: e.target.value}))} className={inputCls + " cursor-pointer"}>
          <option value="">TBD</option>
          {(venues as any[]).map(v => <option key={v.id} value={v.id}>{v.name}, {v.city}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Home Team</label>
        <select value={form.home_team} onChange={e => setForm(f => ({...f, home_team: e.target.value}))} className={inputCls + " cursor-pointer"}>
          <option value="">TBD</option>
          {(teams as any[]).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Away Team</label>
        <select value={form.away_team} onChange={e => setForm(f => ({...f, away_team: e.target.value}))} className={inputCls + " cursor-pointer"}>
          <option value="">TBD</option>
          {(teams as any[]).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div className="md:col-span-2"><button type="submit" disabled={loading} className="h-11 px-8 text-sm font-semibold tracking-wide rounded-xl bg-foreground text-primary-foreground hover:opacity-85 btn-click disabled:opacity-50">{loading ? "Creating..." : "Create Fixture"}</button></div>
    </form>
  );
}

// ── Venue Form ────────────────────────────────────────────────────
function VenueForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", type: "stadium", province: "Harare", city: "", address: "", capacity: "", facilities: "" });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("venues").insert({
      name: form.name, type: form.type, province: form.province, city: form.city,
      address: form.address || null, capacity: form.capacity ? Number(form.capacity) : null,
      facilities: form.facilities ? form.facilities.split(",").map(s => s.trim()) : null,
    });
    setLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Venue added" }); onSuccess();
  };
  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="flex flex-col gap-1.5 md:col-span-2"><label className={labelCls}>Venue Name *</label><input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Type</label>
        <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} className={inputCls + " cursor-pointer"}>
          {["stadium","court","pool","auditorium","lab","pitch","gym","arena","hall","other"].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Province</label>
        <select value={form.province} onChange={e => setForm(f => ({...f, province: e.target.value}))} className={inputCls + " cursor-pointer"}>
          {PROVINCES.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>City *</label><input required value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Capacity</label><input type="number" value={form.capacity} onChange={e => setForm(f => ({...f, capacity: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5 md:col-span-2"><label className={labelCls}>Address</label><input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5 md:col-span-2"><label className={labelCls}>Facilities (comma-separated)</label><input value={form.facilities} onChange={e => setForm(f => ({...f, facilities: e.target.value}))} className={inputCls} /></div>
      <div className="md:col-span-2"><button type="submit" disabled={loading} className="h-11 px-8 text-sm font-semibold tracking-wide rounded-xl bg-foreground text-primary-foreground hover:opacity-85 btn-click disabled:opacity-50">{loading ? "Adding..." : "Add Venue"}</button></div>
    </form>
  );
}

// ── Team Form ─────────────────────────────────────────────────────
function TeamForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", short_name: "", discipline: "", province: "Harare", school_name: "", club_name: "", level: "national_league", founded_year: "", logo_url: "" });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("teams").insert({
      name: form.name, short_name: form.short_name || null, discipline: form.discipline,
      province: form.province, level: form.level as typeof LEVELS[number],
      founded_year: form.founded_year ? Number(form.founded_year) : null,
      school_name: form.school_name || null, club_name: form.club_name || null,
      manager_id: user?.id || null, logo_url: form.logo_url || null,
    });
    setLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Team created" }); onSuccess();
  };
  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Team Name *</label><input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Short Name</label><input value={form.short_name} onChange={e => setForm(f => ({...f, short_name: e.target.value}))} className={inputCls} placeholder="DFC" /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Discipline *</label>
        <select required value={form.discipline} onChange={e => setForm(f => ({...f, discipline: e.target.value}))} className={inputCls + " cursor-pointer"}>
          <option value="">Select</option>
          {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Level</label>
        <select value={form.level} onChange={e => setForm(f => ({...f, level: e.target.value}))} className={inputCls + " cursor-pointer"}>
          {LEVELS.map(l => <option key={l} value={l}>{l.replace(/_/g," ")}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Province</label>
        <select value={form.province} onChange={e => setForm(f => ({...f, province: e.target.value}))} className={inputCls + " cursor-pointer"}>
          {PROVINCES.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Founded Year</label><input type="number" value={form.founded_year} onChange={e => setForm(f => ({...f, founded_year: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>School</label><input value={form.school_name} onChange={e => setForm(f => ({...f, school_name: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Club</label><input value={form.club_name} onChange={e => setForm(f => ({...f, club_name: e.target.value}))} className={inputCls} /></div>
      <div className="md:col-span-2">
        <FileUploadField label="Team Logo" value={form.logo_url} onChange={url => setForm(f => ({...f, logo_url: url}))} folder="teams" />
      </div>
      <div className="md:col-span-2"><button type="submit" disabled={loading} className="h-11 px-8 text-sm font-semibold tracking-wide rounded-xl bg-foreground text-primary-foreground hover:opacity-85 btn-click disabled:opacity-50">{loading ? "Creating..." : "Create Team"}</button></div>
    </form>
  );
}

// ── Sponsorship Form ──────────────────────────────────────────────
function SponsorshipForm({ onSuccess, competitions }: { onSuccess: () => void; competitions: any[] }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ sponsor_name: "", tier: "gold", amount: "", competition_id: "", contract_start: "", contract_end: "", sponsor_logo: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("sponsorships").insert({
      sponsor_name: form.sponsor_name,
      tier: form.tier || null,
      amount: form.amount ? Number(form.amount) : null,
      competition_id: form.competition_id || null,
      contract_start: form.contract_start || null,
      contract_end: form.contract_end || null,
      sponsor_logo: form.sponsor_logo || null,
    });
    setLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Sponsorship added" }); onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="flex flex-col gap-1.5 md:col-span-2"><label className={labelCls}>Sponsor Name *</label><input required value={form.sponsor_name} onChange={e => setForm(f => ({...f, sponsor_name: e.target.value}))} className={inputCls} placeholder="e.g. Econet Wireless" /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Tier</label>
        <select value={form.tier} onChange={e => setForm(f => ({...f, tier: e.target.value}))} className={inputCls + " cursor-pointer"}>
          {["platinum","gold","silver","bronze","media","in-kind"].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Amount (USD)</label><input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Competition</label>
        <select value={form.competition_id} onChange={e => setForm(f => ({...f, competition_id: e.target.value}))} className={inputCls + " cursor-pointer"}>
          <option value="">General / All</option>
          {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Contract Start</label><input type="date" value={form.contract_start} onChange={e => setForm(f => ({...f, contract_start: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Contract End</label><input type="date" value={form.contract_end} onChange={e => setForm(f => ({...f, contract_end: e.target.value}))} className={inputCls} /></div>
      <div className="md:col-span-2">
        <FileUploadField label="Sponsor Logo" value={form.sponsor_logo} onChange={url => setForm(f => ({...f, sponsor_logo: url}))} folder="sponsors" />
      </div>
      <div className="md:col-span-2"><button type="submit" disabled={loading} className="h-11 px-8 text-sm font-semibold tracking-wide rounded-xl bg-foreground text-primary-foreground hover:opacity-85 btn-click disabled:opacity-50">{loading ? "Adding..." : "Add Sponsorship"}</button></div>
    </form>
  );
}

// ── Detail Slide Panel ────────────────────────────────────────────
function DetailPanel({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-card z-50 shadow-2xl overflow-y-auto hairline-l"
          >
            <div className="p-6 hairline-b flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-sm z-10">
              <p className="text-xs mono tracking-[0.18em] uppercase text-accent font-semibold">{title}</p>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-nexus-surface hover:bg-nexus-silver flex items-center justify-center transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Detail Field ──────────────────────────────────────────────────
function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 hairline-b last:border-0">
      <p className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold">{label}</p>
      <p className="text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

// ── Fixture Edit Panel (fix score/status/schedule, or delete) ──────
const FIXTURE_STATUSES = ["scheduled", "live", "completed", "postponed", "cancelled"] as const;

function FixtureEditPanel({ fixture, onUpdate, onDelete }: {
  fixture: any;
  onUpdate: (id: string, patch: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const toLocalInput = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [status, setStatus] = useState<string>(fixture.status || "scheduled");
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(fixture.scheduled_at));
  const [homeScore, setHomeScore] = useState(String(fixture.home_score ?? 0));
  const [awayScore, setAwayScore] = useState(String(fixture.away_score ?? 0));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onUpdate(fixture.id, {
      status,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      home_score: Number(homeScore) || 0,
      away_score: Number(awayScore) || 0,
    });
    setSaving(false);
  };

  return (
    <div>
      <DetailField label="Match" value={`${fixture.home_team?.name || "TBD"} vs ${fixture.away_team?.name || "TBD"}`} />
      <DetailField label="Competition" value={fixture.competition?.name} />
      <DetailField label="Round" value={fixture.round_label} />

      <div className="grid grid-cols-2 gap-4 py-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls + " cursor-pointer"}>
            {FIXTURE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Scheduled</label>
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Home Score</label>
          <input type="number" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Away Score</label>
          <input type="number" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={save} disabled={saving} className="h-9 px-4 text-xs font-semibold rounded-lg bg-foreground text-primary-foreground hover:opacity-85 transition-opacity disabled:opacity-50">
          {saving ? "Saving…" : "Save changes"}
        </button>
        <a href={`/scoring`} className="h-9 px-4 text-xs font-semibold rounded-lg bg-nexus-surface text-foreground flex items-center hover:bg-nexus-silver transition-colors">Open in Scoring</a>
        <a href={`/broadcast/${fixture.id}`} className="h-9 px-4 text-xs font-semibold rounded-lg bg-nexus-surface text-foreground flex items-center hover:bg-nexus-silver transition-colors">Broadcast CG</a>
        <button onClick={() => onDelete(fixture.id)} className="h-9 px-4 text-xs font-semibold rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors ml-auto">
          Delete fixture
        </button>
      </div>
    </div>
  );
}

// ── Scholastic Services Integration Panel ─────────────────────────
function ScholasticPanel({ user, toast, refetchTeams, refetchAthletes, refetchVenues }: {
  user: any; toast: any; refetchTeams: () => void; refetchAthletes: () => void; refetchVenues: () => void;
}) {
  const [syncStatus, setSyncStatus] = useState<"idle"|"syncing"|"success"|"error">("idle");
  const [discoverResult, setDiscoverResult] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const callSync = async (action: string) => {
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    setSyncStatus("syncing");
    setSyncResult(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("No session");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/scholastic-sync?action=${action}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");

      if (action === "discover") {
        setDiscoverResult(data);
      } else {
        setSyncResult(data);
        setLastSynced(new Date().toLocaleString());
        refetchTeams();
        refetchAthletes();
        refetchVenues();
      }
      setSyncStatus("success");
      toast({ title: action === "discover" ? "Schema discovered" : "Sync complete" });
    } catch (err: any) {
      setSyncStatus("error");
      toast({ title: "Sync Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="hairline rounded-xl p-6 sm:p-8 bg-card card-shadow mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-foreground/60 animate-pulse" />
              <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted font-medium">
                Linked to scholasticservices.online
              </p>
            </div>
            <h2 className="display-font text-xl font-bold text-foreground">Scholastic Services Integration</h2>
            <p className="text-sm text-nexus-muted mt-1">
              Automatically sync schools and students from the Scholastic Services platform for vetting and registration.
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            <span className="text-[9px] mono uppercase tracking-widest px-3 py-1.5 rounded-full bg-foreground/10 text-foreground font-semibold">Connected</span>
          </div>
        </div>

        {lastSynced && (
          <p className="text-[10px] mono text-nexus-muted mb-4">Last synced: {lastSynced}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => callSync("discover")} disabled={syncStatus === "syncing"}
            className="h-12 px-6 text-xs font-semibold tracking-wide rounded-xl bg-nexus-surface hover:bg-nexus-silver transition-colors btn-click disabled:opacity-50 flex items-center justify-center gap-2">
            {syncStatus === "syncing" ? (
              <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
            Discover Schema
          </button>
          <button onClick={() => callSync("sync-schools")} disabled={syncStatus === "syncing"}
            className="h-12 px-6 text-xs font-semibold tracking-wide rounded-xl bg-nexus-surface hover:bg-nexus-silver transition-colors btn-click disabled:opacity-50 flex items-center justify-center gap-2">
            {syncStatus === "syncing" ? (
              <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
            Sync Schools
          </button>
          <button onClick={() => callSync("sync-students")} disabled={syncStatus === "syncing"}
            className="h-12 px-6 text-xs font-semibold tracking-wide rounded-xl bg-nexus-surface hover:bg-nexus-silver transition-colors btn-click disabled:opacity-50 flex items-center justify-center gap-2">
            {syncStatus === "syncing" ? (
              <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
            Sync Students
          </button>
        </div>
      </div>

      {/* Discover Results */}
      {discoverResult && (
        <div className="hairline rounded-xl p-6 bg-card card-shadow mb-6">
          <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted font-medium mb-4">Discovered Tables</p>
          {Object.keys(discoverResult.tables || {}).length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-nexus-muted mb-2">No publicly accessible tables found.</p>
              <p className="text-xs text-nexus-muted">The Scholastic Services database may require a service role key for full access. Contact the Scholastic Services administrator to enable read access for schools and students tables.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(discoverResult.tables).map(([table, info]: [string, any]) => (
                <div key={table} className="hairline rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground mb-1">{table}</p>
                  <p className="text-[10px] mono text-nexus-muted">{info.columns?.length || 0} columns</p>
                  {info.columns?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {info.columns.slice(0, 8).map((col: string) => (
                        <span key={col} className="text-[9px] mono px-2 py-0.5 rounded bg-nexus-surface text-nexus-muted">{col}</span>
                      ))}
                      {info.columns.length > 8 && <span className="text-[9px] mono text-nexus-muted">+{info.columns.length - 8} more</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sync Results */}
      {syncResult && (
        <div className="hairline rounded-xl p-6 bg-card card-shadow mb-6">
          <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted font-medium mb-4">Sync Results</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {syncResult.schools && (
              <div className="hairline rounded-lg p-4">
                <p className="text-sm font-semibold text-foreground mb-2">Schools</p>
                <div className="space-y-1">
                  <p className="text-xs text-nexus-muted">Total found: <span className="font-semibold text-foreground">{syncResult.schools.total}</span></p>
                  <p className="text-xs text-nexus-muted">Synced: <span className="font-semibold text-foreground">{syncResult.schools.synced}</span></p>
                  <p className="text-xs text-nexus-muted">Skipped (existing): <span className="font-semibold text-foreground">{syncResult.schools.skipped}</span></p>
                </div>
              </div>
            )}
            {syncResult.students && (
              <div className="hairline rounded-lg p-4">
                <p className="text-sm font-semibold text-foreground mb-2">Students / Athletes</p>
                <div className="space-y-1">
                  <p className="text-xs text-nexus-muted">Total found: <span className="font-semibold text-foreground">{syncResult.students.total}</span></p>
                  <p className="text-xs text-nexus-muted">Synced: <span className="font-semibold text-foreground">{syncResult.students.synced}</span></p>
                  <p className="text-xs text-nexus-muted">Skipped (existing): <span className="font-semibold text-foreground">{syncResult.students.skipped}</span></p>
                </div>
              </div>
            )}
            {/* Single action results */}
            {syncResult.source && (
              <div className="hairline rounded-lg p-4">
                <p className="text-sm font-semibold text-foreground mb-2 capitalize">{syncResult.source}</p>
                <div className="space-y-1">
                  <p className="text-xs text-nexus-muted">Total found: <span className="font-semibold text-foreground">{syncResult.total}</span></p>
                  <p className="text-xs text-nexus-muted">Synced: <span className="font-semibold text-foreground">{syncResult.synced}</span></p>
                  <p className="text-xs text-nexus-muted">Skipped (existing): <span className="font-semibold text-foreground">{syncResult.skipped}</span></p>
                </div>
                {syncResult.errors?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] mono text-nexus-muted uppercase mb-1">Errors</p>
                    {syncResult.errors.slice(0, 5).map((e: string, i: number) => (
                      <p key={i} className="text-[10px] mono text-nexus-muted">{e}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="hairline rounded-xl p-6 bg-card card-shadow">
        <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted font-medium mb-4">How It Works</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">1. Discover</p>
            <p className="text-xs text-nexus-muted">Scans the Scholastic Services database to identify available tables and their structure.</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">2. Sync Schools</p>
            <p className="text-xs text-nexus-muted">Imports school records as Teams and creates corresponding Venue entries with location data.</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">3. Sync Students</p>
            <p className="text-xs text-nexus-muted">Imports student records as Athletes with school affiliation, discipline, and demographic data.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showForm, setShowForm] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailType, setDetailType] = useState("");
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, hasRole, roles, loading: rolesLoading } = useHasRole();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Any admin-tier role grants access to /admin (not just super_admin/admin).
  const isAnyAdmin = hasRole(...ADMIN_ROLES);
  const visibleTabs = useMemo(
    () => ALL_TABS.filter((t) => t.roles.length === 0 || hasRole(...t.roles)),
    [roles.join("|")],
  );



  const { data: competitions = [], refetch: refetchComp } = useQuery({ queryKey: ["admin-competitions"], queryFn: async () => { const { data } = await supabase.from("competitions").select("id, name, discipline, level, format, status, province, season, parent_id, created_at, description, start_date, end_date, max_participants, entry_fee, prize_pool, sponsor, logo_url").order("created_at", { ascending: false }).limit(100); return data || []; } });
  const { data: athletes = [], refetch: refetchAthletes } = useQuery({ queryKey: ["admin-athletes"], queryFn: async () => { const { data } = await supabase.from("athletes").select("id, first_name, last_name, province, disciplines, id_card_number, is_active, is_suspended, created_at, date_of_birth, school_name, club_name, photo_url, gender").order("created_at", { ascending: false }).limit(100); return data || []; } });
  const { data: venues = [], refetch: refetchVenues } = useQuery({ queryKey: ["admin-venues"], queryFn: async () => { const { data } = await supabase.from("venues").select("id, name, type, city, province, capacity, is_active, address, facilities").order("created_at", { ascending: false }).limit(100); return data || []; } });
  const { data: officials = [] } = useQuery({ queryKey: ["admin-officials"], queryFn: async () => { const { data } = await supabase.from("officials").select("id, first_name, last_name, role, disciplines, province, is_active, performance_rating, certification_level, total_matches").order("created_at", { ascending: false }).limit(50); return data || []; } });
  const { data: teams = [], refetch: refetchTeams } = useQuery({ queryKey: ["admin-teams"], queryFn: async () => { const { data } = await supabase.from("teams").select("id, name, short_name, discipline, level, province, is_active, created_at, school_name, club_name, logo_url, kit_colors, founded_year").order("created_at", { ascending: false }).limit(100); return data || []; } });
  const { data: fixtures = [], refetch: refetchFixtures } = useQuery({ queryKey: ["admin-fixtures"], queryFn: async () => { const { data } = await supabase.from("fixtures").select(`id, round_label, status, scheduled_at, home_score, away_score, competition_id, home_team:home_team_id(name), away_team:away_team_id(name), competition:competition_id(name, discipline)`).order("scheduled_at", { ascending: false }).limit(100); return data || []; } });
  const { data: disciplinary = [] } = useQuery({ queryKey: ["admin-disciplinary"], queryFn: async () => { const { data } = await supabase.from("disciplinary_records").select("id, reason, severity, is_active, appeal_status, suspension_until, created_at, description, suspension_games, athlete:athlete_id(first_name, last_name)").order("created_at", { ascending: false }).limit(50); return data || []; } });
  const { data: registrations = [] } = useQuery({ queryKey: ["admin-registrations"], queryFn: async () => { const { data } = await supabase.from("registrations").select(`id, registration_type, status, payment_status, created_at, division, notes, competition:competition_id(name), athlete:athlete_id(first_name, last_name), team:team_id(name)`).order("created_at", { ascending: false }).limit(100); return data || []; } });
  const { data: broadcasts = [] } = useQuery({ queryKey: ["admin-broadcasts"], queryFn: async () => { const { data } = await supabase.from("broadcasts").select("id, title, platform, is_live, viewer_count, quality, created_at, stream_url, competition:competition_id(name)").order("created_at", { ascending: false }).limit(30); return data || []; } });
  const { data: sponsorships = [], refetch: refetchSponsors } = useQuery({ queryKey: ["admin-sponsorships"], queryFn: async () => { const { data } = await supabase.from("sponsorships").select("id, sponsor_name, tier, amount, contract_start, contract_end, sponsor_logo, competition:competition_id(name)").order("created_at", { ascending: false }).limit(50); return data || []; } });

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-nexus-muted mono text-sm tracking-[0.15em] uppercase">Loading…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (!isAnyAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NashHeader />
        <div className="max-w-[900px] mx-auto pt-32 px-8 text-center">
          <p className="text-[10px] mono tracking-[0.2em] uppercase text-nexus-muted mb-3">403 Forbidden</p>
          <h1 className="text-2xl font-semibold mb-3">Admin access required</h1>
          <p className="text-nexus-muted text-sm">
            Your account doesn't carry an admin-tier NASH or NAPH role (platform, federation, provincial, district, zonal or organiser). Request access via <Link to="/register" className="underline">registration</Link>.
          </p>
        </div>
      </div>
    );
  }



  const openDetail = (item: any, type: string) => { setSelectedItem(item); setDetailType(type); };

  const sectionHeader = (title: string, action?: React.ReactNode) => (
    <div className="px-4 sm:px-8 py-5 hairline-b flex items-center justify-between gap-3 flex-wrap">
      <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">{title}</p>
      {action}
    </div>
  );

  const tableHead = (...cols: string[]) => (
    <thead><tr className="hairline-b">{cols.map(c => <th key={c} className="px-4 sm:px-6 py-4 text-left text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold whitespace-nowrap">{c}</th>)}</tr></thead>
  );

  const EmptyState = ({ msg }: { msg: string }) => (
    <div className="py-12 text-center"><p className="text-nexus-muted mono text-sm">{msg}</p></div>
  );

  const clickableRow = "hairline-b hover:bg-nexus-surface/60 transition-colors cursor-pointer";

  const updateCompStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("competitions").update({ status: status as typeof STATUSES[number] }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Status updated" }); refetchComp(); }
  };

  const deleteFixture = async (id: string) => {
    if (!window.confirm("Delete this fixture? Its scores and events are removed too.")) return;
    await supabase.from("score_entries").delete().eq("fixture_id", id);
    const { error } = await supabase.from("fixtures").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Fixture deleted" });
    setSelectedItem(null);
    refetchFixtures();
  };

  const updateFixture = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase.from("fixtures").update(patch).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Fixture updated" });
    refetchFixtures();
  };

  // Deleting a school ("teams" row) cascades school_teams automatically
  // (ON DELETE CASCADE), but fixtures.home/away_team_id have no cascade, so
  // any fixtures involving this school as a team must be cleared first or
  // the delete fails on an FK violation.
  const deleteSchool = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This removes the school, its teams and any fixtures it played in. This cannot be undone.`)) return;
    const { data: linkedFixtures } = await supabase.from("fixtures").select("id").or(`home_team_id.eq.${id},away_team_id.eq.${id}`);
    const fixtureIds = (linkedFixtures || []).map((f: any) => f.id);
    if (fixtureIds.length > 0) {
      await supabase.from("score_entries").delete().in("fixture_id", fixtureIds);
      await supabase.from("fixtures").delete().in("id", fixtureIds);
    }
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: `"${name}" deleted` });
    setSelectedItem(null);
    refetchTeams();
    refetchFixtures();
  };

  const deleteOfficial = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from the officials registry?`)) return;
    const { error } = await supabase.from("officials").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Official removed" });
    setSelectedItem(null);
    qc.invalidateQueries({ queryKey: ["admin-officials"] });
  };

  const deleteCompetition = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? All its fixtures and registrations are removed too. This cannot be undone.`)) return;
    const { data: linkedFixtures } = await supabase.from("fixtures").select("id").eq("competition_id", id);
    const fixtureIds = (linkedFixtures || []).map((f: any) => f.id);
    if (fixtureIds.length > 0) {
      await supabase.from("score_entries").delete().in("fixture_id", fixtureIds);
      await supabase.from("fixtures").delete().in("id", fixtureIds);
    }
    await supabase.from("registrations").delete().eq("competition_id", id);
    const { error } = await supabase.from("competitions").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: `"${name}" deleted` });
    setSelectedItem(null);
    refetchComp();
    refetchFixtures();
  };

  const deleteBroadcast = async (id: string, title: string) => {
    if (!window.confirm(`Delete broadcast "${title}"?`)) return;
    const { error } = await supabase.from("broadcasts").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Broadcast deleted" });
    setSelectedItem(null);
    qc.invalidateQueries({ queryKey: ["admin-broadcasts"] });
  };

  const deleteSponsorship = async (id: string, name: string) => {
    if (!window.confirm(`Remove sponsor "${name}"?`)) return;
    const { error } = await supabase.from("sponsorships").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Sponsor removed" });
    setSelectedItem(null);
    refetchSponsors();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto py-6">
        <div className="px-4 md:px-6 flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Platform · Administration</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight mt-1">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage schools, competitions, fixtures, officials, users and the Scholastic Services bridge — all in one place.</p>
          </div>
          {!user && <Badge variant="secondary" className="text-xs">Sign in with an admin account to manage data</Badge>}
        </div>

        <div className="px-4 md:px-6 flex overflow-x-auto scrollbar-hide gap-1.5 mb-2">
          {visibleTabs.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
              className={`px-3.5 h-9 text-xs font-display font-semibold tracking-wide whitespace-nowrap flex-shrink-0 rounded-lg transition-all duration-200 btn-click
                ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"}`}>
              {tab.label}
            </button>
          ))}
        </div>


        <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="p-4 sm:p-8">
              <div className="mb-6 flex flex-col gap-4">
                <ScholasticIntegrationBanner />
                <SyncStatusWidget autoSyncIfEmpty={true} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <NashStatCard label="Schools" value={teams.length} hint="Scholastic verified" icon={School} tone="primary" />
                <NashStatCard label="Students" value={athletes.length} hint="from Scholastic" icon={Users} tone="accent" />
                <NashStatCard label="Competitions" value={competitions.length} hint="total" icon={Trophy} tone="success" />
                <NashStatCard label="Fixtures" value={fixtures.length} hint="scheduled" icon={CalendarDays} tone="primary" />
                <NashStatCard label="Venues" value={venues.length} hint="in system" icon={MapPin} tone="muted" />
                <NashStatCard label="Officials" value={officials.length} hint="certified" icon={ShieldCheck} tone="warning" />
                <NashStatCard label="Registrations" value={registrations.length} hint="submitted" icon={ClipboardList} tone="accent" />
                <NashStatCard label="Sponsors" value={sponsorships.length} hint="active" icon={Handshake} tone="success" />
              </div>

              {/* Fixture generator */}
              <div className="mb-6">
                <InterSchoolFixturesBuilder />
              </div>

              {/* Activity & Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Breakdown */}
                <div className="hairline rounded-xl p-6 bg-card card-shadow">
                  <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted font-medium mb-4">Competition Status Breakdown</p>
                  <div className="space-y-3">
                    {["draft","registration_open","ongoing","completed","cancelled"].map(status => {
                      const count = (competitions as any[]).filter(c => c.status === status).length;
                      const pct = competitions.length > 0 ? (count / competitions.length) * 100 : 0;
                      return (
                        <div key={status} className="flex items-center gap-3">
                          <span className="text-[10px] mono w-28 text-nexus-muted capitalize flex-shrink-0">{status.replace(/_/g," ")}</span>
                          <div className="flex-1 h-2 rounded-full bg-nexus-surface overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.1 }} className="h-full rounded-full bg-foreground/60" />
                          </div>
                          <span className="text-xs mono font-semibold text-foreground w-6 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fixture Status */}
                <div className="hairline rounded-xl p-6 bg-card card-shadow">
                  <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted font-medium mb-4">Fixture Status</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Scheduled", status: "scheduled", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
                      { label: "Live", status: "live", icon: "M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9.172 14.828a4 4 0 010-5.656m5.656 0a4 4 0 010 5.656M12 12h.01" },
                      { label: "Completed", status: "completed", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
                    ].map(({ label, status, icon }) => {
                      const count = (fixtures as any[]).filter(f => f.status === status).length;
                      return (
                        <div key={status} className="hairline rounded-xl p-4 text-center hover:bg-nexus-surface/40 transition-colors">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 text-nexus-muted">
                            <path d={icon} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="score-display text-xl text-foreground">{count}</p>
                          <p className="text-[9px] mono text-nexus-muted mt-1 uppercase tracking-wider">{label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Discipline Distribution */}
                <div className="hairline rounded-xl p-6 bg-card card-shadow">
                  <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted font-medium mb-4">Discipline Distribution</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(
                      (competitions as any[]).reduce((acc: Record<string, number>, c) => {
                        acc[c.discipline] = (acc[c.discipline] || 0) + 1;
                        return acc;
                      }, {})
                    ).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([disc, count]) => (
                      <div key={disc} className="hairline rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-nexus-surface/40 transition-colors">
                        <span className="text-xs font-semibold text-foreground">{disc}</span>
                        <span className="text-[10px] mono text-nexus-muted bg-nexus-surface px-1.5 py-0.5 rounded">{count as number}</span>
                      </div>
                    ))}
                    {competitions.length === 0 && <p className="text-xs text-nexus-muted mono">No data</p>}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="hairline rounded-xl p-6 bg-card card-shadow">
                  <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted font-medium mb-4">Recent Activity</p>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {(fixtures as any[]).slice(0, 8).map((f) => (
                      <div key={f.id} className="flex items-center gap-3 py-1.5 hairline-b last:border-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${f.status === "live" ? "bg-nexus-live animate-pulse" : f.status === "completed" ? "bg-foreground/40" : "bg-nexus-surface"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{f.home_team?.name || "TBD"} vs {f.away_team?.name || "TBD"}</p>
                          <p className="text-[10px] mono text-nexus-muted">{f.competition?.name || "—"}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {f.status === "completed" ? (
                            <span className="text-xs font-bold mono text-foreground">{f.home_score ?? 0} — {f.away_score ?? 0}</span>
                          ) : (
                            <span className="text-[9px] mono uppercase text-nexus-muted bg-nexus-surface px-2 py-0.5 rounded-full">{f.status}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {fixtures.length === 0 && <p className="text-xs text-nexus-muted mono">No activity yet</p>}
                  </div>
                </div>

                {/* Provincial Coverage */}
                <div className="hairline rounded-xl p-6 bg-card card-shadow lg:col-span-2">
                  <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted font-medium mb-4">Provincial Coverage</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {PROVINCES.map(prov => {
                      const teamCount = (teams as any[]).filter(t => t.province === prov).length;
                      const compCount = (competitions as any[]).filter(c => c.province === prov).length;
                      return (
                        <div key={prov} className="hairline rounded-lg p-3 text-center hover:bg-nexus-surface/40 transition-colors">
                          <p className="text-xs font-semibold text-foreground">{prov}</p>
                          <p className="text-[9px] mono text-nexus-muted mt-1">{teamCount} teams · {compCount} comps</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COMPETITIONS */}
          {activeTab === "competitions" && (
            <div>
              <div className="px-4 sm:px-8 pt-4">
                <Link to="/admin/competitions" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent hover:underline">
                  Prefer the NASH-sanctioned competition builder? Open Competitions & Tournament Wizard <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {sectionHeader("Competitions (legacy list)", user && (
                <button onClick={() => setShowForm(!showForm)} className="h-8 px-4 text-xs font-semibold tracking-wide rounded-lg bg-foreground text-primary-foreground hover:opacity-85 btn-click">
                  {showForm ? "Cancel" : "+ New Competition"}
                </button>
              ))}
              {showForm && <div className="p-4 sm:p-8 hairline-b"><CompetitionForm competitions={competitions as any[]} onSuccess={() => { setShowForm(false); refetchComp(); }} /></div>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px]">
                  {tableHead("","Name","Discipline","Level","Status","Province","Season","Actions")}
                  <tbody>
                    {(competitions as any[]).map((comp) => (
                      <tr key={comp.id} className={clickableRow} onClick={() => openDetail(comp, "competition")}>
                        <td className="px-4 sm:px-6 py-4 w-10">{comp.logo_url ? <img src={comp.logo_url} className="w-8 h-8 rounded-lg object-cover bg-white" alt="" /> : <div className="w-8 h-8 rounded-lg bg-nexus-surface" />}</td>
                        <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-foreground">{comp.name}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{comp.discipline}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{comp.level?.replace(/_/g," ")}</td>
                        <td className="px-4 sm:px-6 py-4">
                          {user ? (
                            <select value={comp.status} onChange={e => { e.stopPropagation(); updateCompStatus(comp.id, e.target.value); }}
                              onClick={e => e.stopPropagation()}
                              className="text-[10px] mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-2.5 py-1 rounded-full border-0 focus:outline-none cursor-pointer">
                              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                            </select>
                          ) : (
                            <span className="text-[10px] mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-2.5 py-1 rounded-full">{comp.status?.replace(/_/g," ")}</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{comp.province || "National"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{comp.season || "—"}</td>
                        <td className="px-4 sm:px-6 py-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteCompetition(comp.id, comp.name); }}
                            className="h-7 px-3 text-[10px] font-semibold tracking-wide rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {competitions.length === 0 && <tr><td colSpan={8}><EmptyState msg="No competitions yet. Create one above." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FIXTURES */}
          {activeTab === "fixtures" && (
            <div>
              {sectionHeader("Fixtures", user && (
                <div className="flex gap-2">
                  <button onClick={() => { setShowGenerator(!showGenerator); setShowForm(false); }} className="h-8 px-4 text-xs font-semibold tracking-wide rounded-lg bg-nexus-surface hover:bg-nexus-silver transition-colors btn-click">
                    {showGenerator ? "Cancel" : "Generate Fixtures"}
                  </button>
                  <button onClick={() => { setShowForm(!showForm); setShowGenerator(false); }} className="h-8 px-4 text-xs font-semibold tracking-wide rounded-lg bg-foreground text-primary-foreground hover:opacity-85 btn-click">
                    {showForm ? "Cancel" : "+ New Fixture"}
                  </button>
                </div>
              ))}
              {showGenerator && <div className="hairline-b"><InterSchoolFixturesBuilder /></div>}
              {showForm && <div className="p-4 sm:p-8 hairline-b"><FixtureForm competitions={competitions as any[]} onSuccess={() => { setShowForm(false); refetchFixtures(); }} /></div>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px]">
                  {tableHead("Match","Competition","Round","Status","Score","Scheduled","Actions")}
                  <tbody>
                    {(fixtures as any[]).map((f) => (
                      <tr key={f.id} className={clickableRow} onClick={() => openDetail(f, "fixture")}>
                        <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-foreground">{f.home_team?.name || "TBD"} vs {f.away_team?.name || "TBD"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{f.competition?.name || "—"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{f.round_label || "—"}</td>
                        <td className="px-4 sm:px-6 py-4"><span className="text-[10px] mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-2.5 py-1 rounded-full">{f.status}</span></td>
                        <td className="px-4 sm:px-6 py-4 text-sm mono font-semibold text-foreground">{f.home_score ?? 0} — {f.away_score ?? 0}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{f.scheduled_at ? new Date(f.scheduled_at).toLocaleString("en-ZW", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "TBD"}</td>
                        <td className="px-4 sm:px-6 py-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteFixture(f.id); }}
                            className="h-7 px-3 text-[10px] font-semibold tracking-wide rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {fixtures.length === 0 && <tr><td colSpan={7}><EmptyState msg="No fixtures yet." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SCHOOLS & TEAMS */}
          {activeTab === "schools" && (
            <div>
              {sectionHeader("Schools & Teams", (
                <div className="flex flex-wrap gap-2">
                  <Link to="/admin/teams" className="h-8 px-4 text-xs font-semibold tracking-wide rounded-lg bg-nexus-surface hover:bg-nexus-silver flex items-center transition-colors">
                    Manage sport team rosters →
                  </Link>
                  <Link to="/schools" className="h-8 px-4 text-xs font-semibold tracking-wide rounded-lg bg-nexus-surface hover:bg-nexus-silver flex items-center transition-colors">
                    Open public directory →
                  </Link>
                </div>
              ))}
              <div className="p-4 sm:p-8 space-y-6">
                <SchoolsDirectory />
                <div className="hairline rounded-xl bg-card overflow-hidden">
                  <p className="px-6 py-4 hairline-b text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted font-medium">All synced schools</p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px]">
                      {tableHead("","Name","Discipline","Level","Province","Status","Actions")}
                      <tbody>
                        {(teams as any[]).map((t) => (
                          <tr key={t.id} className={clickableRow} onClick={() => openDetail(t, "team")}>
                            <td className="px-4 sm:px-6 py-4 w-10">{t.logo_url ? <img src={t.logo_url} className="w-8 h-8 rounded-lg object-cover bg-white" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <div className="w-8 h-8 rounded-lg bg-nexus-surface flex items-center justify-center text-[9px] mono text-nexus-muted">{t.short_name?.slice(0,2) || t.name?.slice(0,2)}</div>}</td>
                            <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-foreground">{t.name}</td>
                            <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{t.discipline || "—"}</td>
                            <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{t.level?.replace(/_/g," ") || "—"}</td>
                            <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{t.province || "—"}</td>
                            <td className="px-4 sm:px-6 py-4"><span className={`text-[10px] mono px-2.5 py-1 rounded-full ${t.is_active ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted"}`}>{t.is_active ? "Active" : "Inactive"}</span></td>
                            <td className="px-4 sm:px-6 py-4">
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteSchool(t.id, t.name); }}
                                className="h-7 px-3 text-[10px] font-semibold tracking-wide rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {teams.length === 0 && <tr><td colSpan={7}><EmptyState msg="No schools synced yet. Trigger a federation sync." /></td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SPORTING CALENDAR */}
          {activeTab === "calendar" && <SportingCalendar />}

          {/* OFFICIALS */}
          {activeTab === "officials" && (
            <div>
              {sectionHeader("Officials")}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  {tableHead("Name","Role","Disciplines","Province","Rating","Status","Actions")}
                  <tbody>
                    {(officials as any[]).map((o) => (
                      <tr key={o.id} className={clickableRow} onClick={() => openDetail(o, "official")}>
                        <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-foreground">{o.first_name} {o.last_name}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted capitalize">{o.role}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{o.disciplines?.join(", ")}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{o.province || "—"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{o.performance_rating ? `${o.performance_rating}/5` : "—"}</td>
                        <td className="px-4 sm:px-6 py-4"><span className={`text-[10px] mono px-2.5 py-1 rounded-full ${o.is_active ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted"}`}>{o.is_active ? "Active" : "Inactive"}</span></td>
                        <td className="px-4 sm:px-6 py-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteOfficial(o.id, `${o.first_name} ${o.last_name}`); }}
                            className="h-7 px-3 text-[10px] font-semibold tracking-wide rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {officials.length === 0 && <tr><td colSpan={7}><EmptyState msg="No officials registered yet." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STANDINGS */}
          {activeTab === "standings" && (
            <div>
              {sectionHeader("Standings & Records")}
              <div className="p-8 text-center">
                <p className="text-nexus-muted mono text-sm">Standings auto-populate from fixture results.</p>
                <p className="text-nexus-muted mono text-xs mt-2">Use Fixtures & Scoring to enter results, then view standings publicly on /standings.</p>
                <Link to="/standings" className="mt-4 inline-block h-9 px-4 text-xs font-semibold rounded-lg bg-foreground text-primary-foreground hover:opacity-85 leading-9">Open public standings →</Link>
              </div>
            </div>
          )}

          {/* BROADCASTS */}
          {activeTab === "broadcasts" && (
            <div>
              {sectionHeader("Broadcasts & Media", (
                <Link to="/broadcast" className="h-8 px-4 text-xs font-semibold tracking-wide rounded-lg bg-nexus-surface hover:bg-nexus-silver flex items-center transition-colors">
                  Open Broadcast Hub →
                </Link>
              ))}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  {tableHead("Title","Competition","Platform","Status","Viewers","Quality","Actions")}
                  <tbody>
                    {(broadcasts as any[]).map((b) => (
                      <tr key={b.id} className={clickableRow} onClick={() => openDetail(b, "broadcast")}>
                        <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-foreground">{b.title}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{b.competition?.name || "—"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{b.platform || "—"}</td>
                        <td className="px-4 sm:px-6 py-4"><span className={`text-[10px] mono px-2.5 py-1 rounded-full ${b.is_live ? "bg-nexus-live text-primary-foreground" : "bg-nexus-surface text-nexus-muted"}`}>{b.is_live ? "Live" : "Offline"}</span></td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{b.viewer_count?.toLocaleString() || "—"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{b.quality || "HD"}</td>
                        <td className="px-4 sm:px-6 py-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteBroadcast(b.id, b.title); }}
                            className="h-7 px-3 text-[10px] font-semibold tracking-wide rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {broadcasts.length === 0 && <tr><td colSpan={7}><EmptyState msg="No broadcasts yet." /></td></tr>}
                  </tbody>
                </table>
              </div>

              <div className="mt-8">
                {sectionHeader("Sponsorships", user && (
                  <button onClick={() => setShowForm(!showForm)} className="h-8 px-4 text-xs font-semibold tracking-wide rounded-lg bg-foreground text-primary-foreground hover:opacity-85 btn-click">
                    {showForm ? "Cancel" : "+ Add Sponsor"}
                  </button>
                ))}
                {showForm && <div className="p-4 sm:p-8 hairline-b"><SponsorshipForm competitions={competitions as any[]} onSuccess={() => { setShowForm(false); refetchSponsors(); }} /></div>}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    {tableHead("Sponsor","Tier","Amount","Competition","Actions")}
                    <tbody>
                      {(sponsorships as any[]).map((s) => (
                        <tr key={s.id} className={clickableRow} onClick={() => openDetail(s, "sponsor")}>
                          <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-foreground">{s.sponsor_name}</td>
                          <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted capitalize">{s.tier || "—"}</td>
                          <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{s.amount ? `$${Number(s.amount).toLocaleString()}` : "—"}</td>
                          <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{s.competition?.name || "General"}</td>
                          <td className="px-4 sm:px-6 py-4">
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteSponsorship(s.id, s.sponsor_name); }}
                              className="h-7 px-3 text-[10px] font-semibold tracking-wide rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      {sponsorships.length === 0 && <tr><td colSpan={5}><EmptyState msg="No sponsors yet." /></td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* USERS & ROLES */}
          {activeTab === "users" && <UsersRolesPanel />}

          {/* ROLE APPLICATIONS */}
          {activeTab === "role_requests" && <RoleRequestsPanel />}

          {/* REGION REQUESTS */}
          {activeTab === "regions" && <RegionRequestsPanel />}

          {/* FEDERATION SYNC */}
          {activeTab === "federation" && (
            <ScholasticPanel user={user} toast={toast} refetchTeams={refetchTeams} refetchAthletes={refetchAthletes} refetchVenues={refetchVenues} />
          )}



        </motion.div>
      </div>

      {/* Detail Slide Panels */}
      <DetailPanel open={!!selectedItem && detailType === "competition"} onClose={() => setSelectedItem(null)} title="Competition Details">
        {selectedItem && detailType === "competition" && (
          <div>
            {selectedItem.logo_url && <img src={selectedItem.logo_url} className="w-16 h-16 rounded-xl object-cover bg-white mb-4" alt="" />}
            <DetailField label="Name" value={selectedItem.name} />
            <DetailField label="Discipline" value={selectedItem.discipline} />
            <DetailField label="Level" value={selectedItem.level?.replace(/_/g," ")} />
            <DetailField label="Format" value={selectedItem.format?.replace(/_/g," ")} />
            <DetailField label="Status" value={selectedItem.status?.replace(/_/g," ")} />
            <DetailField label="Season" value={selectedItem.season} />
            <DetailField label="Province" value={selectedItem.province || "National"} />
            <DetailField label="Start Date" value={selectedItem.start_date} />
            <DetailField label="End Date" value={selectedItem.end_date} />
            <DetailField label="Max Participants" value={selectedItem.max_participants} />
            <DetailField label="Entry Fee" value={selectedItem.entry_fee ? `$${selectedItem.entry_fee}` : null} />
            <DetailField label="Prize Pool" value={selectedItem.prize_pool ? `$${Number(selectedItem.prize_pool).toLocaleString()}` : null} />
            <DetailField label="Sponsor" value={selectedItem.sponsor} />
            <DetailField label="Description" value={selectedItem.description} />
            <div className="mt-4">
              <button onClick={() => deleteCompetition(selectedItem.id, selectedItem.name)} className="h-9 px-4 text-xs font-semibold rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                Delete competition
              </button>
            </div>
          </div>
        )}
      </DetailPanel>

      <DetailPanel open={!!selectedItem && detailType === "fixture"} onClose={() => setSelectedItem(null)} title="Fixture Details">
        {selectedItem && detailType === "fixture" && (
          <FixtureEditPanel
            fixture={selectedItem}
            onUpdate={updateFixture}
            onDelete={deleteFixture}
          />
        )}
      </DetailPanel>

      <DetailPanel open={!!selectedItem && detailType === "team"} onClose={() => setSelectedItem(null)} title="Team Details">
        {selectedItem && detailType === "team" && (
          <div>
            {selectedItem.logo_url && <img src={selectedItem.logo_url} className="w-16 h-16 rounded-xl object-cover bg-white mb-4" alt="" />}
            <DetailField label="Name" value={selectedItem.name} />
            <DetailField label="Short Name" value={selectedItem.short_name} />
            <DetailField label="Discipline" value={selectedItem.discipline} />
            <DetailField label="Level" value={selectedItem.level?.replace(/_/g," ")} />
            <DetailField label="Province" value={selectedItem.province} />
            <DetailField label="School" value={selectedItem.school_name} />
            <DetailField label="Club" value={selectedItem.club_name} />
            <DetailField label="Founded" value={selectedItem.founded_year} />
            <DetailField label="Kit Colors" value={selectedItem.kit_colors?.join(", ")} />
            <DetailField label="Status" value={selectedItem.is_active ? "Active" : "Inactive"} />
            <div className="mt-4">
              <button onClick={() => deleteSchool(selectedItem.id, selectedItem.name)} className="h-9 px-4 text-xs font-semibold rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                Delete school
              </button>
            </div>
          </div>
        )}
      </DetailPanel>

      <DetailPanel open={!!selectedItem && detailType === "athlete"} onClose={() => setSelectedItem(null)} title="Athlete Details">
        {selectedItem && detailType === "athlete" && (
          <div>
            {selectedItem.photo_url && <img src={selectedItem.photo_url} className="w-16 h-16 rounded-full object-cover mb-4" alt="" />}
            <DetailField label="Name" value={`${selectedItem.first_name} ${selectedItem.last_name}`} />
            <DetailField label="Province" value={selectedItem.province} />
            <DetailField label="Gender" value={selectedItem.gender} />
            <DetailField label="Date of Birth" value={selectedItem.date_of_birth} />
            <DetailField label="Disciplines" value={selectedItem.disciplines?.join(", ")} />
            <DetailField label="School" value={selectedItem.school_name} />
            <DetailField label="Club" value={selectedItem.club_name} />
            <DetailField label="ID Card" value={selectedItem.id_card_number} />
            <DetailField label="Status" value={selectedItem.is_suspended ? "Suspended" : selectedItem.is_active ? "Active" : "Inactive"} />
            <div className="mt-4">
              <a href="/athletes/id-cards" className="h-9 px-4 text-xs font-semibold rounded-lg bg-foreground text-primary-foreground inline-flex items-center hover:opacity-85 transition-opacity">View ID Card</a>
            </div>
          </div>
        )}
      </DetailPanel>

      <DetailPanel open={!!selectedItem && detailType === "official"} onClose={() => setSelectedItem(null)} title="Official Details">
        {selectedItem && detailType === "official" && (
          <div>
            <DetailField label="Name" value={`${selectedItem.first_name} ${selectedItem.last_name}`} />
            <DetailField label="Role" value={selectedItem.role} />
            <DetailField label="Disciplines" value={selectedItem.disciplines?.join(", ")} />
            <DetailField label="Province" value={selectedItem.province} />
            <DetailField label="Certification" value={selectedItem.certification_level} />
            <DetailField label="Rating" value={selectedItem.performance_rating ? `${selectedItem.performance_rating}/5` : null} />
            <DetailField label="Total Matches" value={selectedItem.total_matches} />
            <DetailField label="Status" value={selectedItem.is_active ? "Active" : "Inactive"} />
            <div className="mt-4">
              <button onClick={() => deleteOfficial(selectedItem.id, `${selectedItem.first_name} ${selectedItem.last_name}`)} className="h-9 px-4 text-xs font-semibold rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                Remove official
              </button>
            </div>
          </div>
        )}
      </DetailPanel>

      <DetailPanel open={!!selectedItem && detailType === "disciplinary"} onClose={() => setSelectedItem(null)} title="Disciplinary Record">
        {selectedItem && detailType === "disciplinary" && (
          <div>
            <DetailField label="Athlete" value={selectedItem.athlete ? `${selectedItem.athlete.first_name} ${selectedItem.athlete.last_name}` : "—"} />
            <DetailField label="Severity" value={selectedItem.severity?.replace(/_/g," ")} />
            <DetailField label="Reason" value={selectedItem.reason} />
            <DetailField label="Description" value={selectedItem.description} />
            <DetailField label="Appeal Status" value={selectedItem.appeal_status} />
            <DetailField label="Suspension Games" value={selectedItem.suspension_games} />
            <DetailField label="Suspension Until" value={selectedItem.suspension_until} />
            <DetailField label="Active" value={selectedItem.is_active ? "Yes" : "Resolved"} />
          </div>
        )}
      </DetailPanel>

      <DetailPanel open={!!selectedItem && detailType === "sponsor"} onClose={() => setSelectedItem(null)} title="Sponsor Details">
        {selectedItem && detailType === "sponsor" && (
          <div>
            {selectedItem.sponsor_logo && <img src={selectedItem.sponsor_logo} className="w-16 h-16 rounded-xl object-contain bg-white p-1 mb-4" alt="" />}
            <DetailField label="Sponsor" value={selectedItem.sponsor_name} />
            <DetailField label="Competition" value={selectedItem.competition?.name || "General"} />
            <DetailField label="Tier" value={selectedItem.tier} />
            <DetailField label="Amount" value={selectedItem.amount ? `$${Number(selectedItem.amount).toLocaleString()}` : null} />
            <DetailField label="Contract Start" value={selectedItem.contract_start} />
            <DetailField label="Contract End" value={selectedItem.contract_end} />
            <div className="mt-4">
              <button onClick={() => deleteSponsorship(selectedItem.id, selectedItem.sponsor_name)} className="h-9 px-4 text-xs font-semibold rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                Remove sponsor
              </button>
            </div>
          </div>
        )}
      </DetailPanel>

      <DetailPanel open={!!selectedItem && detailType === "broadcast"} onClose={() => setSelectedItem(null)} title="Broadcast Details">
        {selectedItem && detailType === "broadcast" && (
          <div>
            <DetailField label="Title" value={selectedItem.title} />
            <DetailField label="Competition" value={selectedItem.competition?.name} />
            <DetailField label="Platform" value={selectedItem.platform} />
            <DetailField label="Status" value={selectedItem.is_live ? "Live" : "Offline"} />
            <DetailField label="Viewers" value={selectedItem.viewer_count?.toLocaleString()} />
            <DetailField label="Quality" value={selectedItem.quality || "HD"} />
            <DetailField label="Stream URL" value={selectedItem.stream_url} />
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedItem.stream_url && (
                <a href={selectedItem.stream_url} target="_blank" rel="noreferrer" className="h-9 px-4 text-xs font-semibold rounded-lg bg-nexus-surface text-foreground flex items-center hover:bg-nexus-silver transition-colors">Open stream</a>
              )}
              <button onClick={() => deleteBroadcast(selectedItem.id, selectedItem.title)} className="h-9 px-4 text-xs font-semibold rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                Delete broadcast
              </button>
            </div>
          </div>
        )}
      </DetailPanel>

      <NexusFooter />
    </div>
  );
}
