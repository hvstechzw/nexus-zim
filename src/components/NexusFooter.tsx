import aieLogoLight from "@/assets/aie-logo-light.png";

const FOOTER_LINKS = {
  Platform: ["Live Scores", "Events Hub", "League Standings", "Broadcast Stream", "Results Archive"],
  Register: ["Athletes", "Teams & Clubs", "Officials", "School Programs", "National League Entry"],
  Disciplines: ["Track & Field", "Ball Sports", "Aquatics", "Combat Sports", "Smart Games & Academic"],
  Support: ["Contact Us", "Documentation", "Federation Login", "Media & Press", "Privacy Policy"],
};

export function NexusFooter() {
  return (
    <footer className="hairline-t">
      {/* Main footer body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr]">
        {/* Brand column */}
        <div className="p-12 md:p-16 hairline-r flex flex-col justify-between gap-10">
          {/* Logo */}
          <div>
            <div className="bg-foreground p-6 inline-flex mb-6">
              <img
                src={aieLogoLight}
                alt="Aetheris Innovative Enterprises"
                className="w-32 h-auto object-contain"
                style={{ filter: "brightness(10)" }}
              />
            </div>
            <p className="display-font text-xl font-semibold text-foreground tracking-tight">Nexus</p>
            <p className="text-xs mono text-nexus-muted tracking-[0.15em] uppercase mt-1">
              by Aetheris Innovative Enterprises Pvt Ltd
            </p>
          </div>

          <div>
            <p className="text-sm text-nexus-muted leading-relaxed max-w-[42ch]">
              Zimbabwe's national competition infrastructure. Centralising tracking, broadcast,
              and registration for every discipline across every level.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <p className="text-xs mono tracking-widest uppercase text-nexus-muted">National Coverage</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {["Harare", "Bulawayo", "Mutare", "Gweru", "Masvingo", "Bindura", "Chinhoyi", "Marondera", "Kariba", "Hwange"].map((city) => (
                  <span key={city} className="text-xs mono text-nexus-muted hairline px-2 py-1">
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
              className={`p-10 flex flex-col gap-5 ${i < Object.keys(FOOTER_LINKS).length - 1 ? "hairline-r" : ""} hairline-b`}
            >
              <p className="text-xs mono tracking-[0.2em] uppercase text-nexus-muted">{section}</p>
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

      {/* Sub-footer / Legal bar */}
      <div className="hairline-t px-12 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <p className="text-xs mono text-nexus-muted">
            © {new Date().getFullYear()} Aetheris Innovative Enterprises Pvt Ltd. All rights reserved.
          </p>
          <span className="hairline-l pl-6 text-xs mono text-nexus-muted hidden md:block">
            Registered in Zimbabwe
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs mono text-nexus-muted hairline px-3 py-1.5">
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
