import { ChevronLeft, ChevronRight, Moon, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { SlyBodyV1 } from "@/components/sly/SlyBodyV1";
import {
  IDLE_LINES,
  PAGE_LINES,
  SLEEP_LINE,
  TAP_LINES,
  TOUR_END_LINE,
  TOUR_STEPS,
  WAKE_LINE,
  type SlyAccessory,
  type SlyExpression,
  type TourStep,
} from "@/content/sly";
import { dispatchSlyDockV1, dispatchSlyUndockV1, setSlyTourActiveV1 } from "@/lib/sly/slyTourStateV1";
import { cn } from "@/lib/utils";

/**
 * Sly in Nexus: the Vimera companion (same body, bubble and movement rules) with
 * Nexus's own voice and a tour of the real home page.
 *
 * Aetheris AI extension (§19.4): contextual and dismissible; he explains, never acts;
 * he rests clear of navigation, only travels during a tour, steps back under dialogs
 * and while the person types, and never reacts to hover. This component decides what
 * he says and when, and owns the controls that keep him dismissible.
 */

const SLEEP_KEY = "sly_sleeping_nexus";
const SEEN_PREFIX = "sly_seen_nexus:";
const TAP_COOLDOWN_MS = 12000;
/** Operational and chromeless routes where he would cover controls or interrupt work. */
const HIDDEN_ROUTES = ["/login", "/register", "/auth", "/score", "/scoring", "/broadcast/", "/admin/competitions/new"];

function say(text: string, duration = 9000, width?: number) {
  const w = width ?? Math.min(280, window.innerWidth - 16);
  window.dispatchEvent(new CustomEvent("sly-say", { detail: { text, type: "speech", duration, width: w } }));
}
function setExpression(expression: SlyExpression) {
  window.dispatchEvent(new CustomEvent("sly-set-expression", { detail: { expression } }));
}
function setAccessory(accessory: SlyAccessory) {
  window.dispatchEvent(new CustomEvent("sly-set-accessory", { detail: { accessory } }));
}
function reducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
function readFlag(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}
function writeFlag(key: string, value: boolean) {
  try {
    sessionStorage.setItem(key, value ? "1" : "0");
  } catch {
    // storage unavailable: the choice simply lasts for this page view
  }
}

/** The first on-screen element for a tour target (the rail and the bottom bar share one name; only one is visible). */
function findTarget(target: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[data-sly="${target}"]`);
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

function bubbleBox(line: string) {
  const width = Math.min(360, window.innerWidth - 16);
  const charsPerLine = Math.max(20, Math.floor((width - 22) / 7.2));
  const lines = Math.ceil(line.length / charsPerLine);
  return { width, height: lines * 21 + 20 };
}

/** Stand just above the element so the bubble fits beneath the 64px header; near the bottom if it fills the screen. */
function dockBeside(el: Element, bubbleHeight: number) {
  const rect = el.getBoundingClientRect();
  const minY = 64 + bubbleHeight + 12;
  const tall = rect.height > window.innerHeight * 0.6;
  const fixedAtBottom = rect.top > window.innerHeight * 0.7;
  const y = tall || fixedAtBottom ? window.innerHeight - 190 : Math.max(minY, rect.top - 96);
  const railOffset = window.innerWidth >= 1024 ? 240 : 0;
  return dispatchSlyDockV1({
    x: Math.max(8 + railOffset, Math.min(window.innerWidth - 76, rect.left + rect.width / 2 - 32)),
    y: Math.min(window.innerHeight - 190, y),
    motion: "spring",
  });
}

function scrollForStep(el: HTMLElement, bubbleHeight: number) {
  const rect = el.getBoundingClientRect();
  const wanted = Math.min(64 + bubbleHeight + 12 + 96, window.innerHeight * 0.58);
  const tall = rect.height > window.innerHeight * 0.6;
  const top = window.scrollY + rect.top - (tall ? 80 : wanted);
  window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion() ? "auto" : "smooth" });
}

export function NexusSlyGuide() {
  const [mounted, setMounted] = useState(false);
  const [sleeping, setSleeping] = useState(false);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [step, setStep] = useState<number | null>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const lastSpokeRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);
  const touring = step !== null;

  useEffect(() => {
    setMounted(true);
    setSleeping(readFlag(SLEEP_KEY));
  }, []);

  const hidden = HIDDEN_ROUTES.some((r) => pathname === r || pathname.startsWith(r.endsWith("/") ? r : r + "/"));

  const endTour = useCallback((announce: boolean) => {
    setSlyTourActiveV1(false);
    dispatchSlyUndockV1();
    setAccessory("none");
    setExpression("idle");
    setStep(null);
    if (announce) say(TOUR_END_LINE, 7000);
  }, []);

  const startTour = useCallback(() => {
    setSleeping(false);
    writeFlag(SLEEP_KEY, false);
    window.dispatchEvent(new CustomEvent("sly-wake"));
    if (pathname !== "/") navigate("/");
    setSlyTourActiveV1(true);
    lastSpokeRef.current = Date.now();
    // Wait for the home page, then keep only the steps whose section is actually on screen.
    let tries = 0;
    const begin = () => {
      const available = TOUR_STEPS.filter((s) => findTarget(s.target));
      if (!findTarget("hero") && tries++ < 40) return void window.setTimeout(begin, 50);
      setSteps(available);
      setStep(0);
    };
    begin();
  }, [navigate, pathname]);

  // Leaving the home page ends the tour: its targets live there.
  useEffect(() => {
    if (touring && pathname !== "/") endTour(false);
  }, [touring, pathname, endTour]);

  // Run the current step: bring the section into view, stand beside it and speak.
  useEffect(() => {
    if (step === null || !steps[step]) return;
    const s = steps[step];
    let cancelled = false;
    let raf = 0;
    let settleTimer = 0;
    const cleanups: (() => void)[] = [];

    const el = findTarget(s.target);
    if (!el) return;
    const box = bubbleBox(s.line);
    scrollForStep(el, box.height);
    setExpression(s.expression);
    setAccessory(s.accessory);

    const sync = () => {
      const current = findTarget(s.target);
      if (current) dockBeside(current, box.height);
    };
    // Follow the section while the smooth scroll settles, then stay put.
    const loop = () => {
      sync();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    settleTimer = window.setTimeout(() => cancelAnimationFrame(raf), 900);
    window.addEventListener("resize", sync);
    cleanups.push(() => window.removeEventListener("resize", sync));

    const speakTimer = window.setTimeout(() => {
      if (!cancelled) say(s.line, 26000, box.width);
    }, 350);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(settleTimer);
      window.clearTimeout(speakTimer);
      cleanups.forEach((fn) => fn());
    };
  }, [step, steps]);

  const next = useCallback(() => {
    setStep((cur) => {
      if (cur === null) return cur;
      if (cur >= steps.length - 1) {
        window.setTimeout(() => endTour(true), 0);
        return cur;
      }
      return cur + 1;
    });
  }, [endTour, steps.length]);

  const back = useCallback(() => setStep((cur) => (cur === null || cur === 0 ? cur : cur - 1)), []);

  const repeat = useCallback(() => {
    if (step === null || !steps[step]) return;
    say(steps[step].line, 26000, bubbleBox(steps[step].line).width);
  }, [step, steps]);

  // Escape ends the tour; keyboard focus lands on Next when a tour starts.
  useEffect(() => {
    if (!touring) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && endTour(true);
    window.addEventListener("keydown", onKey);
    nextButtonRef.current?.focus({ preventScroll: true });
    return () => window.removeEventListener("keydown", onKey);
  }, [touring, endTour]);

  const handleTap = useCallback(() => {
    if (touring) return next();
    const now = Date.now();
    if (now - lastSpokeRef.current < TAP_COOLDOWN_MS) {
      setExpression(Math.random() < 0.5 ? "cheeky" : "idle");
      window.dispatchEvent(new CustomEvent("sly-nod"));
      return;
    }
    lastSpokeRef.current = now;
    setExpression("smug");
    say(TAP_LINES[Math.floor(Math.random() * TAP_LINES.length)]);
  }, [touring, next]);

  const goToSleep = useCallback(() => {
    if (touring) endTour(false);
    say(SLEEP_LINE, 2500);
    window.setTimeout(() => {
      setSleeping(true);
      writeFlag(SLEEP_KEY, true);
    }, 1800);
  }, [touring, endTour]);

  const wake = useCallback(() => {
    setSleeping(false);
    writeFlag(SLEEP_KEY, false);
    window.setTimeout(() => say(WAKE_LINE, 4000), 300);
  }, []);

  // One greeting per page per session, a moment after arrival.
  useEffect(() => {
    if (!mounted || hidden || sleeping || touring) return;
    const line = PAGE_LINES[pathname];
    if (!line || readFlag(SEEN_PREFIX + pathname)) return;
    const id = window.setTimeout(() => {
      writeFlag(SEEN_PREFIX + pathname, true);
      lastSpokeRef.current = Date.now();
      setExpression("cheeky");
      say(line, 10000);
    }, 2200);
    return () => window.clearTimeout(id);
  }, [mounted, hidden, sleeping, touring, pathname]);

  // One idle remark per page view, only if the person has been still for a while.
  useEffect(() => {
    if (!mounted || hidden || sleeping || touring) return;
    lastActivityRef.current = Date.now();
    const onActivity = () => (lastActivityRef.current = Date.now());
    window.addEventListener("keydown", onActivity);
    window.addEventListener("pointerdown", onActivity);
    const id = window.setTimeout(() => {
      if (Date.now() - lastActivityRef.current < 30000) return;
      setExpression("bored");
      say(IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)], 8000);
    }, 45000);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("pointerdown", onActivity);
    };
  }, [mounted, hidden, sleeping, touring, pathname]);

  if (!mounted || hidden) return null;

  const BTN =
    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-control bg-card px-3 text-sm font-medium text-foreground shadow-md hover:bg-accent";
  const ICON_BTN = cn(BTN, "w-11 px-0");
  const total = steps.length;

  return (
    <>
      <SlyBodyV1 asleep={sleeping} onWake={wake} onTap={handleTap} />

      {/* Controls sit beside Sly's resting spot, above the navigation, never over page content or the nav. */}
      <div
        data-sly-overlay
        className="fixed left-24 right-4 z-overlay flex flex-wrap items-center gap-2 lg:left-[calc(var(--layout-rail-width)+96px)]"
        style={{ bottom: "calc(var(--layout-nav-clearance) + 8px)" }}
      >
        {sleeping ? (
          <button type="button" className={BTN} onClick={wake}>
            Wake Sly
          </button>
        ) : touring && steps[step!] ? (
          <div role="group" aria-label="Tour with Sly" className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
            <span className="tabular mr-1 text-sm text-supporting" aria-live="polite">
              {step! + 1} of {total} · {steps[step!].title}
            </span>
            <button type="button" className={ICON_BTN} onClick={back} disabled={step === 0} aria-label="Previous step">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              ref={nextButtonRef}
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
              onClick={next}
            >
              {step === total - 1 ? "Finish" : "Next"}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" className={ICON_BTN} onClick={repeat} aria-label="Say that again" title="Say that again">
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" className={ICON_BTN} onClick={() => endTour(true)} aria-label="End the tour" title="End the tour">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            <button type="button" className={BTN} onClick={startTour}>
              Tour with Sly
            </button>
            <button type="button" className={ICON_BTN} onClick={goToSleep} aria-label="Let Sly sleep" title="Let Sly sleep">
              <Moon className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </>
  );
}
