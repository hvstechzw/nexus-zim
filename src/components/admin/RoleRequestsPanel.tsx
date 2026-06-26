import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AppRole } from "@/hooks/useHasRole";
import { Button } from "@/components/ui/button";

interface RoleRequest {
  id: string;
  user_id: string;
  requested_role: AppRole;
  status: "pending" | "approved" | "rejected" | "revoked";
  payload: Record<string, any>;
  notes: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

const STATUS_TINT: Record<RoleRequest["status"], string> = {
  pending: "bg-amber-500/10 text-amber-600",
  approved: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-red-500/10 text-red-600",
  revoked: "bg-zinc-500/10 text-zinc-600",
};

/**
 * Super-admin panel for reviewing every role application submitted via /register.
 * Shows role-specific details (school, sport, certification, region, …) and
 * grants/revokes the role on approval.
 */
export function RoleRequestsPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<RoleRequest[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { display_name: string | null }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<RoleRequest["status"] | "all">("pending");

  async function load() {
    const { data, error } = await supabase
      .from("role_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Load failed", description: error.message, variant: "destructive" });
      return;
    }
    setItems((data || []) as RoleRequest[]);
    const ids = Array.from(new Set((data || []).map((d: any) => d.user_id)));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
      const map: Record<string, { display_name: string | null }> = {};
      (ps || []).forEach((p: any) => { map[p.user_id] = { display_name: p.display_name }; });
      setProfiles(map);
    }
  }
  useEffect(() => { load(); }, []);

  async function approve(r: RoleRequest) {
    if (!user) return;
    setBusy(r.id);
    const { error: roleErr } = await supabase.from("user_roles").insert({ user_id: r.user_id, role: r.requested_role });
    if (roleErr && !roleErr.message.includes("duplicate")) {
      setBusy(null);
      toast({ title: "Could not grant role", description: roleErr.message, variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("role_requests")
      .update({ status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq("id", r.id);
    setBusy(null);
    if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Approved ${r.requested_role}` });
    load();
  }

  async function reject(r: RoleRequest) {
    const reason = prompt("Reason for rejection (shown to user):", "") || "";
    setBusy(r.id);
    const { error } = await supabase.from("role_requests")
      .update({ status: "rejected", reviewed_by: user?.id, reviewed_at: new Date().toISOString(), review_notes: reason })
      .eq("id", r.id);
    setBusy(null);
    if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Rejected" });
    load();
  }

  async function revoke(r: RoleRequest) {
    if (!confirm(`Revoke ${r.requested_role}?`)) return;
    setBusy(r.id);
    await supabase.from("user_roles").delete().eq("user_id", r.user_id).eq("role", r.requested_role);
    const { error } = await supabase.from("role_requests").update({ status: "revoked" }).eq("id", r.id);
    setBusy(null);
    if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Revoked" });
    load();
  }

  const filtered = items.filter(i => filter === "all" || i.status === filter);

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="hairline rounded-xl p-6 bg-background card-shadow">
        <h2 className="display-font text-xl font-bold text-foreground">Role Applications</h2>
        <p className="text-xs text-nexus-muted mt-1 mb-4">
          Every signup that requested a coach, official, media, federation, or regional role lands here. Approving grants the role automatically.
        </p>
        <div className="flex gap-2 flex-wrap">
          {(["pending","approved","rejected","revoked","all"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-md hairline ${filter === f ? "bg-foreground text-primary-foreground" : "hover:bg-nexus-surface"}`}>
              {f[0].toUpperCase() + f.slice(1)}
              <span className="ml-1.5 opacity-60">{items.filter(x => f === "all" || x.status === f).length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="hairline rounded-xl bg-background overflow-hidden">
        {filtered.length === 0 && (
          <p className="p-12 text-center text-xs text-nexus-muted mono">No {filter === "all" ? "" : filter} applications.</p>
        )}
        <ul className="divide-y divide-border">
          {filtered.map(r => {
            const p = r.payload || {};
            const entries = Object.entries(p).filter(([k, v]) => v && !["display_name","phone"].includes(k));
            return (
              <li key={r.id} className="p-4 flex flex-wrap items-start gap-3 justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {profiles[r.user_id]?.display_name || p.display_name || r.user_id.slice(0,8)}
                    <span className="ml-2 text-[10px] mono uppercase tracking-wider text-nexus-muted">{r.requested_role}</span>
                  </p>
                  {p.phone && <p className="text-[10px] mono text-nexus-muted">{p.phone}</p>}
                  {entries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {entries.map(([k, v]) => (
                        <span key={k} className="text-[10px] mono px-2 py-0.5 rounded bg-nexus-surface">
                          <span className="opacity-60">{k}:</span> {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                  {r.notes && <p className="text-[10px] text-nexus-muted mt-1 italic">“{r.notes}”</p>}
                  {r.review_notes && <p className="text-[10px] text-red-600 mt-1">Reviewer: {r.review_notes}</p>}
                  <p className="text-[10px] mono text-nexus-muted mt-1">
                    Requested {new Date(r.created_at).toLocaleString()}
                    {r.reviewed_at ? ` · Reviewed ${new Date(r.reviewed_at).toLocaleString()}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] mono uppercase tracking-wider px-2 py-1 rounded ${STATUS_TINT[r.status]}`}>{r.status}</span>
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" disabled={busy === r.id} onClick={() => approve(r)}>{busy === r.id ? "…" : "Approve"}</Button>
                      <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => reject(r)}>Reject</Button>
                    </>
                  )}
                  {r.status === "approved" && (
                    <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => revoke(r)}>Revoke</Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
