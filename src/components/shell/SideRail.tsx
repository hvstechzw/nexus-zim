import { Link, NavLink, useLocation } from "react-router-dom";
import { BrandLockup } from "@/components/Brand";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { GLOBAL_DESTINATIONS, isInside, toolsForPerson } from "@/lib/navModel";
import { cn } from "@/lib/utils";

/**
 * Desktop rail (§11.3): 240px, the same global destinations in the same order as
 * the mobile bar, then the tools this person can use, grouped under visible headings.
 */
export function SideRail() {
  const { user } = useAuth();
  const { hasRole } = useHasRole();
  const { pathname } = useLocation();
  const globalPaths = new Set(GLOBAL_DESTINATIONS.map((d) => d.to));
  const groups = toolsForPerson(!!user, hasRole)
    .map((g) => ({ ...g, tools: g.tools.filter((t) => !globalPaths.has(t.to)) }))
    .filter((g) => g.tools.length > 0);

  const itemCls = (active: boolean) =>
    cn(
      "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm",
      active ? "bg-secondary font-semibold text-foreground" : "text-supporting hover:bg-accent hover:text-foreground",
    );

  return (
    <aside className="fixed inset-y-0 left-0 z-navigation hidden w-[var(--layout-rail-width)] flex-col border-r border-border bg-background lg:flex">
      <div className="flex h-[var(--layout-header-height)] shrink-0 items-center px-4">
        <BrandLockup to="/" subtitle="NASH & NAPH" />
      </div>
      <nav aria-label="Primary" data-sly="nav" className="flex-1 overflow-y-auto px-3 pb-6">
        <ul className="space-y-1">
          {GLOBAL_DESTINATIONS.map((d) => {
            const active = isInside(pathname, d);
            const Icon = d.icon;
            return (
              <li key={d.id}>
                <Link to={d.to} aria-current={active ? "page" : undefined} className={itemCls(active)}>
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{d.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {groups.map((group) => (
          <div key={group.tier} className="mt-6 border-t border-border pt-4">
            <h2 className="px-3 pb-1 font-body text-xs font-semibold uppercase tracking-wider text-supporting">
              {group.tier}
            </h2>
            <ul className="space-y-1">
              {group.tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <li key={tool.to + tool.label}>
                    <NavLink
                      to={tool.to}
                      end
                      className={({ isActive }) => itemCls(isActive)}
                      aria-label={tool.label}
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{tool.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
