import { motion } from "framer-motion";

const EVENTS = [
  { id: "1", sport: "Football", level: "National League", title: "Premier Soccer League — Match Day 18", teams: ["Dynamos FC", "Highlanders FC", "CAPS United", "FC Platinum"], date: "Sat 15 Mar 2026", venue: "National Sports Stadium, Harare", status: "upcoming", entries: 18, capacity: 18 },
  { id: "2", sport: "Chess", level: "Primary Schools", title: "Harare Primary Inter-School Chess Championship", teams: ["Roosevelt Prim.", "Avondale Prim.", "Westlea Prim.", "Glen Lorne Prim."], date: "Sat 15 Mar 2026", venue: "Harare Chess Club", status: "live", entries: 64, capacity: 64 },
  { id: "3", sport: "Athletics", level: "Secondary Schools", title: "Mashonaland East Athletics Trials", teams: ["150+ athletes across 12 schools"], date: "Sun 16 Mar 2026", venue: "Mutare Sports Club", status: "upcoming", entries: 142, capacity: 200 },
  { id: "4", sport: "Rugby", level: "Secondary Schools", title: "Harare Schools Rugby Sevens", teams: ["Prince Edward", "St George's", "Churchill", "Allan Wilson"], date: "Sat 15 Mar 2026", venue: "Old Hararians Sports Club", status: "live", entries: 12, capacity: 16 },
  { id: "5", sport: "Debate", level: "National League", title: "Zimbabwe Universities Debate League — Quarter Finals", teams: ["UZ", "MSU", "NUST", "CUT"], date: "Fri 14 Mar 2026", venue: "HICC, Harare", status: "live", entries: 8, capacity: 8 },
  { id: "6", sport: "Swimming", level: "Club Level", title: "Harare Swimming Gala — Open Masters", teams: ["Harare Swimming Club", "Borrowdale Stingrays", "BSAC"], date: "Sat 22 Mar 2026", venue: "Hillside Swimming Pool, Harare", status: "open", entries: 78, capacity: 120 },
  { id: "7", sport: "Cricket", level: "National League", title: "Logan Cup — Round 4", teams: ["Mashonaland Eagles", "Southern Rocks", "Mountaineers"], date: "Thu 13 Mar 2026", venue: "Harare Sports Club", status: "upcoming", entries: 4, capacity: 4 },
  { id: "8", sport: "Quiz", level: "Secondary Schools", title: "National Science Quiz — Harare Regional", teams: ["20 schools competing"], date: "Mon 17 Mar 2026", venue: "Girls High School Harare", status: "open", entries: 12, capacity: 20 },
  { id: "9", sport: "Basketball", level: "Club Level", title: "ZABA Premier League — Week 9", teams: ["Suns BC", "Eagles BC", "Wizards", "Lakers ZW"], date: "Sat 15 Mar 2026", venue: "YMCA, Harare", status: "live", entries: 8, capacity: 8 },
];

const STATUS_CONFIG = {
  live: { label: "Live", dot: true },
  upcoming: { label: "Upcoming", dot: false },
  open: { label: "Open", dot: false },
  closed: { label: "Closed", dot: false },
};

export function EventsGrid() {
  return (
    <section id="events" className="hairline-b">
      {/* Section header */}
      <div className="px-8 py-5 hairline-b flex items-center justify-between">
        <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">Upcoming & Active Events</p>
        <button className="text-xs font-semibold text-nexus-muted hover:text-foreground transition-colors flex items-center gap-1">
          View All <span>→</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6 md:p-8">
        {EVENTS.map((event, i) => {
          const status = STATUS_CONFIG[event.status as keyof typeof STATUS_CONFIG];
          const fillPct = Math.round((event.entries / event.capacity) * 100);

          return (
            <motion.article
              key={event.id}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: (i % 3) * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="hairline rounded-xl p-6 flex flex-col gap-4 hover:bg-nexus-surface/50 transition-colors duration-200 cursor-pointer group card-shadow"
            >
              {/* Meta row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] mono tracking-widest uppercase text-nexus-muted bg-nexus-surface px-2.5 py-1 rounded-full">
                    {event.sport}
                  </span>
                  <span className="text-[10px] mono tracking-widest uppercase text-nexus-muted/70 bg-nexus-surface px-2.5 py-1 rounded-full">
                    {event.level}
                  </span>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] mono tracking-widest uppercase text-nexus-muted">
                  {status.dot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-nexus-live animate-pulse" />
                  )}
                  {status.label}
                </span>
              </div>

              {/* Title */}
              <h3 className="display-font text-sm font-semibold text-foreground leading-snug group-hover:opacity-75 transition-opacity">
                {event.title}
              </h3>

              {/* Teams */}
              <div className="flex flex-wrap gap-1.5">
                {event.teams.slice(0, 3).map((team) => (
                  <span key={team} className="text-[11px] mono text-nexus-muted hairline px-2 py-1 rounded-md">
                    {team}
                  </span>
                ))}
                {event.teams.length > 3 && (
                  <span className="text-[11px] mono text-nexus-muted px-2 py-1">
                    +{event.teams.length - 3}
                  </span>
                )}
              </div>

              {/* Footer row */}
              <div className="mt-auto pt-4 hairline-t flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs mono text-nexus-muted font-medium">{event.date}</p>
                  <p className="text-[11px] mono text-nexus-muted/70 mt-0.5 truncate max-w-[180px]">
                    {event.venue}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1.5 bg-nexus-silver rounded-full overflow-hidden">
                      <div
                        className="h-full bg-foreground transition-all duration-700 rounded-full"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] mono text-nexus-muted">
                      {event.entries}/{event.capacity}
                    </span>
                  </div>
                  <p className="text-[10px] mono text-nexus-muted/60 mt-1">entries</p>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
