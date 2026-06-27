import { describe, expect, it } from "vitest";
import { timeAgo } from "./timeAgo";

const NOW = new Date("2026-06-26T12:00:00Z").getTime();
const ago = (ms: number) => NOW - ms;

describe("timeAgo", () => {
  it("shows 'now' under 45 seconds", () => {
    expect(timeAgo(ago(10_000), NOW)).toBe("now");
  });
  it("formats minutes, hours and days", () => {
    expect(timeAgo(ago(5 * 60_000), NOW)).toBe("5m");
    expect(timeAgo(ago(3 * 3600_000), NOW)).toBe("3h");
    expect(timeAgo(ago(2 * 86400_000), NOW)).toBe("2d");
  });
  it("formats weeks, months and years", () => {
    expect(timeAgo(ago(2 * 7 * 86400_000), NOW)).toBe("2w");
    expect(timeAgo(ago(3 * 30 * 86400_000), NOW)).toBe("3mo");
    expect(timeAgo(ago(2 * 365 * 86400_000), NOW)).toBe("2y");
  });
  it("clamps future timestamps to 'now' and handles bad input", () => {
    expect(timeAgo(NOW + 10_000, NOW)).toBe("now");
    expect(timeAgo("not-a-date", NOW)).toBe("");
  });
});
