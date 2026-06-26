import { describe, expect, it } from "vitest";
import { athleteEligibility } from "./eligibility";

describe("athleteEligibility", () => {
  it("blocks suspended athletes", () => {
    expect(athleteEligibility({ is_suspended: true, scholastic_card_verified: true })).toMatchObject({
      eligible: false,
      status: "suspended",
    });
  });

  it("blocks inactive athletes", () => {
    expect(athleteEligibility({ is_active: false, scholastic_card_verified: true })).toMatchObject({
      eligible: false,
      status: "inactive",
    });
  });

  it("allows but flags an unverified card", () => {
    expect(athleteEligibility({ is_active: true, scholastic_card_verified: false })).toMatchObject({
      eligible: true,
      status: "unverified",
    });
  });

  it("is fully eligible when active, not suspended, and verified", () => {
    expect(athleteEligibility({ is_active: true, is_suspended: false, scholastic_card_verified: true })).toMatchObject({
      eligible: true,
      status: "eligible",
    });
  });

  it("suspension takes precedence over an unverified card", () => {
    expect(athleteEligibility({ is_suspended: true, scholastic_card_verified: false }).status).toBe("suspended");
  });
});
