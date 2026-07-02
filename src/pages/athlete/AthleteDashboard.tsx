import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NashHeader } from "@/components/nash/NashHeader";
import { StatCard } from "@/components/nash/StatCard";
import { EligibilityIndicator } from "@/components/nash/EligibilityIndicator";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Trophy, Award, Calendar, IdCard, AlertTriangle } from "lucide-react";

interface AthleteProfile {
  id: string; nash_id: string; first_name: string; last_name: string;
  date_of_birth: string | null; gender: string | null; province: string | null;
  current_school_name: string | null; is_suspended: boolean | null; is_active: boolean | null;
  id_verified: boolean | null; ss_student_id: string | null; photo_url: string | null;
}

interface Stats { registrations: number; awards: number; flags: number; }

export default function AthleteDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [stats, setStats] = useState<Stats>({ registrations: 0, awards: 0, flags: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) { setLoading(false); return; }
      // Try resolve via legacy athletes table (which links user_id) → nash_athlete_id
      const { data: link } = await (supabase as any).from("athletes").select("nash_athlete_id").eq("user_id", user.id).maybeSingle();
      if (link?.nash_athlete_id) {
        const sb = supabase as any;
        const [{ data: reg }, regCount, awardCount, flagCount] = await Promise.all([
          sb.from("nash_athlete_registry").select("*").eq("id", link.nash_athlete_id).maybeSingle(),
          sb.from("nash_athlete_registrations").select("id", { count: "exact", head: true }).eq("nash_athlete_id", link.nash_athlete_id),
          sb.from("nash_awards").select("id", { count: "exact", head: true }).eq("nash_athlete_id", link.nash_athlete_id),
          sb.from("nash_eligibility_flags").select("id", { count: "exact", head: true }).eq("nash_athlete_id", link.nash_athlete_id).eq("status", "open"),
        ]);
        setProfile(reg as AthleteProfile | null);
        setStats({
          registrations: regCount.count ?? 0,
          awards: awardCount.count ?? 0,
          flags: flagCount.count ?? 0,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Athlete</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
              {profile ? `${profile.first_name} ${profile.last_name}` : (user?.email?.split("@")[0] ?? "My Profile")}
            </h1>
            {profile && (
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                {profile.nash_id} · {profile.current_school_name ?? "—"} · {profile.province ?? ""}
              </p>
            )}
          </div>
          {profile && (
            <EligibilityIndicator
              status={profile.is_suspended ? "suspended" : profile.is_active ? "clear" : "flagged"}
            />
          )}
        </div>

        {!profile && !loading && (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-4 text-sm">
              No athlete record linked to your account yet. Your coach or school sports master registers athletes in the NASH registry.
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Team Registrations" value={stats.registrations} icon={Trophy} tone="primary" loading={loading} />
          <StatCard label="Eligibility Flags" value={stats.flags} icon={AlertTriangle} tone={stats.flags > 0 ? "error" : "success"} loading={loading} />
          <StatCard label="Awards" value={stats.awards} icon={Award} tone="success" loading={loading} />
          <StatCard label="SS Link" value={profile?.ss_student_id ? "Linked" : "—"} icon={IdCard} tone={profile?.ss_student_id ? "accent" : "muted"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" /> Upcoming Fixtures</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground py-6 text-center">Fixtures will appear as your teams register for competitions.</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Identity</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">NASH ID</span><span className="font-mono text-accent">{profile?.nash_id ?? "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">ID Verified</span>{profile?.id_verified ? <Badge variant="outline" className="text-[10px] border-[hsl(var(--nash-success))]/50 text-[hsl(var(--nash-success))]">Verified</Badge> : <span className="text-xs">Pending</span>}</div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Scholastic Card</span>{profile?.ss_student_id ? <Badge variant="outline" className="text-[10px] border-accent/50 text-accent">SS-Linked</Badge> : <span className="text-xs">—</span>}</div>
              <Button asChild variant="outline" size="sm" className="w-full mt-2"><Link to="/athletes/id-cards"><IdCard className="h-4 w-4 mr-1" /> View ID card</Link></Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}
