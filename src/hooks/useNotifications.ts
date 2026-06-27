import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean | null;
  created_at: string;
}

// User notifications with realtime updates + read management.
export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["notifications", user?.id];

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data || []) as NotificationRow[];
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", user.id] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, qc]);

  const notifications = query.data || [];
  const unread = notifications.filter((n) => !n.is_read).length;

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: key });
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    qc.invalidateQueries({ queryKey: key });
  };

  return { notifications, unread, markRead, markAllRead, loading: query.isLoading };
}
