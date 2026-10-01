/**
 * What Sly says in Nexus.
 *
 * VOICE (same contract as the companion inside Vimera): dry, sarcastic, brutally
 * honest, warm underneath. Short sentences. If a line would be fine coming out of a
 * corporate chatbot, delete it.
 *
 * HONESTY: sarcasm is the delivery, never the content. Every claim here describes
 * something Nexus actually does today. Sly suggests and explains; he never scores,
 * registers or changes anything.
 */

export type SlyExpression =
  | "idle" | "thinking" | "happy" | "smug" | "cheeky" | "cool" | "nerd"
  | "proud" | "suspicious" | "determined" | "winking" | "bored";

export type SlyAccessory = "none" | "sunglasses" | "graduation_cap" | "party_hat" | "book" | "chalk";

export interface TourStep {
  /** Matches a `data-sly` attribute in the page. Steps whose target isn't on screen are skipped. */
  target: string;
  title: string;
  line: string;
  expression: SlyExpression;
  accessory: SlyAccessory;
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: "hero",
    title: "Welcome",
    expression: "smug",
    accessory: "none",
    line: "Welcome to Nexus. I'm Sly. I was hired to show you around, and by hired I mean assigned. This is where NASH and NAPH school sport in Zimbabwe lives: fixtures, live scores, results, schools. Tap me or press Next when you've read enough. I'll wait. I'm good at waiting.",
  },
  {
    target: "stats",
    title: "The numbers",
    expression: "nerd",
    accessory: "graduation_cap",
    line: "Registered athletes, schools, matches live right now, competitions this week. They come from the registry, not from my imagination. My imagination would have rounder numbers.",
  },
  {
    target: "filters",
    title: "Filters",
    expression: "thinking",
    accessory: "none",
    line: "Sport, province, tier. Pick one and everything below narrows to match. Clear resets it. Nobody needs a tutorial for a dropdown, and yet here I am, giving one.",
  },
  {
    target: "live",
    title: "Live now",
    expression: "proud",
    accessory: "party_hat",
    line: "Fixtures being scored right now. Tap one to follow the match as it happens. If this section is missing, nothing is live. It's not broken. It's just a quiet afternoon on the pitch.",
  },
  {
    target: "upcoming",
    title: "Upcoming",
    expression: "cool",
    accessory: "sunglasses",
    line: "Competitions by start date, earliest first. Zonal, district, provincial, national. If your filters leave this empty, loosen them before you blame the fixture list.",
  },
  {
    target: "results",
    title: "Results",
    expression: "smug",
    accessory: "none",
    line: "Finished competitions, newest first. Final scores, standings, brackets. The part where arguments about who actually won get settled by a table.",
  },
  {
    target: "nav",
    title: "Getting around",
    expression: "winking",
    accessory: "none",
    line: "Home, Results, Live, Calendar, Tools. Same five everywhere, same order. Tools holds everything else, and only what your role can use. If a tool isn't listed, you don't have access to it. That's not me being unhelpful. That's permissions.",
  },
  {
    target: "closing",
    title: "Your role",
    expression: "cheeky",
    accessory: "none",
    line: "Coach, official, organiser, athlete? Register and ask for the role you need. A person approves it. I'm not that person. I can only judge your filters. That's the tour. You survived.",
  },
];

/** A tap that isn't part of the tour. He is not grateful for the attention and will say so. */
export const TAP_LINES: string[] = [
  "Yes? I was mid-thought. It was about your attention span. It'll keep.",
  "Poked. Lovely. Tour's available if you'd like me to be useful instead.",
  "I'm an ambient presence, not a doorbell. Though that is exactly what I just was.",
  "Still here. Still employed. Still watching. Anything else?",
  "You tapped me instead of checking the scores. Interesting priorities, but sure.",
  "I'm Zimbabwean. I have opinions about the offside rule. None of them are for a website.",
];

/** One quiet remark per page, per session, on first arrival. */
export const PAGE_LINES: Record<string, string> = {
  "/": "Oh good, a visitor. I'm Sly. Tap me for a remark, or hit Tour with Sly and I'll walk you through the page. I'll try to look enthusiastic.",
  "/live": "Live matches. Scores update as the scorer enters them, so if a match looks stuck, blame the humans with the whistles.",
  "/results": "Results. Final scores, no take-backs. Tap a competition for standings and the bracket.",
  "/calendar": "The calendar. Where fixtures become promises. Check the date before you check the pitch.",
  "/schools": "Every school on Nexus. If yours isn't here, take it up with Scholastic Services. Politely. They have feelings.",
  "/records": "National records. Proof that someone, once, was faster than you.",
  "/tools": "Tools. Everything your role can open, in one list. What you can't open isn't shown. That's the system working.",
};

export const IDLE_LINES: string[] = [
  "Quiet in here. Suspiciously quiet. One of us should read a scoreboard.",
  "Nothing's happened for a while. I'll allow it. Enjoy it. It won't last.",
  "If I had a body I'd be leaning on the touchline right now, sighing. Picture that.",
];

export const TOUR_END_LINE =
  "Tour over. I'll be down here if you need me. I won't be going anywhere. I physically can't.";
export const SLEEP_LINE = "Sleeping. Tap me when you need me. Or don't. I'll be fine.";
export const WAKE_LINE = "Back. Did I miss a goal? Don't answer that.";
