import { useEffect, useState } from "react";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";

// Public, no-login local scoring sandbox — for training, friendlies, practice runs.
// Stays in browser memory only, never hits the database.

interface ScoreLine { id: string; name: string; score: number; }

export default function PracticeScoringPage() {
  useEffect(() => { document.title = "Practice Scoring — Nexus"; }, []);
  const [title, setTitle] = useState("Practice Match");
  const [lines, setLines] = useState<ScoreLine[]>([
    { id: "a", name: "Team A", score: 0 },
    { id: "b", name: "Team B", score: 0 },
  ]);
  const [newName, setNewName] = useState("");

  const adjust = (id: string, delta: number) => setLines((l) => l.map((x) => x.id === id ? { ...x, score: Math.max(0, x.score + delta) } : x));
  const rename = (id: string, name: string) => setLines((l) => l.map((x) => x.id === id ? { ...x, name } : x));
  const remove = (id: string) => setLines((l) => l.filter((x) => x.id !== id));
  const add = () => { if (newName.trim()) { setLines((l) => [...l, { id: crypto.randomUUID(), name: newName.trim(), score: 0 }]); setNewName(""); } };
  const reset = () => setLines((l) => l.map((x) => ({ ...x, score: 0 })));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />
      <main className="pt-16 sm:pt-20">
        <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-6">
          <div>
            <p className="text-[10px] sm:text-xs mono tracking-[0.25em] uppercase text-nexus-muted">Public · No Login</p>
            <h1 className="display-font text-2xl sm:text-3xl font-bold mt-1 tracking-tight">Practice Scoreboard</h1>
            <p className="text-xs sm:text-sm text-nexus-muted mt-1">A free local scoreboard for training and friendly matches. Nothing is saved.</p>
          </div>

          <input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-nexus-surface hairline rounded-xl px-5 py-3 text-base font-semibold w-full focus:outline-none focus:ring-2 focus:ring-foreground/20" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lines.map((l) => (
              <div key={l.id} className="hairline rounded-2xl p-5 bg-background card-shadow flex flex-col gap-3">
                <input value={l.name} onChange={(e) => rename(l.id, e.target.value)} className="bg-transparent text-sm font-semibold focus:outline-none border-b border-transparent focus:border-foreground/30 pb-1" />
                <p className="score-display text-6xl text-center">{l.score}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button onClick={() => adjust(l.id, -1)} className="h-10 rounded-lg bg-nexus-surface hover:bg-nexus-silver text-sm font-semibold">−1</button>
                  <button onClick={() => adjust(l.id, 1)} className="h-10 rounded-lg bg-foreground text-primary-foreground hover:opacity-85 text-sm font-semibold">+1</button>
                  <button onClick={() => adjust(l.id, 5)} className="h-10 rounded-lg bg-nexus-surface hover:bg-nexus-silver text-sm font-semibold">+5</button>
                </div>
                <button onClick={() => remove(l.id)} className="text-[10px] mono text-nexus-muted hover:text-foreground">Remove</button>
              </div>
            ))}
          </div>

          <div className="hairline rounded-xl p-4 bg-background flex flex-col sm:flex-row gap-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="New team name…" className="bg-nexus-surface hairline rounded-lg px-4 py-2.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-foreground/20" />
            <button onClick={add} className="h-10 px-5 text-xs font-semibold rounded-lg bg-foreground text-primary-foreground hover:opacity-85">Add Team</button>
            <button onClick={reset} className="h-10 px-5 text-xs font-semibold rounded-lg bg-nexus-surface hover:bg-nexus-silver">Reset Scores</button>
          </div>
        </div>
      </main>
      <NexusFooter />
    </div>
  );
}
