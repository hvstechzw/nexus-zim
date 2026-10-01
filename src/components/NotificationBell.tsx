import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications, type NotificationRow } from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/timeAgo";

/** Header bell: the one entry to the notification inbox (§12.5). Opening it marks nothing read. */
export function NotificationBell() {
  const { notifications, unread, markRead, markAllRead, loading } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const go = async (n: NotificationRow) => {
    if (!n.is_read) await markRead(n.id);
    setOpen(false);
    const fixtureId = n.data?.fixture_id as string | undefined;
    const competitionId = n.data?.competition_id as string | undefined;
    if (fixtureId) navigate(`/live/${fixtureId}`);
    else if (competitionId) navigate(`/competition/${competitionId}`);
  };

  const label = unread > 0 ? `Notifications, ${unread} unread` : "Notifications";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-foreground hover:bg-accent"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-0.5 top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold leading-none text-primary-foreground tabular"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] max-w-[calc(100vw-32px)] overflow-hidden rounded-xl p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-foreground underline underline-offset-4"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="px-4 py-8 text-center text-sm text-supporting" role="status">Loading notifications…</p>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium">You're up to date</p>
              <p className="mt-1 text-sm text-supporting">Follow a team or competition and updates will appear here.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => go(n)}
                className={`flex min-h-11 w-full gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-accent ${n.is_read ? "" : "bg-secondary"}`}
              >
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm ${n.is_read ? "font-medium" : "font-semibold"}`}>
                    {!n.is_read && <span className="mr-2 inline-block rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">Unread</span>}
                    {n.title}
                  </span>
                  {n.body && <span className="mt-0.5 line-clamp-2 block text-sm text-supporting">{n.body}</span>}
                </span>
                <span className="shrink-0 text-xs text-supporting tabular">{timeAgo(n.created_at)}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
