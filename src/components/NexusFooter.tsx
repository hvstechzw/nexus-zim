// NASH-themed compact footer — replaces the legacy multi-column layout so
// every page that still imports NexusFooter gets consistent NASH branding.
import { Link } from "react-router-dom";

export function NexusFooter() {
  return (
    <footer className="border-t border-border bg-primary/5 mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-center md:text-left">
            <p className="text-xs font-display tracking-wider uppercase">Nexus Zimbabwe</p>
            <p className="text-[10px] text-muted-foreground">Powered by NASH · Integrated with Scholastic Services · Built by Aetheris Innovative Enterprises</p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <Link to="/live" className="hover:text-accent">Live</Link>
            <Link to="/results" className="hover:text-accent">Results</Link>
            <Link to="/calendar" className="hover:text-accent">Calendar</Link>
            <Link to="/schools" className="hover:text-accent">Schools</Link>
            <Link to="/records" className="hover:text-accent">Records</Link>
            <Link to="/dashboard" className="hover:text-accent">Dashboard</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default NexusFooter;
