import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { supabase } from "@/integrations/supabase/client";
import { athleteEligibility, allEventLabels, detectSport, playerSummary, type ScoreEntryLike } from "@/lib/sports";
import { FollowButton } from "@/components/community/FollowButton";


export default function PlayerProfilePage() {
  const { athleteId } = useParams<{ athleteId: string }>();

  const { data: athlete, isLoading } = useQuery({
    queryKey: ["player", athleteId],
    enabled: !!athleteId,
    queryFn: async () => {
      const { data } = await supabase
        .from("athletes")
        .select("id, first_name, last_name, display_name, photo_url, jersey_number, house, club_name, school_name, gender, nexus_sport, disciplines, is_active, is_suspended, scholastic_card_verified")
        .eq("id", athleteId!)
        .maybeSingle();
      return data;
    },
  });

  const { data: entries = [] } = useQuery({
    queryKey: ["player-entries", athleteId],
    enabled: !!athleteId,
    queryFn: async () => {
      const { data } = await supabase
        .from("score_entries")
        .select("athlete_id, team_id, fixture_id, value, event_type, metadata, created_at")
        .eq("athlete_id", athleteId!)
        .order("created_at", { ascending: false })
        .limit(2000);
      return (data || []) as (ScoreEntryLike & { created_at: string })[];
    },
  });

  // Match Engine 2.0 career data
  const { data: career } = useQuery({
    queryKey: ["player-career", athleteId],
    enabled: !!athleteId,
    queryFn: async () => {
      const { data } = await supabase.from("vw_player_career").select("*").eq("athlete_id", athleteId!).maybeSingle();
      return data as any;
    },
  });
  const { data: form = [] } = useQuery({
    queryKey: ["player-form", athleteId],
    enabled: !!athleteId,
    queryFn: async () => {
      const { data } = await supabase.from("vw_player_form").select("*").eq("athlete_id", athleteId!).order("scheduled_at", { ascending: false }).limit(10);
      return (data || []) as any[];
    },
  });
  const { data: badges = [] } = useQuery({
    queryKey: ["player-badges", athleteId],
    enabled: !!athleteId,
    queryFn: async () => {
      const { data } = await supabase.from("player_badges").select("*").eq("athlete_id", athleteId!).order("awarded_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NexusHeader />
        <div className="flex items-center justify-center h-[60vh]"><div className="w-6 h-6 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" /></div>
        <NexusFooter />
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NexusHeader />
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-nexus-muted mono text-sm">Player not found</p>
          <Link to="/" className="text-xs underline text-nexus-muted hover:text-foreground">Back to Home</Link>
        </div>
        <NexusFooter />
      </div>
    );
  }

  const name = athlete.display_name || `${athlete.first_name ?? ""} ${athlete.last_name ?? ""}`.trim() || "Player";
  const summary = playerSummary(entries);
  const elig = athleteEligibility(athlete);
  const sport = detectSport(athlete.nexus_sport || (athlete.disciplines || [])[0]);
  const labels = allEventLabels(sport);

  const stats = [
    { label: "Goals", value: summary.goals },
    { label: "Points", value: summary.points },
    { label: "Appearances", value: summary.appearances },
    { label: "Cards / 2′", value: `${summary.yellow}Y · ${summary.suspensions}×2′ · ${summary.red}R` },
  ];

  const canonical = `https://nexuszw.online/players/${athleteId}`;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{`${name} — Nexus player profile`}</title>
        <meta name="description" content={`${name} — ${sport} player profile on Nexus. Appearances, goals and discipline record from inter-school fixtures.`} />
        <link rel="canonical" href={canonical} />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={`${name} — Nexus`} />
        <meta property="og:description" content={`${sport} player profile on Nexus.`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name,
          image: athlete.photo_url || undefined,
          memberOf: athlete.school_name ? { "@type": "EducationalOrganization", name: athlete.school_name } : undefined,
          url: canonical,
        })}</script>
      </Helmet>
      <NexusHeader />
      <div className="max-w-[1000px] mx-auto pt-20 px-4 sm:px-8">

        <Link to="/schools" className="text-xs mono text-nexus-muted hover:text-foreground">← Directory</Link>

        <div className="flex items-start gap-5 flex-wrap py-8">
          {athlete.photo_url ? (
            <img src={athlete.photo_url} className="w-20 h-20 rounded-2xl object-cover bg-nexus-surface" alt="" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-nexus-surface flex items-center justify-center text-xl font-bold text-nexus-muted">
              {name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted bg-nexus-surface px-2.5 py-1 rounded-full">{sport}</span>
              {athlete.jersey_number != null && <span className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted bg-nexus-surface px-2.5 py-1 rounded-full">#{athlete.jersey_number}</span>}
              <span className={`text-[10px] mono tracking-[0.15em] uppercase px-2.5 py-1 rounded-full ${
                elig.status === "suspended" ? "bg-foreground text-primary-foreground" : elig.status === "unverified" ? "bg-nexus-surface text-nexus-muted" : "bg-nexus-surface text-nexus-muted"}`}>{elig.label}</span>
            </div>
            <h1 className="display-font text-display-md font-bold">{name}</h1>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs text-nexus-muted">
              {athlete.school_name && <span>{athlete.school_name}</span>}
              {athlete.club_name && <span>{athlete.club_name}</span>}
              {athlete.house && <span>House: {athlete.house}</span>}
              {athlete.gender && <span className="capitalize">{athlete.gender}</span>}
            </div>
          </div>
          <div className="ml-auto"><FollowButton entityType="athlete" entityId={athlete.id} /></div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="hairline rounded-xl p-4">
              <p className="text-[9px] mono tracking-[0.15em] uppercase text-nexus-muted">{s.label}</p>
              <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="py-8">
          <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted mb-3">Recent activity</p>
          {entries.length === 0 ? (
            <p className="text-nexus-muted mono text-sm text-center py-12">No recorded events yet.</p>
          ) : (
            <div className="hairline rounded-xl overflow-hidden">
              {entries.slice(0, 40).map((e, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 hairline-b last:border-b-0">
                  <span className="text-sm font-semibold text-foreground flex-1 truncate">{labels[e.event_type] || e.event_type}</span>
                  {Number(e.value ?? 0) > 0 && <span className="text-[10px] mono text-nexus-live">+{e.value}</span>}
                  <span className="text-[10px] mono text-nexus-muted">{new Date(e.created_at).toLocaleDateString("en-ZW", { month: "short", day: "numeric" })}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {(career || form.length > 0 || badges.length > 0) && (
          <div className="py-8 space-y-6">
            <div>
              <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted mb-3">Career — Match Engine</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { l: "Matches", v: career?.matches ?? 0 },
                  { l: "Goals", v: career?.goals ?? 0 },
                  { l: "Assists", v: career?.assists ?? 0 },
                  { l: "Shooting %", v: `${career?.shooting_pct ?? 0}%` },
                  { l: "Intercepts", v: career?.intercepts ?? 0 },
                ].map((s) => (
                  <div key={s.l} className="hairline rounded-xl p-4">
                    <p className="text-[9px] mono tracking-[0.15em] uppercase text-nexus-muted">{s.l}</p>
                    <p className="text-xl font-bold mt-1">{s.v}</p>
                  </div>
                ))}
              </div>
            </div>
            {form.length > 0 && (
              <div>
                <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted mb-3">Last {form.length} matches</p>
                <div className="hairline rounded-xl overflow-hidden">
                  {form.map((m: any) => (
                    <Link to={`/live/${m.fixture_id}`} key={m.fixture_id} className="flex items-center gap-3 px-4 py-3 hairline-b last:border-b-0 hover:bg-nexus-surface/40">
                      <span className="text-[10px] mono text-nexus-muted w-20">{m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString("en-ZW", { month: "short", day: "numeric" }) : "—"}</span>
                      <span className="text-sm flex-1 tabular-nums">{m.goals}G · {m.assists}A · {m.intercepts}I{m.cards ? ` · ${m.cards}C` : ""}</span>
                      <span className="text-[10px] mono text-nexus-muted">view →</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {badges.length > 0 && (
              <div>
                <p className="text-[10px] mono tracking-[0.18em] uppercase text-nexus-muted mb-3">Achievements</p>
                <div className="flex flex-wrap gap-2">
                  {badges.map((b: any) => (
                    <span key={b.id} className="hairline rounded-full px-3 py-1 text-xs">{b.label}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <NexusFooter />
    </div>
  );
}
