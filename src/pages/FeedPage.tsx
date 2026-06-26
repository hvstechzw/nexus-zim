// Public community feed: realtime stream of results, badges and milestones.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { Badge } from "@/components/ui/badge";

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

export default function FeedPage() {
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
      <NexusHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold">Community Feed</h1>
            <p className="text-sm opacity-70">Live results, milestones and highlights from Handball & Netball across Zimbabwe.</p>
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
                    <h2 className="text-base font-medium hover:underline">{it.title}</h2>
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
