import { Link } from "react-router-dom";
import { BrandLockup } from "@/components/Brand";
import { ScholasticBadge } from "@/components/ScholasticBadge";
import aetherisLogo from "@/assets/aetheris-logo.png.asset.json";
import scholasticLogo from "@/assets/scholastic-logo.png.asset.json";

const FOOTER_LINKS: Record<string, { label: string; to: string }[]> = {
  Platform: [
    { label: "Live Scores", to: "/live" },
    { label: "Fixtures", to: "/fixtures" },
    { label: "Schools", to: "/schools" },
    { label: "Inter-School", to: "/inter-school" },
  ],
  Sports: [
    { label: "Handball", to: "/fixtures?sport=handball" },
    { label: "Netball", to: "/fixtures?sport=netball" },
  ],
  Account: [
    { label: "Sign In", to: "/login" },
    { label: "Register", to: "/register" },
    { label: "Dashboard", to: "/dashboard" },
  ],
  Support: [
    { label: "Scholastic Services", to: "https://scholasticservices.online" },
    { label: "Practice Scoring", to: "/scoring/practice" },
  ],
};


export function NexusFooter() {
  return (
    <footer className="hairline-t bg-background">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0 hairline-b">
        {/* Brand */}
        <div className="p-6 sm:p-10 md:p-14 lg:hairline-r flex flex-col justify-between gap-8 sm:gap-10">
          <div>
            <BrandLockup
              to="/"
              glyphClass="w-11 h-11 text-xl rounded-xl"
              wordClass="text-xl sm:text-2xl"
              subtitle="Inter-School Sports"
              className="mb-4 sm:mb-5"
            />
            <div className="flex items-center gap-2 mt-3">
              <img src={aetherisLogo.url} alt="Aetheris Innovative Enterprises" className="w-7 h-7 rounded-md bg-white p-0.5" />
              <p className="text-[10px] sm:text-xs text-nexus-muted tracking-wide uppercase">by Aetheris Innovative Enterprises</p>
            </div>
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
                  <li key={link.label}>
                    {link.to.startsWith("http") ? (
                      <a href={link.to} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-foreground hover:text-nexus-muted transition-colors duration-200">{link.label}</a>
                    ) : (
                      <Link to={link.to} className="text-xs sm:text-sm text-foreground hover:text-nexus-muted transition-colors duration-200">{link.label}</Link>
                    )}
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
        <a href="https://scholasticservices.online" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold text-foreground hover:opacity-70 transition-opacity">
          <img src={scholasticLogo.url} alt="" className="w-5 h-5 rounded-md bg-white p-0.5" />
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
