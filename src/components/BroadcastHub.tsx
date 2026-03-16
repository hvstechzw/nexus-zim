import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function BroadcastHub() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: broadcasts = [], isLoading } = useQuery({
    queryKey: ["broadcast-hub"],
    queryFn: async () => {
      const { data } = await supabase
        .from("broadcasts")
        .select(`*, competition:competition_id(name, level, discipline), fixture:fixture_id(home_score, away_score, status)`)
        .order("is_live", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);
      return data || [];
    },
    refetchInterval: 15000,
  });

  const liveCount = broadcasts.filter((b: any) => b.is_live).length;

  return (
    <section id="broadcast" className="hairline-b">
      <div className="px-8 py-5 hairline-b flex items-center justify-between">
        <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">Broadcast Hub</p>
        <div className="flex items-center gap-2 bg-nexus-surface px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse" />
          <span className="text-xs mono tracking-widest uppercase text-nexus-muted">
            {liveCount} Live Stream{liveCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 md:p-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="hairline rounded-xl p-5 animate-pulse">
              <div className="w-full aspect-video bg-nexus-surface rounded-lg mb-4" />
              <div className="h-3 bg-nexus-surface rounded w-2/3 mb-2" />
              <div className="h-4 bg-nexus-surface rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && broadcasts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <p className="text-nexus-muted mono text-sm">No broadcasts available.</p>
          <p className="text-nexus-muted mono text-xs mt-2">Live streams will appear here once created by broadcasters.</p>
        </div>
      )}

      {!isLoading && broadcasts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 md:p-8">
          {broadcasts.map((broadcast: any, i) => {
            const isSelected = selectedId === broadcast.id;
            return (
              <motion.button
                key={broadcast.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                onClick={() => {
                  if (broadcast.stream_url) {
                    window.open(broadcast.stream_url, "_blank");
                  } else {
                    setSelectedId(broadcast.id === selectedId ? null : broadcast.id);
                  }
                }}
                className={`rounded-xl p-5 text-left flex flex-col gap-4 transition-all duration-200 btn-click card-shadow hairline
                  ${isSelected ? "bg-foreground" : "bg-background hover:bg-nexus-surface/50"}`}
              >
                <div className={`w-full aspect-video rounded-lg flex items-center justify-center relative overflow-hidden ${
                  isSelected ? "bg-white/10" : "bg-nexus-surface"
                }`}>
                  {broadcast.thumbnail_url ? (
                    <img src={broadcast.thumbnail_url} alt={broadcast.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center"
                        style={{ background: isSelected ? "rgba(255,255,255,0.15)" : "hsl(0 0% 9%)" }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <polygon points="5,3 14,8 5,13" fill={isSelected ? "hsl(0 0% 9%)" : "white"} />
                        </svg>
                      </div>
                      <span className={`text-[10px] mono tracking-widest uppercase ${isSelected ? "text-white/50" : "text-nexus-muted"}`}>
                        {broadcast.stream_url ? "Tap to watch" : "Stream setup"}
                      </span>
                    </div>
                  )}

                  {broadcast.is_live && (
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-nexus-live px-2.5 py-1 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-primary-foreground animate-pulse" />
                      <span className="text-[10px] mono text-primary-foreground tracking-widest uppercase">Live</span>
                    </div>
                  )}
                  <div className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md ${isSelected ? "bg-white/10" : "bg-background/80"}`}>
                    <span className={`text-[10px] mono tracking-widest ${isSelected ? "text-white/60" : "text-nexus-muted"}`}>
                      {broadcast.quality || "HD"}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    {broadcast.competition && (
                      <>
                        <span className={`text-[10px] mono tracking-widest uppercase px-2 py-0.5 rounded-full ${isSelected ? "bg-white/10 text-white/60" : "bg-nexus-surface text-nexus-muted"}`}>
                          {broadcast.competition.discipline}
                        </span>
                        <span className={`text-[10px] mono tracking-widest uppercase px-2 py-0.5 rounded-full ${isSelected ? "bg-white/10 text-white/50" : "bg-nexus-surface text-nexus-muted/70"}`}>
                          {broadcast.competition.level?.replace(/_/g, " ")}
                        </span>
                      </>
                    )}
                  </div>
                  <p className={`display-font text-sm font-semibold leading-snug ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
                    {broadcast.title}
                  </p>
                </div>

                <div className={`flex items-center justify-between pt-3 hairline-t`} style={isSelected ? { borderColor: "rgba(255,255,255,0.15)" } : {}}>
                  <span className={`text-xs mono ${isSelected ? "text-primary-foreground/50" : "text-nexus-muted"}`}>
                    {broadcast.platform || "Live"}
                  </span>
                  {broadcast.is_live && broadcast.viewer_count != null && (
                    <span className={`text-xs mono ${isSelected ? "text-primary-foreground/50" : "text-nexus-muted"}`}>
                      {broadcast.viewer_count.toLocaleString()} watching
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </section>
  );
}
