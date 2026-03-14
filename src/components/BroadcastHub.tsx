import { useState } from "react";
import { motion } from "framer-motion";

const BROADCASTS = [
  { id: "1", title: "PSL: Dynamos FC vs Highlanders", sport: "Football", level: "National League", isLive: true, viewers: "12,480", duration: "72:14", quality: "HD" },
  { id: "2", title: "ZABA Premier: Suns BC vs Eagles BC", sport: "Basketball", level: "Club Level", isLive: true, viewers: "3,220", duration: "Q3 · 04:22", quality: "HD" },
  { id: "3", title: "Schools Rugby: Prince Edward vs St George's", sport: "Rugby", level: "Secondary Schools", isLive: true, viewers: "1,840", duration: "2nd Half · 54:30", quality: "SD" },
  { id: "4", title: "UZ Debate League: Quarter Finals", sport: "Debate", level: "National League", isLive: false, viewers: "—", duration: "Starts 18:00", quality: "HD" },
  { id: "5", title: "Logan Cup: Mashonaland Eagles vs Mountaineers", sport: "Cricket", level: "National League", isLive: false, viewers: "—", duration: "Day 2", quality: "HD" },
  { id: "6", title: "National Chess Championship — Board 1 & 2", sport: "Chess", level: "Primary Schools", isLive: true, viewers: "684", duration: "Round 5", quality: "SD" },
];

export function BroadcastHub() {
  const [selectedBroadcast, setSelectedBroadcast] = useState<string | null>(null);

  return (
    <section id="broadcast" className="hairline-b">
      {/* Header */}
      <div className="px-8 py-5 hairline-b flex items-center justify-between">
        <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">Broadcast Hub</p>
        <div className="flex items-center gap-2 bg-nexus-surface px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse" />
          <span className="text-xs mono tracking-widest uppercase text-nexus-muted">
            {BROADCASTS.filter(b => b.isLive).length} Live Streams
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 md:p-8">
        {BROADCASTS.map((broadcast, i) => {
          const isSelected = selectedBroadcast === broadcast.id;

          return (
            <motion.button
              key={broadcast.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setSelectedBroadcast(broadcast.id === selectedBroadcast ? null : broadcast.id)}
              className={`rounded-xl p-5 text-left flex flex-col gap-4 transition-all duration-200 btn-click card-shadow hairline
                ${isSelected ? "bg-foreground" : "bg-background hover:bg-nexus-surface/50"}`}
            >
              {/* Video placeholder */}
              <div
                className={`w-full aspect-video rounded-lg flex items-center justify-center relative overflow-hidden ${
                  isSelected ? "bg-white/10" : "bg-nexus-surface"
                }`}
              >
                {broadcast.isLive ? (
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ background: isSelected ? "rgba(255,255,255,0.15)" : "hsl(0 0% 9%)" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <polygon points="5,3 14,8 5,13" fill={isSelected ? "hsl(0 0% 9%)" : "white"} />
                      </svg>
                    </div>
                    <span className={`text-[10px] mono tracking-widest uppercase ${isSelected ? "text-white/50" : "text-nexus-muted"}`}>
                      Tap to watch
                    </span>
                  </div>
                ) : (
                  <span className={`text-xs mono tracking-widest uppercase ${isSelected ? "text-white/50" : "text-nexus-muted"}`}>
                    {broadcast.duration}
                  </span>
                )}

                {/* Live badge */}
                {broadcast.isLive && (
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-nexus-live px-2.5 py-1 rounded-full">
                    <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                    <span className="text-[10px] mono text-white tracking-widest uppercase">Live</span>
                  </div>
                )}

                {/* Quality badge */}
                <div className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md ${isSelected ? "bg-white/10" : "bg-background/80"}`}>
                  <span className={`text-[10px] mono tracking-widest ${isSelected ? "text-white/60" : "text-nexus-muted"}`}>
                    {broadcast.quality}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`text-[10px] mono tracking-widest uppercase px-2 py-0.5 rounded-full ${isSelected ? "bg-white/10 text-white/60" : "bg-nexus-surface text-nexus-muted"}`}>
                    {broadcast.sport}
                  </span>
                  <span className={`text-[10px] mono tracking-widest uppercase px-2 py-0.5 rounded-full ${isSelected ? "bg-white/10 text-white/50" : "bg-nexus-surface text-nexus-muted/70"}`}>
                    {broadcast.level}
                  </span>
                </div>
                <p className={`display-font text-sm font-semibold leading-snug ${isSelected ? "text-white" : "text-foreground"}`}>
                  {broadcast.title}
                </p>
              </div>

              {/* Footer */}
              <div className={`flex items-center justify-between pt-3 hairline-t ${isSelected ? "border-white/15" : ""}`}>
                <span className={`text-xs mono ${isSelected ? "text-white/50" : "text-nexus-muted"}`}>
                  {broadcast.duration}
                </span>
                {broadcast.isLive && (
                  <span className={`text-xs mono ${isSelected ? "text-white/50" : "text-nexus-muted"}`}>
                    {broadcast.viewers} watching
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
