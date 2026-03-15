import { useState } from "react";
import { motion } from "framer-motion";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const ADMIN_TABS = [
  { id: "overview", label: "Overview" },
  { id: "competitions", label: "Competitions" },
  { id: "athletes", label: "Athletes" },
  { id: "officials", label: "Officials" },
  { id: "venues", label: "Venues" },
  { id: "disciplinary", label: "Disciplinary" },
  { id: "broadcasts", label: "Broadcasts" },
  { id: "sponsorships", label: "Sponsorships" },
];

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="hairline rounded-xl p-6 flex flex-col gap-2 card-shadow bg-background">
      <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted font-medium">{label}</p>
      <p className="score-display text-score-md text-foreground">{value}</p>
      {sub && <p className="text-xs text-nexus-muted">{sub}</p>}
    </div>
  );
}

function CompetitionForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "", discipline: "", level: "national_league", format: "round_robin",
    status: "draft", season: "2026", province: "", description: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    await supabase.from("competitions").insert({
      ...form,
      level: form.level as "national_league",
      status: form.status as "draft",
      format: form.format as "round_robin",
      created_by: user.id,
    });
    setLoading(false);
    onSuccess();
  };

  const inputCls = "bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all";
  const labelCls = "text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold";

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label className={labelCls}>Competition Name</label>
        <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={inputCls} placeholder="e.g. Premier Soccer League 2026" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Discipline</label>
        <input required value={form.discipline} onChange={e => setForm(f => ({...f, discipline: e.target.value}))} className={inputCls} placeholder="Football, Chess, Debate…" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Level</label>
        <select value={form.level} onChange={e => setForm(f => ({...f, level: e.target.value}))} className={inputCls + " cursor-pointer"}>
          <option value="primary_school">Primary School</option>
          <option value="secondary_school">Secondary School</option>
          <option value="club_academy">Club / Academy</option>
          <option value="provincial">Provincial</option>
          <option value="national_league">National League</option>
          <option value="national_cup">National Cup</option>
          <option value="international">International</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Format</label>
        <select value={form.format} onChange={e => setForm(f => ({...f, format: e.target.value}))} className={inputCls + " cursor-pointer"}>
          <option value="round_robin">Round Robin</option>
          <option value="single_elimination">Single Elimination</option>
          <option value="double_elimination">Double Elimination</option>
          <option value="swiss">Swiss</option>
          <option value="league">League</option>
          <option value="ladder">Ladder</option>
          <option value="custom_heats">Custom Heats</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Status</label>
        <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={inputCls + " cursor-pointer"}>
          <option value="draft">Draft</option>
          <option value="registration_open">Registration Open</option>
          <option value="registration_closed">Registration Closed</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Province</label>
        <select value={form.province} onChange={e => setForm(f => ({...f, province: e.target.value}))} className={inputCls + " cursor-pointer"}>
          <option value="">National (All Provinces)</option>
          {["Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label className={labelCls}>Description</label>
        <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className={inputCls} rows={3} placeholder="Brief description of the competition…" />
      </div>
      <div className="md:col-span-2">
        <button type="submit" disabled={loading} className="h-11 px-8 text-sm font-semibold tracking-wide rounded-xl bg-foreground text-primary-foreground hover:opacity-85 transition-opacity btn-click disabled:opacity-50">
          {loading ? "Creating…" : "Create Competition"}
        </button>
      </div>
    </form>
  );
}

function VenueForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", type: "stadium", province: "Harare", city: "", address: "", capacity: "" });
  const [loading, setLoading] = useState(false);
  const inputCls = "bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all";
  const labelCls = "text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from("venues").insert({ ...form, capacity: form.capacity ? Number(form.capacity) : null });
    setLoading(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label className={labelCls}>Venue Name</label>
        <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={inputCls} placeholder="National Sports Stadium" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Type</label>
        <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} className={inputCls + " cursor-pointer"}>
          {["stadium","court","pool","auditorium","lab","pitch","gym","arena","other"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Province</label>
        <select value={form.province} onChange={e => setForm(f => ({...f, province: e.target.value}))} className={inputCls + " cursor-pointer"}>
          {["Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>City</label>
        <input required value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} className={inputCls} placeholder="Harare" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Capacity</label>
        <input type="number" value={form.capacity} onChange={e => setForm(f => ({...f, capacity: e.target.value}))} className={inputCls} placeholder="60000" />
      </div>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label className={labelCls}>Address</label>
        <input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} className={inputCls} placeholder="Rufaro, Mbare, Harare" />
      </div>
      <div className="md:col-span-2">
        <button type="submit" disabled={loading} className="h-11 px-8 text-sm font-semibold tracking-wide rounded-xl bg-foreground text-primary-foreground hover:opacity-85 transition-opacity btn-click disabled:opacity-50">
          {loading ? "Adding…" : "Add Venue"}
        </button>
      </div>
    </form>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();

  const { data: competitions, refetch: refetchComp } = useQuery({
    queryKey: ["admin-competitions"],
    queryFn: async () => {
      const { data } = await supabase.from("competitions").select("*").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const { data: athletes } = useQuery({
    queryKey: ["admin-athletes"],
    queryFn: async () => {
      const { data } = await supabase.from("athletes").select("*").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const { data: venues, refetch: refetchVenues } = useQuery({
    queryKey: ["admin-venues"],
    queryFn: async () => {
      const { data } = await supabase.from("venues").select("*").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const { data: officials } = useQuery({
    queryKey: ["admin-officials"],
    queryFn: async () => {
      const { data } = await supabase.from("officials").select("*").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const sectionHeader = (title: string, action?: React.ReactNode) => (
    <div className="px-8 py-5 hairline-b flex items-center justify-between">
      <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">{title}</p>
      {action}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />

      <div className="max-w-[1400px] mx-auto pt-20">
        {/* Page header */}
        <div className="px-8 py-8 hairline-b">
          <p className="text-[10px] mono tracking-[0.25em] uppercase text-nexus-muted">Administration</p>
          <h1 className="display-font text-display-lg font-bold text-foreground mt-1">Nexus Admin Dashboard</h1>
          {!user && (
            <p className="text-sm text-nexus-muted mt-2 bg-nexus-surface hairline rounded-lg px-4 py-2.5 inline-block mt-3">
              ⚠ Sign in with an admin account to manage data
            </p>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex overflow-x-auto hairline-b">
          {ADMIN_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
              className={`px-6 py-4 text-xs font-semibold tracking-wide whitespace-nowrap flex-shrink-0 border-b-2 transition-all duration-200 btn-click
                ${activeTab === tab.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-nexus-muted hover:text-foreground"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Competitions" value={String(competitions?.length ?? "—")} sub="in database" />
                <StatCard label="Athletes" value={String(athletes?.length ?? "—")} sub="registered" />
                <StatCard label="Venues" value={String(venues?.length ?? "—")} sub="in system" />
                <StatCard label="Officials" value={String(officials?.length ?? "—")} sub="certified" />
              </div>

              <div className="hairline rounded-xl p-6 bg-nexus-surface/40">
                <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium mb-4">Database Schema — 18 Tables</p>
                <div className="flex flex-wrap gap-2">
                  {["user_roles","profiles","venues","competitions","teams","athletes","registrations","fixtures","standings","score_entries","officials","disciplinary_records","records","broadcasts","judge_scores","polls","poll_votes","notifications","venue_bookings","official_assignments","athlete_transfers","sponsorships"].map(t => (
                    <span key={t} className="text-[11px] mono hairline px-2.5 py-1.5 rounded-md text-nexus-muted bg-background">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* COMPETITIONS */}
          {activeTab === "competitions" && (
            <div>
              {sectionHeader("Competitions", (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="h-8 px-4 text-xs font-semibold tracking-wide rounded-lg bg-foreground text-primary-foreground hover:opacity-85 transition-opacity btn-click"
                >
                  {showForm ? "Cancel" : "+ New Competition"}
                </button>
              ))}
              {showForm && (
                <div className="p-8 hairline-b">
                  <CompetitionForm onSuccess={() => { setShowForm(false); refetchComp(); }} />
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="hairline-b">
                      {["Name","Discipline","Level","Format","Status","Province"].map(c => (
                        <th key={c} className={`px-6 py-4 text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold ${c === "Name" ? "text-left" : "text-left"}`}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(competitions || []).map((comp) => (
                      <tr key={comp.id} className="hairline-b hover:bg-nexus-surface/60 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{comp.name}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{comp.discipline}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{comp.level?.replace(/_/g," ")}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{comp.format?.replace(/_/g," ")}</td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-2.5 py-1 rounded-full">
                            {comp.status?.replace(/_/g," ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{comp.province || "National"}</td>
                      </tr>
                    ))}
                    {!competitions?.length && (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-nexus-muted text-sm mono">No competitions yet. Create one above.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ATHLETES */}
          {activeTab === "athletes" && (
            <div>
              {sectionHeader("Registered Athletes")}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="hairline-b">
                      {["Name","Province","Disciplines","ID Card","Status"].map(c => (
                        <th key={c} className="px-6 py-4 text-left text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(athletes || []).map((a) => (
                      <tr key={a.id} className="hairline-b hover:bg-nexus-surface/60 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{a.first_name} {a.last_name}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{a.province}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{a.disciplines?.join(", ")}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{a.id_card_number || "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] mono tracking-widest uppercase px-2.5 py-1 rounded-full ${a.is_suspended ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-nexus-muted"}`}>
                            {a.is_suspended ? "Suspended" : "Active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!athletes?.length && (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-nexus-muted text-sm mono">No athletes registered yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VENUES */}
          {activeTab === "venues" && (
            <div>
              {sectionHeader("Venues & Facilities", (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="h-8 px-4 text-xs font-semibold tracking-wide rounded-lg bg-foreground text-primary-foreground hover:opacity-85 transition-opacity btn-click"
                >
                  {showForm ? "Cancel" : "+ Add Venue"}
                </button>
              ))}
              {showForm && (
                <div className="p-8 hairline-b">
                  <VenueForm onSuccess={() => { setShowForm(false); refetchVenues(); }} />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {(venues || []).map((v) => (
                  <div key={v.id} className="hairline rounded-xl p-6 card-shadow bg-background">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-2.5 py-1 rounded-full">{v.type}</span>
                      {v.capacity && <span className="text-xs mono text-nexus-muted">{v.capacity.toLocaleString()} cap.</span>}
                    </div>
                    <p className="display-font text-sm font-semibold text-foreground">{v.name}</p>
                    <p className="text-xs mono text-nexus-muted mt-1">{v.city}, {v.province}</p>
                    {v.address && <p className="text-[11px] mono text-nexus-muted/70 mt-0.5">{v.address}</p>}
                  </div>
                ))}
                {!venues?.length && (
                  <div className="col-span-3 py-12 text-center text-nexus-muted text-sm mono">No venues yet.</div>
                )}
              </div>
            </div>
          )}

          {/* OFFICIALS */}
          {activeTab === "officials" && (
            <div>
              {sectionHeader("Officials & Referees")}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="hairline-b">
                      {["Name","Role","Disciplines","Certification","Rating","Status"].map(c => (
                        <th key={c} className="px-6 py-4 text-left text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(officials || []).map((o) => (
                      <tr key={o.id} className="hairline-b hover:bg-nexus-surface/60 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{o.first_name} {o.last_name}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{o.role}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{o.disciplines?.join(", ")}</td>
                        <td className="px-6 py-4 text-xs mono text-nexus-muted">{o.certification_level || "—"}</td>
                        <td className="px-6 py-4 text-xs mono text-foreground">{o.performance_rating ? `${o.performance_rating}/5` : "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] mono tracking-widest uppercase px-2.5 py-1 rounded-full ${o.is_active ? "bg-nexus-surface text-nexus-muted" : "bg-foreground text-primary-foreground"}`}>
                            {o.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!officials?.length && (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-nexus-muted text-sm mono">No officials registered yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DISCIPLINARY */}
          {activeTab === "disciplinary" && (
            <div className="p-8">
              <div className="hairline rounded-xl p-8 bg-nexus-surface/40 text-center">
                <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted mb-3">Disciplinary Registry</p>
                <p className="display-font text-xl font-semibold text-foreground mb-2">Cross-Level Suspension Tracker</p>
                <p className="text-sm text-nexus-muted max-w-[55ch] mx-auto">
                  Red cards, suspensions and bans follow athletes across all levels. A national ban issued here blocks participation from primary school fixtures to national finals.
                </p>
                <p className="text-xs mono text-nexus-muted mt-4 bg-background hairline px-4 py-2.5 rounded-lg inline-block">Sign in as admin to manage disciplinary records</p>
              </div>
            </div>
          )}

          {/* BROADCASTS */}
          {activeTab === "broadcasts" && (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard label="Live Streams" value="4" sub="Active now" />
                <StatCard label="Total Viewers" value="18.2K" sub="Across all streams" />
                <StatCard label="Platforms" value="3" sub="Nexus · YT · FB" />
              </div>
              <div className="hairline rounded-xl p-8 bg-nexus-surface/40">
                <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted mb-3">OTT & Streaming Management</p>
                <p className="text-sm text-nexus-muted">Manage live streams, CG overlays, lower-thirds, commentary ports, and AI highlights from this panel. Connect stream keys and schedule broadcasts for upcoming fixtures.</p>
              </div>
            </div>
          )}

          {/* SPONSORSHIPS */}
          {activeTab === "sponsorships" && (
            <div className="p-8">
              <div className="hairline rounded-xl p-8 bg-nexus-surface/40">
                <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted mb-3">Sponsorship & Monetization</p>
                <p className="text-sm text-nexus-muted max-w-[60ch]">Manage digital billboard slots, ticket sales, merchandise stores, and fundraising trackers. Add sponsors with tiered packages (Title, Gold, Silver, Bronze) per competition.</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <NexusFooter />
    </div>
  );
}
