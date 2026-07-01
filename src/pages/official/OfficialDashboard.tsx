import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NashHeader } from "@/components/nash/NashHeader";
import { StatCard } from "@/components/nash/StatCard";
import { SportBadge } from "@/components/nash/SportBadge";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, ShieldCheck, DollarSign, Award, Clock } from "lucide-react";

interface OfficialProfile {
  id: string; nash_official_id: string; first_name: string; last_name: string;
  primary_role: string | null; grade: string | null; sports: string[] | null;
  certification_expiry: string | null; total_matches: number | null;
  performance_rating: number | null; province: string | null; district: string | null;
}

export default function OfficialDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<OfficialProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data } = await (supabase as any)
        .from("nash_officials").select("*").eq("user_id", user.id).maybeSingle();
      setProfile(data as OfficialProfile | null);
      setLoading(false);
    })();
  }, [user]);

  const certDaysLeft = profile?.certification_expiry ?
    Math.ceil((new Date(profile.certification_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Official Dashboard</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
              {profile ? `${profile.first_name} ${profile.last_name}` : (user?.email?.split("@")[0] ?? "Official")}
            </h1>
            {profile?.nash_official_id && (
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">{profile.nash_official_id} · Grade {profile.grade ?? "—"}</p>
            )}
          </div>
          {profile?.sports && profile.sports.length > 0 && (
            <div className="flex flex-wrap gap-1">{profile.sports.map((c) => <SportBadge key={c} code={c} />)}</div>
          )}
        </div>

        {!profile && !loading && (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-4 text-sm">
              You're signed in as an official but don't yet have an entry in the NASH officials registry. Contact your district's referee coordinator to be added.
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Upcoming Assignments" value={0} icon={Calendar} tone="primary" />
          <StatCard label="Matches This Season" value={0} icon={Award} tone="accent" />
          <StatCard label="Total Career" value={profile?.total_matches ?? 0} icon={Award} tone="primary" />
          <StatCard
            label="Cert Expires"
            value={certDaysLeft !== null ? `${certDaysLeft}d` : "—"}
            hint={profile?.certification_expiry ? new Date(profile.certification_expiry).toLocaleDateString() : undefined}
            icon={ShieldCheck}
            tone={certDaysLeft !== null && certDaysLeft < 30 ? "warning" : "success"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" /> Upcoming Assignments</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-6 text-center">No assignments yet. District coordinators will assign you to fixtures.</p>
              <Button asChild variant="outline" className="w-full"><Link to="/official/assignments">View all assignments →</Link></Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><DollarSign className="h-4 w-4 text-accent" /> Stipends</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-6 text-center">No pending stipend payments.</p>
              <p className="text-[10px] text-muted-foreground text-center">Match fees are tracked through nash_entry_fee_payments and disbursed by the host organiser.</p>
            </CardContent>
          </Card>
        </div>

        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}
