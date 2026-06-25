import { describe, expect, it } from "vitest";
import { isNexusDiscipline, matchesNexusSports, NEXUS_SPORTS } from "./nexusSports";

describe("isNexusDiscipline", () => {
  it("matches the two in-scope sports case-insensitively", () => {
    expect(isNexusDiscipline("Handball")).toBe(true);
    expect(isNexusDiscipline("NETBALL")).toBe(true);
    expect(isNexusDiscipline("girls netball u16")).toBe(true);
  });

  it("rejects out-of-scope disciplines", () => {
    expect(isNexusDiscipline("football")).toBe(false);
    expect(isNexusDiscipline("athletics")).toBe(false);
  });

  it("treats null/undefined/empty as no match", () => {
    expect(isNexusDiscipline(null)).toBe(false);
    expect(isNexusDiscipline(undefined)).toBe(false);
    expect(isNexusDiscipline("")).toBe(false);
  });

  it("only knows handball and netball", () => {
    expect([...NEXUS_SPORTS].sort()).toEqual(["handball", "netball"]);
  });
});

describe("matchesNexusSports", () => {
  it("accepts an array with at least one in-scope sport", () => {
    expect(matchesNexusSports(["football", "Netball"])).toBe(true);
  });

  it("rejects an array with no in-scope sport", () => {
    expect(matchesNexusSports(["football", "rugby"])).toBe(false);
  });

  it("splits delimited strings on commas and semicolons", () => {
    expect(matchesNexusSports("football; handball")).toBe(true);
    expect(matchesNexusSports("rugby,cricket")).toBe(false);
  });

  it("treats nullish input as no match", () => {
    expect(matchesNexusSports(null)).toBe(false);
    expect(matchesNexusSports(undefined)).toBe(false);
  });
});
