import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LeaderboardPanel } from "@/components/LeaderboardPanel";


const tabCls = (active: boolean) =>
  `px-5 py-3 text-xs font-semibold tracking-wide whitespace-nowrap border-b-2 transition-all btn-click ${
    active ? "border-foreground text-foreground" : "border-transparent text-nexus-muted hover:text-foreground"
  }`;

export default function CompetitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<"fixtures" | "standings" | "leaders" | "teams" | "results">("fixtures");

  const { data: comp, isLoading } = useQuery({
    queryKey: ["comp-detail", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("*, venue:venues!competitions_venue_id_fkey(name, city)")
        .eq("id", id!)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const { data: fixtures = [] } = useQuery({
    queryKey: ["comp-fixtures", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("fixtures")
        .select(`id, round_label, status, scheduled_at, home_score, away_score, started_at, ended_at, period_scores,
          home_team:teams!fixtures_home_team_id_fkey(name, short_name, logo_url),
          away_team:teams!fixtures_away_team_id_fkey(name, short_name, logo_url)`)
        .eq("competition_id", id!)
        .order("scheduled_at", { ascending: true });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: standings = [] } = useQuery({
    queryKey: ["comp-standings", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("standings")
        .select("*, team:teams!standings_team_id_fkey(name, short_name, logo_url)")
        .eq("competition_id", id!)
        .order("position", { ascending: true });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: regs = [] } = useQuery({
    queryKey: ["comp-registrations", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("registrations")
        .select("id, status, registration_type, team:teams!registrations_team_id_fkey(name, logo_url), athlete:athletes!registrations_athlete_id_fkey(first_name, last_name, photo_url)")
        .eq("competition_id", id!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const completedFixtures = fixtures.filter((f: any) => f.status === "completed");
  const upcomingFixtures = fixtures.filter((f: any) => f.status !== "completed");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NexusHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-6 h-6 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
        </div>
        <NexusFooter />
      </div>
    );
  }

  if (!comp) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NexusHeader />
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-nexus-muted mono text-sm">Competition not found</p>
          <Link to="/" className="text-xs underline text-nexus-muted hover:text-foreground">Back to Home</Link>
        </div>
        <NexusFooter />
      </div>
    );
  }

  const canonical = `https://nexuszw.online/competition/${id}`;
  const compDesc = comp.description || `${comp.discipline} competition at ${comp.level?.replace(/_/g, " ")} level on Nexus.`;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{`${comp.name} — Nexus`}</title>
        <meta name="description" content={compDesc.slice(0, 155)} />
        <link rel="canonical" href={canonical} />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={`${comp.name} — Nexus`} />
        <meta property="og:description" content={compDesc.slice(0, 155)} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          name: comp.name,
          sport: comp.discipline,
          startDate: comp.start_date || undefined,
          endDate: comp.end_date || undefined,
          eventStatus: comp.status === "completed" ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled",
          location: comp.venue ? { "@type": "Place", name: comp.venue.name, address: comp.venue.city } : undefined,
          url: canonical,
        })}</script>
      </Helmet>
      <NexusHeader />


      {/* Hero Banner */}
      <div className="max-w-[1200px] mx-auto pt-20 px-4 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-8">
          <div className="flex items-start gap-5 flex-wrap">
            {comp.logo_url ? (
              <img src={comp.logo_url} className="w-16 h-16 rounded-2xl object-cover bg-white" alt="" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-nexus-surface flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-nexus-muted">
                  <circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted bg-nexus-surface px-2.5 py-1 rounded-full">{comp.discipline}</span>
                <span className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted bg-nexus-surface px-2.5 py-1 rounded-full">{comp.level?.replace(/_/g, " ")}</span>
                <span className={`text-[10px] mono tracking-[0.15em] uppercase px-2.5 py-1 rounded-full ${
                  comp.status === "ongoing" ? "bg-nexus-live text-primary-foreground" : "bg-nexus-surface text-nexus-muted"
                }`}>{comp.status?.replace(/_/g, " ")}</span>
              </div>
              <h1 className="display-font text-display-md font-bold text-foreground">{comp.name}</h1>
              {comp.description && <p className="text-sm text-nexus-muted mt-2 max-w-xl">{comp.description}</p>}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="hairline rounded-xl p-4">
              <p className="text-[9px] mono tracking-[0.15em] uppercase text-nexus-muted">Fixtures</p>
              <p className="text-2xl font-bold text-foreground mt-1">{fixtures.length}</p>
            </div>
            <div className="hairline rounded-xl p-4">
              <p className="text-[9px] mono tracking-[0.15em] uppercase text-nexus-muted">Completed</p>
              <p className="text-2xl font-bold text-foreground mt-1">{completedFixtures.length}</p>
            </div>
            <div className="hairline rounded-xl p-4">
              <p className="text-[9px] mono tracking-[0.15em] uppercase text-nexus-muted">Registrations</p>
              <p className="text-2xl font-bold text-foreground mt-1">{regs.length}</p>
            </div>
            <div className="hairline rounded-xl p-4">
              <p className="text-[9px] mono tracking-[0.15em] uppercase text-nexus-muted">Format</p>
              <p className="text-lg font-bold text-foreground mt-1 capitalize">{comp.format?.replace(/_/g, " ")}</p>
            </div>
          </div>

          {/* Meta Row */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-xs text-nexus-muted">
            {comp.start_date && <span>Start: {new Date(comp.start_date).toLocaleDateString("en-ZW", { month: "long", day: "numeric", year: "numeric" })}</span>}
            {comp.end_date && <span>End: {new Date(comp.end_date).toLocaleDateString("en-ZW", { month: "long", day: "numeric", year: "numeric" })}</span>}
            {comp.province && <span>Province: {comp.province}</span>}
            {comp.season && <span>Season: {comp.season}</span>}
            {comp.prize_pool && Number(comp.prize_pool) > 0 && <span>Prize: ${Number(comp.prize_pool).toLocaleString()}</span>}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex overflow-x-auto hairline-b scrollbar-hide -mx-4 sm:-mx-8 px-4 sm:px-8">
          {(["fixtures", "standings", "leaders", "teams", "results"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={tabCls(tab === t)}>{t === "teams" ? "Participants" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="py-6 min-h-[300px]">

          {/* Fixtures */}
          {tab === "fixtures" && (
            <div className="space-y-3">
              {fixtures.length === 0 && <p className="text-nexus-muted mono text-sm text-center py-12">No fixtures scheduled yet.</p>}
              {fixtures.map((f: any) => (
                <div key={f.id} className="hairline rounded-xl p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-nexus-surface/40 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {f.home_team?.logo_url && <img src={f.home_team.logo_url} className="w-8 h-8 rounded-lg object-cover bg-white flex-shrink-0" alt="" />}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{f.home_team?.name || "TBD"} vs {f.away_team?.name || "TBD"}</p>
                      <p className="text-[10px] text-nexus-muted mono">{f.round_label || "—"} · {f.scheduled_at ? new Date(f.scheduled_at).toLocaleDateString("en-ZW", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "TBD"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {f.status === "completed" ? (
                      <span className="text-lg font-bold mono text-foreground">{f.home_score ?? 0} — {f.away_score ?? 0}</span>
                    ) : f.status === "live" ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse" />
                        <span className="text-lg mono font-bold">{f.home_score ?? 0} — {f.away_score ?? 0}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] mono px-2.5 py-1 rounded-full bg-nexus-surface text-nexus-muted uppercase">{f.status}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Standings */}
          {tab === "standings" && (
            <div>
              {standings.length === 0 ? (
                <p className="text-nexus-muted mono text-sm text-center py-12">No standings data yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="hairline-b">
                        {["#", "Team", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"].map(h => (
                          <th key={h} className="px-3 py-3 text-[9px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold text-left whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((s: any, i: number) => (
                        <tr key={s.id} className="hairline-b hover:bg-nexus-surface/40 transition-colors">
                          <td className="px-3 py-3 text-sm font-bold text-foreground w-8">{s.position || i + 1}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {s.team?.logo_url && <img src={s.team.logo_url} className="w-6 h-6 rounded-md object-cover bg-white" alt="" />}
                              <span className="text-sm font-semibold text-foreground">{s.team?.name || "—"}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs mono text-nexus-muted">{s.played ?? 0}</td>
                          <td className="px-3 py-3 text-xs mono text-nexus-muted">{s.won ?? 0}</td>
                          <td className="px-3 py-3 text-xs mono text-nexus-muted">{s.drawn ?? 0}</td>
                          <td className="px-3 py-3 text-xs mono text-nexus-muted">{s.lost ?? 0}</td>
                          <td className="px-3 py-3 text-xs mono text-nexus-muted">{s.score_for ?? 0}</td>
                          <td className="px-3 py-3 text-xs mono text-nexus-muted">{s.score_against ?? 0}</td>
                          <td className="px-3 py-3 text-xs mono text-foreground font-semibold">{s.score_diff ?? 0}</td>
                          <td className="px-3 py-3 text-sm font-bold text-foreground">{s.points ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Leaders */}
          {tab === "leaders" && (
            <LeaderboardPanel fixtureIds={fixtures.map((f: any) => f.id)} competitionId={id} />
          )}

          {/* Participants */}
          {tab === "teams" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {regs.length === 0 && <p className="text-nexus-muted mono text-sm text-center py-12 col-span-full">No registrations yet.</p>}
              {regs.map((r: any) => (
                <div key={r.id} className="hairline rounded-xl p-4 flex items-center gap-3 hover:bg-nexus-surface/40 transition-colors">
                  {r.team?.logo_url ? (
                    <img src={r.team.logo_url} className="w-10 h-10 rounded-xl object-cover bg-white flex-shrink-0" alt="" />
                  ) : r.athlete?.photo_url ? (
                    <img src={r.athlete.photo_url} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-nexus-surface flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {r.team?.name || (r.athlete ? `${r.athlete.first_name} ${r.athlete.last_name}` : "—")}
                    </p>
                    <p className="text-[10px] mono text-nexus-muted capitalize">{r.registration_type} · {r.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {tab === "results" && (
            <div className="space-y-3">
              {completedFixtures.length === 0 && <p className="text-nexus-muted mono text-sm text-center py-12">No completed matches yet.</p>}
              {completedFixtures.map((f: any) => (
                <div key={f.id} className="hairline rounded-xl p-4 sm:p-5 hover:bg-nexus-surface/40 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-right min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{f.home_team?.name || "TBD"}</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-nexus-surface flex-shrink-0">
                        <span className="text-xl font-bold mono text-foreground">{f.home_score ?? 0}</span>
                        <span className="text-xs text-nexus-muted">—</span>
                        <span className="text-xl font-bold mono text-foreground">{f.away_score ?? 0}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{f.away_team?.name || "TBD"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 justify-center flex-wrap">
                    <span className="text-[10px] mono text-nexus-muted">{f.round_label || "—"}</span>
                    {Array.isArray(f.period_scores) && f.period_scores.length > 0 && (
                      <span className="text-[10px] mono text-nexus-muted">
                        {(f.period_scores as any[]).map((p) => `${p.period} ${p.home}-${p.away}`).join(" · ")}
                      </span>
                    )}
                    <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-nexus-surface text-nexus-muted">FT</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <NexusFooter />
    </div>
  );
}
