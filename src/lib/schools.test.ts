import { describe, expect, it } from "vitest";
import { ALL_DISCIPLINES, SCHOOL_DISCIPLINES, SCHOOL_TIERS, tierLabel } from "./schools";

describe("tierLabel", () => {
  it("maps known tier values to their labels", () => {
    expect(tierLabel("primary_school")).toBe("Primary");
    expect(tierLabel("secondary_school")).toBe("Secondary");
  });

  it("returns an em-dash for null/undefined", () => {
    expect(tierLabel(null)).toBe("—");
    expect(tierLabel(undefined)).toBe("—");
  });

  it("falls back to a humanised value for unknown tiers", () => {
    expect(tierLabel("some_custom_tier")).toBe("some custom tier");
  });
});

describe("ALL_DISCIPLINES", () => {
  it("is the flattened union of every category", () => {
    const expected = Object.values(SCHOOL_DISCIPLINES).flat();
    expect(ALL_DISCIPLINES).toEqual(expected);
    expect(ALL_DISCIPLINES.length).toBeGreaterThan(0);
  });

  it("has no duplicate disciplines within a category", () => {
    for (const list of Object.values(SCHOOL_DISCIPLINES)) {
      expect(new Set(list).size).toBe(list.length);
    }
  });
});

describe("SCHOOL_TIERS", () => {
  it("includes the catch-all 'all' option", () => {
    expect(SCHOOL_TIERS.some((t) => t.value === "all")).toBe(true);
  });
});
