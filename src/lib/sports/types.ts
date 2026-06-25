// Nexus sport domain — shared types.
//
// Nexus is deliberately scoped to two codes: netball and handball. Everything
// that needs to know "how a match is scored" reads from a single SportConfig so
// the live scorer, the broadcast overlay, and the stats engine never disagree.

export type SportKey = "netball" | "handball";
export type Side = "home" | "away";
export type CardKind = "yellow" | "red" | "blue";

/** An event that changes the scoreline. `value` points go to the scoring side. */
export interface ScoreEventDef {
  type: string; // canonical, stored in score_entries.event_type
  label: string;
  value: number;
  hint?: string;
  /** Attribution prompt — a goal should ask "who scored?" */
  attributable?: boolean;
  primary?: boolean;
}

/** A non-scoring event: discipline, turnovers, saves, stoppages. */
export interface OtherEventDef {
  type: string;
  label: string;
  kind: "shot" | "save" | "turnover" | "discipline" | "stoppage" | "info";
  hint?: string;
  attributable?: boolean;
  card?: CardKind;
  /** Handball 2-minute suspension etc. Drives short-handed tracking. */
  suspensionSeconds?: number;
}

export interface PeriodDef {
  key: string; // "Q1", "H1", "ET1", "SO"
  label: string; // "Quarter 1"
  short: string; // "Q1"
  seconds: number; // regulation length (0 for shootout)
  kind: "regulation" | "extra" | "shootout";
}

export interface PositionDef {
  code: string; // "GS"
  name: string; // "Goal Shooter"
  canScore: boolean;
}

export interface SportConfig {
  key: SportKey;
  label: string;
  governing: string; // "World Netball" | "IHF"
  blurb: string;
  squadSize: number; // players named on a team sheet
  onCourt: number; // players on court per side
  periodNoun: string; // "Quarter" | "Half"
  periods: PeriodDef[];
  regulationPeriods: number;
  scoreEvents: ScoreEventDef[];
  otherEvents: OtherEventDef[];
  positions: PositionDef[];
  /** Netball: possession (centre pass) alternates after every goal. */
  centrePassAlternates: boolean;
  /** CSS custom property used for the sport's accent pill/dot. */
  accentVar: string;
}
