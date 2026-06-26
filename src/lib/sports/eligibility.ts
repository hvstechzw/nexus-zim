// Athlete eligibility for live scoring attribution. A suspended or inactive
// athlete must not be credited with a goal; an athlete whose Scholastic card is
// not yet verified can still play but is flagged so officials can follow up.

export interface AthleteEligibilityInput {
  is_active?: boolean | null;
  is_suspended?: boolean | null;
  scholastic_card_verified?: boolean | null;
}

export type EligibilityStatus = "eligible" | "suspended" | "inactive" | "unverified";

export interface Eligibility {
  /** May this athlete be selected/credited? */
  eligible: boolean;
  status: EligibilityStatus;
  label: string;
}

export function athleteEligibility(a: AthleteEligibilityInput): Eligibility {
  if (a.is_suspended) return { eligible: false, status: "suspended", label: "Suspended" };
  if (a.is_active === false) return { eligible: false, status: "inactive", label: "Inactive" };
  // Unverified card: allowed to play, but surfaced as a soft warning.
  if (!a.scholastic_card_verified) return { eligible: true, status: "unverified", label: "Card unverified" };
  return { eligible: true, status: "eligible", label: "Eligible" };
}
