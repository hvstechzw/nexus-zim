import { useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { roles, loading: rolesLoading, isAdmin, hasRole } = useHasRole();
  const navigate = useNavigate();

  if (!authLoading && !user) return <Navigate to="/login" replace />;
  const loading = authLoading || rolesLoading;

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name, bio").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const requestedRole = profile?.bio?.startsWith("requested_role:") ? profile.bio.split(":")[1] : null;
  const isCoach = hasRole("coach");
  const isUmpire = hasRole("umpire", "referee");
  const isHIC = hasRole("hic");
  const isPending = requestedRole && requestedRole !== "viewer" && !hasRole(requestedRole as any);

  useEffect(() => {
    // Admins go straight to admin panel
    if (!loading && isAdmin) navigate("/admin", { replace: true });
  }, [loading, isAdmin, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NexusHeader />
      <main className="flex-1 px-4 sm:px-8 py-8 max-w-6xl w-full mx-auto">
        <header className="flex items-start justify-between mb-8 gap-4">
          <div>
            <p className="text-[10px] mono tracking-widest uppercase text-nexus-muted mb-1">Dashboard</p>
            <h1 className="text-2xl sm:text-3xl font-semibold">Hello, {profile?.display_name || user?.email}</h1>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {roles.length === 0 && <span className="text-xs text-nexus-muted">No roles assigned</span>}
              {roles.map(r => <span key={r} className="text-[10px] mono uppercase bg-nexus-surface px-2 py-1 rounded">{r}</span>)}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
        </header>

        {isPending && (
          <div className="hairline rounded-xl p-4 mb-6 bg-nexus-surface/40">
            <p className="text-sm font-medium">Role pending approval</p>
            <p className="text-xs text-nexus-muted mt-1">
              You requested <strong>{requestedRole}</strong> access. An admin will review your request.
            </p>
          </div>
        )}

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isCoach && (
            <Tile to="/coach" title="Coach console" desc="Manage your team sheets and submit line-ups." />
          )}
          {isUmpire && (
            <Tile to="/fixtures" title="My fixtures" desc="Score live matches you're officiating." />
          )}
          {isHIC && (
            <Tile to="/admin" title="HIC verification" desc="Verify player Scholastic Cards before matches." />
          )}
          <Tile to="/live" title="Live scores" desc="Watch all fixtures live." />
          <Tile to="/fixtures" title="Fixtures" desc="Browse schedule and results." />
          <Tile to="/schools" title="Schools" desc="Directory of registered schools." />
        </section>
      </main>
      <NexusFooter />
    </div>
  );
}

function Tile({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="hairline rounded-xl p-5 hover:bg-nexus-surface/60 transition block">
      <div className="text-sm font-semibold mb-1">{title}</div>
      <div className="text-xs text-nexus-muted">{desc}</div>
    </Link>
  );
}
