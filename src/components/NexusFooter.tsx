import aieLogoLight from "@/assets/aie-logo-light.png";

const FOOTER_LINKS = {
  Platform: ["Live Scores", "Events Hub", "League Standings", "Broadcast Stream", "Results Archive"],
  Register: ["Athletes", "Teams & Clubs", "Officials", "School Programs", "National League Entry"],
  Disciplines: ["Track & Field", "Ball Sports", "Aquatics", "Combat Sports", "Smart Games & Academic"],
  Support: ["Contact Us", "Documentation", "Federation Login", "Media & Press", "Privacy Policy"],
};

export function NexusFooter() {
  return (
    <footer className="hairline-t bg-background">
      {/* Main footer body */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-0 hairline-b">
        {/* Brand column */}
        <div className="p-10 md:p-14 lg:hairline-r flex flex-col justify-between gap-10">
          <div>
            <div className="bg-foreground rounded-xl p-5 inline-flex mb-5">
              <img
                src={aieLogoLight}
                alt="Aetheris Innovative Enterprises"
                className="w-28 h-auto object-contain"
                style={{ filter: "brightness(10)" }}
              />
            </div>
            <p className="display-font text-xl font-bold text-foreground tracking-tight">Nexus</p>
            <p className="text-xs text-nexus-muted tracking-wide uppercase mt-1">
              by Aetheris Innovative Enterprises Pvt Ltd
            </p>
          </div>

          <div>
            <p className="text-sm text-nexus-muted leading-relaxed max-w-[40ch]">
              Zimbabwe's national competition infrastructure. Centralising tracking, broadcast,
              and registration for every discipline across every level.
            </p>

            <div className="mt-6">
              <p className="text-xs mono tracking-widest uppercase text-nexus-muted mb-3">National Coverage</p>
              <div className="flex flex-wrap gap-2">
                {["Harare", "Bulawayo", "Mutare", "Gweru", "Masvingo", "Bindura", "Chinhoyi", "Marondera", "Kariba", "Hwange"].map((city) => (
                  <span key={city} className="text-xs mono text-nexus-muted hairline px-2.5 py-1 rounded-md">
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4">
          {Object.entries(FOOTER_LINKS).map(([section, links], i) => (
            <div
              key={section}
              className={`p-10 flex flex-col gap-5 ${i < Object.keys(FOOTER_LINKS).length - 1 ? "hairline-r" : ""}`}
            >
              <p className="text-xs mono tracking-[0.18em] uppercase text-nexus-muted font-semibold">{section}</p>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-foreground hover:text-nexus-muted transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-footer */}
      <div className="max-w-[1400px] mx-auto px-10 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <p className="text-xs mono text-nexus-muted">
            © {new Date().getFullYear()} Aetheris Innovative Enterprises Pvt Ltd. All rights reserved.
          </p>
          <span className="text-xs mono text-nexus-muted hidden md:block">·</span>
          <span className="text-xs mono text-nexus-muted hidden md:block">Registered in Zimbabwe</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs mono text-nexus-muted hairline px-3 py-1.5 rounded-md">
            Nexus v1.0
          </span>
          <span className="text-xs mono text-nexus-muted">
            Precision infrastructure for Zimbabwean sport
          </span>
        </div>
      </div>
    </footer>
  );
}
