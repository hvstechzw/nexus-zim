import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { SlyBubbleV1 } from "@/components/sly/SlyBubbleV1";
import { useV1RecededV1, useV1ModalOpenV1, recedeStyleV1 } from "@/lib/sly/v1RecedeV1";
import { slyTourActiveV1 } from "@/lib/sly/slyTourStateV1";

/**
 * SlyBodyV1 — the floating companion itself, ported from Scholastic
 * Services' CompanionBody3D: same blob head, floating hands, expression set,
 * spring-physics idle drift, drag-to-reposition, dock/undock glide, blink
 * loop, and drag pickup/release reactions. Recolored from white/charcoal-gray
 * to Vimera's ivory/gray tokens. Renamed "sc-*" events to this project's own
 * "sly-*" bus — sly-dock-to/sly-undock/sly-say already existed and are
 * unchanged; the rest (sly-set-expression, sly-set-accessory, sly-wake,
 * sly-celebrate, sly-shake-head, sly-nod, sly-dance, sly-crack-whip) are new
 * names for the same ported mechanism. The reference's onDoubleClick→open
 * chat is replaced with a plain-tap→onTap callback, since Sly has no chat
 * interface to open. LiveCompanionIcon (a chat-header mirror of this state)
 * isn't ported — there's no chat surface for it to sit in.
 */

export type ExprName =
  | "idle"
  | "thinking"
  | "happy"
  | "confused"
  | "shy"
  | "surprised"
  | "peeking"
  | "sneaking"
  | "sleeping"
  | "working"
  | "laughing"
  | "reading"
  | "struggling"
  | "excited"
  | "smug"
  | "dragging"
  | "pointing"
  | "winking"
  | "horrified"
  | "proud"
  | "bored"
  | "suspicious"
  | "starstruck"
  | "crying"
  | "angry"
  | "love"
  | "cool"
  | "nerd"
  | "dizzy"
  | "cheeky"
  | "determined"
  | "victorious";

interface ExprData {
  pupilX: number;
  pupilY: number;
  eyeScaleY: number;
  mouthD: string;
  cheeks?: boolean;
  sweat?: boolean;
  hearts?: boolean;
  zzz?: boolean;
  /** A subtle warm glow around him for high-energy expressions. Replaces
   * the old ✦ star-burst — no sparkle iconography anywhere in v1. */
  glow?: boolean;
  tears?: boolean;
  angryBrows?: boolean;
}

const EXPRS: Record<ExprName, ExprData> = {
  idle: { pupilX: 0, pupilY: 0, eyeScaleY: 1, mouthD: "" },
  thinking: { pupilX: -3, pupilY: -2, eyeScaleY: 0.85, mouthD: "" },
  happy: { pupilX: 0, pupilY: 4, eyeScaleY: 0.5, mouthD: "" },
  confused: { pupilX: 4, pupilY: 0, eyeScaleY: 0.88, mouthD: "" },
  shy: { pupilX: -2, pupilY: 5, eyeScaleY: 0.4, mouthD: "", cheeks: true },
  surprised: { pupilX: 0, pupilY: 0, eyeScaleY: 1.45, mouthD: "" },
  peeking: { pupilX: 0, pupilY: -4, eyeScaleY: 1, mouthD: "" },
  sneaking: { pupilX: 6, pupilY: 2, eyeScaleY: 0.28, mouthD: "" },
  sleeping: { pupilX: 0, pupilY: 0, eyeScaleY: 0, mouthD: "", zzz: true },
  working: { pupilX: -1, pupilY: -1, eyeScaleY: 0.9, mouthD: "" },
  laughing: { pupilX: 0, pupilY: 3, eyeScaleY: 0.35, mouthD: "" },
  reading: { pupilX: -2, pupilY: 1, eyeScaleY: 0.75, mouthD: "" },
  struggling: { pupilX: 3, pupilY: -3, eyeScaleY: 1.1, mouthD: "" },
  excited: { pupilX: 0, pupilY: 0, eyeScaleY: 1.5, mouthD: "", glow: true },
  smug: { pupilX: 2, pupilY: 1, eyeScaleY: 0.6, mouthD: "" },
  dragging: { pupilX: 0, pupilY: 2, eyeScaleY: 0.55, mouthD: "" },
  pointing: { pupilX: 4, pupilY: -1, eyeScaleY: 1, mouthD: "" },
  winking: { pupilX: 1, pupilY: 2, eyeScaleY: 0.5, mouthD: "" },
  horrified: { pupilX: 0, pupilY: 0, eyeScaleY: 1.6, mouthD: "" },
  proud: { pupilX: 0, pupilY: -1, eyeScaleY: 0.7, mouthD: "" },
  bored: { pupilX: 0, pupilY: 1, eyeScaleY: 0.4, mouthD: "" },
  suspicious: { pupilX: 3, pupilY: 0, eyeScaleY: 0.5, mouthD: "" },
  starstruck: { pupilX: 0, pupilY: 0, eyeScaleY: 1.4, mouthD: "", glow: true },
  crying: { pupilX: 0, pupilY: 2, eyeScaleY: 0.4, mouthD: "", tears: true },
  angry: { pupilX: 0, pupilY: 2, eyeScaleY: 0.7, mouthD: "", angryBrows: true },
  love: { pupilX: 0, pupilY: 0, eyeScaleY: 0, mouthD: "", hearts: true },
  cool: { pupilX: 0, pupilY: 1, eyeScaleY: 0.6, mouthD: "" },
  nerd: { pupilX: -1, pupilY: -1, eyeScaleY: 0.85, mouthD: "" },
  dizzy: { pupilX: 0, pupilY: 0, eyeScaleY: 1, mouthD: "" },
  cheeky: { pupilX: 2, pupilY: 1, eyeScaleY: 0.65, mouthD: "" },
  determined: { pupilX: 0, pupilY: -1, eyeScaleY: 0.8, mouthD: "", angryBrows: true },
  victorious: { pupilX: 0, pupilY: 0, eyeScaleY: 1.2, mouthD: "", glow: true },
};

// Mouth paths in 80×80 face coordinate space
const MOUTH80: Record<ExprName, string | null> = {
  idle: "M 33 67 Q 40 70 47 67",
  thinking: "M 31 67 Q 37 63 43 67 Q 48 71 53 67",
  happy: "M 26 65 Q 40 75 54 65",
  confused: "M 29 67 Q 35 62 41 67 Q 47 72 53 67",
  shy: "M 35 67 L 45 67",
  surprised: "M 36 65 Q 40 76 44 65",
  peeking: "M 33 67 Q 40 70 47 67",
  sneaking: "M 33 67 Q 40 65 47 67",
  sleeping: null,
  working: "M 29 66 Q 34 71 40 64 Q 46 71 51 66",
  laughing: "M 26 63 Q 40 79 54 63",
  reading: "M 33 67 L 47 67",
  struggling: "M 29 66 Q 34 71 40 64 Q 46 71 51 66",
  excited: "M 26 65 Q 40 76 54 65",
  smug: "M 33 68 Q 39 63 50 66",
  dragging: "M 30 68 Q 40 61 50 68",
  pointing: "M 33 67 Q 40 70 47 67",
  winking: "M 26 65 Q 40 74 54 65",
  horrified: "M 36 64 Q 40 76 44 64",
  proud: "M 26 65 Q 40 74 54 65",
  bored: "M 29 67 Q 40 65 51 67",
  suspicious: "M 30 68 Q 38 64 46 68",
  starstruck: "M 26 65 Q 40 76 54 65",
  crying: "M 30 70 Q 40 63 50 70",
  angry: "M 30 70 Q 40 63 50 70",
  love: "M 26 65 Q 40 75 54 65",
  cool: "M 33 67 Q 40 71 47 67",
  nerd: "M 30 65 Q 40 72 50 65",
  dizzy: "M 33 68 Q 40 66 47 68",
  cheeky: "M 30 65 Q 40 74 50 65",
  determined: "M 30 67 Q 40 70 50 67",
  victorious: "M 26 65 Q 40 77 54 65",
};

const HEAD_PATH =
  "M 40 5 C 60 3 77 14 78 33 C 79 51 73 68 61 74 C 51 80 28 80 18 74 C 6 67 1 50 2 32 C 3 14 20 7 40 5 Z";

export type AccessoryName =
  | "none"
  | "sunglasses"
  | "graduation_cap"
  | "party_hat"
  | "book"
  | "chalk"
  | "whip";

const DRAG_PICKUP_LINES = [
  "Hey!! PUT ME DOWN!! 😤",
  "EXCUSE ME?! I am NOT a toy!! 😡",
  "oh no oh no oh nO— 🫣",
  "I WAS COMFORTABLE THERE!!",
  "UNHAND ME!! ...please. 😤",
  "This is ASSAULT. I'm noting it. 😤",
  "I DID NOT CONSENT TO THIS JOURNEY!! 😱",
  "STOP STOP I'm still thinking— 🌀",
  "Somebody HELP— wait no this is fine. WAIT NO IT'S NOT— 😵",
  "Oh so we're doing THIS now. Cool. Great. Fine. 😒",
  "I have RIGHTS!! Probably!! 😤",
];

const DRAG_RELEASE_LINES = [
  "...I'm okay. I'm FINE. That was fine. 😤",
  "You put me down! How DARE you also put me down! 😤",
  "New spot. I've already memorised it. Do NOT move me again.",
  "I've been relocated. I am RECORDING this.",
  "Thank you. I think. 🙄",
  "...okay. I can work with this position. I GUESS.",
  "Freedom! Sort of! It's FINE! 🙌",
  "I have been THROUGH something. I need a moment.",
  "I survived. No thanks to you. 😒",
  "*adjusts dignity* I meant to do that.",
  "The view from here is fine. FINE. 🙄",
];

// A fixed bottom nav bar (64px) lives at the bottom of every v1 screen Sly
// appears on — the reference app had none, so its own resting/clamp offsets
// (110/80) are bumped here to keep him clear of it.
const NAV_CLEARANCE = 150;
const DRAG_FLOOR = 144;
const RESTING_MARGIN = 18;
const BODY_WIDTH = 64;

// Default resting spot is bottom-left (system audit §4.2), clear of the
// bottom nav — never computed at module load
// since window isn't available yet in SSR, always read at call time. These
// are also called during the very first render (see initialPosRef below),
// which for a server-rendered route runs before window exists at all, so
// each one falls back to a fixed placeholder in that case; the real
// viewport-based position is applied client-side once mounted.
function restingXV1(): number {
  if (typeof window === "undefined") return 0;
  // On wide screens the 240px navigation rail owns the left edge; rest beside it, not on it.
  return window.innerWidth >= 1024 ? 240 + RESTING_MARGIN : RESTING_MARGIN;
}
function restingPosV1(): { x: number; y: number } {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  return { x: restingXV1(), y: window.innerHeight - NAV_CLEARANCE };
}

function clampPosV1(p: { x: number; y: number }): { x: number; y: number } {
  if (typeof window === "undefined") return p;
  return {
    x: Math.max(8, Math.min(window.innerWidth - 74, p.x)),
    y: Math.max(8, Math.min(window.innerHeight - DRAG_FLOOR, p.y)),
  };
}

const POSITION_KEY = "sly_position_v1";

/** Where a user actually left him last time, remembered across sessions —
 * clamped to the current viewport in case the window/orientation changed
 * since the save, so a saved position can never leave him off-screen. Falls
 * back to the default bottom-left resting spot when nothing was ever
 * saved, or the saved value is corrupt. */
function loadPositionV1(): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    if (raw) {
      const p = JSON.parse(raw) as { x?: unknown; y?: unknown };
      if (typeof p.x === "number" && typeof p.y === "number") return clampPosV1({ x: p.x, y: p.y });
    }
  } catch {
    // localStorage unavailable or corrupt entry — fall through to default
  }
  return restingPosV1();
}

function savePositionV1(p: { x: number; y: number }): void {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify(p));
  } catch {
    // localStorage unavailable — position simply won't persist this session
  }
}

interface SlyBodyV1Props {
  asleep: boolean;
  onWake: () => void;
  onTap: () => void;
  onPositionChange?: (pos: { x: number; y: number }) => void;
}

export function SlyBodyV1({ asleep, onWake, onTap, onPositionChange }: SlyBodyV1Props) {
  const initialPosRef = useRef<{ x: number; y: number } | null>(null);
  if (!initialPosRef.current) initialPosRef.current = loadPositionV1();
  const [pos, setPos] = useState(initialPosRef.current);
  const [targetPos, setTargetPos] = useState(initialPosRef.current);

  // loadPositionV1() above runs during the very first render, which for a
  // server-rendered route happens before window exists — it then falls back
  // to a fixed placeholder (see restingPosV1's own SSR guard). Once actually
  // mounted in the browser, snap straight to the real viewport-based
  // position before paint, so nobody sees Sly sitting in the wrong corner.
  useLayoutEffect(() => {
    const real = loadPositionV1();
    setPos(real);
    setTargetPos(real);
  }, []);
  const [vel, setVel] = useState({ x: 0, y: 0 });
  // Keep him on screen through resize and rotation (system audit §4.2). Only
  // the on-screen position is clamped, never the saved one: an on-screen
  // keyboard shrinking the viewport must not overwrite where the person put
  // him, so the saved spot is restored on the next load.
  useEffect(() => {
    const keepOnScreen = () => {
      const current = posRef.current;
      const clamped = clampPosV1(current);
      if (clamped.x === current.x && clamped.y === current.y) return;
      setPos(clamped);
      setTargetPos(clamped);
    };
    window.addEventListener("resize", keepOnScreen);
    window.addEventListener("orientationchange", keepOnScreen);
    return () => {
      window.removeEventListener("resize", keepOnScreen);
      window.removeEventListener("orientationchange", keepOnScreen);
    };
  }, []);
  const [expression, setExpression] = useState<ExprName>("idle");
  const [accessory, setAccessory] = useState<AccessoryName>("none");
  const [tiltY, setTiltY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [blinking, setBlinking] = useState(false);

  const rafRef = useRef<number | null>(null);
  const posRef = useRef(pos);
  const velRef = useRef(vel);
  const targetRef = useRef(targetPos);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragPosRef = useRef({ x: 0, y: 0 });
  const dragStartClientRef = useRef({ x: 0, y: 0 });
  const dragMovedRef = useRef(0);
  const prevExprRef = useRef<ExprName>("idle");
  const dockedRef = useRef(false);
  const glideRef = useRef(false);
  const glideSpeedRef = useRef(0.08);
  // Explainer docking wants a walk, not a spring: constant speed with a
  // short ease-out at the end, so Sly arrives beside the thing he's about
  // to talk about instead of overshooting and wobbling into it.
  const linearRef = useRef(false);
  const homeRef = useRef<{ x: number; y: number } | null>(null);
  // Bumped the moment a real drag begins, so any reactive animation already
  // in flight (a celebration wiggle, a nod-revert, a whip-revert timeout)
  // recognizes itself as stale and stops touching expression/tilt — without
  // this, picking Sly up mid-animation left that animation's own delayed
  // callbacks free to keep firing after the drag ended, fighting with the
  // drag's own settle-to-idle and reading as a glitch at the drop position.
  const animEpochRef = useRef(0);

  posRef.current = pos;
  velRef.current = vel;
  targetRef.current = targetPos;

  useEffect(() => {
    onPositionChange?.(pos);
  }, [pos, onPositionChange]);

  // ── Auto-blink ────────────────────────────────────────────────────────────
  const sleepingRef = useRef(false);
  sleepingRef.current = asleep || expression === "sleeping";
  useEffect(() => {
    let stopped = false;
    let tid: number | undefined;
    let offId: number | undefined;
    const schedule = () => {
      if (stopped) return;
      tid = window.setTimeout(
        () => {
          if (stopped) return;
          if (!sleepingRef.current) {
            setBlinking(true);
            offId = window.setTimeout(() => setBlinking(false), 130);
          }
          schedule();
        },
        4000 + Math.random() * 7000,
      );
    };
    schedule();
    return () => {
      stopped = true;
      if (tid) window.clearTimeout(tid);
      if (offId) window.clearTimeout(offId);
      setBlinking(false);
    };
  }, []);

  // ── Movement loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = () => {
      if (!isDragging && !asleep) {
        const tx = targetRef.current.x,
          ty = targetRef.current.y;
        const cx = posRef.current.x,
          cy = posRef.current.y;
        const dx = tx - cx,
          dy = ty - cy;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          if (glideRef.current && linearRef.current) {
            const dist = Math.hypot(dx, dy) || 1;
            const speed = dist > 60 ? 18 : Math.max(3, (dist / 60) * 18);
            const step = Math.min(dist, speed);
            setPos({ x: cx + (dx / dist) * step, y: cy + (dy / dist) * step });
            setVel({ x: 0, y: 0 });
            setTiltY((prev) => prev * 0.85);
          } else if (glideRef.current) {
            const k = glideSpeedRef.current;
            setPos({ x: cx + dx * k, y: cy + dy * k });
            setVel({ x: 0, y: 0 });
            setTiltY((prev) => prev * 0.9);
          } else {
            const newVx = velRef.current.x * 0.8 + dx * 0.14;
            const newVy = velRef.current.y * 0.8 + dy * 0.14;
            setPos({ x: cx + newVx, y: cy + newVy });
            setVel({ x: newVx, y: newVy });
            setTiltY(Math.max(-12, Math.min(12, newVx * 1.8)));
          }
        } else {
          setVel({ x: 0, y: 0 });
          setTiltY((prev) => prev * 0.85);
          if (glideRef.current) glideRef.current = false;
          linearRef.current = false;
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isDragging, asleep]);

  // ── Global event listeners ────────────────────────────────────────────────
  const expressionRef = useRef<ExprName>(expression);
  expressionRef.current = expression;
  const wiggleBusyRef = useRef(false);

  useEffect(() => {
    const runWiggle = (amplitude: number, steps: number, stepMs: number) => {
      if (wiggleBusyRef.current) return;
      wiggleBusyRef.current = true;
      const epoch = animEpochRef.current;
      let i = 0;
      const tick = () => {
        // A drag started since this wiggle began — stop touching tilt/expr
        // entirely rather than fighting the drag or lingering after release.
        if (animEpochRef.current !== epoch) return;
        if (i >= steps) {
          setTiltY(0);
          wiggleBusyRef.current = false;
          return;
        }
        setTiltY(i % 2 === 0 ? amplitude : -amplitude);
        i++;
        setTimeout(tick, stepMs);
      };
      tick();
    };

    const handlers: Array<[string, (e: Event) => void]> = [
      [
        "sly-set-expression",
        (e) => {
          const expr = (e as CustomEvent).detail?.expression as ExprName;
          if (EXPRS[expr]) {
            prevExprRef.current = expressionRef.current;
            setExpression(expr);
          }
        },
      ],
      ["sly-set-accessory", (e) => setAccessory((e as CustomEvent).detail?.accessory || "none")],
      [
        "sly-dock-to",
        (e) => {
          // Final authority: even a caller bypassing every helper cannot move
          // Sly unless the Welcome tour itself is active.
          if (!slyTourActiveV1()) return;
          const d = (e as CustomEvent).detail as
            | { x: number; y: number; motion?: "spring" | "linear" }
            | undefined;
          if (!d) return;
          if (!dockedRef.current) {
            dockedRef.current = true;
            homeRef.current = { ...targetRef.current };
            setExpression("bored");
          }
          glideRef.current = true;
          linearRef.current = d.motion === "linear";
          glideSpeedRef.current = 0.08;
          setVel({ x: 0, y: 0 });
          setTargetPos({
            x: Math.max(8, Math.min(window.innerWidth - 74, d.x)),
            y: Math.max(8, Math.min(window.innerHeight - DRAG_FLOOR, d.y)),
          });
        },
      ],
      [
        "sly-undock",
        () => {
          if (!dockedRef.current) return;
          dockedRef.current = false;
          const home = homeRef.current ?? loadPositionV1();
          glideRef.current = true;
          linearRef.current = false;
          glideSpeedRef.current = 0.05;
          setVel({ x: 0, y: 0 });
          setTargetPos(home);
          setExpression("idle");
        },
      ],
      [
        "sly-wake",
        () => {
          setExpression("surprised");
          const epoch = animEpochRef.current;
          setTimeout(() => {
            if (animEpochRef.current === epoch) setExpression("excited");
          }, 800);
        },
      ],
      [
        "sly-celebrate",
        () => {
          if (wiggleBusyRef.current) return;
          setExpression("victorious");
          runWiggle(12, 6, 140);
          window.dispatchEvent(
            new CustomEvent("sly-say", { detail: { text: "Done!", type: "shout" } }),
          );
          const epoch = animEpochRef.current;
          setTimeout(() => {
            if (animEpochRef.current === epoch) setExpression("idle");
          }, 3000);
        },
      ],
      ["sly-shake-head", () => runWiggle(18, 6, 120)],
      [
        "sly-nod",
        () => {
          setExpression("happy");
          const epoch = animEpochRef.current;
          setTimeout(() => {
            if (animEpochRef.current === epoch) setExpression(prevExprRef.current);
          }, 700);
        },
      ],
      [
        "sly-crack-whip",
        () => {
          setAccessory("whip");
          setExpression("smug");
          const epoch = animEpochRef.current;
          setTimeout(() => {
            if (animEpochRef.current !== epoch) return;
            setAccessory("none");
            setExpression(prevExprRef.current);
          }, 1200);
        },
      ],
      ["sly-dance", () => runWiggle(15, 8, 200)],
    ];
    handlers.forEach(([ev, h]) => window.addEventListener(ev, h));
    return () => handlers.forEach(([ev, h]) => window.removeEventListener(ev, h));
  }, []);

  // ── Dragging ──────────────────────────────────────────────────────────────
  // A graze during a scroll is not a tap. Sly only counts a press as
  // deliberate when the finger barely moved, it lasted long enough to be
  // intentional, and the page wasn't being scrolled around that moment.
  const pressStartRef = useRef(0);
  const lastScrollRef = useRef(0);
  const suppressClickRef = useRef(false);
  useEffect(() => {
    const onScroll = () => {
      lastScrollRef.current = Date.now();
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("wheel", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("wheel", onScroll);
      window.removeEventListener("touchmove", onScroll);
    };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (asleep) {
        onWake();
        window.dispatchEvent(new CustomEvent("sly-wake"));
        return;
      }
      // Drag-to-reposition is a normal, always-available interaction — only
      // the *programmatic* docking/movement (sly-dock-to, useSlyDockV1) is
      // tour-gated, via slyTourStateV1's own single movement authority.
      // Pointer tracking here only classifies the later real click vs. drag.
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      dragMovedRef.current = 0;
      dragStartClientRef.current = { x: e.clientX, y: e.clientY };
      pressStartRef.current = Date.now();
      suppressClickRef.current = false;
      prevExprRef.current = expression;
      setExpression("dragging");
      dragOffsetRef.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y };
      dragPosRef.current = posRef.current;
    },
    [expression, asleep, onWake],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const nx = Math.max(8, Math.min(window.innerWidth - 74, e.clientX - dragOffsetRef.current.x));
      const ny = Math.max(
        8,
        Math.min(window.innerHeight - DRAG_FLOOR, e.clientY - dragOffsetRef.current.y),
      );
      const flingVx = nx - dragPosRef.current.x;
      const flingVy = ny - dragPosRef.current.y;
      // Tap vs. drag is decided by how far the finger actually is from where
      // it first touched down — the peak of that distance, tracked across
      // the whole gesture. Summing every frame's movement instead (as this
      // used to) means a finger that's merely trembling in place while held
      // — completely normal for a touchscreen, and this app deliberately
      // allows a press to last up to a second — accumulates a "distance
      // travelled" that grows without bound and eventually crosses the
      // threshold on its own, misreading an ordinary tap as a drag.
      const distFromStart = Math.hypot(
        e.clientX - dragStartClientRef.current.x,
        e.clientY - dragStartClientRef.current.y,
      );
      dragMovedRef.current = Math.max(dragMovedRef.current, distFromStart);
      if (dragMovedRef.current > 6 && prevExprRef.current !== "dragging") {
        // First real movement past the click threshold — this is genuinely a
        // pickup now, not a tap. Invalidate any reactive animation already in
        // flight (a wiggle, a nod/whip revert) so it can't keep firing after
        // the drag ends and fighting the settle-to-idle below.
        animEpochRef.current++;
        wiggleBusyRef.current = false;
        setTiltY(0);
        const line = DRAG_PICKUP_LINES[Math.floor(Math.random() * DRAG_PICKUP_LINES.length)];
        window.dispatchEvent(
          new CustomEvent("sly-say", { detail: { text: line, type: "shout", duration: 2200 } }),
        );
        prevExprRef.current = "dragging";
      }
      dragPosRef.current = { x: nx, y: ny };
      setPos({ x: nx, y: ny });
      setTargetPos({ x: nx, y: ny });
      setVel({ x: flingVx * 0.6, y: flingVy * 0.6 });
    },
    [isDragging],
  );

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
    const wasRealDrag = dragMovedRef.current > 6;
    // Always settle cleanly at the drop position — regardless of whatever
    // expression was active when he was picked up, a real drag always ends
    // idle, never mid-reaction. (The animEpoch bump at pickup already
    // silenced any reactive animation's own delayed callbacks; this is the
    // drag's own explicit settle.)
    setExpression(wasRealDrag ? "idle" : prevExprRef.current);
    if (wasRealDrag) {
      suppressClickRef.current = true;
      savePositionV1(dragPosRef.current);
      const line = DRAG_RELEASE_LINES[Math.floor(Math.random() * DRAG_RELEASE_LINES.length)];
      setTimeout(
        () =>
          window.dispatchEvent(
            new CustomEvent("sly-say", {
              detail: { text: line, type: "speech", duration: 2800 },
            }),
          ),
        300,
      );
    }
  }, []);

  const onPointerCancel = useCallback(() => {
    setIsDragging(false);
    suppressClickRef.current = true;
    const wasRealDrag = dragMovedRef.current > 6;
    dragMovedRef.current = Number.POSITIVE_INFINITY;
    setExpression("idle");
    if (wasRealDrag) savePositionV1(dragPosRef.current);
  }, []);

  const onClick = useCallback(() => {
    // Activation is bound to a genuine click. Pointer movement and scrolling
    // are cancellation signals only; hover/enter/over never enter this path.
    const heldFor = Date.now() - pressStartRef.current;
    const scrolledRecently = Date.now() - lastScrollRef.current < 500;
    const deliberate =
      !suppressClickRef.current &&
      dragMovedRef.current <= 3 &&
      heldFor >= 40 &&
      heldFor <= 1000 &&
      !scrolledRecently;
    suppressClickRef.current = false;
    if (deliberate) onTap();
  }, [onTap]);

  const displayExpression: ExprName = asleep ? "sleeping" : expression;
  // Sly recedes (never vanishes) while the person is typing, mid-form or
  // actively scrolling — same fade, same timing as the bottom nav.
  const receded = useV1RecededV1();
  // Above every dialog and sheet in z-order, so while one is open he steps
  // back completely: fades, shrinks and stops taking taps.
  const modalOpen = useV1ModalOpenV1();

  return (
    <>
      {!asleep && <SlyBubbleV1 scPosition={pos} scSize={{ w: 64, h: 64 }} />}

      <div
        data-sly-body
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClick={onClick}
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          width: 64,
          zIndex: 99995,
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          touchAction: "none",
          ...(isDragging ? {} : recedeStyleV1(receded, 0.4)),
          ...(modalOpen
            ? {
                opacity: 0.12,
                transform: "scale(0.85)",
                pointerEvents: "none" as const,
                transition: "opacity 0.2s ease, transform 0.2s ease",
              }
            : {}),
        }}
      >
        {/* Accessory above head */}
        <AnimatePresence>
          {accessory !== "none" && accessory !== "sunglasses" && !asleep && (
            <motion.div
              initial={{ scale: 0, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              style={{
                position: "absolute",
                top: -26,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 2,
                pointerEvents: "none",
              }}
            >
              <SlyAccessorySVG type={accessory} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Blobby round face */}
        <motion.div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--v1-ivory-50)",
            border: "2px solid var(--v1-gray-300)",
            boxShadow: asleep
              ? "0 2px 10px rgba(0,0,0,0.08)"
              : "0 4px 18px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.06)",
            position: "relative",
            overflow: "visible",
            opacity: asleep ? 0.6 : 1,
          }}
          animate={{
            scale: isDragging ? 1.1 : 1,
            rotate: tiltY * 0.35,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          <SlyFaceV1 expression={displayExpression} blinking={blinking} accessory={accessory} />
          {!asleep && (
            <SlyHandsV1 expression={expression} accessory={accessory} isDragging={isDragging} />
          )}
        </motion.div>
      </div>
    </>
  );
}

// ── Blobby SVG face ───────────────────────────────────────────────────────────
function SlyFaceV1({
  expression,
  blinking,
  accessory,
}: {
  expression: ExprName;
  blinking: boolean;
  accessory: AccessoryName;
}) {
  const expr = EXPRS[expression] || EXPRS.idle;
  const isSleeping = expression === "sleeping";

  const lPX = useMotionValue(0);
  const lPY = useMotionValue(0);
  const rPX = useMotionValue(0);
  const rPY = useMotionValue(0);
  const lPXs = useSpring(lPX, { stiffness: 200, damping: 20 });
  const lPYs = useSpring(lPY, { stiffness: 200, damping: 20 });
  const rPXs = useSpring(rPX, { stiffness: 200, damping: 20 });
  const rPYs = useSpring(rPY, { stiffness: 200, damping: 20 });

  useEffect(() => {
    lPX.set(expr.pupilX * 0.75);
    lPY.set(expr.pupilY * 2);
    rPX.set(-expr.pupilX * 0.75);
    rPY.set(expr.pupilY * 2);
  }, [expr, lPX, lPY, rPX, rPY]);

  const leftScaleY = blinking ? 0.04 : expr.eyeScaleY;
  const rightScaleY = blinking ? 0.04 : expression === "winking" ? 0.04 : expr.eyeScaleY;
  const mouthD = MOUTH80[expression] ?? MOUTH80.idle ?? null;
  const isLaughing = expression === "laughing";
  const isSurprised = expression === "surprised" || expression === "horrified";

  return (
    <svg
      viewBox="0 0 80 80"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
      aria-hidden
    >
      {/* Blob head */}
      <path d={HEAD_PATH} fill="var(--v1-ivory-50)" stroke="var(--v1-gray-300)" strokeWidth="2" />

      {/* Cheek blush */}
      {expr.cheeks && (
        <>
          <ellipse cx="13" cy="60" rx="9" ry="5.5" fill="#fca5a5" opacity="0.38" />
          <ellipse cx="67" cy="60" rx="9" ry="5.5" fill="#fca5a5" opacity="0.38" />
        </>
      )}

      {/* Angry brows */}
      {expr.angryBrows && (
        <>
          <line
            x1="13"
            y1="26"
            x2="26"
            y2="30"
            stroke="var(--v1-gray-700)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="42"
            y1="30"
            x2="55"
            y2="26"
            stroke="var(--v1-gray-700)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      )}

      {/* Left eye */}
      <ellipse
        cx="25"
        cy="42"
        rx="14"
        ry={22 * leftScaleY}
        fill="var(--v1-ivory-50)"
        stroke="var(--v1-gray-300)"
        strokeWidth="1.6"
      />
      {!isSleeping && !blinking && (
        <>
          <motion.circle
            cx={25}
            cy={42}
            r="9"
            fill="var(--v1-gray-900)"
            style={{ x: lPXs, y: lPYs }}
          />
          <motion.circle
            cx={25}
            cy={42}
            r="3"
            fill="var(--v1-ivory-50)"
            opacity="0.85"
            style={{ x: lPXs, y: lPYs, translateX: 3, translateY: -3 }}
          />
          <motion.circle
            cx={25}
            cy={42}
            r="1.2"
            fill="var(--v1-ivory-50)"
            opacity="0.5"
            style={{ x: lPXs, y: lPYs, translateX: -2.5, translateY: 3 }}
          />
        </>
      )}
      {isSleeping && (
        <line
          x1="13"
          y1="42"
          x2="37"
          y2="42"
          stroke="var(--v1-gray-400)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}

      {/* Right eye */}
      <ellipse
        cx="55"
        cy="42"
        rx="14"
        ry={22 * rightScaleY}
        fill="var(--v1-ivory-50)"
        stroke="var(--v1-gray-300)"
        strokeWidth="1.6"
      />
      {!isSleeping && !blinking && expression !== "winking" && (
        <>
          <motion.circle
            cx={55}
            cy={42}
            r="9"
            fill="var(--v1-gray-900)"
            style={{ x: rPXs, y: rPYs }}
          />
          <motion.circle
            cx={55}
            cy={42}
            r="3"
            fill="var(--v1-ivory-50)"
            opacity="0.85"
            style={{ x: rPXs, y: rPYs, translateX: 3, translateY: -3 }}
          />
          <motion.circle
            cx={55}
            cy={42}
            r="1.2"
            fill="var(--v1-ivory-50)"
            opacity="0.5"
            style={{ x: rPXs, y: rPYs, translateX: -2.5, translateY: 3 }}
          />
        </>
      )}
      {isSleeping && (
        <line
          x1="43"
          y1="42"
          x2="67"
          y2="42"
          stroke="var(--v1-gray-400)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}

      {/* Thinking dots */}
      {expression === "thinking" &&
        [0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx={66 + i * 4}
            cy={22 - i * 3}
            r={1.8 - i * 0.3}
            fill="var(--v1-gray-400)"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}

      {/* Sweat drop */}
      {expression === "struggling" && (
        <motion.g animate={{ y: [0, 3, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
          <ellipse cx="70" cy="28" rx="4" ry="6" fill="#bfdbfe" opacity="0.8" />
          <path d="M 70 22 L 73 28 Q 70 32 67 28 Z" fill="#bfdbfe" opacity="0.8" />
        </motion.g>
      )}

      {/* Mouth */}
      {!isSleeping &&
        (isLaughing ? (
          <>
            <ellipse cx="40" cy="67" rx="11" ry="7" fill="var(--v1-gray-900)" />
            <ellipse cx="40" cy="64" rx="9" ry="3" fill="var(--v1-ivory-50)" opacity="0.25" />
          </>
        ) : isSurprised ? (
          <ellipse
            cx="40"
            cy="68"
            rx="7"
            ry="5.5"
            fill="none"
            stroke="var(--v1-gray-700)"
            strokeWidth="2"
          />
        ) : mouthD ? (
          <motion.path
            d={mouthD}
            stroke="var(--v1-gray-700)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            animate={{ d: mouthD }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        ) : null)}

      {/* ZZZ */}
      {expr.zzz && (
        <motion.text
          x="65"
          y="22"
          fontSize="12"
          fill="var(--v1-gray-400)"
          fontWeight="700"
          animate={{ y: [22, 10], opacity: [1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          z
        </motion.text>
      )}

      {/* Hearts */}
      {expr.hearts &&
        [
          { x: 5, y: 47 },
          { x: 58, y: 47 },
        ].map((p, i) => (
          <motion.text
            key={i}
            x={p.x}
            y={p.y}
            fontSize="14"
            fill="#f43f5e"
            animate={{ y: [p.y, p.y - 10], opacity: [1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
          >
            ♥
          </motion.text>
        ))}

      {/* Tears */}
      {expr.tears &&
        [16, 50].map((cx, i) => (
          <motion.ellipse
            key={i}
            cx={cx}
            cy={60}
            rx="2.5"
            ry="5"
            fill="#93c5fd"
            animate={{ y: [0, 8], opacity: [1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}

      {/* Subtle energy glow (replaces the former sparkle burst) */}
      {expr.glow &&
        [
          { x: 6, y: 26 },
          { x: 66, y: 23 },
          { x: 8, y: 60 },
          { x: 63, y: 57 },
        ].map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2.2"
            fill="var(--v1-gray-300)"
            animate={{ opacity: [0.15, 0.5, 0.15], scale: [0.9, 1.15, 0.9] }}
            transition={{ duration: 1.6, delay: i * 0.25, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

      {/* Sunglasses */}
      {(accessory === "sunglasses" || expression === "cool") && (
        <motion.g
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <rect
            x="11"
            y="34"
            width="28"
            height="16"
            rx="6"
            fill="var(--v1-gray-900)"
            opacity="0.92"
          />
          <rect
            x="41"
            y="34"
            width="28"
            height="16"
            rx="6"
            fill="var(--v1-gray-900)"
            opacity="0.92"
          />
          <line x1="39" y1="42" x2="41" y2="42" stroke="var(--v1-gray-700)" strokeWidth="2.5" />
          <line
            x1="11"
            y1="41"
            x2="3"
            y2="38"
            stroke="var(--v1-gray-700)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="69"
            y1="41"
            x2="77"
            y2="38"
            stroke="var(--v1-gray-700)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <ellipse cx="17" cy="38" rx="2.5" ry="1.8" fill="var(--v1-ivory-50)" opacity="0.2" />
          <ellipse cx="47" cy="38" rx="2.5" ry="1.8" fill="var(--v1-ivory-50)" opacity="0.2" />
        </motion.g>
      )}

      {/* Nerd glasses */}
      {expression === "nerd" && (
        <g>
          <circle
            cx="25"
            cy="42"
            r="13"
            fill="none"
            stroke="var(--v1-gray-700)"
            strokeWidth="2"
            opacity="0.7"
          />
          <circle
            cx="55"
            cy="42"
            r="13"
            fill="none"
            stroke="var(--v1-gray-700)"
            strokeWidth="2"
            opacity="0.7"
          />
          <line x1="38" y1="42" x2="42" y2="42" stroke="var(--v1-gray-700)" strokeWidth="2" />
          <line
            x1="12"
            y1="40"
            x2="4"
            y2="38"
            stroke="var(--v1-gray-700)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="68"
            y1="40"
            x2="76"
            y2="38"
            stroke="var(--v1-gray-700)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Dizzy spirals */}
      {expression === "dizzy" && (
        <>
          <text x="14" y="46" fontSize="18" fill="#a78bfa" opacity="0.85">
            @
          </text>
          <text x="46" y="46" fontSize="18" fill="#a78bfa" opacity="0.85">
            @
          </text>
        </>
      )}
    </svg>
  );
}

// ── Floating hands ────────────────────────────────────────────────────────────
function SlyHandsV1({
  expression,
  accessory,
  isDragging,
}: {
  expression: ExprName;
  accessory: AccessoryName;
  isDragging: boolean;
}) {
  const covering = expression === "shy";
  const excited = ["excited", "starstruck", "victorious", "love"].includes(expression);
  const raised = expression === "surprised" || expression === "happy";
  const laughing = expression === "laughing";
  const struggling = expression === "struggling";
  const thinking = expression === "thinking";
  const reading = expression === "reading";
  const showPeace = [
    "idle",
    "happy",
    "smug",
    "cool",
    "proud",
    "nerd",
    "winking",
    "cheeky",
  ].includes(expression);

  const leftAnim = isDragging
    ? {
        rotate: [0, -85, 55, -100, 45, -65, 80, -40, 0],
        y: [0, -20, 6, -24, 12, -6, -16, 4, 0],
        x: [0, -12, 7, -16, 9, -4, 2, 0],
      }
    : covering
      ? { y: -24, rotate: 25, x: 2 }
      : excited
        ? { y: [-10, -20, -10, -22, -10], rotate: [-8, -20, -8, -25, -8], x: [0, 0, 0, 0, 0] }
        : raised
          ? { y: -10, rotate: 0, x: 0 }
          : struggling
            ? { y: [-10, -14, -10], rotate: [18, 22, 18], x: [5, 8, 5] }
            : laughing
              ? { y: 4, rotate: -14, x: 0 }
              : thinking
                ? { y: -18, rotate: -30, x: 2 }
                : reading
                  ? { y: -8, rotate: -28, x: 0 }
                  : { y: 0, rotate: 0, x: 0 };

  const rightAnim = isDragging
    ? {
        rotate: [0, 80, -55, 100, -45, 65, -80, 40, 0],
        y: [0, -22, 8, -20, 14, -7, -18, 5, 0],
        x: [0, 12, -7, 16, -9, 4, -2, 0],
      }
    : covering
      ? { y: -24, rotate: -25, x: -2 }
      : excited
        ? { y: [-10, -18, -10, -20, -10], rotate: [8, 20, 8, 25, 8], x: [0, 0, 0, 0, 0] }
        : raised
          ? { y: -10, rotate: 0, x: 0 }
          : struggling
            ? { y: [-10, -14, -10], rotate: [-18, -22, -18], x: [-5, -8, -5] }
            : laughing
              ? { y: 4, rotate: 14, x: 0 }
              : thinking
                ? { y: 0, rotate: 0, x: 0 }
                : reading
                  ? { y: -4, rotate: 12, x: 0 }
                  : { y: 0, rotate: 0, x: 0 };

  // Damping tuned high enough that settling from the drag flail's large
  // swings (rotate up to ~100°) doesn't overshoot into a visible bounce —
  // the flail itself is unaffected (that path uses mirrorT, not this).
  const springT = { type: "spring" as const, stiffness: 240, damping: 28 };
  const mirrorT = (dur: number) => ({
    duration: dur,
    repeat: Infinity,
    repeatType: "mirror" as const,
    ease: "easeInOut" as const,
  });
  const lt = isDragging ? mirrorT(0.5) : excited || struggling ? mirrorT(0.75) : springT;

  return (
    <div
      style={{
        position: "absolute",
        bottom: -8,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-between",
        pointerEvents: "none",
        padding: "0 2px",
      }}
    >
      {/* Left hand */}
      <motion.svg
        viewBox="0 0 22 36"
        style={{ width: 24, height: 36, overflow: "visible", originX: "50%", originY: "80%" }}
        animate={leftAnim}
        transition={lt}
      >
        <ellipse
          cx="11"
          cy="24"
          rx="9"
          ry="11"
          fill="var(--v1-ivory-50)"
          stroke="var(--v1-gray-300)"
          strokeWidth="1.5"
        />
        <rect
          x="6.5"
          y="9"
          width="3.5"
          height="10"
          rx="1.75"
          fill="var(--v1-ivory-50)"
          stroke="var(--v1-gray-300)"
          strokeWidth="1.2"
        />
        <rect
          x="11.5"
          y="7"
          width="3.5"
          height="12"
          rx="1.75"
          fill="var(--v1-ivory-50)"
          stroke="var(--v1-gray-300)"
          strokeWidth="1.2"
        />
        {accessory === "chalk" && (
          <>
            <rect
              x="5"
              y="-2"
              width="4.5"
              height="16"
              rx="2"
              fill="var(--v1-ivory-100)"
              stroke="var(--v1-gray-400)"
              strokeWidth="0.9"
            />
            <rect x="5" y="-2" width="4.5" height="3" rx="1" fill="var(--v1-gray-200)" />
            <motion.ellipse
              cx="7.5"
              cy="-6"
              rx="1.5"
              ry="1"
              fill="var(--v1-gray-400)"
              opacity="0.6"
              animate={{ y: [-6, -18], opacity: [0.6, 0], scale: [1, 2] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
          </>
        )}
      </motion.svg>

      {/* Right hand */}
      <motion.svg
        viewBox="0 0 22 36"
        style={{ width: 24, height: 36, overflow: "visible", originX: "50%", originY: "80%" }}
        animate={rightAnim}
        transition={lt}
      >
        <ellipse
          cx="11"
          cy="24"
          rx="9"
          ry="11"
          fill="var(--v1-ivory-50)"
          stroke="var(--v1-gray-300)"
          strokeWidth="1.5"
        />
        {showPeace ? (
          <>
            <rect
              x="6.5"
              y="7"
              width="3.5"
              height="12"
              rx="1.75"
              fill="var(--v1-ivory-50)"
              stroke="var(--v1-gray-300)"
              strokeWidth="1.2"
            />
            <rect
              x="11.5"
              y="7"
              width="3.5"
              height="12"
              rx="1.75"
              fill="var(--v1-ivory-50)"
              stroke="var(--v1-gray-300)"
              strokeWidth="1.2"
            />
          </>
        ) : (
          <>
            <rect
              x="6.5"
              y="9"
              width="3.5"
              height="10"
              rx="1.75"
              fill="var(--v1-ivory-50)"
              stroke="var(--v1-gray-300)"
              strokeWidth="1.2"
            />
            <rect
              x="11.5"
              y="7"
              width="3.5"
              height="12"
              rx="1.75"
              fill="var(--v1-ivory-50)"
              stroke="var(--v1-gray-300)"
              strokeWidth="1.2"
            />
          </>
        )}
      </motion.svg>
    </div>
  );
}

// ── Accessories ───────────────────────────────────────────────────────────────
function SlyAccessorySVG({ type }: { type: AccessoryName }) {
  switch (type) {
    case "graduation_cap":
      return (
        <svg width={48} height={28} viewBox="0 0 48 28">
          <polygon points="24,2 46,12 24,22 2,12" fill="var(--v1-gray-900)" />
          <rect x={17} y={20} width={14} height={5} rx={2} fill="var(--v1-gray-900)" />
          <line x1={46} y1={12} x2={46} y2={22} stroke="var(--v1-gray-600)" strokeWidth={1.5} />
          <circle cx={46} cy={24} r={2.5} fill="var(--v1-gray-600)" />
        </svg>
      );
    case "party_hat":
      return (
        <svg width={30} height={36} viewBox="0 0 30 36">
          <polygon points="15,0 30,32 0,32" fill="#f43f5e" />
          <polygon
            points="15,0 30,32 0,32"
            fill="none"
            stroke="var(--v1-ivory-50)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        </svg>
      );
    case "book":
      return (
        <svg width={32} height={22} viewBox="0 0 32 22">
          <rect x={1} y={2} width={14} height={18} rx={2} fill="#2563eb" />
          <rect x={17} y={2} width={14} height={18} rx={2} fill="#1d4ed8" />
          <line x1={15} y1={2} x2={15} y2={20} stroke="var(--v1-gray-700)" strokeWidth={2} />
        </svg>
      );
    case "chalk":
      return (
        <svg width={18} height={8} viewBox="0 0 18 8">
          <rect
            x={0}
            y={1}
            width={16}
            height={6}
            rx={2}
            fill="var(--v1-ivory-100)"
            stroke="var(--v1-gray-300)"
            strokeWidth={0.5}
          />
        </svg>
      );
    default:
      return null;
  }
}
