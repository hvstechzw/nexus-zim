import { describe, expect, it } from "vitest";
import { disciplineLeaders, playerSummary, teamGoals, topScorers, type ScoreEntryLike } from "./leaderboard";

const entries: ScoreEntryLike[] = [
  { athlete_id: "a1", team_id: "t1", value: 1, event_type: "goal", metadata: { player_name: "Tariro" } },
  { athlete_id: "a1", team_id: "t1", value: 2, event_type: "super_shot", metadata: { player_name: "Tariro" } },
  { athlete_id: "a2", team_id: "t1", value: 1, event_type: "goal", metadata: { player_name: "Chipo" } },
  { athlete_id: null, team_id: "t2", value: 1, event_type: "goal" }, // unattributed
  { athlete_id: "a3", team_id: "t2", value: 0, event_type: "save", metadata: { player_name: "Rudo" } }, // non-scoring
];

describe("topScorers", () => {
  it("ranks attributed scorers by points then goals", () => {
    const rows = topScorers(entries);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ athleteId: "a1", goals: 2, points: 3, name: "Tariro" });
    expect(rows[1]).toMatchObject({ athleteId: "a2", goals: 1, points: 1 });
  });

  it("prefers an explicit name lookup over metadata", () => {
    const rows = topScorers(entries, { a1: "T. Moyo" });
    expect(rows[0].name).toBe("T. Moyo");
  });

  it("excludes unattributed and non-scoring entries", () => {
    const rows = topScorers(entries);
    expect(rows.find((r) => r.athleteId === "a3")).toBeUndefined();
    expect(rows.some((r) => r.name === "Unknown")).toBe(false);
  });
});

describe("disciplineLeaders", () => {
  it("ranks by weighted severity (red 3 > suspension 2 > yellow 1)", () => {
    const disc: ScoreEntryLike[] = [
      { athlete_id: "p1", event_type: "warning", metadata: { player_name: "A" } },
      { athlete_id: "p2", event_type: "suspension_2min", metadata: { player_name: "B" } },
      { athlete_id: "p3", event_type: "disqualification", metadata: { player_name: "C" } },
      { athlete_id: "p2", event_type: "warning", metadata: { player_name: "B" } },
    ];
    const rows = disciplineLeaders(disc);
    expect(rows.map((r) => r.athleteId)).toEqual(["p3", "p2", "p1"]);
    expect(rows.find((r) => r.athleteId === "p2")).toMatchObject({ yellow: 1, suspensions: 1, weight: 3 });
  });
});

describe("playerSummary", () => {
  it("aggregates goals, points, appearances and discipline for one athlete", () => {
    const mine: ScoreEntryLike[] = [
      { athlete_id: "a1", fixture_id: "f1", value: 1, event_type: "goal" },
      { athlete_id: "a1", fixture_id: "f1", value: 2, event_type: "super_shot" },
      { athlete_id: "a1", fixture_id: "f2", value: 1, event_type: "goal" },
      { athlete_id: "a1", fixture_id: "f2", value: 0, event_type: "warning", metadata: { card: "yellow" } },
      { athlete_id: "a1", fixture_id: "f2", value: 0, event_type: "suspension_2min" },
    ];
    expect(playerSummary(mine)).toEqual({ goals: 3, points: 4, appearances: 2, yellow: 1, suspensions: 1, red: 0 });
  });

  it("returns zeroes for an empty set", () => {
    expect(playerSummary([])).toEqual({ goals: 0, points: 0, appearances: 0, yellow: 0, suspensions: 0, red: 0 });
  });
});

describe("teamGoals", () => {
  it("sums points by team for all scoring entries, attributed or not", () => {
    // t1: 1 + 2 + 1 = 4; t2: the unattributed goal still counts for the team.
    expect(teamGoals(entries)).toEqual({ t1: 4, t2: 1 });
  });
});
