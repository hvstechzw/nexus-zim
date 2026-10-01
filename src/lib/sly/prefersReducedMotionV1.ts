import { useEffect, useState } from "react";

/**
 * UI/UX audit response (audit section 4.15): "reduced-motion treatment for
 * Sly movement and overlays" was an outright gap — nothing in the app read
 * `prefers-reduced-motion` at all. Shared so any surface that wants to
 * respect it (starting with Sly's speech bubble) reads the same live value
 * rather than each defining its own media-query listener.
 */
export function usePrefersReducedMotionV1(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
