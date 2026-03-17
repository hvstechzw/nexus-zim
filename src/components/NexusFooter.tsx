import aieLogoLight from "@/assets/aie-logo-light.png";

const FOOTER_LINKS = {
  Platform: ["Live Scores", "Events Hub", "Standings", "Broadcast", "Results Archive"],
  Register: ["Athletes", "Teams & Clubs", "Officials", "School Programs", "League Entry"],
  Disciplines: ["Track & Field", "Ball Sports", "Aquatics", "Combat Sports", "Academic"],
  Support: ["Contact Us", "Documentation", "Federation Login", "Media & Press", "Privacy Policy"],
};

export function NexusFooter() {
  return (
    <footer className="hairline-t bg-background">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0 hairline-b">
        {/* Brand */}
        <div className="p-6 sm:p-10 md:p-14 lg:hairline-r flex flex-col justify-between gap-8 sm:gap-10">
          <div>
            <div className="bg-foreground rounded-xl p-4 sm:p-5 inline-flex mb-4 sm:mb-5">
              <img src={aieLogoLight} alt="Aetheris" className="w-20 sm:w-28 h-auto object-contain" style={{ filter: "brightness(10)" }} />
            </div>
            <p className="display-font text-lg sm:text-xl font-bold text-foreground tracking-tight">Nexus</p>
            <p className="text-[10px] sm:text-xs text-nexus-muted tracking-wide uppercase mt-1">by Aetheris Innovative Enterprises</p>
          </div>

          <div>
            <p className="text-xs sm:text-sm text-nexus-muted leading-relaxed max-w-[40ch]">
              Zimbabwe's national competition infrastructure. Centralising tracking, broadcast, and registration.
            </p>
            <div className="mt-4 sm:mt-6">
              <p className="text-[10px] sm:text-xs mono tracking-widest uppercase text-nexus-muted mb-2 sm:mb-3">Coverage</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {["Harare", "Bulawayo", "Mutare", "Gweru", "Masvingo", "Chinhoyi", "Marondera"].map((city) => (
                  <span key={city} className="text-[10px] sm:text-xs mono text-nexus-muted hairline px-2 py-0.5 sm:py-1 rounded-md">{city}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 md:grid-cols-4">
          {Object.entries(FOOTER_LINKS).map(([section, links], i) => (
            <div key={section} className={`p-5 sm:p-8 md:p-10 flex flex-col gap-4 sm:gap-5 ${i < Object.keys(FOOTER_LINKS).length - 1 ? "md:hairline-r" : ""}`}>
              <p className="text-[10px] sm:text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-semibold">{section}</p>
              <ul className="flex flex-col gap-2 sm:gap-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-xs sm:text-sm text-foreground hover:text-nexus-muted transition-colors duration-200">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-10 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <p className="text-[10px] sm:text-xs mono text-nexus-muted">© {new Date().getFullYear()} Aetheris Innovative Enterprises Pvt Ltd</p>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-[10px] sm:text-xs mono text-nexus-muted hairline px-2 sm:px-3 py-1 sm:py-1.5 rounded-md">Nexus v1.0</span>
          <span className="text-[10px] sm:text-xs mono text-nexus-muted hidden sm:block">Precision infrastructure for Zimbabwean sport</span>
        </div>
      </div>
    </footer>
  );
}
