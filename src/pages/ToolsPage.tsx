import { Link } from "react-router-dom";
import { NashHeader } from "@/components/nash/NashHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useHasRole, type AppRole } from "@/hooks/useHasRole";
import { Lock, ArrowRight } from "lucide-react";

interface ToolDef {
  label: string;
  to: string;
  blurb: string;
  /** Roles that can use this tool. Empty = anyone signed in. */
  roles?: AppRole[];
}

interface ToolGroup {
  tier: string;
  tools: ToolDef[];
}

// Every module in the app, grouped by the tier that owns it. This is the full
// directory — dashboards only ever surface a handful of "Quick Actions", this
// page is the index of everything a role is entitled to reach.
const TOOL_DIRECTORY: ToolGroup[] = [
  {
    tier: "Public",
    tools: [
      { label: "Live Matches", to: "/live", blurb: "Realtime scores across all 15 sports." },
      { label: "Results", to: "/results", blurb: "Completed fixtures and final scores." },
      { label: "Competition Calendar", to: "/calendar", blurb: "Upcoming fixtures by tier and sport." },
      { label: "Schools Directory", to: "/schools", blurb: "Every school on Nexus, verified by Scholastic Services." },
      { label: "National Records", to: "/records", blurb: "All-time NASH & NAPH records." },
      { label: "Broadcast Gallery", to: "/broadcast", blurb: "Public broadcast graphics showcase." },
    ],
  },
  {
    tier: "Platform",
    tools: [
      { label: "Platform Admin Console", to: "/platform", blurb: "Full system administration.", roles: ["platform_admin", "super_admin", "admin"] },
      { label: "Users & Roles", to: "/admin/dashboard", blurb: "Manage accounts and role approvals.", roles: ["platform_admin", "super_admin", "admin"] },
    ],
  },
  {
    tier: "Federation (NASH / NAPH National)",
    tools: [
      { label: "NASH National Dashboard", to: "/federation/nash", blurb: "Secondary schools federation overview.", roles: ["nash_national", "national_technical_director", "federation_official", "national_admin", "platform_admin", "super_admin", "admin"] },
      { label: "NAPH National Dashboard", to: "/federation/naph", blurb: "Primary schools federation overview.", roles: ["naph_national", "national_technical_director", "federation_official", "national_admin", "platform_admin", "super_admin", "admin"] },
      { label: "Seasons", to: "/admin/seasons", blurb: "Manage competition seasons/terms." },
      { label: "Sports Registry", to: "/admin/sports", blurb: "The 15 sports NASH/NAPH sanctions." },
      { label: "Organisations", to: "/admin/organisations", blurb: "National → provincial → district → zonal tree." },
      { label: "Members", to: "/admin/members", blurb: "Federation officials directory." },
      { label: "Eligibility Flags", to: "/admin/eligibility", blurb: "Review dual-enrollment and eligibility flags." },
      { label: "MoPSE Annual Report", to: "/admin/reports", blurb: "Print-ready ministry report." },
      { label: "Finances", to: "/admin/finances", blurb: "Entry fees, budgets and payouts." },
      { label: "Venues Database", to: "/admin/venues", blurb: "All sanctioned competition venues." },
    ],
  },
  {
    tier: "Provincial / District / Zonal",
    tools: [
      { label: "Provincial Dashboard", to: "/province", blurb: "Provincial-tier competitions and standings.", roles: ["provincial_admin", "provincial_technical_director"] },
      { label: "District Dashboard", to: "/district", blurb: "District-tier competitions and standings.", roles: ["district_admin", "district_technical_director"] },
      { label: "Zonal Dashboard", to: "/zone", blurb: "Zonal-tier fixtures and clusters.", roles: ["zonal_admin"] },
      { label: "Region Requests", to: "/admin/regions", blurb: "Approve pending regional admin requests." },
    ],
  },
  {
    tier: "Competitions & Officiating",
    tools: [
      { label: "Tournament Wizard", to: "/admin/competitions/new", blurb: "11-step competition creation flow." },
      { label: "Competitions", to: "/admin/competitions", blurb: "Manage/delete competitions and fixtures." },
      { label: "Teams", to: "/admin/teams", blurb: "Manage/delete school team rosters." },
      { label: "Officials Registry", to: "/admin/officials", blurb: "Referees, scorers, technical delegates." },
      { label: "Official Dashboard", to: "/official/dashboard", blurb: "Your assignments and match sheets.", roles: ["referee", "scorer", "timekeeper", "technical_delegate", "umpire"] },
      { label: "Assignments", to: "/official/assignments", blurb: "Upcoming officiating assignments.", roles: ["referee", "scorer", "timekeeper", "technical_delegate", "umpire"] },
      { label: "Organiser Dashboard", to: "/organiser/dashboard", blurb: "Run your competitions end to end.", roles: ["competition_organiser", "hic"] },
      { label: "Broadcast CG Control", to: "/broadcast", blurb: "Score bug, lower thirds, sponsor ticker.", roles: ["competition_organiser", "hic", "broadcaster", "technical_delegate", "platform_admin", "super_admin", "admin"] },
    ],
  },
  {
    tier: "School",
    tools: [
      { label: "School / Coach Dashboard", to: "/school/dashboard", blurb: "Your teams, fixtures and roster.", roles: ["school_head", "coach", "team_manager", "school_coordinator"] },
      { label: "Team Registration", to: "/school/teams", blurb: "Register teams for a competition.", roles: ["school_head", "coach", "team_manager", "school_coordinator"] },
      { label: "Athletes Registry", to: "/school/players", blurb: "Your school's NASH athlete records.", roles: ["school_head", "coach", "team_manager", "school_coordinator"] },
      { label: "Register Athlete", to: "/admin/athletes/new", blurb: "Add an athlete, with dual-enrollment checks." },
      { label: "Athletes Registry (federation)", to: "/admin/athletes", blurb: "Full athlete registry across all schools." },
      { label: "Eligibility (school view)", to: "/school/eligibility", blurb: "Flags raised for your athletes.", roles: ["school_head", "coach", "team_manager", "school_coordinator"] },
    ],
  },
  {
    tier: "Athlete / Parent",
    tools: [
      { label: "Athlete Dashboard", to: "/athlete/profile", blurb: "Your profile, stats and NASH ID card.", roles: ["athlete", "parent"] },
      { label: "My Stats", to: "/athlete/stats", blurb: "Career stats across competitions.", roles: ["athlete", "parent"] },
      { label: "My Competitions", to: "/athlete/competitions", blurb: "Competitions you're registered in.", roles: ["athlete", "parent"] },
      { label: "Card Verification", to: "/admin/verify", blurb: "Verify identity via Scholastic Card." },
    ],
  },
];

function ToolCard({ tool, allowed }: { tool: ToolDef; allowed: boolean }) {
  return (
    <Link
      to={tool.to}
      className={`hairline rounded-xl p-4 flex flex-col gap-2 transition-colors ${allowed ? "bg-background hover:bg-nexus-surface" : "bg-nexus-surface/40 opacity-60"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-display font-semibold">{tool.label}</p>
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
              <CardTitle className="text-base font-display tracking-wide">{group.tier}</CardTitle>
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
