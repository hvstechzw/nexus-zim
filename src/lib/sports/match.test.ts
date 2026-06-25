import { describe, expect, it } from "vitest";
import {
  activeSuspensions,
  applyEvent,
  cardTally,
  createEvent,
  nextCentrePass,
  periodScores,
  removeEvent,
  scoreFor,
  scorers,
  undoLast,
  type MatchEvent,
} from "./match";

function goal(side: "home" | "away", period: string, extra: Partial<MatchEvent> = {}): MatchEvent {
  return createEvent("netball", { side, type: "goal", period, clock: 0, ...extra });
}

describe("createEvent", () => {
  it("derives point value and label from the sport config", () => {
    const e = createEvent("netball", { side: "home", type: "super_shot", period: "Q1", clock: 30 });
    expect(e.value).toBe(2);
    expect(e.label).toBe("Super Shot");
  });

  it("derives card and suspension metadata for handball discipline events", () => {
    const susp = createEvent("handball", { side: "away", type: "suspension_2min", period: "H1", clock: 600 });
    expect(susp.suspensionSeconds).toBe(120);
    expect(susp.value).toBe(0);
    const red = createEvent("handball", { side: "away", type: "disqualification", period: "H1", clock: 10 });
    expect(red.card).toBe("red");
  });
});

describe("scoreFor / undo", () => {
  it("sums only the scoring side and supports undo", () => {
    let events: MatchEvent[] = [];
    events = applyEvent(events, goal("home", "Q1"));
    events = applyEvent(events, goal("home", "Q1"));
    events = applyEvent(events, goal("away", "Q1"));
    expect(scoreFor(events, "home")).toBe(2);
    expect(scoreFor(events, "away")).toBe(1);

    events = undoLast(events); // removes the away goal
    expect(scoreFor(events, "away")).toBe(0);
    expect(scoreFor(events, "home")).toBe(2);
  });

  it("undoLast on empty is a no-op", () => {
    expect(undoLast([])).toEqual([]);
  });

  it("removeEvent deletes a specific entry", () => {
    const a = goal("home", "Q1");
    const b = goal("home", "Q2");
    const events = removeEvent([a, b], a.id);
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe(b.id);
  });

  it("a super shot counts 2 toward the scoreline", () => {
    const events = [goal("home", "Q4"), createEvent("netball", { side: "home", type: "super_shot", period: "Q4", clock: 5 })];
    expect(scoreFor(events, "home")).toBe(3);
  });
});

describe("periodScores", () => {
  it("breaks the score down per quarter in order", () => {
    const events = [goal("home", "Q1"), goal("away", "Q1"), goal("home", "Q2"), goal("home", "Q2")];
    const rows = periodScores("netball", events);
    const q1 = rows.find((r) => r.period === "Q1")!;
    const q2 = rows.find((r) => r.period === "Q2")!;
    expect([q1.home, q1.away]).toEqual([1, 1]);
    expect([q2.home, q2.away]).toEqual([2, 0]);
    // Untouched quarters are not reported.
    expect(rows.find((r) => r.period === "Q3")).toBeUndefined();
  });
});

describe("scorers", () => {
  it("ranks attributed goal scorers by points", () => {
    const events = [
      goal("home", "Q1", { playerId: "p1", playerName: "Tariro" }),
      goal("home", "Q1", { playerId: "p2", playerName: "Chipo" }),
      createEvent("netball", { side: "home", type: "super_shot", period: "Q2", clock: 0, playerId: "p2", playerName: "Chipo" }),
      goal("home", "Q3"), // unattributed — excluded
    ];
    const ranked = scorers(events, "home");
    expect(ranked).toHaveLength(2);
    expect(ranked[0]).toMatchObject({ playerId: "p2", points: 3, goals: 2 });
    expect(ranked[1]).toMatchObject({ playerId: "p1", points: 1, goals: 1 });
  });
});

describe("activeSuspensions (handball)", () => {
  it("reports a 2-minute suspension as active only within its window", () => {
    const susp = createEvent("handball", { side: "home", type: "suspension_2min", period: "H1", clock: 600 });
    const events = [susp];
    expect(activeSuspensions(events, "home", "H1", 650)).toHaveLength(1);
    expect(activeSuspensions(events, "home", "H1", 600)[0].remaining).toBe(120);
    expect(activeSuspensions(events, "home", "H1", 720)).toHaveLength(0); // expired at 600+120
    expect(activeSuspensions(events, "home", "H2", 650)).toHaveLength(0); // different period
  });
});

describe("cardTally", () => {
  it("counts cards and suspensions per side", () => {
    const events = [
      createEvent("handball", { side: "home", type: "warning", period: "H1", clock: 1 }),
      createEvent("handball", { side: "home", type: "suspension_2min", period: "H1", clock: 2 }),
      createEvent("handball", { side: "home", type: "disqualification", period: "H1", clock: 3 }),
    ];
    expect(cardTally(events, "home")).toEqual({ yellow: 1, red: 1, blue: 0, suspensions: 1 });
  });
});

describe("nextCentrePass (netball)", () => {
  it("starts with the toss winner and alternates after each goal", () => {
    let events: MatchEvent[] = [];
    expect(nextCentrePass("netball", events, "home")).toBe("home");
    events = applyEvent(events, goal("home", "Q1"));
    expect(nextCentrePass("netball", events, "home")).toBe("away");
    events = applyEvent(events, goal("away", "Q1"));
    expect(nextCentrePass("netball", events, "home")).toBe("home");
  });

  it("handball has no centre pass — always returns the first side", () => {
    const events = [createEvent("handball", { side: "home", type: "goal", period: "H1", clock: 0 })];
    expect(nextCentrePass("handball", events, "away")).toBe("away");
  });
});
