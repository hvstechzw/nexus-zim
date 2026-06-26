// Default landing — realtime community feed with brand hero + feature tiles.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { Badge } from "@/components/ui/badge";
import { useScholasticAutoSync } from "@/hooks/useScholasticAutoSync";
import nexusLogo from "@/assets/nexus-logo.png.asset.json";
import scholasticLogo from "@/assets/scholastic-logo.png.asset.json";
import aetherisLogo from "@/assets/aetheris-logo.png.asset.json";

type FeedItem = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  image_url: string | null;
  fixture_id: string | null;
  competition_id: string | null;
  athlete_id: string | null;
  school_team_id: string | null;
  payload: any;
  created_at: string;
};

const KIND_TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  match_result: "default",
  badge: "secondary",
  milestone: "secondary",
  mvp: "default",
  highlight: "default",
  announcement: "outline",
};

const FEATURES = [
  { to: "/live", title: "Live Matches", body: "Action-by-action handball & netball scoring with realtime commentary." },
  { to: "/schools", title: "Schools & Teams", body: "Verified rosters synced from Scholastic Services." },
  { to: "/inter-school", title: "Inter-School Pathway", body: "Zonal → District → Provincial → National brackets." },
  { to: "/competitions", title: "Tournaments", body: "Round-robin, KO, pooled — auto brackets & standings." },
  { to: "/dashboard", title: "Your Dashboard", body: "Coach, HIC, scorer & admin tools in one place." },
  { to: "/admin/verify", title: "Card Verify", body: "Scan a Scholastic Card to verify eligibility instantly." },
];

export default function FeedPage() {
  useScholasticAutoSync();
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("feed_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(80);
      setItems((data as any) ?? []);
    })();

    const channel = supabase
      .channel("feed-items")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "feed_items" },
        (p) => setItems((prev) => [p.new as any, ...prev].slice(0, 80)))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Helmet>
        <title>Nexus — Live Feed · School Handball & Netball Zimbabwe</title>
        <meta name="description" content="Realtime feed of inter-school handball and netball results, milestones and highlights — powered by Scholastic Services." />
        <link rel="canonical" href="https://nexuszw.online/" />
      </Helmet>
      <NexusHeader />
      <main className="flex-1">
        {/* Brand hero */}
        <section className="hairline-b bg-nexus-surface/30">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-foreground flex items-center justify-center flex-shrink-0">
                <img src={nexusLogo.url} alt="Nexus" className="w-[72%] h-[72%] object-contain" />
              </div>
              <div className="min-w-0">
                <h1 className="display-font text-2xl sm:text-4xl font-bold tracking-tight">Nexus Live Feed</h1>
                <p className="text-xs sm:text-sm text-nexus-muted mt-1">
                  Zimbabwe's school handball & netball network — exclusively powered by Scholastic Services.
                </p>
              </div>
            </div>

            {/* Partner strip */}
            <div className="mt-5 flex flex-wrap items-center gap-3 sm:gap-5 text-[10px] sm:text-xs mono uppercase tracking-wider text-nexus-muted">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Live sync active
              </span>
              <a href="https://scholasticservices.online" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <img src={scholasticLogo.url} alt="" className="w-5 h-5 rounded-md bg-white p-0.5" />
                Scholastic Services
              </a>
              <span className="flex items-center gap-2">
                <img src={aetherisLogo.url} alt="" className="w-5 h-5 rounded-md bg-white p-0.5" />
                Built by Aetheris
              </span>
            </div>

            {/* Feature tiles */}
            <div className="mt-6 sm:mt-8 grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
              {FEATURES.map((f) => (
                <Link
                  key={f.to}
                  to={f.to}
                  className="hairline rounded-xl p-3 sm:p-4 bg-background hover:bg-nexus-surface/60 transition-colors group"
                >
                  <p className="text-xs sm:text-sm font-semibold text-foreground group-hover:translate-x-0.5 transition-transform">{f.title}</p>
                  <p className="text-[10px] sm:text-xs text-nexus-muted mt-1 leading-relaxed">{f.body}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Feed */}
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
          <header className="space-y-1">
            <h2 className="text-xl font-semibold">Latest Activity</h2>
            <p className="text-sm opacity-70">Results, milestones and highlights as they happen.</p>
          </header>
          {items.length === 0 && (
            <div className="rounded-xl border bg-card/50 p-6 text-sm opacity-70">No activity yet. Check back after the next fixture.</div>
          )}
          <ul className="space-y-3">
            {items.map((it) => {
              const href = it.fixture_id ? `/live/${it.fixture_id}`
                : it.athlete_id ? `/players/${it.athlete_id}`
                : it.competition_id ? `/competition/${it.competition_id}`
                : "#";
              return (
                <li key={it.id} className="rounded-xl border bg-card/60 backdrop-blur p-4">
                  <div className="flex items-center justify-between text-xs opacity-60">
                    <Badge variant={KIND_TONE[it.kind] ?? "outline"} className="uppercase">{it.kind.replace("_", " ")}</Badge>
                    <time>{new Date(it.created_at).toLocaleString()}</time>
                  </div>
                  <Link to={href} className="block mt-2">
                    <h3 className="text-base font-medium hover:underline">{it.title}</h3>
                    {it.body && <p className="text-sm opacity-80 mt-1">{it.body}</p>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
      <NexusFooter />
    </div>
  );
}
