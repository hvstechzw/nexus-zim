// Man-of-the-Match voting widget. One vote per user per fixture.
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Candidate = { athlete_id: string; name: string; team_side: "home" | "away" };

export function MoMVote({ fixtureId }: { fixtureId: string }) {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [tally, setTally] = useState<Record<string, number>>({});
  const [myVote, setMyVote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      // Pull players who appeared in match events
      const { data: evs } = await supabase
        .from("match_events")
        .select("player_id, team_side")
        .eq("fixture_id", fixtureId)
        .not("player_id", "is", null);
      const ids = Array.from(new Set((evs ?? []).map((e: any) => e.player_id)));
      const sideMap: Record<string, "home" | "away"> = {};
      (evs ?? []).forEach((e: any) => { sideMap[e.player_id] = e.team_side; });
      if (ids.length === 0) { setCandidates([]); return; }
      const { data: ath } = await supabase
        .from("athletes")
        .select("id, display_name, first_name, last_name")
        .in("id", ids);
      const list: Candidate[] = (ath ?? []).map((a: any) => ({
        athlete_id: a.id,
        name: a.display_name || `${a.first_name ?? ""} ${a.last_name ? a.last_name[0] + "." : ""}`.trim(),
        team_side: sideMap[a.id] ?? "home",
      }));
      const { data: votes } = await supabase
        .from("vw_mom_tally")
        .select("athlete_id, votes")
        .eq("fixture_id", fixtureId);
      const t: Record<string, number> = {};
      (votes ?? []).forEach((v: any) => { t[v.athlete_id] = v.votes; });
      const mine = user
        ? (await supabase.from("mom_votes").select("athlete_id").eq("fixture_id", fixtureId).eq("user_id", user.id).maybeSingle()).data
        : null;
      if (!active) return;
      setCandidates(list);
      setTally(t);
      setMyVote((mine as any)?.athlete_id ?? null);
    })();

    const channel = supabase
      .channel(`mom-${fixtureId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mom_votes", filter: `fixture_id=eq.${fixtureId}` },
        async () => {
          const { data: votes } = await supabase
            .from("vw_mom_tally").select("athlete_id, votes").eq("fixture_id", fixtureId);
          const t: Record<string, number> = {};
          (votes ?? []).forEach((v: any) => { t[v.athlete_id] = v.votes; });
          setTally(t);
        })
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [fixtureId, user]);

  const total = useMemo(() => Object.values(tally).reduce((a, b) => a + b, 0), [tally]);

  const vote = async (athleteId: string) => {
    if (!user) { toast.error("Sign in to vote."); return; }
    setBusy(true);
    if (myVote) {
      await supabase.from("mom_votes").delete().eq("fixture_id", fixtureId).eq("user_id", user.id);
    }
    const { error } = await supabase.from("mom_votes").insert({
      fixture_id: fixtureId, athlete_id: athleteId, user_id: user.id,
    });
    if (error) toast.error(error.message);
    else setMyVote(athleteId);
    setBusy(false);
  };

  if (candidates.length === 0) {
    return <div className="text-xs opacity-60">MoM voting opens once players are credited with actions.</div>;
  }

  return (
    <div className="space-y-2">
      <div className="text-xs uppercase opacity-60 flex justify-between">
        <span>Man of the Match</span><span>{total} votes</span>
      </div>
      <div className="space-y-1">
        {candidates.map((c) => {
          const v = tally[c.athlete_id] ?? 0;
          const pct = total > 0 ? Math.round((v / total) * 100) : 0;
          const mine = myVote === c.athlete_id;
          return (
            <div key={c.athlete_id} className="rounded-md border p-2">
              <div className="flex items-center justify-between">
                <div className="text-sm truncate">
                  <Badge variant="outline" className="mr-2 uppercase text-[10px]">{c.team_side}</Badge>
                  {c.name}
                </div>
                <Button size="sm" variant={mine ? "secondary" : "default"} disabled={busy} onClick={() => vote(c.athlete_id)}>
                  {mine ? "Voted" : "Vote"} · {v}
                </Button>
              </div>
              <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
