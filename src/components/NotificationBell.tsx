import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications, type NotificationRow } from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/timeAgo";

export function NotificationBell() {
  const { notifications, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const go = async (n: NotificationRow) => {
    if (!n.is_read) await markRead(n.id);
    setOpen(false);
    const fixtureId = n.data?.fixture_id as string | undefined;
    const competitionId = n.data?.competition_id as string | undefined;
    if (fixtureId) navigate(`/live/${fixtureId}`);
    else if (competitionId) navigate(`/competition/${competitionId}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-nexus-surface hover:bg-nexus-silver transition-colors btn-click"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-nexus-live text-primary-foreground text-[9px] mono font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[320px] max-w-[calc(100vw-2rem)] hairline rounded-xl bg-background card-shadow-md z-[70] overflow-hidden">
          <div className="px-4 py-3 hairline-b flex items-center justify-between">
            <p className="text-xs mono tracking-widest uppercase text-nexus-muted font-semibold">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[11px] mono text-nexus-muted hover:text-foreground">Mark all read</button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center"><p className="text-xs mono text-nexus-muted">No notifications yet.</p></div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => go(n)}
                  className={`w-full text-left px-4 py-3 hairline-b last:border-b-0 hover:bg-nexus-surface/50 transition-colors flex gap-3 ${n.is_read ? "" : "bg-nexus-surface/30"}`}
                >
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${n.is_read ? "bg-transparent" : "bg-nexus-live"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground truncate">{n.title}</span>
                    {n.body && <span className="block text-[11px] text-nexus-muted mt-0.5 line-clamp-2">{n.body}</span>}
                  </span>
                  <span className="text-[10px] mono text-nexus-muted flex-shrink-0">{timeAgo(n.created_at)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
