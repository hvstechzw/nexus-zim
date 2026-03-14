import { useState } from "react";
import { motion } from "framer-motion";

const LEAGUES = [
  { id: "psl", label: "Premier Soccer League" },
  { id: "rugby", label: "Rugby Union Premier" },
  { id: "cricket", label: "Logan Cup" },
  { id: "basketball", label: "ZABA Premier League" },
];

const STANDINGS: Record<string, Array<{
  pos: number; team: string; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number;
}>> = {
  psl: [
    { pos: 1, team: "FC Platinum", p: 17, w: 12, d: 3, l: 2, gf: 34, ga: 14, pts: 39 },
    { pos: 2, team: "Dynamos FC", p: 17, w: 11, d: 2, l: 4, gf: 28, ga: 18, pts: 35 },
    { pos: 3, team: "Highlanders FC", p: 17, w: 10, d: 4, l: 3, gf: 30, ga: 16, pts: 34 },
    { pos: 4, team: "CAPS United", p: 17, w: 9, d: 3, l: 5, gf: 24, ga: 19, pts: 30 },
    { pos: 5, team: "Chicken Inn FC", p: 17, w: 8, d: 4, l: 5, gf: 22, ga: 20, pts: 28 },
    { pos: 6, team: "ZPC Kariba", p: 17, w: 7, d: 4, l: 6, gf: 20, ga: 22, pts: 25 },
    { pos: 7, team: "Manica Diamonds", p: 17, w: 6, d: 5, l: 6, gf: 18, ga: 23, pts: 23 },
    { pos: 8, team: "Black Rhinos", p: 17, w: 5, d: 4, l: 8, gf: 16, ga: 24, pts: 19 },
  ],
  rugby: [
    { pos: 1, team: "Harare Sports Club", p: 10, w: 9, d: 0, l: 1, gf: 284, ga: 112, pts: 45 },
    { pos: 2, team: "Old Georgians", p: 10, w: 8, d: 0, l: 2, gf: 256, ga: 130, pts: 40 },
    { pos: 3, team: "Matabeleland Tuskers", p: 10, w: 6, d: 1, l: 3, gf: 210, ga: 162, pts: 32 },
    { pos: 4, team: "Old Hararians", p: 10, w: 5, d: 0, l: 5, gf: 188, ga: 195, pts: 25 },
    { pos: 5, team: "Bulawayo Athletic", p: 10, w: 3, d: 1, l: 6, gf: 150, ga: 218, pts: 17 },
  ],
  cricket: [
    { pos: 1, team: "Mashonaland Eagles", p: 6, w: 5, d: 0, l: 1, gf: 1840, ga: 1502, pts: 15 },
    { pos: 2, team: "Southern Rocks", p: 6, w: 3, d: 1, l: 2, gf: 1720, ga: 1660, pts: 10 },
    { pos: 3, team: "Mountaineers", p: 6, w: 2, d: 1, l: 3, gf: 1680, ga: 1720, pts: 8 },
    { pos: 4, team: "Mid West Rhinos", p: 6, w: 1, d: 0, l: 5, gf: 1520, ga: 1878, pts: 3 },
  ],
  basketball: [
    { pos: 1, team: "Suns BC", p: 8, w: 7, d: 0, l: 1, gf: 680, ga: 592, pts: 14 },
    { pos: 2, team: "Eagles BC", p: 8, w: 6, d: 0, l: 2, gf: 648, ga: 612, pts: 12 },
    { pos: 3, team: "Wizards ZW", p: 8, w: 4, d: 0, l: 4, gf: 620, ga: 634, pts: 8 },
    { pos: 4, team: "Lakers ZW", p: 8, w: 2, d: 0, l: 6, gf: 580, ga: 660, pts: 4 },
    { pos: 5, team: "Bulls BC", p: 8, w: 1, d: 0, l: 7, gf: 544, ga: 694, pts: 2 },
  ],
};

export function StandingsTable() {
  const [activeLeague, setActiveLeague] = useState("psl");
  const data = STANDINGS[activeLeague] || [];

  return (
    <section id="standings" className="hairline-b">
      {/* Header */}
      <div className="px-8 py-5 hairline-b flex items-center justify-between">
        <p className="text-xs mono tracking-[0.2em] uppercase text-nexus-muted">League Standings</p>
      </div>

      {/* League tabs */}
      <div className="flex hairline-b overflow-x-auto">
        {LEAGUES.map((league, i) => (
          <button
            key={league.id}
            onClick={() => setActiveLeague(league.id)}
            className={`px-7 py-4 text-xs tracking-[0.15em] uppercase font-medium transition-colors duration-200 btn-click whitespace-nowrap flex-shrink-0
              ${i < LEAGUES.length - 1 ? "hairline-r" : ""}
              ${activeLeague === league.id ? "bg-foreground text-primary-foreground" : "text-nexus-muted hover:text-foreground"}`}
          >
            {league.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="hairline-b">
              {["#", "Club", "P", "W", "D", "L", "GF", "GA", "PTS"].map((col) => (
                <th
                  key={col}
                  className={`py-3 text-xs mono tracking-[0.15em] uppercase text-nexus-muted font-medium
                    ${col === "Club" ? "text-left px-8" : "text-center px-3"}`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <motion.tr
                key={row.team}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="hairline-b hover:bg-nexus-surface/50 transition-colors duration-200"
              >
                <td className="py-4 text-center px-3">
                  <span className="mono text-sm text-nexus-muted">{row.pos}</span>
                </td>
                <td className="py-4 px-8">
                  <span className="display-font text-sm font-semibold text-foreground">{row.team}</span>
                </td>
                {[row.p, row.w, row.d, row.l, row.gf, row.ga].map((val, j) => (
                  <td key={j} className="py-4 text-center px-3">
                    <span className="mono text-sm text-nexus-muted">{val}</span>
                  </td>
                ))}
                <td className="py-4 text-center px-3">
                  <span className="mono text-sm font-bold text-foreground">{row.pts}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
