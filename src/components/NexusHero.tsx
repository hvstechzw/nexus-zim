import { motion } from "framer-motion";
import aieLogoLight from "@/assets/aie-logo-light.png";

const STATS = [
  { value: "4,200+", label: "Active Competitions" },
  { value: "127K+", label: "Registered Athletes" },
  { value: "10", label: "Provinces Covered" },
  { value: "48", label: "Disciplines" },
];

export function NexusHero() {
  return (
    <section className="relative min-h-screen flex flex-col hairline-b overflow-hidden">
      {/* The Aetheris Hero Logo Block */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-8 pt-20 pb-0 hairline-b"
           style={{ minHeight: "60vh" }}>
        {/* Grid lines — mechanical precision */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-y-0 left-1/4 hairline-l opacity-30" />
          <div className="absolute inset-y-0 right-1/4 hairline-r opacity-30" />
          <div className="absolute inset-x-0 top-1/3 hairline-t opacity-20" />
          <div className="absolute inset-x-0 bottom-1/3 hairline-b opacity-20" />
        </div>

        {/* Logo — architectural element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl"
        >
          {/* Logo on dark block */}
          <div className="bg-foreground p-12 md:p-20 flex items-center justify-center hairline">
            <img
              src={aieLogoLight}
              alt="Aetheris Innovative Enterprises"
              className="w-full max-w-2xl h-auto object-contain"
              style={{ filter: "brightness(10)" }}
            />
          </div>

          {/* Product name below logo block */}
          <div className="mt-0 hairline hairline-t-0 bg-background px-8 py-5 flex items-center justify-between">
            <div>
              <p className="text-xs mono tracking-[0.3em] uppercase text-nexus-muted">Product</p>
              <h1 className="display-font text-display-xl font-semibold text-foreground mt-1">
                Nexus
              </h1>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs mono tracking-[0.3em] uppercase text-nexus-muted">By</p>
              <p className="display-font text-sm font-medium text-foreground mt-1">
                Aetheris Innovative Enterprises Pvt Ltd
              </p>
            </div>
          </div>
        </motion.div>

        {/* Hero headline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl mt-12 mb-8"
        >
          <p className="text-display-lg display-font font-semibold text-foreground max-w-[24ch]">
            The National Pulse.{" "}
            <span className="text-nexus-muted">
              Every match, every move, every second.
            </span>
          </p>
          <p className="mt-4 text-sm leading-relaxed text-nexus-muted max-w-[60ch]">
            Zimbabwe's centralised competition infrastructure — tracking, broadcasting, and
            registering every competitive discipline across every level, from Primary School
            classrooms to National League finals.
          </p>

          <div className="mt-8 flex items-center gap-0">
            <a
              href="#live"
              className="flex items-center h-11 px-8 bg-foreground text-primary-foreground text-xs tracking-[0.2em] uppercase font-medium hover:opacity-90 transition-opacity btn-click hairline"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-nexus-live mr-2.5" />
              View Live
            </a>
            <a
              href="#events"
              className="flex items-center h-11 px-8 bg-background text-foreground text-xs tracking-[0.2em] uppercase font-medium hairline hover:bg-nexus-surface transition-colors btn-click"
            >
              Browse Events
            </a>
          </div>
        </motion.div>
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-4 hairline-t"
      >
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={`px-8 py-6 ${i < STATS.length - 1 ? "hairline-r" : ""} stagger-item`}
            style={{ animationDelay: `${0.7 + i * 0.08}s` }}
          >
            <p className="score-display text-score-md text-foreground">{stat.value}</p>
            <p className="text-xs tracking-[0.15em] uppercase text-nexus-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
