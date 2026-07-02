import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { TOOL_DIRECTORY, type ToolDef } from "@/lib/toolDirectory";
import { cn } from "@/lib/utils";
import { ChevronsLeft, ChevronsRight, Lock, ShieldCheck, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const COLLAPSE_KEY = "nexus-sidebar-collapsed";

/**
 * Collapsible tools sidebar opened from the header hamburger. Every module in
 * TOOL_DIRECTORY, grouped by tier, with the current role's inaccessible tools
 * shown locked rather than hidden — matches /tools but as a persistent rail.
 */
export function ToolsSidebar({ open, onClose }: Props) {
  const { user } = useAuth();
  const { hasRole, loading } = useHasRole();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      return !c;
    });
  };

  const canUse = (tool: ToolDef) => {
    if (!tool.roles || tool.roles.length === 0) return !!user;
    return hasRole(...tool.roles);
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-50 bg-card border-r border-border shadow-2xl overflow-hidden transition-transform duration-200 flex flex-col",
          collapsed ? "w-16" : "w-72",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-14 flex items-center gap-2 px-3 border-b border-border shrink-0">
          <ShieldCheck className="h-5 w-5 text-accent shrink-0" />
          {!collapsed && <span className="font-display font-bold text-sm tracking-wide flex-1">Tools</span>}
          <button onClick={toggleCollapsed} className="h-8 w-8 rounded-lg hover:bg-nexus-surface flex items-center justify-center shrink-0" title={collapsed ? "Expand" : "Collapse"}>
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-nexus-surface flex items-center justify-center shrink-0 md:hidden" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {TOOL_DIRECTORY.map((group) => (
            <div key={group.tier} className="mb-1">
              {!collapsed && (
                <p className="px-3 pt-3 pb-1 text-[9px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <group.icon className="h-3 w-3" /> {group.tier}
                </p>
              )}
              {group.tools.map((tool) => {
                const allowed = loading ? true : canUse(tool);
                const active = location.pathname === tool.to;
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.to + tool.label}
                    to={tool.to}
                    onClick={onClose}
                    title={collapsed ? tool.label : undefined}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                      active ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-nexus-surface",
                      !allowed && "opacity-50",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate flex-1">{tool.label}</span>}
                    {!collapsed && !allowed && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="p-3 border-t border-border shrink-0">
            <p className="text-[9px] text-muted-foreground text-center">Powered by NASH &amp; NAPH</p>
          </div>
        )}
      </aside>
    </>
  );
}

export default ToolsSidebar;
