// Follow / unfollow toggle for athletes, teams, schools and competitions.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type FollowEntity = "athlete" | "school_team" | "competition" | "school";

export function FollowButton({
  entityType,
  entityId,
  size = "sm",
}: {
  entityType: FollowEntity;
  entityId: string;
  size?: "sm" | "default";
}) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ count: total }, mine] = await Promise.all([
        supabase
          .from("follows")
          .select("id", { count: "exact", head: true })
          .eq("entity_type", entityType)
          .eq("entity_id", entityId),
        user
          ? supabase
              .from("follows")
              .select("id")
              .eq("entity_type", entityType)
              .eq("entity_id", entityId)
              .eq("user_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (!active) return;
      setCount(total ?? 0);
      setFollowing(!!(mine as any)?.data);
    })();
    return () => {
      active = false;
    };
  }, [entityType, entityId, user]);

  const toggle = async () => {
    if (!user) {
      toast.error("Sign in to follow.");
      return;
    }
    setBusy(true);
    if (following) {
      await supabase
        .from("follows")
        .delete()
        .eq("user_id", user.id)
        .eq("entity_type", entityType)
        .eq("entity_id", entityId);
      setFollowing(false);
      setCount((c) => Math.max(0, c - 1));
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ user_id: user.id, entity_type: entityType, entity_id: entityId });
      if (error) toast.error(error.message);
      else {
        setFollowing(true);
        setCount((c) => c + 1);
      }
    }
    setBusy(false);
  };

  return (
    <Button onClick={toggle} disabled={busy} size={size} variant={following ? "secondary" : "default"}>
      {following ? "Following" : "Follow"} · {count}
    </Button>
  );
}
