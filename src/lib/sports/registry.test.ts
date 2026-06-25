import { describe, expect, it } from "vitest";
import { detectSport, getSport, scoreValueFor, SPORT_LIST } from "./registry";

describe("sport registry", () => {
  it("exposes exactly netball and handball", () => {
    expect(SPORT_LIST.map((s) => s.key)).toEqual(["netball", "handball"]);
  });

  it("models netball as four 15-minute quarters, 7 a side", () => {
    const nb = getSport("netball");
    expect(nb.regulationPeriods).toBe(4);
    expect(nb.onCourt).toBe(7);
    expect(nb.periods.filter((p) => p.kind === "regulation").every((p) => p.seconds === 900)).toBe(true);
    expect(nb.centrePassAlternates).toBe(true);
    expect(nb.positions.filter((p) => p.canScore).map((p) => p.code)).toEqual(["GS", "GA"]);
  });

  it("models handball as two 30-minute halves with 2-min suspensions", () => {
    const hb = getSport("handball");
    expect(hb.regulationPeriods).toBe(2);
    expect(hb.periods.filter((p) => p.kind === "regulation").every((p) => p.seconds === 1800)).toBe(true);
    expect(hb.otherEvents.find((e) => e.type === "suspension_2min")?.suspensionSeconds).toBe(120);
  });

  it("detectSport resolves discipline strings and defaults to handball", () => {
    expect(detectSport("Girls Netball U16")).toBe("netball");
    expect(detectSport("Senior Handball")).toBe("handball");
    expect(detectSport("")).toBe("handball");
    expect(detectSport(null)).toBe("handball");
  });

  it("scoreValueFor returns points for scoring events and 0 otherwise", () => {
    expect(scoreValueFor("netball", "goal")).toBe(1);
    expect(scoreValueFor("netball", "super_shot")).toBe(2);
    expect(scoreValueFor("handball", "goal_7m")).toBe(1);
    expect(scoreValueFor("handball", "save")).toBe(0);
    expect(scoreValueFor("netball", "nonsense")).toBe(0);
  });
});
