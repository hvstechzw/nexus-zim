import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else { setSuccess("Signed in!"); setTimeout(onClose, 800); }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name }, emailRedirectTo: window.location.origin },
      });
      if (error) setError(error.message);
      else setSuccess("Check your email to confirm your account.");
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "hsl(0 0% 0% / 0.5)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="bg-background hairline rounded-2xl p-8 w-full max-w-[400px] card-shadow-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="display-font text-xl font-bold text-foreground tracking-tight">
                {mode === "signin" ? "Sign In" : "Create Account"}
              </h2>
              <p className="text-xs text-nexus-muted mt-0.5">Nexus · Aetheris Platform</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-nexus-surface hover:bg-nexus-silver transition-colors text-nexus-muted hover:text-foreground"
            >
              ✕
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1.5 p-1.5 bg-nexus-surface rounded-xl mb-6">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 text-xs tracking-wide font-semibold rounded-lg transition-all duration-200 btn-click capitalize
                  ${mode === m ? "bg-background text-foreground shadow-sm" : "text-nexus-muted hover:text-foreground"}`}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                  placeholder="Tinashe Moyo"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                placeholder="email@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] mono tracking-[0.15em] uppercase text-nexus-muted font-semibold">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs mono text-foreground bg-nexus-surface hairline rounded-lg px-4 py-2.5">{error}</p>
            )}
            {success && (
              <p className="text-xs mono text-nexus-muted bg-nexus-surface hairline rounded-lg px-4 py-2.5">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-11 text-sm font-semibold tracking-wide rounded-xl bg-foreground text-primary-foreground hover:opacity-85 transition-opacity btn-click disabled:opacity-50 mt-1"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
