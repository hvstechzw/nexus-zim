import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget mirror push to Scholastic Services bridge.
 * Safe to call from any UI write path — failures are swallowed and logged.
 *
 * Trigger this after any change to an athlete's rankings, personal bests,
 * records, or after a fixture they took part in is completed.
 */
export async function pushAthleteMirror(athleteId: string | null | undefined): Promise<void> {
  if (!athleteId) return;
  try {
    const { error } = await supabase.functions.invoke("scholastic-push", {
      body: { athleteId },
    });
    if (error) console.warn("[scholastic-push]", athleteId, error.message);
  } catch (e) {
    console.warn("[scholastic-push] invoke failed", e);
  }
}

/** Push mirrors for every athlete linked to a finalized fixture. */
export async function pushFixtureMirror(fixtureId: string): Promise<void> {
  try {
    const { data } = await supabase
      .from("fixtures")
      .select("home_athlete_id, away_athlete_id")
      .eq("id", fixtureId)
      .maybeSingle();
    const ids = [data?.home_athlete_id, data?.away_athlete_id].filter(Boolean) as string[];
    await Promise.all(ids.map((id) => pushAthleteMirror(id)));
  } catch (e) {
    console.warn("[scholastic-push] fixture mirror failed", e);
  }
}
