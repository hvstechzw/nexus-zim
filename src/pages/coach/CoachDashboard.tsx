import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NashHeader } from "@/components/nash/NashHeader";
import { StatCard } from "@/components/nash/StatCard";
import { CompetitionCard, type Competition } from "@/components/nash/CompetitionCard";
import { EligibilityIndicator } from "@/components/nash/EligibilityIndicator";
import { SportBadge } from "@/components/nash/SportBadge";
import { SeasonSelector, type NashSeason } from "@/components/nash/SeasonSelector";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Users, Trophy, AlertTriangle, Calendar, ArrowRight, Plus, FileText, ListChecks } from "lucide-react";

interface SquadMember {
  id: string;
  jersey_number: number | null;
  age_group: string | null;
  is_captain: boolean | null;
  registration_status: string | null;
  academic_eligible: boolean | null;
  medical_cleared: boolean | null;
  athlete?: { first_name: string; last_name: string; nash_id: string } | null;
  team?: { name: string; discipline: string; age_group: string | null; gender: string | null } | null;
}

interface Stats {
  squadSize: number;
  flaggedAthletes: number;
  upcomingFixtures: number;
  pendingApprovals: number;
}

/**
 * Coach Dashboard — sport- and school-scoped. Shows the registered squad with
 * per-player eligibility, upcoming fixtures, season results, and a registration
 * deadline countdown.
 */
export default function CoachDashboard() {
  const { user } = useAuth();
  const [seasonId, setSeasonId] = useState<string>("");
  const [season, setSeason] = useState<NashSeason | undefined>();
  const [stats, setStats] = useState<Stats>({ squadSize: 0, flaggedAthletes: 0, upcomingFixtures: 0, pendingApprovals: 0 });
  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [upcoming, setUpcoming] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!seasonId || !user) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const sb = supabase as any;
      // Squad scoped to coach's user (via school_teams.created_by) for this season
      const [squadRes, compsRes] = await Promise.all([
        sb.from("nash_athlete_registrations")
          .select("id,jersey_number,age_group,is_captain,registration_status,academic_eligible,medical_cleared,athlete:nash_athlete_id(first_name,last_name,nash_id),team:school_team_id(name,discipline,age_group,gender,created_by)")
          .eq("season_id", seasonId)
          .limit(200),
        sb.from("competitions")
          .select("id,name,discipline,province,tier,age_group,gender,start_date,end_date,host_school_name,total_entries,status,is_nash_sanctioned")
          .eq("season_id", seasonId)
          .gte("start_date", new Date().toISOString().slice(0, 10))
          .order("start_date", { ascending: true })
          .limit(6),
      ]);
      if (cancelled) return;
      const squadRaw: any[] = squadRes.data || [];
      // Filter to teams owned by this coach
      const myRows = squadRaw.filter((r) => r.team?.created_by === user.id);
      setSquad(myRows as SquadMember[]);
      const flagged = myRows.filter((r) => !r.academic_eligible || !r.medical_cleared || r.registration_status === "rejected").length;
      const pending = myRows.filter((r) => r.registration_status === "pending").length;
      setStats({
        squadSize: myRows.length,
        flaggedAthletes: flagged,
        upcomingFixtures: (compsRes.data || []).length,
        pendingApprovals: pending,
      });
      setUpcoming((compsRes.data || []) as Competition[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [seasonId, user]);

  const deadline = season?.registration_deadline ? new Date(season.registration_deadline) : null;
  const daysToDeadline = deadline ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Coach Dashboard</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">{user?.email?.split("@")[0] ?? "Coach"}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{season?.name ?? "Current season"}</p>
          </div>
          <div className="flex items-end gap-2">
            <SeasonSelector value={seasonId} onChange={(id, s) => { setSeasonId(id); setSeason(s); }} className="h-9 w-56" />
            <Button asChild><Link to="/coach/registration"><Plus className="h-4 w-4 mr-1" /> Register Team</Link></Button>
          </div>
        </div>

        {deadline && daysToDeadline !== null && daysToDeadline > 0 && daysToDeadline < 30 && (
          <Card className="border-accent/40 bg-accent/5">
            <CardContent className="p-3 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-accent" />
              <div className="flex-1 text-sm">
                <span className="font-semibold">Registration closes in {daysToDeadline} day{daysToDeadline === 1 ? "" : "s"}</span>
                <span className="text-muted-foreground"> · {deadline.toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Squad Size" value={stats.squadSize} icon={Users} tone="primary" loading={loading} />
          <StatCard label="Eligibility Issues" value={stats.flaggedAthletes} icon={AlertTriangle} tone={stats.flaggedAthletes > 0 ? "error" : "success"} loading={loading} />
          <StatCard label="Pending Approval" value={stats.pendingApprovals} icon={ListChecks} tone={stats.pendingApprovals > 0 ? "warning" : "muted"} loading={loading} />
          <StatCard label="Upcoming Fixtures" value={stats.upcomingFixtures} icon={Trophy} tone="accent" loading={loading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><Users className="h-4 w-4 text-accent" /> My Squad</CardTitle>
              <Link to="/coach/registration" className="text-xs text-accent hover:underline">Manage →</Link>
            </CardHeader>
            <CardContent className="p-0">
              {squad.length === 0 && !loading && (
                <div className="p-8 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">No registered athletes yet for this season.</p>
                  <Button asChild size="sm" variant="outline"><Link to="/coach/registration">Start Registration</Link></Button>
                </div>
              )}
              {squad.length > 0 && (
                <div className="divide-y divide-border/50">
                  {squad.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/5">
                      <span className="font-mono text-xs text-muted-foreground w-8 text-right">{m.jersey_number ?? "—"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {m.athlete ? `${m.athlete.first_name} ${m.athlete.last_name}` : "—"}
                          {m.is_captain && <Badge variant="outline" className="ml-2 text-[9px]">C</Badge>}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">{m.athlete?.nash_id}</div>
                      </div>
                      {m.team?.discipline && <SportBadge code={m.team.discipline.toUpperCase().slice(0, 2)} />}
                      {m.age_group && <Badge variant="secondary" className="text-[10px] font-mono">{m.age_group}</Badge>}
                      <EligibilityIndicator
                        status={
                          m.registration_status === "rejected" ? "suspended" :
                          !m.academic_eligible || !m.medical_cleared ? "flagged" :
                          m.registration_status === "pending" ? "pending" : "clear"
                        }
                        reason={!m.academic_eligible ? "Academic check failed" : !m.medical_cleared ? "Medical clearance missing" : undefined}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><ArrowRight className="h-4 w-4 text-accent" /> Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start h-10"><Link to="/coach/registration"><Plus className="h-4 w-4 mr-2 text-accent" />Register / update team</Link></Button>
              <Button asChild variant="outline" className="w-full justify-start h-10"><Link to="/school/eligibility"><AlertTriangle className="h-4 w-4 mr-2 text-accent" />Check eligibility flags</Link></Button>
              <Button asChild variant="outline" className="w-full justify-start h-10"><Link to="/coach/team-sheet/new"><FileText className="h-4 w-4 mr-2 text-accent" />Generate team sheet</Link></Button>
              <Button asChild variant="outline" className="w-full justify-start h-10"><Link to="/fixtures"><Calendar className="h-4 w-4 mr-2 text-accent" />My fixtures</Link></Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" /> Upcoming Fixtures</CardTitle>
            <Link to="/calendar" className="text-xs text-accent hover:underline">Calendar →</Link>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
            {!loading && upcoming.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No upcoming fixtures for this season.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcoming.map((c) => <CompetitionCard key={c.id} comp={c} />)}
            </div>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}
