import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const TILES = [
  { to: "/live", title: "Live scores", desc: "Real-time handball & netball fixtures.", tag: "Watch" },
  { to: "/fixtures", title: "Fixtures & results", desc: "Browse the full schedule and outcomes.", tag: "Browse" },
  { to: "/register", title: "Join as coach or umpire", desc: "Request a role — HIC reviews and approves.", tag: "Sign up", guestOnly: true },
  { to: "/dashboard", title: "Your dashboard", desc: "Jump back into your tools and tasks.", tag: "Open", authOnly: true },
];

export function HomeQuickActions() {
  const { user } = useAuth();
  const items = TILES.filter(t => (!t.guestOnly || !user) && (!t.authOnly || user));

  return (
    <section className="px-4 sm:px-8 py-10 hairline-b">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[10px] mono tracking-widest uppercase text-nexus-muted">Quick actions</p>
          {user ? (
            <Link to="/dashboard" className="text-[11px] mono text-nexus-muted hover:text-foreground">All tools →</Link>
          ) : (
            <Link to="/login" className="text-[11px] mono text-nexus-muted hover:text-foreground">Sign in →</Link>
          )}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map(t => (
            <Link key={t.to} to={t.to} className="hairline rounded-xl p-5 hover:bg-nexus-surface/60 transition group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] mono uppercase tracking-widest text-nexus-muted">{t.tag}</span>
                <span className="text-nexus-muted group-hover:text-foreground transition">→</span>
              </div>
              <div className="text-sm font-semibold mb-1">{t.title}</div>
              <div className="text-xs text-nexus-muted">{t.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
