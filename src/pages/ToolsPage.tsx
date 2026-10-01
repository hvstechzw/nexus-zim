import { Link } from "react-router-dom";
import { NashHeader } from "@/components/nash/NashHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { TOOL_DIRECTORY, type ToolDef } from "@/lib/toolDirectory";
import { toolsForPerson } from "@/lib/navModel";
import { ArrowRight } from "lucide-react";

function ToolCard({ tool }: { tool: ToolDef }) {
  const Icon = tool.icon;
  return (
    <Link
      to={tool.to}
      className="flex min-h-11 flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm hover:border-control hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 text-foreground shrink-0" />
          <p className="text-sm font-display font-semibold truncate">{tool.label}</p>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      </div>
      <p className="text-sm text-supporting">{tool.blurb}</p>
    </Link>
  );
}

export default function ToolsPage() {
  const { user } = useAuth();
  const { roles, hasRole, loading } = useHasRole();

  // Same capability-based model as the rail: tools you cannot use are not listed (Aetheris §12.2).
  const groups = toolsForPerson(!!user, hasRole).map((g) => ({
    ...g,
    icon: TOOL_DIRECTORY.find((d) => d.tier === g.tier)!.icon,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NashHeader />
      <main className="max-w-workspace mx-auto px-4 md:px-6 py-8 space-y-8">
        <div>
          <p className="text-xs font-mono tracking-[0.2em] uppercase text-foreground">Directory</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight mt-1">All Tools</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every module your role can open, grouped by tier. Need another? Ask for the matching role when you{" "}
            <Link to="/register" className="underline underline-offset-4">register</Link>.
          </p>
          {!loading && user && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {roles.map((r) => <Badge key={r} variant="secondary" className="text-xs font-mono">{r}</Badge>)}
            </div>
          )}
        </div>

        {groups.map((group) => (
          <Card key={group.tier}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display tracking-wide flex items-center gap-2">
                <group.icon className="h-4 w-4 text-foreground" /> {group.tier}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.tools.map((tool) => (
                  <ToolCard key={tool.to + tool.label} tool={tool} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <p className="text-xs text-muted-foreground text-center pt-2">Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
      </main>
      <NexusFooter />
    </div>
  );
}
