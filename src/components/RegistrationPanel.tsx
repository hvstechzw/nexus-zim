import { useState } from "react";
import { motion } from "framer-motion";

const DISCIPLINES = [
  "Football", "Rugby", "Cricket", "Athletics (Track)", "Athletics (Field)",
  "Swimming", "Basketball", "Volleyball", "Tennis", "Chess", "Debate",
  "Quiz / Academic", "Netball", "Hockey", "Boxing", "Judo", "Cycling", "Other",
];

const LEVELS = [
  "Primary School (U13)", "Primary School (U12 & Below)",
  "Secondary School (O-Level)", "Secondary School (A-Level)",
  "Club / Academy", "Provincial", "National League", "National Cup / Knockout",
];

export function RegistrationPanel() {
  const [tab, setTab] = useState<"athlete" | "team" | "official">("athlete");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section id="register" className="hairline-b">
      {/* Section header */}
      <div className="px-8 py-5 hairline-b">
        <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-medium">Registration Portal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left — Info */}
        <div className="p-10 md:p-14 hairline-r flex flex-col gap-8">
          <div>
            <h2 className="display-font text-display-lg font-bold text-foreground tracking-tight">
              Join the National Grid.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-nexus-muted max-w-[55ch]">
              Register individuals, teams, or officials across every discipline and level.
              From a Grade 3 chess competitor in Mutare to a National League squad in Harare —
              every entry is tracked, verifiable, and broadcast-ready.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Athlete Profiles", value: "127,000+" },
              { label: "Registered Teams", value: "4,800+" },
              { label: "Certified Officials", value: "2,100+" },
              { label: "Schools Enrolled", value: "680+" },
            ].map((item) => (
              <div
                key={item.label}
                className="hairline rounded-xl p-5 flex flex-col gap-1.5 card-shadow"
              >
                <p className="score-display text-score-md text-foreground">{item.value}</p>
                <p className="text-[10px] mono tracking-[0.12em] uppercase text-nexus-muted">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="hairline rounded-xl p-6 flex flex-col gap-3 bg-nexus-surface/50">
            <p className="text-xs mono tracking-[0.15em] uppercase text-nexus-muted font-semibold mb-1">What you get</p>
            {[
              "Digital competition ID & profile",
              "Real-time scoring integration",
              "Broadcast-ready athlete card",
              "Cross-season performance records",
              "National rankings and seeding",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Form */}
        <div className="p-10 md:p-14">
          {/* Tab switcher */}
          <div className="flex gap-1.5 p-1.5 bg-nexus-surface rounded-xl mb-8">
            {(["athlete", "team", "official"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs tracking-wide font-semibold rounded-lg transition-all duration-200 btn-click capitalize
                  ${tab === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-nexus-muted hover:text-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <motion.form
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold">
                  {tab === "team" ? "Team Name" : "First Name"}
                </label>
                <input
                  type="text"
                  required
                  className="bg-nexus-surface/60 hairline rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all duration-200"
                  placeholder={tab === "team" ? "e.g. Dynamos FC" : "Tinashe"}
                />
              </div>
              {tab !== "team" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold">Surname</label>
                  <input
                    type="text"
                    required
                    className="bg-nexus-surface/60 hairline rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all duration-200"
                    placeholder="Moyo"
                  />
                </div>
              )}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold">Email</label>
                <input
                  type="email"
                  required
                  className="bg-nexus-surface/60 hairline rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all duration-200"
                  placeholder="email@example.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold">Phone</label>
                <input
                  type="tel"
                  className="bg-nexus-surface/60 hairline rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all duration-200"
                  placeholder="+263 77 ..."
                />
              </div>
            </div>

            {/* Discipline */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold">Discipline</label>
              <select
                required
                className="bg-nexus-surface/60 hairline rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 cursor-pointer transition-all duration-200 appearance-none"
              >
                <option value="">Select discipline</option>
                {DISCIPLINES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold">Competition Level</label>
              <select
                required
                className="bg-nexus-surface/60 hairline rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 cursor-pointer transition-all duration-200 appearance-none"
              >
                <option value="">Select level</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Province */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold">Province</label>
              <select
                required
                className="bg-nexus-surface/60 hairline rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 cursor-pointer transition-all duration-200 appearance-none"
              >
                <option value="">Select province</option>
                {["Harare", "Bulawayo", "Manicaland", "Mashonaland Central", "Mashonaland East",
                  "Mashonaland West", "Masvingo", "Matabeleland North", "Matabeleland South", "Midlands"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`h-12 text-sm font-semibold tracking-wide rounded-xl transition-all duration-200 btn-click
                ${submitted
                  ? "bg-nexus-muted text-primary-foreground"
                  : "bg-foreground text-primary-foreground hover:opacity-85"
                }`}
            >
              {submitted ? "✓ Registration Submitted" : "Submit Registration"}
            </button>

            <p className="text-xs mono text-nexus-muted text-center leading-relaxed">
              Official confirmation sent within 24 hours. All submissions reviewed by Nexus officials.
            </p>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
