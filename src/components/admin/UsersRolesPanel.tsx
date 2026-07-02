import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole } from "@/hooks/useHasRole";

interface UserRow {
  user_id: string;
  display_name: string | null;
  email: string | null;
  roles: AppRole[];
}

const GRANTABLE: AppRole[] = [
  // Platform / federation
  "platform_admin",
  "admin",
  "nash_national",
  "naph_national",
  "national_technical_director",
  "national_admin",
  "federation_official",
  // Provincial / district / zonal
  "provincial_admin",
  "provincial_technical_director",
  "district_admin",
  "district_technical_director",
  "zonal_admin",
  // School
  "school_head",
  "coach",
  "team_manager",
  "school_coordinator",
  "hic",
  // Officials
  "referee",
  "umpire",
  "scorer",
  "timekeeper",
  "technical_delegate",
  // Operations / athlete
  "competition_organiser",
  "broadcaster",
  "athlete",
  "parent",
  "viewer",
];

const inputCls =
  "bg-nexus-surface hairline rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 w-full";

/**
 * Super-admin only. Lists users + their roles, lets the admin grant/revoke any role except super_admin.
 * super_admin grants are intentionally not exposed — bootstrap via direct DB write.
 */
export function UsersRolesPanel() {
  const { toast } = useToast();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .order("display_name", { ascending: true })
      .limit(500);
    if (error) {
      toast({ title: "Load failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const ids = (profiles || []).map((p: any) => p.user_id);
    let rolesByUser: Record<string, AppRole[]> = {};
    if (ids.length) {
      const { data: rs } = await supabase.from("user_roles").select("user_id, role").in("user_id", ids);
      (rs || []).forEach((r: any) => {
        rolesByUser[r.user_id] = [...(rolesByUser[r.user_id] || []), r.role];
      });
    }
    setRows(
      (profiles || []).map((p: any) => ({
        user_id: p.user_id,
        display_name: p.display_name,
        email: null,
        roles: rolesByUser[p.user_id] || [],
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function grant(userId: string, role: AppRole) {
    setBusy(userId + role);
    const { error } = await (supabase.from("user_roles") as any).insert({ user_id: userId, role });
    setBusy(null);
    if (error && !error.message.includes("duplicate")) {
      toast({ title: "Grant failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Granted ${role}` });
    load();
  }

  async function revoke(userId: string, role: AppRole) {
    if (!confirm(`Revoke ${role}?`)) return;
    setBusy(userId + role);
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    setBusy(null);
    if (error) {
      toast({ title: "Revoke failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Revoked ${role}` });
    load();
  }

  const filtered = rows.filter(
    (r) => !search || (r.display_name || "").toLowerCase().includes(search.toLowerCase()) || r.user_id.includes(search),
  );

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="hairline rounded-xl p-6 bg-card card-shadow">
        <h2 className="display-font text-xl font-bold text-foreground">Users &amp; Roles</h2>
        <p className="text-xs text-nexus-muted mt-1 mb-4">
          Grant or revoke any role except super admin. super_admin is bootstrapped directly in the database.
        </p>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search display name or user id…"
          className={inputCls + " max-w-md"}
        />
      </div>

      <div className="hairline rounded-xl bg-card overflow-hidden">
        {loading ? (
          <p className="p-12 text-center text-xs text-nexus-muted mono">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-12 text-center text-xs text-nexus-muted mono">No users.</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((u) => (
              <li key={u.user_id} className="p-4 flex flex-wrap gap-4 items-start">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{u.display_name || u.user_id.slice(0, 8)}</p>
                  <p className="text-[10px] mono text-nexus-muted">{u.user_id}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {u.roles.length === 0 && <span className="text-[10px] mono text-nexus-muted">no roles</span>}
                    {u.roles.map((r) => (
                      <span
                        key={r}
                        className={`text-[10px] mono uppercase tracking-wider px-2 py-1 rounded ${
                          r === "super_admin"
                            ? "bg-foreground text-primary-foreground"
                            : "bg-nexus-surface text-foreground"
                        } flex items-center gap-1`}
                      >
                        {r}
                        {r !== "super_admin" && (
                          <button
                            onClick={() => revoke(u.user_id, r)}
                            disabled={busy === u.user_id + r}
                            className="opacity-60 hover:opacity-100"
                            title="Revoke"
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <select
                    onChange={(e) => {
                      const v = e.target.value as AppRole;
                      if (v) grant(u.user_id, v);
                      e.target.value = "";
                    }}
                    className={inputCls + " max-w-[200px] text-xs"}
                    defaultValue=""
                  >
                    <option value="">+ Grant role…</option>
                    {GRANTABLE.filter((r) => !u.roles.includes(r)).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
