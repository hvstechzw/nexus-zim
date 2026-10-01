/**
 * The single movement authority for Sly.
 *
 * This module deliberately has no React or data-client imports. Every code
 * path that can request movement and the final body listener both consult it,
 * so an accidental direct `sly-dock-to` dispatch cannot move Sly outside a
 * running Welcome tour.
 */
let tourActive = false;

export function setSlyTourActiveV1(active: boolean): void {
  tourActive = active;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sly-tour-state", { detail: { active } }));
  }
}

export function slyTourActiveV1(): boolean {
  return tourActive;
}

export function dispatchSlyDockV1(detail: {
  x: number;
  y: number;
  motion?: "spring" | "linear";
}): boolean {
  if (!tourActive || typeof window === "undefined") return false;
  window.dispatchEvent(new CustomEvent("sly-dock-to", { detail }));
  return true;
}

export function dispatchSlyUndockV1(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("sly-undock"));
}