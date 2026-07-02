import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AppRole } from "@/hooks/useHasRole";
import { Button } from "@/components/ui/button";

type Assignment = {
  id: string;
  user_id: string;
  level: "zonal" | "district" | "provincial" | "national";
  zone_name: string | null;
  district_name: string | null;
  province_name: string | null;
  status: "pending" | "approved" | "revoked";
  approved_at: string | null;
  created_at: string;
  notes: string | null;
};

const LEVEL_TO_ROLE: Record<Assignment["level"], AppRole> = {
  zonal: "zonal_admin",
  district: "district_admin",
  provincial: "provincial_admin",
  national: "national_admin",
};

const regionLabel = (a: Assignment) =>
  [a.zone_name, a.district_name, a.province_name].filter(Boolean).join(" • ") || "—";

/** Super-admin only. Review and approve/revoke zonal/district/provincial/national admin requests. */
export function RegionRequestsPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Assignment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { display_name: string | null }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "revoked" | "all">("pending");

  async function load() {
    const { data, error } = await supabase
      .from("region_admin_assignments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Load failed", description: error.message, variant: "destructive" });
      return;
    }
    setItems((data || []) as Assignment[]);
    const ids = Array.from(new Set((data || []).map((d: any) => d.user_id)));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
      const map: Record<string, { display_name: string | null }> = {};
      (ps || []).forEach((p: any) => {
        map[p.user_id] = { display_name: p.display_name };
      });
      setProfiles(map);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(a: Assignment) {
    if (!user) return;
    setBusy(a.id);
    const role = LEVEL_TO_ROLE[a.level];
    const { error: roleErr } = await (supabase.from("user_roles") as any).insert({ user_id: a.user_id, role });
    if (roleErr && !roleErr.message.includes("duplicate")) {
      setBusy(null);
      toast({ title: "Could not grant role", description: roleErr.message, variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("region_admin_assignments")
      .update({ status: "approved", approved_by: user.id, approved_at: new Date().toISOString() })
      .eq("id", a.id);
    setBusy(null);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Approved", description: `${role} • ${regionLabel(a)}` });
    load();
  }

  async function revoke(a: Assignment) {
    if (!confirm("Revoke this regional admin assignment?")) return;
    setBusy(a.id);
    const role = LEVEL_TO_ROLE[a.level];
    await supabase.from("user_roles").delete().eq("user_id", a.user_id).eq("role", role as any);
    const { error } = await supabase.from("region_admin_assignments").update({ status: "revoked" }).eq("id", a.id);
    setBusy(null);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Revoked" });
    load();
  }

  const filtered = items.filter((a) => filter === "all" || a.status === filter);

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="hairline rounded-xl p-6 bg-card card-shadow">
        <h2 className="display-font text-xl font-bold text-foreground">Region Admin Requests</h2>
        <p className="text-xs text-nexus-muted mt-1 mb-4">
          Approve or revoke zonal, district, provincial and national admin assignments. Approved admins can authorise sporting
          activities in their jurisdiction.
        </p>
        <div className="flex gap-2 flex-wrap">
          {(["pending", "approved", "revoked", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-md hairline ${
                filter === f ? "bg-foreground text-primary-foreground" : "hover:bg-nexus-surface"
              }`}
            >
              {f[0].toUpperCase() + f.slice(1)}
              <span className="ml-1.5 opacity-60">{items.filter((x) => f === "all" || x.status === f).length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="hairline rounded-xl bg-card overflow-hidden">
        {filtered.length === 0 && (
          <p className="p-12 text-center text-xs text-nexus-muted mono">No {filter === "all" ? "" : filter} assignments.</p>
        )}
        <ul className="divide-y divide-border">
          {filtered.map((a) => (
            <li key={a.id} className="p-4 flex flex-wrap items-center gap-3 justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {profiles[a.user_id]?.display_name || a.user_id.slice(0, 8)}
                  <span className="ml-2 text-[10px] mono uppercase tracking-wider text-nexus-muted">{a.level}</span>
                </p>
                <p className="text-xs text-nexus-muted">{regionLabel(a)}</p>
                {a.notes && <p className="text-[10px] text-nexus-muted mt-1 italic">{a.notes}</p>}
                <p className="text-[10px] mono text-nexus-muted mt-1">
                  Requested {new Date(a.created_at).toLocaleString()}
                  {a.approved_at ? ` · Approved ${new Date(a.approved_at).toLocaleString()}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] mono uppercase tracking-wider px-2 py-1 rounded ${
                    a.status === "approved"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : a.status === "revoked"
                        ? "bg-red-500/10 text-red-600"
                        : "bg-amber-500/10 text-amber-600"
                  }`}
                >
                  {a.status}
                </span>
                {a.status === "pending" && (
                  <Button size="sm" disabled={busy === a.id} onClick={() => approve(a)}>
                    {busy === a.id ? "…" : "Approve"}
                  </Button>
                )}
                {a.status === "approved" && (
                  <Button size="sm" variant="ghost" disabled={busy === a.id} onClick={() => revoke(a)}>
                    Revoke
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
