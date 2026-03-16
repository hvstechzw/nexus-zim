import { useState } from "react";
import { motion } from "framer-motion";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const DISCIPLINES = ["Football","Rugby","Cricket","Athletics","Swimming","Basketball","Volleyball","Tennis","Chess","Debate","Quiz","Netball","Hockey","Boxing","Judo","Cycling","Other"];
const PROVINCES = ["Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"];
const LEVELS = ["primary_school","secondary_school","club_academy","provincial","national_league","national_cup","international"] as const;
const FORMATS = ["round_robin","single_elimination","double_elimination","swiss","league","ladder","custom_heats"] as const;
const STATUSES = ["draft","registration_open","registration_closed","ongoing","completed","cancelled"] as const;

const inputCls = "bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all w-full";
const labelCls = "text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-nexus-surface text-nexus-muted",
  registration_open: "bg-foreground text-primary-foreground",
  registration_closed: "bg-nexus-surface text-nexus-muted",
  ongoing: "bg-nexus-live text-primary-foreground",
  completed: "bg-nexus-surface text-nexus-muted",
  cancelled: "bg-nexus-surface text-nexus-muted",
};

function CompetitionForm({ onSuccess, parentId }: { onSuccess: () => void; parentId?: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "", discipline: "", level: "national_league" as typeof LEVELS[number],
    format: "round_robin" as typeof FORMATS[number], status: "draft" as typeof STATUSES[number],
    season: new Date().getFullYear().toString(), province: "", description: "",
    start_date: "", end_date: "", registration_deadline: "", max_participants: "",
    entry_fee: "", prize_pool: "", sponsor: "", parent_id: parentId || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    setLoading(true);
    const { error } = await supabase.from("competitions").insert({
      name: form.name, discipline: form.discipline, level: form.level,
      format: form.format, status: form.status, season: form.season,
      province: form.province || null, description: form.description || null,
      start_date: form.start_date || null, end_date: form.end_date || null,
      registration_deadline: form.registration_deadline || null,
      max_participants: form.max_participants ? Number(form.max_participants) : null,
      entry_fee: form.entry_fee ? Number(form.entry_fee) : 0,
      prize_pool: form.prize_pool ? Number(form.prize_pool) : 0,
      sponsor: form.sponsor || null,
      parent_id: form.parent_id || null,
      created_by: user.id,
    });
    setLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Competition created successfully" });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label className={labelCls}>Competition Name *</label>
        <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={inputCls} placeholder="e.g. National Schools Football Championship 2026" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Discipline *</label>
        <select required value={form.discipline} onChange={e => setForm(f => ({...f, discipline: e.target.value}))} className={inputCls + " cursor-pointer"}>
          <option value="">Select discipline</option>
          {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Level *</label>
        <select value={form.level} onChange={e => setForm(f => ({...f, level: e.target.value as typeof LEVELS[number]}))} className={inputCls + " cursor-pointer"}>
          {LEVELS.map(l => <option key={l} value={l}>{l.replace(/_/g, " ")}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Format</label>
        <select value={form.format} onChange={e => setForm(f => ({...f, format: e.target.value as typeof FORMATS[number]}))} className={inputCls + " cursor-pointer"}>
          {FORMATS.map(f => <option key={f} value={f}>{f.replace(/_/g, " ")}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Status</label>
        <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value as typeof STATUSES[number]}))} className={inputCls + " cursor-pointer"}>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Season</label>
        <input value={form.season} onChange={e => setForm(f => ({...f, season: e.target.value}))} className={inputCls} placeholder="2026" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Province (leave blank for national)</label>
        <select value={form.province} onChange={e => setForm(f => ({...f, province: e.target.value}))} className={inputCls + " cursor-pointer"}>
          <option value="">National (All Provinces)</option>
          {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Start Date</label>
        <input type="date" value={form.start_date} onChange={e => setForm(f => ({...f, start_date: e.target.value}))} className={inputCls} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>End Date</label>
        <input type="date" value={form.end_date} onChange={e => setForm(f => ({...f, end_date: e.target.value}))} className={inputCls} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Registration Deadline</label>
        <input type="date" value={form.registration_deadline} onChange={e => setForm(f => ({...f, registration_deadline: e.target.value}))} className={inputCls} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Max Participants</label>
        <input type="number" value={form.max_participants} onChange={e => setForm(f => ({...f, max_participants: e.target.value}))} className={inputCls} placeholder="e.g. 16" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Entry Fee (USD)</label>
        <input type="number" value={form.entry_fee} onChange={e => setForm(f => ({...f, entry_fee: e.target.value}))} className={inputCls} placeholder="0" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Prize Pool (USD)</label>
        <input type="number" value={form.prize_pool} onChange={e => setForm(f => ({...f, prize_pool: e.target.value}))} className={inputCls} placeholder="0" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Main Sponsor</label>
        <input value={form.sponsor} onChange={e => setForm(f => ({...f, sponsor: e.target.value}))} className={inputCls} placeholder="e.g. Econet Wireless" />
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

export default function CompetitionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterDiscipline, setFilterDiscipline] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [parentId, setParentId] = useState<string | undefined>();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: competitions = [], isLoading, refetch } = useQuery({
    queryKey: ["competitions-page", filterLevel, filterDiscipline, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from("competitions")
        .select(`*, parent:parent_id(name), children:competitions!competitions_parent_id_fkey(id, name, level, status)`)
        .order("created_at", { ascending: false });
      if (filterLevel !== "all") query = query.eq("level", filterLevel as typeof LEVELS[number]);
      if (filterDiscipline !== "all") query = query.eq("discipline", filterDiscipline);
      if (filterStatus !== "all") query = query.eq("status", filterStatus as typeof STATUSES[number]);
      const { data } = await query;
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("competitions").update({ status: status as typeof STATUSES[number] }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { refetch(); toast({ title: "Status updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = (competitions as any[]).filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.discipline.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.sponsor || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topLevel = filtered.filter(c => !c.parent_id);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />
      <div className="max-w-[1400px] mx-auto pt-20">
        {/* Header */}
        <div className="px-8 py-10 hairline-b">
          <p className="text-[10px] mono tracking-[0.25em] uppercase text-nexus-muted">Platform</p>
          <h1 className="display-font text-display-lg font-bold text-foreground mt-1">Competitions</h1>
          <p className="text-sm text-nexus-muted mt-2 max-w-[55ch]">
            All active, upcoming, and archived competitions across every discipline and level in Zimbabwe.
          </p>
        </div>

        {/* Filters + Actions */}
        <div className="px-8 py-5 hairline-b flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search name, discipline, sponsor…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-nexus-surface hairline rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all w-64"
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-nexus-surface hairline rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none cursor-pointer">
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="bg-nexus-surface hairline rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none cursor-pointer">
            <option value="all">All Levels</option>
            {LEVELS.map(l => <option key={l} value={l}>{l.replace(/_/g, " ")}</option>)}
          </select>
          <select value={filterDiscipline} onChange={e => setFilterDiscipline(e.target.value)} className="bg-nexus-surface hairline rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none cursor-pointer">
            <option value="all">All Disciplines</option>
            {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <span className="text-xs mono text-nexus-muted ml-auto">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          {user && (
            <button
              onClick={() => { setParentId(undefined); setShowForm(!showForm); }}
              className="h-9 px-5 text-xs font-semibold tracking-wide rounded-lg bg-foreground text-primary-foreground hover:opacity-85 transition-opacity btn-click"
            >
              {showForm ? "Cancel" : "+ New Competition"}
            </button>
          )}
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="px-8 py-8 hairline-b bg-nexus-surface/30">
            <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium mb-5">
              {parentId ? "Add Sub-Competition" : "New Competition"}
            </p>
            <CompetitionForm
              parentId={parentId}
              onSuccess={() => { setShowForm(false); setParentId(undefined); refetch(); }}
            />
          </div>
        )}

        {/* Hierarchy Grid */}
        <div className="p-6 md:p-8">
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({length: 6}).map((_, i) => (
                <div key={i} className="hairline rounded-xl p-6 animate-pulse">
                  <div className="h-3 bg-nexus-surface rounded w-1/3 mb-3" />
                  <div className="h-5 bg-nexus-surface rounded w-3/4 mb-2" />
                  <div className="h-3 bg-nexus-surface rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-nexus-muted mono text-sm">No competitions found.</p>
              <p className="text-nexus-muted mono text-xs mt-2">
                {user ? "Create the first competition using the button above." : "Sign in as admin to create competitions."}
              </p>
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="flex flex-col gap-4">
              {topLevel.map((comp: any, i) => (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="hairline rounded-xl overflow-hidden card-shadow bg-background"
                >
                  {/* Main competition row */}
                  <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-2.5 py-1 rounded-full">{comp.discipline}</span>
                        <span className="text-[10px] mono tracking-widest uppercase text-nexus-muted/70 bg-nexus-surface px-2.5 py-1 rounded-full">{comp.level?.replace(/_/g," ")}</span>
                        <span className="text-[10px] mono tracking-widest uppercase bg-nexus-surface px-2.5 py-1 rounded-full">{comp.format?.replace(/_/g," ")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {user && (
                          <select
                            value={comp.status}
                            onChange={e => updateStatus.mutate({ id: comp.id, status: e.target.value })}
                            className={`text-[10px] mono tracking-widest uppercase px-2.5 py-1 rounded-full border-0 focus:outline-none cursor-pointer ${STATUS_STYLES[comp.status] || "bg-nexus-surface text-nexus-muted"}`}
                          >
                            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                          </select>
                        )}
                        {!user && (
                          <span className={`text-[10px] mono tracking-widest uppercase px-2.5 py-1 rounded-full ${STATUS_STYLES[comp.status] || "bg-nexus-surface text-nexus-muted"}`}>
                            {comp.status?.replace(/_/g," ")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="display-font text-lg font-bold text-foreground leading-snug">{comp.name}</h3>
                      {comp.description && <p className="text-xs text-nexus-muted leading-relaxed mt-1 max-w-[70ch] line-clamp-2">{comp.description}</p>}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      {comp.season && <span className="text-[11px] mono text-nexus-muted hairline px-2 py-1 rounded-md">{comp.season}</span>}
                      {comp.province && <span className="text-[11px] mono text-nexus-muted hairline px-2 py-1 rounded-md">{comp.province}</span>}
                      {comp.sponsor && <span className="text-[11px] mono text-nexus-muted hairline px-2 py-1 rounded-md">Sponsored: {comp.sponsor}</span>}
                      {comp.prize_pool > 0 && <span className="text-[11px] mono text-foreground font-semibold hairline px-2 py-1 rounded-md">Prize: ${Number(comp.prize_pool).toLocaleString()}</span>}
                      {comp.max_participants && <span className="text-[11px] mono text-nexus-muted hairline px-2 py-1 rounded-md">Max: {comp.max_participants} participants</span>}
                    </div>

                    <div className="pt-3 hairline-t flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-4">
                        {comp.start_date && (
                          <span className="text-xs mono text-nexus-muted">
                            Start: {new Date(comp.start_date).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                        {comp.end_date && (
                          <span className="text-xs mono text-nexus-muted">
                            End: {new Date(comp.end_date).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                        {comp.registration_deadline && (
                          <span className="text-xs mono text-nexus-muted">
                            Deadline: {new Date(comp.registration_deadline).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                      {user && (
                        <button
                          onClick={() => { setParentId(comp.id); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                          className="text-xs mono text-nexus-muted hover:text-foreground hairline px-3 py-1.5 rounded-md transition-colors"
                        >
                          + Add Sub-Event
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Children / Sub-events */}
                  {comp.children && comp.children.length > 0 && (
                    <div className="hairline-t bg-nexus-surface/30 p-4 flex flex-col gap-2">
                      <p className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold px-2 mb-1">
                        Sub-Events ({comp.children.length})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {comp.children.map((child: any) => (
                          <div key={child.id} className="hairline rounded-lg p-3 bg-background text-xs">
                            <p className="font-semibold text-foreground truncate">{child.name}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="mono text-nexus-muted text-[10px]">{child.level?.replace(/_/g," ")}</span>
                              <span className={`mono text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_STYLES[child.status] || "bg-nexus-surface text-nexus-muted"}`}>
                                {child.status?.replace(/_/g," ")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <NexusFooter />
    </div>
  );
}
