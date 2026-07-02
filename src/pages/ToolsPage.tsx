import { Link } from "react-router-dom";
import { NashHeader } from "@/components/nash/NashHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { TOOL_DIRECTORY, type ToolDef } from "@/lib/toolDirectory";
import { Lock, ArrowRight } from "lucide-react";

function ToolCard({ tool, allowed }: { tool: ToolDef; allowed: boolean }) {
  const Icon = tool.icon;
  return (
    <Link
      to={tool.to}
      className={`hairline rounded-xl p-4 flex flex-col gap-2 transition-colors ${allowed ? "bg-background hover:bg-nexus-surface" : "bg-nexus-surface/40 opacity-60"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 text-accent shrink-0" />
          <p className="text-sm font-display font-semibold truncate">{tool.label}</p>
        </span>
        {allowed ? <ArrowRight className="h-3.5 w-3.5 text-accent shrink-0" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
      </div>
      <p className="text-xs text-muted-foreground">{tool.blurb}</p>
    </Link>
  );
}

export default function ToolsPage() {
  const { user } = useAuth();
  const { roles, hasRole, loading } = useHasRole();

  const canUse = (tool: ToolDef) => {
    if (!tool.roles || tool.roles.length === 0) return !!user;
    return hasRole(...tool.roles);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NashHeader />
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 space-y-8">
        <div>
          <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-accent">Directory</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight mt-1">All Tools</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every module across Nexus, grouped by tier. Tools you don't currently have access to are shown greyed out —
            request the matching role via <Link to="/register" className="underline">registration</Link>.
          </p>
          {!loading && user && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {roles.map((r) => <Badge key={r} variant="secondary" className="text-[10px] font-mono">{r}</Badge>)}
            </div>
          )}
        </div>

        {TOOL_DIRECTORY.map((group) => (
          <Card key={group.tier}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display tracking-wide flex items-center gap-2">
                <group.icon className="h-4 w-4 text-accent" /> {group.tier}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.tools.map((tool) => (
                  <ToolCard key={tool.to + tool.label} tool={tool} allowed={canUse(tool)} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
      </main>
      <NexusFooter />
    </div>
  );
}
