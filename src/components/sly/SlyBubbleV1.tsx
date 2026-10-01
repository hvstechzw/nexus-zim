import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotionV1 } from "@/lib/sly/prefersReducedMotionV1";

/**
 * SlyBubbleV1 — ported nearly verbatim from Scholastic Services'
 * BubbleRenderer (the floating companion's speech/thought/shout bubble
 * system): same layering, same tail/dots/rotation per bubble type, same
 * reading-time-aware auto-dismiss. Recolored from white/charcoal-gray to
 * Vimera's ivory/gray tokens; listens on this project's existing "sly-say"
 * event (already dispatched by slyIdleEngineV1, slyAttentionV1, the tour,
 * and SlyCompanionV1's tap handler) rather than the reference's "sc-say".
 *
 * UI/UX audit response (audit section 4.15): two gaps this file owns since
 * it's the one place every Sly line (idle chatter, roasts, taps, tours)
 * actually renders through. First, the spring/scale entrance respects
 * prefers-reduced-motion — a plain, near-instant fade in reduced-motion
 * mode instead. Second, a persistent (never unmounted, unlike the visual
 * bubble itself) sr-only aria-live region mirrors whatever Sly is
 * currently saying — the one dedicated live region for his speech, so nothing
 * about a screen reader relying on the visual bubble mounting/unmounting is
 * required, and nothing else in the app should add a second, competing one.
 */

export type SlyBubbleTypeV1 = "speech" | "thought" | "shout";

export interface SlyBubbleV1Data {
  text: string;
  type: SlyBubbleTypeV1;
  duration?: number;
  /** Wider bubble for longer-form lines (Sly's own guide/explainer voice,
   * which is delivered through this same bubble rather than a separate
   * tour component). */
  width?: number;
}

interface SlyBubbleV1Props {
  scPosition: { x: number; y: number };
  scSize: { w: number; h: number };
}

export function SlyBubbleV1({ scPosition, scSize }: SlyBubbleV1Props) {
  const [current, setCurrent] = useState<SlyBubbleV1Data | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = usePrefersReducedMotionV1();

  // Reading time: a relaxed pace with a generous floor so remarks linger long
  // enough to be read comfortably (and finished) before the bubble disappears.
  const readingTime = (text: string, type: SlyBubbleTypeV1) => {
    const base = type === "shout" ? 7000 : type === "thought" ? 9000 : 10000;
    const perChar = Math.round((text?.length || 0) * 110);
    return Math.min(26000, Math.max(base, perChar + 4000));
  };

  const show = (bubble: SlyBubbleV1Data) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrent(null);
    // Tiny delay so exit animation fires first
    setTimeout(() => {
      setCurrent(bubble);
      // Explicit durations are treated as a minimum — never shorter than the
      // time it actually takes to read the line.
      const duration = Math.max(bubble.duration ?? 0, readingTime(bubble.text, bubble.type));
      timerRef.current = setTimeout(() => setCurrent(null), duration);
    }, 60);
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const {
        text,
        type = "speech",
        duration,
        width,
      } = (e as CustomEvent).detail as {
        text: string;
        type?: SlyBubbleTypeV1;
        duration?: number;
        width?: number;
      };
      show({ text, type, duration, width });
    };
    window.addEventListener("sly-say", handler);
    return () => window.removeEventListener("sly-say", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute bubble position — above Sly, clamped to viewport
  const bubbleW = current?.width ?? 200;
  const bubbleH = 80;
  let left = scPosition.x + scSize.w / 2 - bubbleW / 2;
  let top = scPosition.y - bubbleH - 16;
  left = Math.max(8, Math.min(window.innerWidth - bubbleW - 8, left));
  top = Math.max(8, top);

  return (
    <>
      {/* Persistent regardless of whether the visual bubble is mounted —
          some screen readers don't reliably announce a live region that's
          inserted into the DOM at the same moment as its content, so this
          stays put and only its text changes. The one live region for Sly's
          speech; nothing else in the app should add a second. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {current?.text ?? ""}
      </div>
      <AnimatePresence>
        {current &&
          (reducedMotion ? (
            <motion.div
              key={current.text + current.type}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.05 }}
              style={{
                position: "fixed",
                left,
                top,
                zIndex: 99996,
                maxWidth: bubbleW,
                pointerEvents: "none",
              }}
            >
              {current.type === "speech" && <SlySpeechBubbleV1 text={current.text} />}
              {current.type === "thought" && <SlyThoughtBubbleV1 text={current.text} />}
              {current.type === "shout" && <SlyShoutBubbleV1 text={current.text} />}
            </motion.div>
          ) : (
            <motion.div
              key={current.text + current.type}
              initial={{ scale: 0.7, opacity: 0, y: 6 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 400, damping: 28, duration: 0.18 }}
              style={{
                position: "fixed",
                left,
                top,
                zIndex: 99996,
                maxWidth: bubbleW,
                pointerEvents: "none",
              }}
            >
              {current.type === "speech" && <SlySpeechBubbleV1 text={current.text} />}
              {current.type === "thought" && <SlyThoughtBubbleV1 text={current.text} />}
              {current.type === "shout" && <SlyShoutBubbleV1 text={current.text} />}
            </motion.div>
          ))}
      </AnimatePresence>
    </>
  );
}

function SlySpeechBubbleV1({ text }: { text: string }) {
  return (
    <div
      style={{
        background: "var(--v1-ivory-50)",
        border: "1.5px solid var(--v1-gray-300)",
        borderRadius: 12,
        padding: "8px 11px",
        fontSize: 12,
        lineHeight: 1.5,
        color: "var(--v1-gray-900)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        position: "relative",
      }}
    >
      {text}
      {/* Tail */}
      <div
        style={{
          position: "absolute",
          bottom: -9,
          right: 18,
          width: 0,
          height: 0,
          borderLeft: "7px solid transparent",
          borderRight: "3px solid transparent",
          borderTop: "9px solid var(--v1-gray-300)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -7,
          right: 19,
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "2px solid transparent",
          borderTop: "8px solid var(--v1-ivory-50)",
        }}
      />
    </div>
  );
}

function SlyThoughtBubbleV1({ text }: { text: string }) {
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          background: "var(--v1-ivory-50)",
          border: "2px dashed var(--v1-gray-400)",
          borderRadius: 12,
          padding: "8px 11px",
          fontSize: 12,
          lineHeight: 1.5,
          color: "var(--v1-gray-600)",
          fontStyle: "italic",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {text}
      </div>
      {/* Thought dots */}
      <div style={{ position: "absolute", bottom: -6, right: 20, display: "flex", gap: 3 }}>
        {[6, 4, 3].map((sz, i) => (
          <div
            key={i}
            style={{ width: sz, height: sz, background: "var(--v1-gray-400)", borderRadius: "50%" }}
          />
        ))}
      </div>
    </div>
  );
}

function SlyShoutBubbleV1({ text }: { text: string }) {
  return (
    <div
      style={{
        background: "#fff9c4",
        border: "2.5px solid #f59e0b",
        borderRadius: 8,
        padding: "9px 13px",
        fontSize: 13,
        lineHeight: 1.4,
        color: "#92400e",
        fontWeight: 700,
        transform: "rotate(-1.5deg)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
      }}
    >
      {text}
    </div>
  );
}
