import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NashHeader } from "@/components/nash/NashHeader";
import { StatCard } from "@/components/nash/StatCard";
import { CompetitionCard, type Competition } from "@/components/nash/CompetitionCard";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Plus, DollarSign, ShieldCheck, ListChecks } from "lucide-react";

export default function OrganiserDashboard() {
  const { user } = useAuth();
  const [comps, setComps] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) { setLoading(false); return; }
      const { data } = await (supabase as any).from("competitions")
        .select("id,name,discipline,province,tier,age_group,gender,start_date,end_date,host_school_name,total_entries,status,is_nash_sanctioned")
        .eq("created_by", user.id).order("start_date", { ascending: false }).limit(50);
      setComps((data || []) as Competition[]);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Competition Organiser</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">My Competitions</h1>
          </div>
          <Button asChild><Link to="/admin/competitions/new"><Plus className="h-4 w-4 mr-1" /> New Competition</Link></Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="My Competitions" value={comps.length} icon={Trophy} tone="primary" loading={loading} />
          <StatCard label="Pending Approvals" value={0} icon={ListChecks} tone="warning" loading={loading} />
          <StatCard label="Officials Assigned" value={0} icon={ShieldCheck} tone="accent" loading={loading} />
          <StatCard label="Fees Collected (USD)" value="$0" icon={DollarSign} tone="success" loading={loading} />
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><Trophy className="h-4 w-4 text-accent" /> Recent Competitions</CardTitle></CardHeader>
          <CardContent>
            {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
            {!loading && comps.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">You haven't created any competitions yet. <Link to="/admin/competitions/new" className="text-accent hover:underline">Create one →</Link></p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {comps.map((c) => <CompetitionCard key={c.id} comp={c} />)}
            </div>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH & NAPH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}
