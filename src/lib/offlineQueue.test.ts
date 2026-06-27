import { beforeEach, describe, expect, it } from "vitest";
import { clearQueue, enqueue, queueSize, queued, removeOp } from "./offlineQueue";

describe("offlineQueue", () => {
  beforeEach(() => clearQueue());

  it("enqueues ops with ids and reports size", () => {
    expect(queueSize()).toBe(0);
    const a = enqueue({ table: "score_entries", action: "insert", payload: { event_type: "goal" } });
    enqueue({ table: "fixtures", action: "update", payload: { home_score: 1 }, match: { id: "f1" } });
    expect(queueSize()).toBe(2);
    expect(a.id).toMatch(/^q_/);
  });

  it("returns ops oldest-first for replay", () => {
    const a = enqueue({ table: "score_entries", action: "insert", payload: { n: 1 } });
    const b = enqueue({ table: "score_entries", action: "insert", payload: { n: 2 } });
    const order = queued().map((o) => o.id);
    expect(order).toEqual([a.id, b.id]);
  });

  it("removes a specific op (offline undo)", () => {
    const a = enqueue({ table: "score_entries", action: "insert", payload: {} });
    const b = enqueue({ table: "score_entries", action: "insert", payload: {} });
    removeOp(a.id);
    expect(queued().map((o) => o.id)).toEqual([b.id]);
  });

  it("persists across reads (localStorage-backed)", () => {
    enqueue({ table: "score_entries", action: "insert", payload: { keep: true } });
    expect(queued()[0].payload).toEqual({ keep: true });
    expect(queueSize()).toBe(1);
  });

  it("clears the queue", () => {
    enqueue({ table: "score_entries", action: "insert", payload: {} });
    clearQueue();
    expect(queueSize()).toBe(0);
  });
});
