import type { SportConfig } from "./types";

// Netball — World Netball rules, schools competition variant.
// 7 a side, four 15-minute quarters, only GS/GA may shoot from inside the
// circle, possession (centre pass) alternates after every goal.
export const NETBALL: SportConfig = {
  key: "netball",
  label: "Netball",
  governing: "World Netball",
  blurb: "7-a-side · four 15-minute quarters · GS & GA shoot from the circle.",
  squadSize: 12,
  onCourt: 7,
  periodNoun: "Quarter",
  regulationPeriods: 4,
  centrePassAlternates: true,
  accentVar: "--sport-netball",
  periods: [
    { key: "Q1", label: "Quarter 1", short: "Q1", seconds: 15 * 60, kind: "regulation" },
    { key: "Q2", label: "Quarter 2", short: "Q2", seconds: 15 * 60, kind: "regulation" },
    { key: "Q3", label: "Quarter 3", short: "Q3", seconds: 15 * 60, kind: "regulation" },
    { key: "Q4", label: "Quarter 4", short: "Q4", seconds: 15 * 60, kind: "regulation" },
    { key: "ET1", label: "Extra Time 1", short: "ET1", seconds: 7 * 60, kind: "extra" },
    { key: "ET2", label: "Extra Time 2", short: "ET2", seconds: 7 * 60, kind: "extra" },
  ],
  scoreEvents: [
    { type: "goal", label: "Goal", value: 1, attributable: true, primary: true, hint: "Inside the circle" },
    { type: "super_shot", label: "Super Shot", value: 2, attributable: true, hint: "2-point zone (league rule)" },
  ],
  otherEvents: [
    { type: "miss", label: "Missed Shot", kind: "shot", attributable: true },
    { type: "rebound", label: "Rebound", kind: "shot", attributable: true },
    { type: "intercept", label: "Intercept", kind: "turnover", attributable: true },
    { type: "turnover", label: "Turnover", kind: "turnover" },
    { type: "penalty_contact", label: "Penalty — Contact", kind: "discipline" },
    { type: "penalty_obstruction", label: "Penalty — Obstruction", kind: "discipline" },
    { type: "footwork", label: "Footwork", kind: "turnover" },
    { type: "offside", label: "Offside", kind: "turnover" },
    { type: "held_ball", label: "Held Ball", kind: "turnover" },
    { type: "substitution", label: "Substitution", kind: "info" },
    { type: "injury", label: "Injury Stoppage", kind: "stoppage" },
    { type: "timeout", label: "Timeout", kind: "stoppage" },
  ],
  positions: [
    { code: "GS", name: "Goal Shooter", canScore: true },
    { code: "GA", name: "Goal Attack", canScore: true },
    { code: "WA", name: "Wing Attack", canScore: false },
    { code: "C", name: "Centre", canScore: false },
    { code: "WD", name: "Wing Defence", canScore: false },
    { code: "GD", name: "Goal Defence", canScore: false },
    { code: "GK", name: "Goal Keeper", canScore: false },
  ],
};
