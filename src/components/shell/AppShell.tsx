import { Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/shell/AppHeader";
import { BottomNav } from "@/components/shell/BottomNav";
import { SideRail } from "@/components/shell/SideRail";
import { NexusSlyGuide } from "@/components/sly/NexusSlyGuide";
import { shellVariant } from "@/lib/navModel";

/**
 * The single shell owner (Aetheris §11, §12.6): one header, one destination
 * model, one navigation renderer per breakpoint. Routes never mount their own.
 *
 *  - full: header + desktop rail + mobile bottom navigation
 *  - bare: header only (sign in / register)
 *  - none: no chrome at all (broadcast overlay captured by OBS)
 */
export function AppShell() {
  const { pathname } = useLocation();
  const variant = shellVariant(pathname);

  if (variant === "none") return <Outlet />;

  const full = variant === "full";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main" className="skip-link">Skip to content</a>
      {full && <SideRail />}
      <div className={full ? "lg:pl-[var(--layout-rail-width)]" : ""}>
        <AppHeader showBrand={!full} />
        <div
          id="main"
          tabIndex={-1}
          className="min-h-[calc(100vh-var(--layout-header-height))] outline-none"
          style={full ? { paddingBottom: "var(--layout-nav-clearance)" } : undefined}
        >
          <Outlet />
        </div>
        <footer data-sly="closing" className="rail pb-8 pt-4 text-sm text-supporting lg:pb-8" style={full ? { paddingBottom: "calc(var(--layout-nav-clearance) - 40px)" } : undefined}>
          Nexus runs school sport for NASH and NAPH in Zimbabwe. Built by Aetheris Innovative Enterprises.
        </footer>
      </div>
      {full && <BottomNav />}
      <NexusSlyGuide />
    </div>
  );
}
