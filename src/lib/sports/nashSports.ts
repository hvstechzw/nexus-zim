// ════════════════════════════════════════════════════════════════════════════
// Minimal SportConfig for the 13 NASH sports beyond handball & netball.
// Concise on purpose — provides scoring buttons + periods so MatchConsolePage
// works for every sport from day one. Each can be elaborated later (positions,
// rich stat formulas, sport-specific commentary triggers) without touching
// callers; this file is the single source of truth for "what events exist for
// sport X".
// ════════════════════════════════════════════════════════════════════════════
import type { SportConfig, ScoreEventDef, OtherEventDef, PeriodDef } from "./types";

const halves = (mins: number): PeriodDef[] => [
  { key: "H1", label: "1st Half", short: "H1", seconds: mins * 60, kind: "regulation" },
  { key: "H2", label: "2nd Half", short: "H2", seconds: mins * 60, kind: "regulation" },
];
const quarters = (mins: number): PeriodDef[] => [
  { key: "Q1", label: "Quarter 1", short: "Q1", seconds: mins * 60, kind: "regulation" },
  { key: "Q2", label: "Quarter 2", short: "Q2", seconds: mins * 60, kind: "regulation" },
  { key: "Q3", label: "Quarter 3", short: "Q3", seconds: mins * 60, kind: "regulation" },
  { key: "Q4", label: "Quarter 4", short: "Q4", seconds: mins * 60, kind: "regulation" },
];
const sets = (n: number): PeriodDef[] => Array.from({ length: n }, (_, i) => ({
  key: `S${i + 1}`, label: `Set ${i + 1}`, short: `S${i + 1}`, seconds: 0, kind: "regulation" as const,
}));

// ── FOOTBALL ────────────────────────────────────────────────────────────────
export const FOOTBALL: SportConfig = {
  key: "football", label: "Football", governing: "FIFA",
  blurb: "Association Football · 2 × 45 min halves, ET + penalties for KO matches.",
  squadSize: 18, onCourt: 11, periodNoun: "Half",
  regulationPeriods: 2, centrePassAlternates: false, accentVar: "--sport-football",
  periods: [
    ...halves(45),
    { key: "ET1", label: "Extra Time 1", short: "ET1", seconds: 15 * 60, kind: "extra" },
    { key: "ET2", label: "Extra Time 2", short: "ET2", seconds: 15 * 60, kind: "extra" },
    { key: "SO", label: "Penalty Shootout", short: "SO", seconds: 0, kind: "shootout" },
  ],
  scoreEvents: [
    { type: "goal", label: "Goal", value: 1, attributable: true, primary: true },
    { type: "own_goal", label: "Own Goal", value: 1 },
    { type: "penalty_goal", label: "Penalty Goal", value: 1, attributable: true },
    { type: "et_goal", label: "ET Goal", value: 1, attributable: true },
    { type: "penalty_shootout_goal", label: "Shootout Goal", value: 1, attributable: true },
  ],
  otherEvents: [
    { type: "yellow_card", label: "Yellow Card", kind: "discipline", attributable: true, card: "yellow" },
    { type: "red_card", label: "Red Card", kind: "discipline", attributable: true, card: "red" },
    { type: "penalty_miss", label: "Penalty Miss", kind: "shot" },
    { type: "substitution", label: "Substitution", kind: "info", attributable: true },
    { type: "offside", label: "Offside", kind: "info" },
    { type: "corner", label: "Corner", kind: "info" },
    { type: "free_kick", label: "Free Kick", kind: "info" },
    { type: "penalty_shootout_miss", label: "Shootout Miss", kind: "shot" },
  ],
  positions: [
    { code: "GK", name: "Goalkeeper", canScore: false },
    { code: "DF", name: "Defender", canScore: true },
    { code: "MF", name: "Midfielder", canScore: true },
    { code: "FW", name: "Forward", canScore: true },
  ],
};

// ── BASKETBALL ──────────────────────────────────────────────────────────────
export const BASKETBALL: SportConfig = {
  key: "basketball", label: "Basketball", governing: "FIBA",
  blurb: "4 × 10 min quarters · 2-point / 3-point / free-throw scoring.",
  squadSize: 12, onCourt: 5, periodNoun: "Quarter",
  regulationPeriods: 4, centrePassAlternates: false, accentVar: "--sport-basketball",
  periods: [...quarters(10), { key: "OT", label: "Overtime", short: "OT", seconds: 5 * 60, kind: "extra" }],
  scoreEvents: [
    { type: "field_goal_2", label: "2 Points", value: 2, attributable: true, primary: true },
    { type: "field_goal_3", label: "3 Points", value: 3, attributable: true, primary: true },
    { type: "free_throw_made", label: "Free Throw", value: 1, attributable: true },
  ],
  otherEvents: [
    { type: "free_throw_miss", label: "FT Miss", kind: "shot" },
    { type: "personal_foul", label: "Personal Foul", kind: "discipline", attributable: true },
    { type: "technical_foul", label: "Technical Foul", kind: "discipline", attributable: true, card: "yellow" },
    { type: "flagrant_foul", label: "Flagrant Foul", kind: "discipline", attributable: true, card: "red" },
    { type: "timeout", label: "Timeout", kind: "stoppage" },
    { type: "substitution", label: "Substitution", kind: "info" },
  ],
  positions: [
    { code: "PG", name: "Point Guard", canScore: true },
    { code: "SG", name: "Shooting Guard", canScore: true },
    { code: "SF", name: "Small Forward", canScore: true },
    { code: "PF", name: "Power Forward", canScore: true },
    { code: "C", name: "Centre", canScore: true },
  ],
};

// ── VOLLEYBALL ──────────────────────────────────────────────────────────────
export const VOLLEYBALL: SportConfig = {
  key: "volleyball", label: "Volleyball", governing: "FIVB",
  blurb: "Best of 5 sets · rally scoring to 25 (15 in deciding set).",
  squadSize: 12, onCourt: 6, periodNoun: "Set",
  regulationPeriods: 5, centrePassAlternates: false, accentVar: "--sport-volleyball",
  periods: sets(5),
  scoreEvents: [
    { type: "point_home", label: "Point Home", value: 1, primary: true },
    { type: "point_away", label: "Point Away", value: 1, primary: true },
  ],
  otherEvents: [
    { type: "timeout", label: "Timeout", kind: "stoppage" },
    { type: "challenge", label: "Challenge / Video Review", kind: "info" },
    { type: "substitution", label: "Substitution", kind: "info" },
  ],
  positions: [
    { code: "S", name: "Setter", canScore: true },
    { code: "OH", name: "Outside Hitter", canScore: true },
    { code: "MB", name: "Middle Blocker", canScore: true },
    { code: "OP", name: "Opposite", canScore: true },
    { code: "L", name: "Libero", canScore: false },
  ],
};

// ── CRICKET ─────────────────────────────────────────────────────────────────
export const CRICKET: SportConfig = {
  key: "cricket", label: "Cricket", governing: "ICC",
  blurb: "Runs and wickets across innings; overs-driven progression.",
  squadSize: 15, onCourt: 11, periodNoun: "Innings",
  regulationPeriods: 2, centrePassAlternates: false, accentVar: "--sport-cricket",
  periods: [
    { key: "I1", label: "Innings 1", short: "I1", seconds: 0, kind: "regulation" },
    { key: "I2", label: "Innings 2", short: "I2", seconds: 0, kind: "regulation" },
  ],
  scoreEvents: [
    { type: "run", label: "Run", value: 1, primary: true },
    { type: "boundary_4", label: "Four", value: 4, attributable: true, primary: true },
    { type: "boundary_6", label: "Six", value: 6, attributable: true, primary: true },
  ],
  otherEvents: [
    { type: "wicket", label: "Wicket", kind: "discipline", attributable: true },
    { type: "wide", label: "Wide", kind: "info" },
    { type: "no_ball", label: "No Ball", kind: "info" },
    { type: "bye", label: "Bye", kind: "info" },
    { type: "leg_bye", label: "Leg Bye", kind: "info" },
    { type: "over_end", label: "End of Over", kind: "stoppage" },
    { type: "innings_end", label: "End of Innings", kind: "stoppage" },
  ],
  positions: [
    { code: "BAT", name: "Batsman", canScore: true },
    { code: "BWL", name: "Bowler", canScore: false },
    { code: "AR", name: "All-Rounder", canScore: true },
    { code: "WK", name: "Wicket Keeper", canScore: true },
  ],
};

// ── RUGBY ───────────────────────────────────────────────────────────────────
export const RUGBY: SportConfig = {
  key: "rugby", label: "Rugby", governing: "World Rugby",
  blurb: "2 × 35 min halves (schools) · tries, conversions, penalties, drop goals.",
  squadSize: 23, onCourt: 15, periodNoun: "Half",
  regulationPeriods: 2, centrePassAlternates: false, accentVar: "--sport-rugby",
  periods: [...halves(35), { key: "ET", label: "Extra Time", short: "ET", seconds: 10 * 60, kind: "extra" }],
  scoreEvents: [
    { type: "try", label: "Try", value: 5, attributable: true, primary: true },
    { type: "conversion", label: "Conversion", value: 2, attributable: true },
    { type: "penalty_goal", label: "Penalty Goal", value: 3, attributable: true },
    { type: "drop_goal", label: "Drop Goal", value: 3, attributable: true },
  ],
  otherEvents: [
    { type: "yellow_card", label: "Yellow Card", kind: "discipline", attributable: true, card: "yellow", suspensionSeconds: 10 * 60 },
    { type: "red_card", label: "Red Card", kind: "discipline", attributable: true, card: "red" },
    { type: "scrum", label: "Scrum", kind: "info" },
    { type: "lineout", label: "Lineout", kind: "info" },
  ],
  positions: [
    { code: "FW", name: "Forward", canScore: true },
    { code: "BK", name: "Back", canScore: true },
  ],
};

// ── HOCKEY ──────────────────────────────────────────────────────────────────
export const HOCKEY: SportConfig = {
  key: "hockey", label: "Hockey", governing: "FIH",
  blurb: "Field Hockey · 4 × 15 min quarters · field goals + penalty corners.",
  squadSize: 16, onCourt: 11, periodNoun: "Quarter",
  regulationPeriods: 4, centrePassAlternates: false, accentVar: "--sport-hockey",
  periods: quarters(15),
  scoreEvents: [
    { type: "field_goal", label: "Field Goal", value: 1, attributable: true, primary: true },
    { type: "penalty_corner_goal", label: "PC Goal", value: 1, attributable: true, primary: true },
    { type: "penalty_stroke", label: "Penalty Stroke", value: 1, attributable: true },
  ],
  otherEvents: [
    { type: "green_card", label: "Green Card", kind: "discipline", attributable: true, card: "yellow", suspensionSeconds: 2 * 60 },
    { type: "yellow_card", label: "Yellow Card", kind: "discipline", attributable: true, card: "yellow", suspensionSeconds: 5 * 60 },
    { type: "red_card", label: "Red Card", kind: "discipline", attributable: true, card: "red" },
    { type: "video_referral", label: "Video Referral", kind: "info" },
  ],
  positions: [
    { code: "GK", name: "Goalkeeper", canScore: false },
    { code: "DF", name: "Defender", canScore: true },
    { code: "MF", name: "Midfielder", canScore: true },
    { code: "FW", name: "Forward", canScore: true },
  ],
};

// ── TENNIS ──────────────────────────────────────────────────────────────────
export const TENNIS: SportConfig = {
  key: "tennis", label: "Tennis", governing: "ITF",
  blurb: "Best-of-3 sets · games & tiebreaks.",
  squadSize: 1, onCourt: 1, periodNoun: "Set",
  regulationPeriods: 3, centrePassAlternates: false, accentVar: "--sport-tennis",
  periods: sets(3),
  scoreEvents: [
    { type: "point_home", label: "Point Home", value: 1, primary: true },
    { type: "point_away", label: "Point Away", value: 1, primary: true },
  ],
  otherEvents: [
    { type: "ace", label: "Ace", kind: "info" },
    { type: "double_fault", label: "Double Fault", kind: "info" },
    { type: "tiebreak_point", label: "Tiebreak Point", kind: "info" },
  ],
  positions: [{ code: "P", name: "Player", canScore: true }],
};

// ── TABLE TENNIS ────────────────────────────────────────────────────────────
export const TABLE_TENNIS: SportConfig = {
  key: "table_tennis", label: "Table Tennis", governing: "ITTF",
  blurb: "Best-of-7 games to 11 points.", squadSize: 1, onCourt: 1, periodNoun: "Game",
  regulationPeriods: 7, centrePassAlternates: false, accentVar: "--sport-tabletennis",
  periods: sets(7).map((p, i) => ({ ...p, label: `Game ${i + 1}` })),
  scoreEvents: [
    { type: "point_home", label: "Point Home", value: 1, primary: true },
    { type: "point_away", label: "Point Away", value: 1, primary: true },
  ],
  otherEvents: [{ type: "timeout", label: "Timeout", kind: "stoppage" }],
  positions: [{ code: "P", name: "Player", canScore: true }],
};

// ── BADMINTON ───────────────────────────────────────────────────────────────
export const BADMINTON: SportConfig = {
  key: "badminton", label: "Badminton", governing: "BWF",
  blurb: "Best-of-3 games to 21 points.", squadSize: 2, onCourt: 1, periodNoun: "Game",
  regulationPeriods: 3, centrePassAlternates: false, accentVar: "--sport-badminton",
  periods: sets(3).map((p, i) => ({ ...p, label: `Game ${i + 1}` })),
  scoreEvents: [
    { type: "point_home", label: "Point Home", value: 1, primary: true },
    { type: "point_away", label: "Point Away", value: 1, primary: true },
  ],
  otherEvents: [{ type: "timeout", label: "Timeout", kind: "stoppage" }],
  positions: [{ code: "P", name: "Player", canScore: true }],
};

// ── Field-based codes (time/distance scoring, no in-match events) ───────────
// Athletics, swimming, cross-country use athletics_events/athletics_results,
// not the match_events flow. We still register stub configs so MatchConsolePage
// can render a "use the events flow instead" message rather than crash.
const stubConfig = (key: SportConfig["key"], label: string, governing: string, blurb: string): SportConfig => ({
  key, label, governing, blurb,
  squadSize: 1, onCourt: 1, periodNoun: "Event",
  regulationPeriods: 1, centrePassAlternates: false, accentVar: `--sport-${key}`,
  periods: [{ key: "E1", label, short: "E1", seconds: 0, kind: "regulation" }],
  scoreEvents: [], otherEvents: [],
  positions: [{ code: "P", name: "Athlete", canScore: true }],
});
export const ATHLETICS = stubConfig("athletics", "Athletics", "World Athletics", "Time/distance scored — use the Athletics Events flow.");
export const SWIMMING = stubConfig("swimming", "Swimming", "World Aquatics", "Time-based scoring — use the Athletics Events flow.");
export const CROSS_COUNTRY = stubConfig("cross_country", "Cross Country", "World Athletics", "Position-based scoring — use the Athletics Events flow.");
export const CHESS = stubConfig("chess", "Chess", "FIDE", "Round-based points — separate flow.");
