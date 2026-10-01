import { useEffect, useState } from "react";

/**
 * v1 "recede" state — shared by the bottom nav and Sly himself.
 *
 * While someone is actively doing something else on screen (typing in a
 * field, working through a form) the persistent chrome should stop
 * competing for attention: it fades back, it does not disappear. Touching
 * the nav or Sly, or simply going idle for a moment, brings it straight
 * back to full strength.
 *
 * Deliberately NOT wired to scroll: scrolling the page is not an
 * interaction that should make Sly (or the nav) react at all — a repeat
 * regression this project's history has flagged more than once, so this
 * comment stays as the explicit record of why scroll is absent from the
 * listener list below.
 *
 * One module-level engine with subscribers, so every consumer fades and
 * returns in lockstep instead of each running its own timer.
 */

const IDLE_MS = 1400;

let engaged = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const subs = new Set<(v: boolean) => void>();
let wired = false;

function set(next: boolean) {
  if (next === engaged) return;
  engaged = next;
  subs.forEach((fn) => fn(engaged));
}

function isExemptTarget(target: EventTarget | null): boolean {
  const el = target instanceof Element ? target : null;
  if (!el) return false;
  return Boolean(el.closest("[data-v1-nav], [data-sly-body], [data-sly-overlay]"));
}

function markEngaged(fromTarget?: EventTarget | null) {
  if (fromTarget !== undefined && isExemptTarget(fromTarget)) {
    // Interacting with the nav or Sly is the opposite of ignoring them.
    if (timer) clearTimeout(timer);
    set(false);
    return;
  }
  set(true);
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => set(false), IDLE_MS);
}

function stillFocusedInAField(): boolean {
  const a = document.activeElement;
  if (!a) return false;
  const tag = a.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    (a as HTMLElement).isContentEditable === true
  );
}

function wire() {
  if (wired || typeof window === "undefined") return;
  wired = true;

  const onKey = (e: KeyboardEvent) => markEngaged(e.target);
  const onPointer = (e: PointerEvent) => markEngaged(e.target);
  const onFocusIn = (e: FocusEvent) => {
    if (isExemptTarget(e.target)) return set(false);
    if (stillFocusedInAField()) {
      if (timer) clearTimeout(timer);
      set(true);
    }
  };
  const onFocusOut = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (!stillFocusedInAField()) set(false);
    }, IDLE_MS);
  };

  window.addEventListener("keydown", onKey, true);
  window.addEventListener("pointerdown", onPointer, true);
  window.addEventListener("focusin", onFocusIn, true);
  window.addEventListener("focusout", onFocusOut, true);
}

// ---- modal open ---------------------------------------------------------
// Sly floats above the whole app, so he must get out of the way of any modal
// dialog or bottom sheet (system audit §4.2: "recedes during ... open bottom
// sheets, dialogs"). Detected from the DOM (aria-modal="true") so every
// present and future sheet is covered without each one opting in. Sly's own
// overlays are exempt: they are Sly.
let modalOpen = false;
let modalWired = false;
let modalCheckQueued = false;
const modalSubs = new Set<(v: boolean) => void>();

function anyForeignModalOpen(): boolean {
  const el = document.querySelector('[aria-modal="true"]');
  return el !== null && !el.closest("[data-sly-overlay], [data-sly-body]");
}

function recheckModal() {
  modalCheckQueued = false;
  const next = anyForeignModalOpen();
  if (next === modalOpen) return;
  modalOpen = next;
  modalSubs.forEach((fn) => fn(modalOpen));
}

function wireModal() {
  if (modalWired || typeof document === "undefined") return;
  modalWired = true;
  const observer = new MutationObserver(() => {
    if (modalCheckQueued) return;
    modalCheckQueued = true;
    requestAnimationFrame(recheckModal);
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-modal"],
  });
  recheckModal();
}

/** True while a dialog or bottom sheet (other than Sly's own) is open. */
export function useV1ModalOpenV1(): boolean {
  const [value, setValue] = useState(false);
  useEffect(() => {
    wireModal();
    setValue(modalOpen);
    const fn = (v: boolean) => setValue(v);
    modalSubs.add(fn);
    return () => {
      modalSubs.delete(fn);
    };
  }, []);
  return value;
}

/** True while the person is busy with something other than the nav/Sly. */
export function useV1RecededV1(): boolean {
  const [value, setValue] = useState(false);
  useEffect(() => {
    wire();
    setValue(engaged);
    const fn = (v: boolean) => setValue(v);
    subs.add(fn);
    return () => {
      subs.delete(fn);
    };
  }, []);
  return value;
}

/** Opacity helper so nav and Sly recede by exactly the same amount. */
export function recedeStyleV1(
  receded: boolean,
  floor = 0.35,
): {
  opacity: number;
  transition: string;
} {
  return { opacity: receded ? floor : 1, transition: "opacity 0.35s ease" };
}
