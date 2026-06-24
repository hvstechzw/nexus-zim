import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NexusHeader } from "@/components/NexusHeader";

const ROLE_OPTIONS = [
  { value: "viewer", label: "Supporter / Viewer", auto: true },
  { value: "coach", label: "Coach", auto: false },
  { value: "umpire", label: "Umpire / Referee", auto: false },
  { value: "hic", label: "Head in Charge (HIC)", auto: false },
];

export default function RegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] = useState("viewer");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { display_name: displayName, requested_role: requestedRole },
      },
    });
    setBusy(false);
    if (error) { toast({ title: "Sign up failed", description: error.message, variant: "destructive" }); return; }
    const opt = ROLE_OPTIONS.find(r => r.value === requestedRole);
    toast({
      title: "Account created",
      description: opt?.auto ? "You're signed in." : "Role request submitted — an admin will review and approve.",
    });
    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NexusHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm hairline rounded-xl p-8">
          <h1 className="text-2xl font-semibold mb-1">Create account</h1>
          <p className="text-xs text-nexus-muted mb-6">Join Nexus as a supporter, coach, umpire, or HIC.</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Display name</Label>
              <Input id="name" required value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <div>
              <Label>Role</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {ROLE_OPTIONS.map(r => (
                  <button key={r.value} type="button" onClick={() => setRequestedRole(r.value)}
                    className={`hairline rounded-md px-3 py-2 text-xs text-left transition ${requestedRole === r.value ? "bg-foreground text-primary-foreground" : "bg-background hover:bg-nexus-surface"}`}>
                    {r.label}
                    {!r.auto && <div className="text-[9px] opacity-70 mt-0.5">Needs admin approval</div>}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={busy} className="w-full">{busy ? "Creating…" : "Create account"}</Button>
          </form>
          <p className="mt-6 text-xs text-center text-nexus-muted">
            Have an account? <Link to="/login" className="underline hover:text-foreground">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
