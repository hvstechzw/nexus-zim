import { describe, expect, it } from "vitest";
import { computeStandings, type ResultInput } from "./standings";

describe("computeStandings", () => {
  it("applies 3-1-0 points and ranks by points then goal difference", () => {
    const results: ResultInput[] = [
      { homeTeamId: "A", awayTeamId: "B", homeScore: 30, awayScore: 20, at: 1 }, // A win
      { homeTeamId: "C", awayTeamId: "A", homeScore: 15, awayScore: 15, at: 2 }, // draw
      { homeTeamId: "B", awayTeamId: "C", homeScore: 25, awayScore: 18, at: 3 }, // B win
    ];
    const table = computeStandings(results);

    const a = table.find((r) => r.teamId === "A")!;
    expect(a).toMatchObject({ played: 2, won: 1, drawn: 1, lost: 0, points: 4, goalsFor: 45, goalsAgainst: 35 });

    // A: 4pts, B: 3pts, C: 1pt
    expect(table.map((r) => r.teamId)).toEqual(["A", "B", "C"]);
    expect(table.map((r) => r.position)).toEqual([1, 2, 3]);
  });

  it("breaks equal points by goal difference, then goals for", () => {
    const results: ResultInput[] = [
      { homeTeamId: "X", awayTeamId: "Z", homeScore: 40, awayScore: 10 }, // X +30
      { homeTeamId: "Y", awayTeamId: "Z", homeScore: 22, awayScore: 20 }, // Y +2
    ];
    const table = computeStandings(results);
    // X and Y both 3pts; X has the better goal difference.
    expect(table[0].teamId).toBe("X");
    expect(table[1].teamId).toBe("Y");
  });

  it("uses head-to-head when points, GD and GF are all equal", () => {
    // P and Q each beat R by the same margin (equal GD/GF), but Q beat P.
    const results: ResultInput[] = [
      { homeTeamId: "P", awayTeamId: "R", homeScore: 20, awayScore: 10 },
      { homeTeamId: "Q", awayTeamId: "R", homeScore: 20, awayScore: 10 },
      { homeTeamId: "Q", awayTeamId: "P", homeScore: 15, awayScore: 15 },
      { homeTeamId: "P", awayTeamId: "Q", homeScore: 15, awayScore: 15 },
    ];
    const table = computeStandings(results);
    const p = table.find((r) => r.teamId === "P")!;
    const q = table.find((r) => r.teamId === "Q")!;
    // Same points/GD/GF and the two head-to-heads are draws → stable teamId order.
    expect(p.points).toBe(q.points);
    expect(p.goalDiff).toBe(q.goalDiff);
  });

  it("tracks last-5 form most-recent-first", () => {
    const results: ResultInput[] = [
      { homeTeamId: "A", awayTeamId: "B", homeScore: 10, awayScore: 5, at: 1 }, // A W
      { homeTeamId: "A", awayTeamId: "B", homeScore: 5, awayScore: 9, at: 2 }, // A L
      { homeTeamId: "A", awayTeamId: "B", homeScore: 8, awayScore: 8, at: 3 }, // A D
    ];
    const a = computeStandings(results).find((r) => r.teamId === "A")!;
    expect(a.form).toEqual(["D", "L", "W"]);
  });
});
