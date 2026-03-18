import { useState } from "react";
import { motion } from "framer-motion";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
];

const inputCls = "bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all w-full";
const labelCls = "text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold";
const PROVINCES = ["Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"];
const LEVELS = ["primary_school","secondary_school","club_academy","provincial","national_league","national_cup","international"] as const;
const FORMATS = ["round_robin","single_elimination","double_elimination","swiss","league","ladder","custom_heats"] as const;
const STATUSES = ["draft","registration_open","registration_closed","ongoing","completed","cancelled"] as const;

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="hairline rounded-xl p-6 flex flex-col gap-2 card-shadow bg-background">
      <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted font-medium">{label}</p>
      <p className="score-display text-score-md text-foreground">{value}</p>
      {sub && <p className="text-xs text-nexus-muted">{sub}</p>}
    </div>
  );
}

function CompetitionForm({ onSuccess, competitions }: { onSuccess: () => void; competitions: any[] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", discipline: "", level: "national_league", format: "round_robin", status: "draft", season: new Date().getFullYear().toString(), province: "", description: "", start_date: "", end_date: "", registration_deadline: "", max_participants: "", entry_fee: "", prize_pool: "", sponsor: "", parent_id: "" });
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
          <option value="">Select…</option>
          {["Football","Rugby","Cricket","Athletics","Swimming","Basketball","Volleyball","Tennis","Chess","Debate","Quiz","Netball","Hockey","Boxing","Judo","Cycling","Other"].map(d => <option key={d}>{d}</option>)}
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
      <div className="flex flex-col gap-1.5 md:col-span-2"><label className={labelCls}>Description</label><textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className={inputCls} rows={2} /></div>
      <div className="md:col-span-2"><button type="submit" disabled={loading} className="h-11 px-8 text-sm font-semibold tracking-wide rounded-xl bg-foreground text-primary-foreground hover:opacity-85 transition-opacity btn-click disabled:opacity-50">{loading ? "Creating…" : "Create Competition"}</button></div>
    </form>
  );
}

function FixtureForm({ onSuccess, competitions }: { onSuccess: () => void; competitions: any[] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ competition_id: "", round_label: "", round_number: "", scheduled_at: "", home_team: "", away_team: "", venue_id: "" });
  const [loading, setLoading] = useState(false);

  const { data: teams = [] } = useQuery({ queryKey: ["form-teams", form.competition_id], queryFn: async () => { const { data } = await supabase.from("teams").select("id, name").limit(100); return data || []; } });
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
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Round Label</label><input value={form.round_label} onChange={e => setForm(f => ({...f, round_label: e.target.value}))} className={inputCls} placeholder="Quarter Final, Match Day 3…" /></div>
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
      <div className="md:col-span-2"><button type="submit" disabled={loading} className="h-11 px-8 text-sm font-semibold tracking-wide rounded-xl bg-foreground text-primary-foreground hover:opacity-85 btn-click disabled:opacity-50">{loading ? "Creating…" : "Create Fixture"}</button></div>
    </form>
  );
}

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
    toast({ title: "Venue added" });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="flex flex-col gap-1.5 md:col-span-2"><label className={labelCls}>Venue Name *</label><input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={inputCls} placeholder="National Sports Stadium" /></div>
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
      <div className="flex flex-col gap-1.5"><label className={labelCls}>City *</label><input required value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} className={inputCls} placeholder="Harare" /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Capacity</label><input type="number" value={form.capacity} onChange={e => setForm(f => ({...f, capacity: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5 md:col-span-2"><label className={labelCls}>Address</label><input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5 md:col-span-2"><label className={labelCls}>Facilities (comma-separated)</label><input value={form.facilities} onChange={e => setForm(f => ({...f, facilities: e.target.value}))} className={inputCls} placeholder="Floodlights, Changing Rooms, Medical Bay…" /></div>
      <div className="md:col-span-2"><button type="submit" disabled={loading} className="h-11 px-8 text-sm font-semibold tracking-wide rounded-xl bg-foreground text-primary-foreground hover:opacity-85 btn-click disabled:opacity-50">{loading ? "Adding…" : "Add Venue"}</button></div>
    </form>
  );
}

function TeamForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", short_name: "", discipline: "", province: "Harare", school_name: "", club_name: "", level: "national_league", founded_year: "" });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("teams").insert({
      ...form, level: form.level as typeof LEVELS[number],
      founded_year: form.founded_year ? Number(form.founded_year) : null,
      school_name: form.school_name || null, club_name: form.club_name || null,
      short_name: form.short_name || null, manager_id: user?.id || null,
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
          {["Football","Rugby","Cricket","Athletics","Swimming","Basketball","Volleyball","Tennis","Chess","Debate","Quiz","Netball","Hockey","Boxing","Judo","Cycling","Other"].map(d => <option key={d}>{d}</option>)}
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
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Founded Year</label><input type="number" value={form.founded_year} onChange={e => setForm(f => ({...f, founded_year: e.target.value}))} className={inputCls} placeholder="2000" /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>School</label><input value={form.school_name} onChange={e => setForm(f => ({...f, school_name: e.target.value}))} className={inputCls} /></div>
      <div className="flex flex-col gap-1.5"><label className={labelCls}>Club</label><input value={form.club_name} onChange={e => setForm(f => ({...f, club_name: e.target.value}))} className={inputCls} /></div>
      <div className="md:col-span-2"><button type="submit" disabled={loading} className="h-11 px-8 text-sm font-semibold tracking-wide rounded-xl bg-foreground text-primary-foreground hover:opacity-85 btn-click disabled:opacity-50">{loading ? "Creating…" : "Create Team"}</button></div>
    </form>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();

  const { data: competitions = [], refetch: refetchComp } = useQuery({ queryKey: ["admin-competitions"], queryFn: async () => { const { data } = await supabase.from("competitions").select("id, name, discipline, level, format, status, province, season, parent_id, created_at").order("created_at", { ascending: false }).limit(50); return data || []; } });
  const { data: athletes = [] } = useQuery({ queryKey: ["admin-athletes"], queryFn: async () => { const { data } = await supabase.from("athletes").select("id, first_name, last_name, province, disciplines, id_card_number, is_active, is_suspended, created_at").order("created_at", { ascending: false }).limit(50); return data || []; } });
  const { data: venues = [], refetch: refetchVenues } = useQuery({ queryKey: ["admin-venues"], queryFn: async () => { const { data } = await supabase.from("venues").select("id, name, type, city, province, capacity, is_active").order("created_at", { ascending: false }).limit(50); return data || []; } });
  const { data: officials = [] } = useQuery({ queryKey: ["admin-officials"], queryFn: async () => { const { data } = await supabase.from("officials").select("id, first_name, last_name, role, disciplines, province, is_active, performance_rating").order("created_at", { ascending: false }).limit(50); return data || []; } });
  const { data: teams = [], refetch: refetchTeams } = useQuery({ queryKey: ["admin-teams"], queryFn: async () => { const { data } = await supabase.from("teams").select("id, name, short_name, discipline, level, province, is_active, created_at").order("created_at", { ascending: false }).limit(50); return data || []; } });
  const { data: fixtures = [], refetch: refetchFixtures } = useQuery({ queryKey: ["admin-fixtures"], queryFn: async () => { const { data } = await supabase.from("fixtures").select(`id, round_label, status, scheduled_at, home_score, away_score, competition_id, home_team:home_team_id(name), away_team:away_team_id(name), competition:competition_id(name)`).order("scheduled_at", { ascending: false }).limit(50); return data || []; } });
  const { data: disciplinary = [] } = useQuery({ queryKey: ["admin-disciplinary"], queryFn: async () => { const { data } = await supabase.from("disciplinary_records").select("id, reason, severity, is_active, appeal_status, suspension_until, created_at, athlete:athlete_id(first_name, last_name)").order("created_at", { ascending: false }).limit(30); return data || []; } });
  const { data: registrations = [] } = useQuery({ queryKey: ["admin-registrations"], queryFn: async () => { const { data } = await supabase.from("registrations").select(`id, registration_type, status, payment_status, created_at, competition:competition_id(name), athlete:athlete_id(first_name, last_name), team:team_id(name)`).order("created_at", { ascending: false }).limit(50); return data || []; } });
  const { data: broadcasts = [] } = useQuery({ queryKey: ["admin-broadcasts"], queryFn: async () => { const { data } = await supabase.from("broadcasts").select("id, title, platform, is_live, viewer_count, quality, created_at, competition:competition_id(name)").order("created_at", { ascending: false }).limit(30); return data || []; } });
  const { data: sponsorships = [] } = useQuery({ queryKey: ["admin-sponsorships"], queryFn: async () => { const { data } = await supabase.from("sponsorships").select("id, sponsor_name, tier, amount, contract_start, contract_end, competition:competition_id(name)").order("created_at", { ascending: false }).limit(30); return data || []; } });

  const sectionHeader = (title: string, action?: React.ReactNode) => (
    <div className="px-8 py-5 hairline-b flex items-center justify-between">
      <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">{title}</p>
      {action}
    </div>
  );

  const tableHead = (...cols: string[]) => (
    <thead><tr className="hairline-b">{cols.map(c => <th key={c} className="px-6 py-4 text-left text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold">{c}</th>)}</tr></thead>
  );

  const EmptyState = ({ msg }: { msg: string }) => (
    <div className="py-12 text-center"><p className="text-nexus-muted mono text-sm">{msg}</p></div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />
      <div className="max-w-[1400px] mx-auto pt-20">
        <div className="px-8 py-8 hairline-b">
          <p className="text-[10px] mono tracking-[0.25em] uppercase text-nexus-muted">Administration</p>
          <h1 className="display-font text-display-lg font-bold text-foreground mt-1">Nexus Admin Dashboard</h1>
          {!user && <p className="text-sm text-nexus-muted mt-2 bg-nexus-surface hairline rounded-lg px-4 py-2.5 inline-block mt-3">⚠ Sign in with an admin account to manage data</p>}
        </div>

        <div className="flex overflow-x-auto hairline-b">
          {ADMIN_TABS.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
              className={`px-6 py-4 text-xs font-semibold tracking-wide whitespace-nowrap flex-shrink-0 border-b-2 transition-all duration-200 btn-click
                ${activeTab === tab.id ? "border-foreground text-foreground" : "border-transparent text-nexus-muted hover:text-foreground"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Competitions" value={String(competitions.length)} sub="total" />
                <StatCard label="Teams" value={String(teams.length)} sub="registered" />
                <StatCard label="Athletes" value={String(athletes.length)} sub="registered" />
                <StatCard label="Venues" value={String(venues.length)} sub="in system" />
                <StatCard label="Fixtures" value={String(fixtures.length)} sub="scheduled" />
                <StatCard label="Officials" value={String(officials.length)} sub="certified" />
                <StatCard label="Registrations" value={String(registrations.length)} sub="submitted" />
                <StatCard label="Broadcasts" value={String(broadcasts.length)} sub="created" />
              </div>
              <div className="hairline rounded-xl p-6 bg-nexus-surface/40">
                <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium mb-4">Live Status</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="hairline rounded-lg p-4 bg-background">
                    <p className="text-[10px] mono text-nexus-muted uppercase tracking-wider mb-1">Live Fixtures</p>
                    <p className="score-display text-score-md text-foreground">{(fixtures as any[]).filter(f => f.status === "live").length}</p>
                  </div>
                  <div className="hairline rounded-lg p-4 bg-background">
                    <p className="text-[10px] mono text-nexus-muted uppercase tracking-wider mb-1">Open Registrations</p>
                    <p className="score-display text-score-md text-foreground">{(competitions as any[]).filter(c => c.status === "registration_open").length}</p>
                  </div>
                  <div className="hairline rounded-lg p-4 bg-background">
                    <p className="text-[10px] mono text-nexus-muted uppercase tracking-wider mb-1">Active Disciplinary</p>
                    <p className="score-display text-score-md text-foreground">{(disciplinary as any[]).filter(d => d.is_active).length}</p>
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
              {showForm && <div className="p-8 hairline-b"><CompetitionForm competitions={competitions as any[]} onSuccess={() => { setShowForm(false); refetchComp(); }} /></div>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  {tableHead("Name","Discipline","Level","Format","Status","Province","Season")}
                  <tbody>
                    {(competitions as any[]).map((comp) => (
                      <tr key={comp.id} className="hairline-b hover:bg-nexus-surface/60 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{comp.name}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{comp.discipline}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{comp.level?.replace(/_/g," ")}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{comp.format?.replace(/_/g," ")}</td>
                        <td className="px-6 py-4"><span className="text-[10px] mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-2.5 py-1 rounded-full">{comp.status?.replace(/_/g," ")}</span></td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{comp.province || "National"}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{comp.season || "—"}</td>
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
              {showForm && <div className="p-8 hairline-b"><FixtureForm competitions={competitions as any[]} onSuccess={() => { setShowForm(false); refetchFixtures(); }} /></div>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  {tableHead("Match","Competition","Round","Status","Score","Scheduled")}
                  <tbody>
                    {(fixtures as any[]).map((f) => (
                      <tr key={f.id} className="hairline-b hover:bg-nexus-surface/60 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{f.home_team?.name || "TBD"} vs {f.away_team?.name || "TBD"}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{f.competition?.name || "—"}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{f.round_label || f.round_number || "—"}</td>
                        <td className="px-6 py-4"><span className="text-[10px] mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-2.5 py-1 rounded-full">{f.status}</span></td>
                        <td className="px-6 py-4 text-sm mono font-semibold text-foreground">{f.home_score ?? 0} — {f.away_score ?? 0}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{f.scheduled_at ? new Date(f.scheduled_at).toLocaleString("en-ZW", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "TBD"}</td>
                      </tr>
                    ))}
                    {fixtures.length === 0 && <tr><td colSpan={6}><EmptyState msg="No fixtures yet. Create one above." /></td></tr>}
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
              {showForm && <div className="p-8 hairline-b"><TeamForm onSuccess={() => { setShowForm(false); refetchTeams(); }} /></div>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  {tableHead("Name","Short","Discipline","Level","Province","Status")}
                  <tbody>
                    {(teams as any[]).map((t) => (
                      <tr key={t.id} className="hairline-b hover:bg-nexus-surface/60 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{t.name}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{t.short_name || "—"}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{t.discipline}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{t.level?.replace(/_/g," ") || "—"}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{t.province || "—"}</td>
                        <td className="px-6 py-4"><span className={`text-[10px] mono px-2.5 py-1 rounded-full ${t.is_active ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted"}`}>{t.is_active ? "Active" : "Inactive"}</span></td>
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
                  {tableHead("Name","Province","Disciplines","ID Card","Status")}
                  <tbody>
                    {(athletes as any[]).map((a) => (
                      <tr key={a.id} className="hairline-b hover:bg-nexus-surface/60 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{a.first_name} {a.last_name}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{a.province}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{a.disciplines?.join(", ")}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{a.id_card_number || "—"}</td>
                        <td className="px-6 py-4"><span className={`text-[10px] mono px-2.5 py-1 rounded-full ${a.is_suspended ? "bg-foreground text-primary-foreground" : a.is_active ? "bg-nexus-surface text-nexus-muted" : "bg-nexus-surface text-nexus-muted"}`}>{a.is_suspended ? "Suspended" : a.is_active ? "Active" : "Inactive"}</span></td>
                      </tr>
                    ))}
                    {athletes.length === 0 && <tr><td colSpan={5}><EmptyState msg="No athletes registered yet." /></td></tr>}
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
                      <tr key={o.id} className="hairline-b hover:bg-nexus-surface/60 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{o.first_name} {o.last_name}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted capitalize">{o.role}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{o.disciplines?.join(", ")}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{o.province || "—"}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{o.performance_rating ? `${o.performance_rating}/5` : "—"}</td>
                        <td className="px-6 py-4"><span className={`text-[10px] mono px-2.5 py-1 rounded-full ${o.is_active ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted"}`}>{o.is_active ? "Active" : "Inactive"}</span></td>
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
              {showForm && <div className="p-8 hairline-b"><VenueForm onSuccess={() => { setShowForm(false); refetchVenues(); }} /></div>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  {tableHead("Name","Type","City","Province","Capacity","Status")}
                  <tbody>
                    {(venues as any[]).map((v) => (
                      <tr key={v.id} className="hairline-b hover:bg-nexus-surface/60 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{v.name}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted capitalize">{v.type}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{v.city}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{v.province}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{v.capacity ? v.capacity.toLocaleString() : "—"}</td>
                        <td className="px-6 py-4"><span className={`text-[10px] mono px-2.5 py-1 rounded-full ${v.is_active ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted"}`}>{v.is_active ? "Active" : "Inactive"}</span></td>
                      </tr>
                    ))}
                    {venues.length === 0 && <tr><td colSpan={6}><EmptyState msg="No venues yet. Add one above." /></td></tr>}
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
                      <tr key={d.id} className="hairline-b hover:bg-nexus-surface/60 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{d.athlete ? `${d.athlete.first_name} ${d.athlete.last_name}` : "—"}</td>
                        <td className="px-6 py-4"><span className="text-[10px] mono px-2.5 py-1 rounded-full bg-nexus-surface text-nexus-muted uppercase tracking-widest">{d.severity?.replace(/_/g," ")}</span></td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted max-w-[200px] truncate">{d.reason}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{d.appeal_status || "none"}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{d.suspension_until || "—"}</td>
                        <td className="px-6 py-4"><span className={`text-[10px] mono px-2.5 py-1 rounded-full ${d.is_active ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted"}`}>{d.is_active ? "Active" : "Resolved"}</span></td>
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
                      <tr key={r.id} className="hairline-b hover:bg-nexus-surface/60 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{r.athlete ? `${r.athlete.first_name} ${r.athlete.last_name}` : r.team?.name || "—"}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted capitalize">{r.registration_type}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{r.competition?.name || "—"}</td>
                        <td className="px-6 py-4"><span className="text-[10px] mono px-2.5 py-1 rounded-full bg-nexus-surface text-nexus-muted">{r.status}</span></td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{r.payment_status}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{new Date(r.created_at).toLocaleDateString("en-ZW", { month: "short", day: "numeric" })}</td>
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
                      <tr key={b.id} className="hairline-b hover:bg-nexus-surface/60 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{b.title}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{b.competition?.name || "—"}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{b.platform || "—"}</td>
                        <td className="px-6 py-4"><span className={`text-[10px] mono px-2.5 py-1 rounded-full ${b.is_live ? "bg-nexus-live text-primary-foreground" : "bg-nexus-surface text-nexus-muted"}`}>{b.is_live ? "Live" : "Offline"}</span></td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{b.viewer_count?.toLocaleString() || "—"}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{b.quality || "HD"}</td>
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
              {sectionHeader("Sponsorships")}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  {tableHead("Sponsor","Competition","Tier","Amount","Start","End")}
                  <tbody>
                    {(sponsorships as any[]).map((s) => (
                      <tr key={s.id} className="hairline-b hover:bg-nexus-surface/60 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{s.sponsor_name}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{s.competition?.name || "—"}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted capitalize">{s.tier || "—"}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{s.amount ? `$${Number(s.amount).toLocaleString()}` : "—"}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{s.contract_start || "—"}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{s.contract_end || "—"}</td>
                      </tr>
                    ))}
                    {sponsorships.length === 0 && <tr><td colSpan={6}><EmptyState msg="No sponsorships yet." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </motion.div>
      </div>
      <NexusFooter />
    </div>
  );
}
