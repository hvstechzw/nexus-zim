import { useState } from "react";
import { motion } from "framer-motion";

const BROADCASTS = [
  {
    id: "1",
    title: "PSL: Dynamos FC vs Highlanders",
    sport: "Football",
    level: "National League",
    isLive: true,
    viewers: "12,480",
    duration: "72:14",
    quality: "HD",
  },
  {
    id: "2",
    title: "ZABA Premier: Suns BC vs Eagles BC",
    sport: "Basketball",
    level: "Club Level",
    isLive: true,
    viewers: "3,220",
    duration: "Q3 · 04:22",
    quality: "HD",
  },
  {
    id: "3",
    title: "Schools Rugby: Prince Edward vs St George's",
    sport: "Rugby",
    level: "Secondary Schools",
    isLive: true,
    viewers: "1,840",
    duration: "2nd Half · 54:30",
    quality: "SD",
  },
  {
    id: "4",
    title: "UZ Debate League: Quarter Finals",
    sport: "Debate",
    level: "National League",
    isLive: false,
    viewers: "—",
    duration: "Starts 18:00",
    quality: "HD",
  },
  {
    id: "5",
    title: "Logan Cup: Mashonaland Eagles vs Mountaineers",
    sport: "Cricket",
    level: "National League",
    isLive: false,
    viewers: "—",
    duration: "Day 2",
    quality: "HD",
  },
  {
    id: "6",
    title: "National Chess Championship — Board 1 & 2",
    sport: "Chess",
    level: "Primary Schools",
    isLive: true,
    viewers: "684",
    duration: "Round 5",
    quality: "SD",
  },
];

export function BroadcastHub() {
  const [selectedBroadcast, setSelectedBroadcast] = useState<string | null>(null);

  return (
    <section id="broadcast" className="hairline-b">
      {/* Header */}
      <div className="px-8 py-5 hairline-b flex items-center justify-between">
        <p className="text-xs mono tracking-[0.2em] uppercase text-nexus-muted">Broadcast Hub</p>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse" />
          <span className="text-xs mono tracking-widest uppercase text-nexus-live">
            {BROADCASTS.filter(b => b.isLive).length} Live Streams
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {BROADCASTS.map((broadcast, i) => (
          <motion.button
            key={broadcast.id}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedBroadcast(broadcast.id === selectedBroadcast ? null : broadcast.id)}
            className={`hairline p-8 text-left flex flex-col gap-4 transition-colors duration-200 btn-click
              ${selectedBroadcast === broadcast.id ? "bg-foreground" : "hover:bg-nexus-surface/40"}`}
          >
            {/* Video placeholder */}
            <div
              className={`w-full aspect-video flex items-center justify-center relative overflow-hidden hairline
                ${selectedBroadcast === broadcast.id ? "border-primary-foreground/20" : ""}`}
              style={{ background: selectedBroadcast === broadcast.id ? "rgba(255,255,255,0.05)" : "hsl(210 40% 96%)" }}
            >
              {broadcast.isLive ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center hairline"
                       style={{ background: selectedBroadcast === broadcast.id ? "rgba(255,255,255,0.1)" : "hsl(222 47% 11%)" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <polygon points="5,3 14,8 5,13" fill={selectedBroadcast === broadcast.id ? "hsl(222 47% 11%)" : "white"} />
                    </svg>
                  </div>
                  <span className={`text-xs mono tracking-widest uppercase ${selectedBroadcast === broadcast.id ? "text-primary-foreground/60" : "text-nexus-muted"}`}>
                    Tap to watch
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <span className={`text-xs mono tracking-widest uppercase ${selectedBroadcast === broadcast.id ? "text-primary-foreground/60" : "text-nexus-muted"}`}>
                    {broadcast.duration}
                  </span>
                </div>
              )}

              {/* Live badge */}
              {broadcast.isLive && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1"
                     style={{ background: "hsl(0 84% 60%)" }}>
                  <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                  <span className="text-xs mono text-white tracking-widest uppercase">Live</span>
                </div>
              )}

              {/* Quality badge */}
              <div className={`absolute top-3 right-3 px-2 py-1 hairline
                ${selectedBroadcast === broadcast.id ? "border-primary-foreground/20" : ""}`}>
                <span className={`text-xs mono tracking-widest ${selectedBroadcast === broadcast.id ? "text-primary-foreground/60" : "text-nexus-muted"}`}>
                  {broadcast.quality}
                </span>
              </div>
            </div>

            {/* Info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs mono tracking-widest uppercase ${selectedBroadcast === broadcast.id ? "text-primary-foreground/60" : "text-nexus-muted"}`}>
                  {broadcast.sport}
                </span>
                <span className={`hairline-l pl-2 text-xs mono tracking-widest uppercase ${selectedBroadcast === broadcast.id ? "text-primary-foreground/40 border-primary-foreground/20" : "text-nexus-muted/70"}`}>
                  {broadcast.level}
                </span>
              </div>
              <p className={`display-font text-sm font-semibold leading-snug ${selectedBroadcast === broadcast.id ? "text-primary-foreground" : "text-foreground"}`}>
                {broadcast.title}
              </p>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-between hairline-t pt-4 ${selectedBroadcast === broadcast.id ? "border-primary-foreground/20" : ""}`}>
              <span className={`text-xs mono ${selectedBroadcast === broadcast.id ? "text-primary-foreground/60" : "text-nexus-muted"}`}>
                {broadcast.duration}
              </span>
              {broadcast.isLive && (
                <span className={`text-xs mono ${selectedBroadcast === broadcast.id ? "text-primary-foreground/60" : "text-nexus-muted"}`}>
                  {broadcast.viewers} watching
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
