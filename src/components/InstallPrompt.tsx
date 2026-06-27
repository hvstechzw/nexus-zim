import { useEffect, useState } from "react";

// Surfaces the browser's "Add to Home Screen" prompt as a dismissible chip so
// officials and fans can install Nexus for one-tap, offline-capable access at
// venues. No-op on browsers that don't support installation or once installed.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "nexus-install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => { setVisible(false); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || !deferred) return null;

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
  };

  const install = async () => {
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } finally {
      setVisible(false);
      setDeferred(null);
    }
  };

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:w-[360px] z-[60] hairline rounded-2xl bg-background card-shadow-md p-4 flex items-center gap-3 animate-fade-in">
      <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center flex-shrink-0">
        <img src="/icon.svg" alt="" className="w-7 h-7" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground leading-tight">Install Nexus</p>
        <p className="text-[11px] text-nexus-muted mt-0.5">Add to your home screen for fast, offline-capable access at venues.</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={dismiss} className="text-[11px] mono text-nexus-muted hover:text-foreground px-2 py-1.5">Later</button>
        <button onClick={install} className="text-[11px] font-semibold bg-foreground text-primary-foreground rounded-lg px-3 py-1.5 hover:opacity-85 btn-click">Install</button>
      </div>
    </div>
  );
}
