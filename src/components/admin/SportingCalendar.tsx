import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { useToast } from "@/hooks/use-toast";

type Discipline = "Handball" | "Netball";
type Level = "zonal" | "district" | "provincial" | "national";
type EventType = "competition" | "camp" | "trial" | "congress" | "holiday" | "other";

interface CalendarEvent {
  id: string;
  discipline: Discipline;
  level: Level;
  region: string | null;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  event_type: EventType;
  competition_id: string | null;
  season: string | null;
  created_by: string | null;
  created_at: string;
}

const DISCIPLINES: Discipline[] = ["Handball", "Netball"];
const LEVELS: Level[] = ["zonal", "district", "provincial", "national"];
const TYPES: EventType[] = ["competition", "camp", "trial", "congress", "holiday", "other"];

const inputCls =
  "bg-nexus-surface hairline rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 w-full";
const labelCls = "text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold";

/**
 * NASH-style sporting calendar. Auto-mirrors Handball/Netball competitions via a DB trigger,
 * and lets admins add manual entries for camps, trials, congresses, and holidays.
 */
export function SportingCalendar() {
  const { user } = useAuth();
  const { hasRole } = useHasRole();
  const { toast } = useToast();
  const canCreate = hasRole(
    "super_admin",
    "admin",
    "national_admin",
    "provincial_admin",
    "district_admin",
    "zonal_admin",
  );

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [discFilter, setDiscFilter] = useState<Discipline | "all">("all");
  const [levelFilter, setLevelFilter] = useState<Level | "all">("all");
  const [seasonFilter, setSeasonFilter] = useState<string>(new Date().getFullYear().toString());

  const [form, setForm] = useState({
    discipline: "Handball" as Discipline,
    level: "national" as Level,
    region: "",
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    event_type: "competition" as EventType,
    season: new Date().getFullYear().toString(),
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .order("start_date", { ascending: true });
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    else setEvents((data || []) as CalendarEvent[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("calendar_events_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "calendar_events" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (discFilter !== "all" && e.discipline !== discFilter) return false;
      if (levelFilter !== "all" && e.level !== levelFilter) return false;
      if (seasonFilter && e.season && e.season !== seasonFilter) return false;
      return true;
    });
  }, [events, discFilter, levelFilter, seasonFilter]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("calendar_events").insert({
      discipline: form.discipline,
      level: form.level,
      region: form.region || null,
      title: form.title,
      description: form.description || null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      event_type: form.event_type,
      season: form.season || null,
      created_by: user.id,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Calendar entry added" });
    setShowForm(false);
    setForm({ ...form, title: "", description: "", start_date: "", end_date: "" });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this calendar entry?")) return;
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else load();
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="hairline rounded-xl p-6 bg-background card-shadow">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] mono tracking-[0.2em] uppercase text-nexus-muted">NASH-style</p>
            <h2 className="display-font text-xl font-bold text-foreground">Sporting Calendar</h2>
            <p className="text-xs text-nexus-muted mt-1">
              Live schedule of competitions, camps, trials and congresses across Handball and Netball. Competition entries are
              auto-synced from the Competitions tab.
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowForm((s) => !s)}
              className="h-9 px-4 text-xs font-semibold rounded-lg bg-foreground text-primary-foreground hover:opacity-85 btn-click"
            >
              {showForm ? "Cancel" : "+ Add Entry"}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={discFilter} onChange={(e) => setDiscFilter(e.target.value as any)} className={inputCls + " max-w-[160px]"}>
            <option value="all">All disciplines</option>
            {DISCIPLINES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value as any)} className={inputCls + " max-w-[160px]"}>
            <option value="all">All levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l} className="capitalize">
                {l}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={seasonFilter}
            onChange={(e) => setSeasonFilter(e.target.value)}
            placeholder="Season"
            className={inputCls + " max-w-[120px]"}
          />
        </div>
      </div>

      {showForm && canCreate && (
        <form onSubmit={save} className="hairline rounded-xl p-6 bg-background grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputCls}
              placeholder="Eg. Provincial Trials – Mashonaland West"
            />
          </div>
          <div>
            <label className={labelCls}>Discipline</label>
            <select value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value as Discipline })} className={inputCls}>
              {DISCIPLINES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Level</label>
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as Level })} className={inputCls}>
              {LEVELS.map((l) => (
                <option key={l} value={l} className="capitalize">
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Region / Province</label>
            <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className={inputCls} placeholder="Optional" />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value as EventType })} className={inputCls}>
              {TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Start date *</label>
            <input
              required
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>End date</label>
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Season</label>
            <input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputCls}
              rows={2}
            />
          </div>
          <div className="md:col-span-2">
            <button
              disabled={saving}
              className="h-10 px-6 text-sm font-semibold rounded-lg bg-foreground text-primary-foreground hover:opacity-85 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add to calendar"}
            </button>
          </div>
        </form>
      )}

      <div className="hairline rounded-xl bg-background overflow-hidden">
        {loading ? (
          <p className="p-12 text-center text-xs text-nexus-muted mono">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-12 text-center text-xs text-nexus-muted mono">No calendar entries for this filter.</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((ev) => {
              const range = ev.end_date && ev.end_date !== ev.start_date ? `${ev.start_date} → ${ev.end_date}` : ev.start_date;
              const canDelete = canCreate && (hasRole("super_admin", "admin", "national_admin") || ev.created_by === user?.id);
              return (
                <li key={ev.id} className="p-4 flex flex-wrap items-center gap-4">
                  <div className="w-28 flex-shrink-0">
                    <p className="text-[10px] mono tracking-wider text-nexus-muted uppercase">{ev.event_type}</p>
                    <p className="text-xs mono font-semibold text-foreground">{range}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{ev.title}</p>
                    <p className="text-[10px] mono text-nexus-muted">
                      {ev.discipline} · <span className="capitalize">{ev.level}</span>
                      {ev.region ? ` · ${ev.region}` : ""}
                      {ev.season ? ` · ${ev.season}` : ""}
                      {ev.competition_id ? " · auto" : ""}
                    </p>
                    {ev.description && <p className="text-xs text-nexus-muted mt-1 line-clamp-2">{ev.description}</p>}
                  </div>
                  {canDelete && !ev.competition_id && (
                    <button onClick={() => remove(ev.id)} className="text-[10px] mono uppercase text-nexus-muted hover:text-foreground">
                      Remove
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
