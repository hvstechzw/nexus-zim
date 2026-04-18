import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { ScholasticIntegrationBanner } from "@/components/ScholasticBadge";
import { SyncStatusWidget } from "@/components/SyncStatusWidget";
import { InterSchoolFixturesBuilder } from "@/components/InterSchoolFixturesBuilder";
import { HouseCompetitionsPanel } from "@/components/HouseCompetitionsPanel";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

const ADMIN_TABS = [
  { id: "overview", label: "Overview" },
  { id: "competitions", label: "Competitions" },
  { id: "fixtures", label: "Fixtures" },
  { id: "teams", label: "Teams" },
  { id: "athletes", label: "Athletes" },
  { id: "officials", label: "Officials" },
  { id: "venues", label: "Venues" },
  { id: "disciplinary", label: "Disciplinary" },
  { id: "standings", label: "Standings" },
  { id: "broadcasts", label: "Broadcasts" },
  { id: "registrations", label: "Registrations" },
  { id: "sponsorships", label: "Sponsorships" },
  { id: "scholastic", label: "Scholastic Services" },
];

const inputCls = "bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all w-full";
const labelCls = "text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold";
const PROVINCES = ["Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"];
const LEVELS = ["primary_school","secondary_school","club_academy","provincial","national_league","national_cup","international"] as const;
const FORMATS = ["round_robin","single_elimination","double_elimination","swiss","league","ladder","custom_heats"] as const;
const STATUSES = ["draft","registration_open","registration_closed","ongoing","completed","cancelled"] as const;
const DISCIPLINES = ["Football","Rugby","Cricket","Athletics","Swimming","Basketball","Volleyball","Tennis","Chess","Debate","Quiz","Netball","Hockey","Boxing","Judo","Cycling","Other"];

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="hairline rounded-xl p-6 flex flex-col gap-2 card-shadow bg-background">
      <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted font-medium">{label}</p>
      <p className="score-display text-score-md text-foreground">{value}</p>
      {sub && <p className="text-xs text-nexus-muted">{sub}</p>}
    </div>
  );
}

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
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-background z-50 shadow-2xl overflow-y-auto hairline-l"
          >
            <div className="p-6 hairline-b flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10">
              <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-semibold">{title}</p>
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
      <div className="hairline rounded-xl p-6 sm:p-8 bg-background card-shadow mb-6">
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
        <div className="hairline rounded-xl p-6 bg-background card-shadow mb-6">
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
        <div className="hairline rounded-xl p-6 bg-background card-shadow mb-6">
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
      <div className="hairline rounded-xl p-6 bg-background card-shadow">
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
  const [activeTab, setActiveTab] = useState("overview");
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailType, setDetailType] = useState("");
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useHasRole();
  const { toast } = useToast();
  const qc = useQueryClient();

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-nexus-muted mono text-sm tracking-[0.15em] uppercase">Loading…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NexusHeader />
        <div className="max-w-[900px] mx-auto pt-32 px-8 text-center">
          <p className="text-[10px] mono tracking-[0.2em] uppercase text-nexus-muted mb-3">403 Forbidden</p>
          <h1 className="text-2xl font-semibold mb-3">Admin access required</h1>
          <p className="text-nexus-muted text-sm">
            Your account doesn't carry the <code>admin</code> or <code>super_admin</code> role. Contact a federation official if you believe this is a mistake.
          </p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />
      <div className="max-w-[1400px] mx-auto pt-20">
        <div className="px-4 sm:px-8 py-8 hairline-b">
          <p className="text-[10px] mono tracking-[0.25em] uppercase text-nexus-muted">Administration</p>
          <h1 className="display-font text-display-lg font-bold text-foreground mt-1">Nexus Admin Dashboard</h1>
          {!user && <p className="text-sm text-nexus-muted mt-3 bg-nexus-surface hairline rounded-lg px-4 py-2.5 inline-block">Sign in with an admin account to manage data</p>}
        </div>

        <div className="flex overflow-x-auto hairline-b scrollbar-hide">
          {ADMIN_TABS.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
              className={`px-4 sm:px-6 py-4 text-xs font-semibold tracking-wide whitespace-nowrap flex-shrink-0 border-b-2 transition-all duration-200 btn-click
                ${activeTab === tab.id ? "border-foreground text-foreground" : "border-transparent text-nexus-muted hover:text-foreground"}`}>
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
                <StatCard label="Schools" value={String(teams.length)} sub="Scholastic verified" />
                <StatCard label="Students" value={String(athletes.length)} sub="from Scholastic" />
                <StatCard label="Competitions" value={String(competitions.length)} sub="total" />
                <StatCard label="Inter-School Fixtures" value={String(fixtures.length)} sub="scheduled" />
                <StatCard label="Venues" value={String(venues.length)} sub="in system" />
                <StatCard label="Officials" value={String(officials.length)} sub="certified" />
                <StatCard label="Registrations" value={String(registrations.length)} sub="submitted" />
                <StatCard label="Sponsors" value={String(sponsorships.length)} sub="active" />
              </div>

              {/* Schools tooling */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <InterSchoolFixturesBuilder />
                <HouseCompetitionsPanel />
              </div>

              {/* Activity & Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Breakdown */}
                <div className="hairline rounded-xl p-6 bg-background card-shadow">
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
                <div className="hairline rounded-xl p-6 bg-background card-shadow">
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
                <div className="hairline rounded-xl p-6 bg-background card-shadow">
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
                <div className="hairline rounded-xl p-6 bg-background card-shadow">
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
                <div className="hairline rounded-xl p-6 bg-background card-shadow lg:col-span-2">
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
              {sectionHeader("Competitions", user && (
                <button onClick={() => setShowForm(!showForm)} className="h-8 px-4 text-xs font-semibold tracking-wide rounded-lg bg-foreground text-primary-foreground hover:opacity-85 btn-click">
                  {showForm ? "Cancel" : "+ New Competition"}
                </button>
              ))}
              {showForm && <div className="p-4 sm:p-8 hairline-b"><CompetitionForm competitions={competitions as any[]} onSuccess={() => { setShowForm(false); refetchComp(); }} /></div>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  {tableHead("","Name","Discipline","Level","Status","Province","Season")}
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
                      </tr>
                    ))}
                    {competitions.length === 0 && <tr><td colSpan={7}><EmptyState msg="No competitions yet. Create one above." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FIXTURES */}
          {activeTab === "fixtures" && (
            <div>
              {sectionHeader("Fixtures", user && (
                <button onClick={() => setShowForm(!showForm)} className="h-8 px-4 text-xs font-semibold tracking-wide rounded-lg bg-foreground text-primary-foreground hover:opacity-85 btn-click">
                  {showForm ? "Cancel" : "+ New Fixture"}
                </button>
              ))}
              {showForm && <div className="p-4 sm:p-8 hairline-b"><FixtureForm competitions={competitions as any[]} onSuccess={() => { setShowForm(false); refetchFixtures(); }} /></div>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  {tableHead("Match","Competition","Round","Status","Score","Scheduled")}
                  <tbody>
                    {(fixtures as any[]).map((f) => (
                      <tr key={f.id} className={clickableRow} onClick={() => openDetail(f, "fixture")}>
                        <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-foreground">{f.home_team?.name || "TBD"} vs {f.away_team?.name || "TBD"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{f.competition?.name || "—"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{f.round_label || "—"}</td>
                        <td className="px-4 sm:px-6 py-4"><span className="text-[10px] mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-2.5 py-1 rounded-full">{f.status}</span></td>
                        <td className="px-4 sm:px-6 py-4 text-sm mono font-semibold text-foreground">{f.home_score ?? 0} — {f.away_score ?? 0}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{f.scheduled_at ? new Date(f.scheduled_at).toLocaleString("en-ZW", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "TBD"}</td>
                      </tr>
                    ))}
                    {fixtures.length === 0 && <tr><td colSpan={6}><EmptyState msg="No fixtures yet." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TEAMS */}
          {activeTab === "teams" && (
            <div>
              {sectionHeader("Teams", user && (
                <button onClick={() => setShowForm(!showForm)} className="h-8 px-4 text-xs font-semibold tracking-wide rounded-lg bg-foreground text-primary-foreground hover:opacity-85 btn-click">
                  {showForm ? "Cancel" : "+ New Team"}
                </button>
              ))}
              {showForm && <div className="p-4 sm:p-8 hairline-b"><TeamForm onSuccess={() => { setShowForm(false); refetchTeams(); }} /></div>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  {tableHead("","Name","Discipline","Level","Province","Status")}
                  <tbody>
                    {(teams as any[]).map((t) => (
                      <tr key={t.id} className={clickableRow} onClick={() => openDetail(t, "team")}>
                        <td className="px-4 sm:px-6 py-4 w-10">{t.logo_url ? <img src={t.logo_url} className="w-8 h-8 rounded-lg object-cover bg-white" alt="" /> : <div className="w-8 h-8 rounded-lg bg-nexus-surface flex items-center justify-center text-[9px] mono text-nexus-muted">{t.short_name?.slice(0,2) || t.name?.slice(0,2)}</div>}</td>
                        <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-foreground">{t.name}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{t.discipline}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{t.level?.replace(/_/g," ") || "—"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{t.province || "—"}</td>
                        <td className="px-4 sm:px-6 py-4"><span className={`text-[10px] mono px-2.5 py-1 rounded-full ${t.is_active ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted"}`}>{t.is_active ? "Active" : "Inactive"}</span></td>
                      </tr>
                    ))}
                    {teams.length === 0 && <tr><td colSpan={6}><EmptyState msg="No teams yet." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ATHLETES */}
          {activeTab === "athletes" && (
            <div>
              {sectionHeader("Athletes")}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  {tableHead("","Name","Province","Disciplines","ID Card","Status")}
                  <tbody>
                    {(athletes as any[]).map((a) => (
                      <tr key={a.id} className={clickableRow} onClick={() => openDetail(a, "athlete")}>
                        <td className="px-4 sm:px-6 py-4 w-10">{a.photo_url ? <img src={a.photo_url} className="w-8 h-8 rounded-full object-cover" alt="" /> : <div className="w-8 h-8 rounded-full bg-nexus-surface flex items-center justify-center text-[9px] mono font-bold text-nexus-muted">{a.first_name?.[0]}{a.last_name?.[0]}</div>}</td>
                        <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-foreground">{a.first_name} {a.last_name}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{a.province}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{a.disciplines?.join(", ")}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{a.id_card_number || "—"}</td>
                        <td className="px-4 sm:px-6 py-4"><span className={`text-[10px] mono px-2.5 py-1 rounded-full ${a.is_suspended ? "bg-foreground text-primary-foreground" : a.is_active ? "bg-nexus-surface text-nexus-muted" : "bg-nexus-surface text-nexus-muted"}`}>{a.is_suspended ? "Suspended" : a.is_active ? "Active" : "Inactive"}</span></td>
                      </tr>
                    ))}
                    {athletes.length === 0 && <tr><td colSpan={6}><EmptyState msg="No athletes registered yet." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* OFFICIALS */}
          {activeTab === "officials" && (
            <div>
              {sectionHeader("Officials")}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  {tableHead("Name","Role","Disciplines","Province","Rating","Status")}
                  <tbody>
                    {(officials as any[]).map((o) => (
                      <tr key={o.id} className={clickableRow} onClick={() => openDetail(o, "official")}>
                        <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-foreground">{o.first_name} {o.last_name}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted capitalize">{o.role}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{o.disciplines?.join(", ")}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{o.province || "—"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{o.performance_rating ? `${o.performance_rating}/5` : "—"}</td>
                        <td className="px-4 sm:px-6 py-4"><span className={`text-[10px] mono px-2.5 py-1 rounded-full ${o.is_active ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted"}`}>{o.is_active ? "Active" : "Inactive"}</span></td>
                      </tr>
                    ))}
                    {officials.length === 0 && <tr><td colSpan={6}><EmptyState msg="No officials registered yet." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VENUES */}
          {activeTab === "venues" && (
            <div>
              {sectionHeader("Venues", user && (
                <button onClick={() => setShowForm(!showForm)} className="h-8 px-4 text-xs font-semibold tracking-wide rounded-lg bg-foreground text-primary-foreground hover:opacity-85 btn-click">
                  {showForm ? "Cancel" : "+ Add Venue"}
                </button>
              ))}
              {showForm && <div className="p-4 sm:p-8 hairline-b"><VenueForm onSuccess={() => { setShowForm(false); refetchVenues(); }} /></div>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  {tableHead("Name","Type","City","Province","Capacity","Status")}
                  <tbody>
                    {(venues as any[]).map((v) => (
                      <tr key={v.id} className={clickableRow} onClick={() => openDetail(v, "venue")}>
                        <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-foreground">{v.name}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted capitalize">{v.type}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{v.city}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{v.province}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{v.capacity ? v.capacity.toLocaleString() : "—"}</td>
                        <td className="px-4 sm:px-6 py-4"><span className={`text-[10px] mono px-2.5 py-1 rounded-full ${v.is_active ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted"}`}>{v.is_active ? "Active" : "Inactive"}</span></td>
                      </tr>
                    ))}
                    {venues.length === 0 && <tr><td colSpan={6}><EmptyState msg="No venues yet." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DISCIPLINARY */}
          {activeTab === "disciplinary" && (
            <div>
              {sectionHeader("Disciplinary Registry")}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  {tableHead("Athlete","Severity","Reason","Appeal","Suspension Until","Active")}
                  <tbody>
                    {(disciplinary as any[]).map((d) => (
                      <tr key={d.id} className={clickableRow} onClick={() => openDetail(d, "disciplinary")}>
                        <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-foreground">{d.athlete ? `${d.athlete.first_name} ${d.athlete.last_name}` : "—"}</td>
                        <td className="px-4 sm:px-6 py-4"><span className="text-[10px] mono px-2.5 py-1 rounded-full bg-nexus-surface text-nexus-muted uppercase tracking-widest">{d.severity?.replace(/_/g," ")}</span></td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted max-w-[200px] truncate">{d.reason}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{d.appeal_status || "none"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{d.suspension_until || "—"}</td>
                        <td className="px-4 sm:px-6 py-4"><span className={`text-[10px] mono px-2.5 py-1 rounded-full ${d.is_active ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted"}`}>{d.is_active ? "Active" : "Resolved"}</span></td>
                      </tr>
                    ))}
                    {disciplinary.length === 0 && <tr><td colSpan={6}><EmptyState msg="No disciplinary records." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STANDINGS */}
          {activeTab === "standings" && (
            <div>
              {sectionHeader("Standings Management")}
              <div className="p-8 text-center">
                <p className="text-nexus-muted mono text-sm">Standings are auto-populated from fixture results.</p>
                <p className="text-nexus-muted mono text-xs mt-2">Go to Scoring to enter results, then view standings on the main page.</p>
              </div>
            </div>
          )}

          {/* REGISTRATIONS */}
          {activeTab === "registrations" && (
            <div>
              {sectionHeader("Registrations")}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  {tableHead("Registrant","Type","Competition","Status","Payment","Date")}
                  <tbody>
                    {(registrations as any[]).map((r) => (
                      <tr key={r.id} className={clickableRow} onClick={() => openDetail(r, "registration")}>
                        <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-foreground">{r.athlete ? `${r.athlete.first_name} ${r.athlete.last_name}` : r.team?.name || "—"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted capitalize">{r.registration_type}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{r.competition?.name || "—"}</td>
                        <td className="px-4 sm:px-6 py-4"><span className="text-[10px] mono px-2.5 py-1 rounded-full bg-nexus-surface text-nexus-muted">{r.status}</span></td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{r.payment_status}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{new Date(r.created_at).toLocaleDateString("en-ZW", { month: "short", day: "numeric" })}</td>
                      </tr>
                    ))}
                    {registrations.length === 0 && <tr><td colSpan={6}><EmptyState msg="No registrations yet." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BROADCASTS */}
          {activeTab === "broadcasts" && (
            <div>
              {sectionHeader("Broadcasts")}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  {tableHead("Title","Competition","Platform","Status","Viewers","Quality")}
                  <tbody>
                    {(broadcasts as any[]).map((b) => (
                      <tr key={b.id} className={clickableRow} onClick={() => openDetail(b, "broadcast")}>
                        <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-foreground">{b.title}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{b.competition?.name || "—"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{b.platform || "—"}</td>
                        <td className="px-4 sm:px-6 py-4"><span className={`text-[10px] mono px-2.5 py-1 rounded-full ${b.is_live ? "bg-nexus-live text-primary-foreground" : "bg-nexus-surface text-nexus-muted"}`}>{b.is_live ? "Live" : "Offline"}</span></td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{b.viewer_count?.toLocaleString() || "—"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{b.quality || "HD"}</td>
                      </tr>
                    ))}
                    {broadcasts.length === 0 && <tr><td colSpan={6}><EmptyState msg="No broadcasts yet." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SPONSORSHIPS */}
          {activeTab === "sponsorships" && (
            <div>
              {sectionHeader("Sponsorships", user && (
                <button onClick={() => setShowForm(!showForm)} className="h-8 px-4 text-xs font-semibold tracking-wide rounded-lg bg-foreground text-primary-foreground hover:opacity-85 btn-click">
                  {showForm ? "Cancel" : "+ Add Sponsor"}
                </button>
              ))}
              {showForm && <div className="p-4 sm:p-8 hairline-b"><SponsorshipForm competitions={competitions as any[]} onSuccess={() => { setShowForm(false); refetchSponsors(); }} /></div>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  {tableHead("","Sponsor","Competition","Tier","Amount","Start","End")}
                  <tbody>
                    {(sponsorships as any[]).map((s) => (
                      <tr key={s.id} className={clickableRow} onClick={() => openDetail(s, "sponsor")}>
                        <td className="px-4 sm:px-6 py-4 w-10">{s.sponsor_logo ? <img src={s.sponsor_logo} className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" alt="" /> : <div className="w-8 h-8 rounded-lg bg-nexus-surface" />}</td>
                        <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-foreground">{s.sponsor_name}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{s.competition?.name || "General"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted capitalize">{s.tier || "—"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{s.amount ? `$${Number(s.amount).toLocaleString()}` : "—"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{s.contract_start || "—"}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs mono text-nexus-muted">{s.contract_end || "—"}</td>
                      </tr>
                    ))}
                    {sponsorships.length === 0 && <tr><td colSpan={7}><EmptyState msg="No sponsorships yet. Add one above." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SCHOLASTIC SERVICES */}
          {activeTab === "scholastic" && (
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
          </div>
        )}
      </DetailPanel>

      <DetailPanel open={!!selectedItem && detailType === "fixture"} onClose={() => setSelectedItem(null)} title="Fixture Details">
        {selectedItem && detailType === "fixture" && (
          <div>
            <DetailField label="Match" value={`${selectedItem.home_team?.name || "TBD"} vs ${selectedItem.away_team?.name || "TBD"}`} />
            <DetailField label="Competition" value={selectedItem.competition?.name} />
            <DetailField label="Round" value={selectedItem.round_label} />
            <DetailField label="Status" value={selectedItem.status} />
            <DetailField label="Score" value={`${selectedItem.home_score ?? 0} — ${selectedItem.away_score ?? 0}`} />
            <DetailField label="Scheduled" value={selectedItem.scheduled_at ? new Date(selectedItem.scheduled_at).toLocaleString() : "TBD"} />
            <div className="mt-4 flex gap-2">
              <a href={`/scoring`} className="h-9 px-4 text-xs font-semibold rounded-lg bg-foreground text-primary-foreground flex items-center hover:opacity-85 transition-opacity">Open in Scoring</a>
              <a href={`/broadcast/${selectedItem.id}`} className="h-9 px-4 text-xs font-semibold rounded-lg bg-nexus-surface text-foreground flex items-center hover:bg-nexus-silver transition-colors">Broadcast CG</a>
            </div>
          </div>
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
          </div>
        )}
      </DetailPanel>

      <NexusFooter />
    </div>
  );
}
