import type { SportConfig } from "./types";

// Handball — IHF rules. 7 a side (6 court + goalkeeper), two 30-minute halves.
// Progressive discipline: warning (yellow), 2-minute suspension (team plays a
// player short), disqualification (red). A 7-metre throw is a penalty shot.
export const HANDBALL: SportConfig = {
  key: "handball",
  label: "Handball",
  governing: "IHF",
  blurb: "7-a-side · two 30-minute halves · 7m penalty throws · 2-min suspensions.",
  squadSize: 14,
  onCourt: 7,
  periodNoun: "Half",
  regulationPeriods: 2,
  centrePassAlternates: false,
  accentVar: "--sport-handball",
  periods: [
    { key: "H1", label: "1st Half", short: "H1", seconds: 30 * 60, kind: "regulation" },
    { key: "H2", label: "2nd Half", short: "H2", seconds: 30 * 60, kind: "regulation" },
    { key: "ET1", label: "Extra Time 1", short: "ET1", seconds: 5 * 60, kind: "extra" },
    { key: "ET2", label: "Extra Time 2", short: "ET2", seconds: 5 * 60, kind: "extra" },
    { key: "SO", label: "7m Shootout", short: "SO", seconds: 0, kind: "shootout" },
  ],
  scoreEvents: [
    { type: "goal", label: "Goal", value: 1, attributable: true, primary: true },
    { type: "goal_7m", label: "7m Goal", value: 1, attributable: true, hint: "Penalty throw" },
  ],
  otherEvents: [
    { type: "miss", label: "Missed Shot", kind: "shot", attributable: true },
    { type: "miss_7m", label: "7m Miss", kind: "shot", attributable: true },
    { type: "save", label: "Save", kind: "save", attributable: true },
    { type: "block", label: "Block", kind: "save", attributable: true },
    { type: "assist", label: "Assist", kind: "info", attributable: true },
    { type: "steal", label: "Steal", kind: "turnover", attributable: true },
    { type: "intercept", label: "Intercept", kind: "turnover", attributable: true },
    { type: "turnover", label: "Turnover", kind: "turnover", attributable: true },
    { type: "technical_fault", label: "Technical Fault", kind: "turnover" },
    { type: "foul", label: "Foul", kind: "discipline", attributable: true },
    { type: "warning", label: "Warning (Yellow)", kind: "discipline", card: "yellow", attributable: true },
    { type: "suspension_2min", label: "2-min Suspension", kind: "discipline", suspensionSeconds: 120, attributable: true },
    { type: "disqualification", label: "Disqualification (Red)", kind: "discipline", card: "red", attributable: true },
    { type: "blue_card", label: "Blue Card (Report)", kind: "discipline", card: "blue", attributable: true },
    { type: "substitution", label: "Substitution", kind: "info", attributable: true },
    { type: "injury", label: "Injury Stoppage", kind: "stoppage" },
    { type: "timeout", label: "Team Timeout", kind: "stoppage" },
  ],

  positions: [
    { code: "GK", name: "Goalkeeper", canScore: true },
    { code: "LW", name: "Left Wing", canScore: true },
    { code: "LB", name: "Left Back", canScore: true },
    { code: "CB", name: "Centre Back", canScore: true },
    { code: "RB", name: "Right Back", canScore: true },
    { code: "RW", name: "Right Wing", canScore: true },
    { code: "P", name: "Pivot (Line)", canScore: true },
  ],
};
