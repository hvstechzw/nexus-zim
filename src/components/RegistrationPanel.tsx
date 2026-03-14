import { useState } from "react";
import { motion } from "framer-motion";

const DISCIPLINES = [
  "Football", "Rugby", "Cricket", "Athletics (Track)",
  "Athletics (Field)", "Swimming", "Basketball", "Volleyball",
  "Tennis", "Chess", "Debate", "Quiz / Academic",
  "Netball", "Hockey", "Boxing", "Judo", "Cycling", "Other",
];

const LEVELS = [
  "Primary School (U13)",
  "Primary School (U12 & Below)",
  "Secondary School (O-Level)",
  "Secondary School (A-Level)",
  "Club / Academy",
  "Provincial",
  "National League",
  "National Cup / Knockout",
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
        <p className="text-xs mono tracking-[0.2em] uppercase text-nexus-muted">Registration Portal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left — Info */}
        <div className="p-12 md:p-16 hairline-r flex flex-col gap-8">
          <div>
            <h2 className="display-font text-display-lg font-semibold text-foreground">
              Join the National Grid.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-nexus-muted max-w-[55ch]">
              Register individuals, teams, or officials across every discipline and level.
              From a Grade 3 chess competitor in Mutare to a National League squad in Harare —
              every entry is tracked, verifiable, and broadcast-ready.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-0">
            {[
              { label: "Athlete Profiles", value: "127,000+" },
              { label: "Registered Teams", value: "4,800+" },
              { label: "Certified Officials", value: "2,100+" },
              { label: "Schools Enrolled", value: "680+" },
            ].map((item, i) => (
              <div
                key={item.label}
                className={`py-6 pr-6 ${i % 2 === 0 ? "hairline-r" : "pl-6"} ${i < 2 ? "hairline-b" : ""}`}
              >
                <p className="score-display text-score-md text-foreground">{item.value}</p>
                <p className="text-xs mono tracking-[0.12em] uppercase text-nexus-muted mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="hairline p-6 flex flex-col gap-3">
            <p className="text-xs mono tracking-[0.15em] uppercase text-nexus-muted">What you get</p>
            {[
              "Digital competition ID & profile",
              "Real-time scoring integration",
              "Broadcast-ready athlete card",
              "Cross-season performance records",
              "National rankings and seeding",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <span className="w-1 h-1 bg-foreground flex-shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Form */}
        <div className="p-12 md:p-16">
          {/* Tab switcher */}
          <div className="flex hairline-b mb-10">
            {(["athlete", "team", "official"] as const).map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-xs tracking-[0.15em] uppercase font-medium transition-colors duration-200 btn-click
                  ${i < 2 ? "hairline-r" : ""}
                  ${tab === t ? "text-foreground" : "text-nexus-muted hover:text-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <motion.form
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-8"
          >
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs mono tracking-[0.15em] uppercase text-nexus-muted">
                  {tab === "team" ? "Team Name" : "First Name"}
                </label>
                <input
                  type="text"
                  required
                  className="bg-transparent border-b border-nexus-silver focus:border-foreground outline-none py-3 text-sm text-foreground placeholder:text-nexus-muted/50 transition-colors duration-200"
                  placeholder={tab === "team" ? "e.g. Dynamos FC" : "Tinashe"}
                />
              </div>
              {tab !== "team" && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs mono tracking-[0.15em] uppercase text-nexus-muted">Surname</label>
                  <input
                    type="text"
                    required
                    className="bg-transparent border-b border-nexus-silver focus:border-foreground outline-none py-3 text-sm text-foreground placeholder:text-nexus-muted/50 transition-colors duration-200"
                    placeholder="Moyo"
                  />
                </div>
              )}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs mono tracking-[0.15em] uppercase text-nexus-muted">Email</label>
                <input
                  type="email"
                  required
                  className="bg-transparent border-b border-nexus-silver focus:border-foreground outline-none py-3 text-sm text-foreground placeholder:text-nexus-muted/50 transition-colors duration-200"
                  placeholder="email@example.com"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs mono tracking-[0.15em] uppercase text-nexus-muted">Phone</label>
                <input
                  type="tel"
                  className="bg-transparent border-b border-nexus-silver focus:border-foreground outline-none py-3 text-sm text-foreground placeholder:text-nexus-muted/50 transition-colors duration-200"
                  placeholder="+263 77 ..."
                />
              </div>
            </div>

            {/* Discipline */}
            <div className="flex flex-col gap-2">
              <label className="text-xs mono tracking-[0.15em] uppercase text-nexus-muted">Discipline</label>
              <select
                required
                className="bg-transparent border-b border-nexus-silver focus:border-foreground outline-none py-3 text-sm text-foreground appearance-none cursor-pointer transition-colors duration-200"
              >
                <option value="">Select discipline</option>
                {DISCIPLINES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div className="flex flex-col gap-2">
              <label className="text-xs mono tracking-[0.15em] uppercase text-nexus-muted">Competition Level</label>
              <select
                required
                className="bg-transparent border-b border-nexus-silver focus:border-foreground outline-none py-3 text-sm text-foreground appearance-none cursor-pointer transition-colors duration-200"
              >
                <option value="">Select level</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Province */}
            <div className="flex flex-col gap-2">
              <label className="text-xs mono tracking-[0.15em] uppercase text-nexus-muted">Province</label>
              <select
                required
                className="bg-transparent border-b border-nexus-silver focus:border-foreground outline-none py-3 text-sm text-foreground appearance-none cursor-pointer transition-colors duration-200"
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
              className={`h-12 text-xs tracking-[0.2em] uppercase font-medium transition-all duration-200 btn-click hairline
                ${submitted
                  ? "bg-foreground text-primary-foreground"
                  : "bg-foreground text-primary-foreground hover:opacity-90"
                }`}
            >
              {submitted ? "✓ Registration Submitted" : "Submit Registration"}
            </button>

            <p className="text-xs mono text-nexus-muted text-center">
              Official confirmation will be sent within 24 hours. All submissions are reviewed by
              Nexus officials.
            </p>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
