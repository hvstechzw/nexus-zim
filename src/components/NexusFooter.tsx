import aieLogoLight from "@/assets/aie-logo-light.png";
import { ScholasticBadge } from "@/components/ScholasticBadge";

const FOOTER_LINKS = {
  Platform: ["Schools", "Inter-School Fixtures", "Sports Day", "Standings", "Broadcast"],
  Schools: ["Schools Directory", "School Profiles", "House Competitions", "Student Rosters", "Coordinator Login"],
  Disciplines: ["Field & Track", "Ball Sports", "Aquatics", "Mind Sports", "Academic Olympiads"],
  Support: ["Contact Us", "Documentation", "Federation Login", "Practice Scoring", "Privacy Policy"],
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
            <p className="display-font text-lg sm:text-xl font-bold text-foreground tracking-tight">Nexus for Schools</p>
            <p className="text-[10px] sm:text-xs text-nexus-muted tracking-wide uppercase mt-1">by Aetheris Innovative Enterprises</p>
          </div>

          <div>
            <p className="text-xs sm:text-sm text-nexus-muted leading-relaxed max-w-[40ch]">
              Zimbabwe's closed inter-school competition network — exclusively powered by Scholastic Services.
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

      {/* Scholastic Services integration strip */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-10 py-3 hairline-b flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          <span className="text-[10px] mono tracking-wide uppercase text-nexus-muted font-semibold">Exclusively integrated with</span>
        </div>
        <a href="https://scholasticservices.online" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-foreground hover:opacity-70 transition-opacity">
          Scholastic Services
        </a>
        <span className="text-[10px] text-nexus-muted">School vetting · Student registration · Sports tracking</span>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-10 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <p className="text-[10px] sm:text-xs mono text-nexus-muted">© {new Date().getFullYear()} Aetheris Innovative Enterprises Pvt Ltd</p>
        <div className="flex items-center gap-2 sm:gap-3">
          <ScholasticBadge size="sm" />
          <span className="text-[10px] sm:text-xs mono text-nexus-muted hairline px-2 sm:px-3 py-1 sm:py-1.5 rounded-md">Nexus v1.0</span>
        </div>
      </div>
    </footer>
  );
}
