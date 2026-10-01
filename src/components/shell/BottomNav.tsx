import { Link, useLocation } from "react-router-dom";
import { CENTRE_DESTINATION_ID, GLOBAL_DESTINATIONS, isInside } from "@/lib/navModel";
import { cn } from "@/lib/utils";

/**
 * Mobile navigation shell (§11.1): fixed, 60px high, at most 480px wide, 16px
 * from both sides, offset by the safe area. Five destinations in the 2 / 1 / 2
 * geometry; the centre target is 58×58 and still shows its label. Slots never
 * change size with state. `data-v1-nav` lets Sly step aside when it is touched.
 */
export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary"
      data-v1-nav
      data-sly="nav"
      className="fixed left-4 right-4 z-navigation mx-auto flex h-[var(--layout-nav-height)] max-w-[var(--layout-nav-mobile)] items-center justify-between rounded-full border border-border bg-background px-2 shadow-md lg:hidden"
      style={{ bottom: "var(--layout-nav-bottom)" }}
    >
      {GLOBAL_DESTINATIONS.map((d) => {
        const active = isInside(pathname, d);
        const centre = d.id === CENTRE_DESTINATION_ID;
        const Icon = d.icon;
        return (
          <Link
            key={d.id}
            to={d.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-full text-xs font-medium",
              centre ? "h-[58px] w-[58px]" : "h-[54px] w-14",
              active && centre && "bg-primary text-primary-foreground",
              active && !centre && "bg-secondary font-semibold text-foreground",
              !active && centre && "border border-control bg-card text-foreground",
              !active && !centre && "text-supporting hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className={centre ? "h-[26px] w-[26px]" : "h-[22px] w-[22px]"} aria-hidden="true" />
            <span className="leading-none">{d.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
