import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";


type Competition = Tables<"competitions">;
type Team = Tables<"teams">;
type Venue = Tables<"venues">;
type Fixture = Tables<"fixtures"> & {
  home_team?: { name: string } | null;
  away_team?: { name: string } | null;
  venue?: { name: string; city: string } | null;
};

type BracketFormat = "round_robin" | "single_elimination";

interface GeneratedFixture {
  home_team_id: string;
  away_team_id: string;
  home_name: string;
  away_name: string;
  round_number: number;
  round_label: string;
  venue_id: string | null;
  venue_name: string;
  scheduled_at: string | null;
  conflict?: string;
}

export default function FixturesPage() {
  const { user } = useAuth();
  const { loading: rolesLoading, hasRole } = useHasRole();
  const canGenerate = hasRole("super_admin", "admin", "hic", "coach");
  const queryClient = useQueryClient();



  const [selectedCompId, setSelectedCompId] = useState("");
  const [format, setFormat] = useState<BracketFormat>("round_robin");
  const [generated, setGenerated] = useState<GeneratedFixture[]>([]);
  const [startDate, setStartDate] = useState("");
  const [matchInterval, setMatchInterval] = useState(60); // minutes between matches
  const [step, setStep] = useState<"config" | "preview" | "saved">("config");

  // Fetch competitions
  const { data: competitions = [] } = useQuery({
    queryKey: ["fixtures-competitions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("*")
        .in("status", ["draft", "registration_open", "registration_closed", "ongoing"])
        .order("created_at", { ascending: false });
      return (data || []) as Competition[];
    },
  });

  // Fetch teams for selected competition's discipline
  const selectedComp = competitions.find((c) => c.id === selectedCompId);

  const { data: teams = [] } = useQuery({
    queryKey: ["fixtures-teams", selectedComp?.discipline],
    queryFn: async () => {
      if (!selectedComp) return [];
      const { data } = await supabase
        .from("teams")
        .select("*")
        .eq("discipline", selectedComp.discipline)
        .eq("is_active", true)
        .order("name");
      return (data || []) as Team[];
    },
    enabled: !!selectedComp,
  });

  // Fetch venues
  const { data: venues = [] } = useQuery({
    queryKey: ["fixtures-venues"],
    queryFn: async () => {
      const { data } = await supabase.from("venues").select("*").eq("is_active", true).order("name");
      return (data || []) as Venue[];
    },
  });

  // Fetch existing fixtures for conflict detection
  const { data: existingFixtures = [] } = useQuery({
    queryKey: ["fixtures-existing", selectedCompId],
    queryFn: async () => {
      if (!selectedCompId) return [];
      const { data } = await supabase
        .from("fixtures")
        .select("id, home_team_id, away_team_id, venue_id, scheduled_at, round_label, status")
        .eq("competition_id", selectedCompId)
        .order("round_number", { ascending: true });
      return (data || []) as unknown as Fixture[];
    },
    enabled: !!selectedCompId,
  });

  // Team selection
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const toggleTeam = (id: string) => {
    setSelectedTeamIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };
  const selectAllTeams = () => setSelectedTeamIds(teams.map((t) => t.id));

  // Venue pool for rotation
  const [venuePool, setVenuePool] = useState<string[]>([]);
  const toggleVenue = (id: string) => {
    setVenuePool((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  // Generate fixtures
  const generateFixtures = () => {
    const selected = teams.filter((t) => selectedTeamIds.includes(t.id));
    if (selected.length < 2) {
      toast({ title: "Need at least 2 teams", description: "Select more teams to generate fixtures.", variant: "destructive" });
      return;
    }

    let fixtures: GeneratedFixture[] = [];

    if (format === "round_robin") {
      fixtures = generateRoundRobin(selected);
    } else {
      fixtures = generateSingleElimination(selected);
    }

    // Assign venues with rotation
    const availableVenues = venues.filter((v) => venuePool.includes(v.id));
    fixtures = assignVenues(fixtures, availableVenues);

    // Assign times
    if (startDate) {
      fixtures = assignTimes(fixtures, startDate, matchInterval);
    }

    // Conflict checking
    fixtures = checkConflicts(fixtures, existingFixtures);

    setGenerated(fixtures);
    setStep("preview");
  };

  // Round Robin generator
  function generateRoundRobin(teamList: Team[]): GeneratedFixture[] {
    const fixtures: GeneratedFixture[] = [];
    const n = teamList.length;
    const teams_ = [...teamList];
    // If odd number, add a BYE placeholder
    const hasBye = n % 2 !== 0;
    if (hasBye) teams_.push({ id: "BYE", name: "BYE" } as any);
    const total = teams_.length;
    const rounds = total - 1;
    const half = total / 2;

    for (let round = 0; round < rounds; round++) {
      for (let i = 0; i < half; i++) {
        const home = teams_[i];
        const away = teams_[total - 1 - i];
        if (home.id === "BYE" || away.id === "BYE") continue;

        fixtures.push({
          home_team_id: home.id,
          away_team_id: away.id,
          home_name: home.name,
          away_name: away.name,
          round_number: round + 1,
          round_label: `Round ${round + 1}`,
          venue_id: null,
          venue_name: "TBD",
          scheduled_at: null,
        });
      }
      // Rotate: fix first element, rotate rest
      const last = teams_.pop()!;
      teams_.splice(1, 0, last);
    }
    return fixtures;
  }

  // Single Elimination generator
  function generateSingleElimination(teamList: Team[]): GeneratedFixture[] {
    const fixtures: GeneratedFixture[] = [];
    const n = teamList.length;
    // Pad to next power of 2
    const size = Math.pow(2, Math.ceil(Math.log2(n)));
    const shuffled = [...teamList].sort(() => Math.random() - 0.5);
    const padded = [...shuffled, ...Array(size - n).fill(null)];

    let round = 1;
    const roundNames = getRoundNames(size);
    let currentPairs: (Team | null)[][] = [];

    for (let i = 0; i < padded.length; i += 2) {
      currentPairs.push([padded[i], padded[i + 1]]);
    }

    let matchQueue = currentPairs;
    let roundNum = 1;

    while (matchQueue.length > 0) {
      const label = roundNames[roundNum - 1] || `Round ${roundNum}`;
      for (const [home, away] of matchQueue) {
        if (!home || !away) continue; // BYE advances
        fixtures.push({
          home_team_id: home.id,
          away_team_id: away.id,
          home_name: home.name,
          away_name: away.name,
          round_number: roundNum,
          round_label: label,
          venue_id: null,
          venue_name: "TBD",
          scheduled_at: null,
        });
      }
      if (matchQueue.length <= 1) break;
      // Next round has half the matches (placeholders)
      const nextPairs: (Team | null)[][] = [];
      for (let i = 0; i < matchQueue.length; i += 2) {
        nextPairs.push([null, null]); // winners TBD
      }
      matchQueue = nextPairs;
      roundNum++;
    }

    return fixtures;
  }

  function getRoundNames(size: number): string[] {
    const rounds: string[] = [];
    let s = size;
    while (s > 1) {
      if (s === 2) rounds.push("Final");
      else if (s === 4) rounds.push("Semi-Finals");
      else if (s === 8) rounds.push("Quarter-Finals");
      else if (s === 16) rounds.push("Round of 16");
      else if (s === 32) rounds.push("Round of 32");
      else rounds.push(`Round of ${s}`);
      s /= 2;
    }
    return rounds.reverse();
  }

  // Assign venues by rotation
  function assignVenues(fixtures: GeneratedFixture[], availableVenues: Venue[]): GeneratedFixture[] {
    if (availableVenues.length === 0) return fixtures;
    return fixtures.map((f, i) => {
      const venue = availableVenues[i % availableVenues.length];
      return { ...f, venue_id: venue.id, venue_name: venue.name };
    });
  }

  // Assign times
  function assignTimes(fixtures: GeneratedFixture[], start: string, intervalMin: number): GeneratedFixture[] {
    const base = new Date(start);
    let roundMap: Record<number, number> = {};
    return fixtures.map((f) => {
      if (!roundMap[f.round_number]) roundMap[f.round_number] = 0;
      const offset = roundMap[f.round_number]! * intervalMin;
      const time = new Date(base.getTime() + ((f.round_number - 1) * 24 * 60 * 60 * 1000) + offset * 60 * 1000);
      roundMap[f.round_number]!;
      roundMap[f.round_number]!++;
      return { ...f, scheduled_at: time.toISOString() };
    });
  }

  // Conflict check
  function checkConflicts(newFixtures: GeneratedFixture[], existing: Fixture[]): GeneratedFixture[] {
    return newFixtures.map((f) => {
      const conflicts: string[] = [];
      // Check if same teams play at same time
      for (const ex of existing) {
        if (f.scheduled_at && ex.scheduled_at) {
          const fTime = new Date(f.scheduled_at).getTime();
          const eTime = new Date(ex.scheduled_at).getTime();
          const timeDiff = Math.abs(fTime - eTime);
          const twoHours = 2 * 60 * 60 * 1000;
          if (timeDiff < twoHours) {
            // Team conflict
            if ([f.home_team_id, f.away_team_id].includes(ex.home_team_id ?? "") || [f.home_team_id, f.away_team_id].includes(ex.away_team_id ?? "")) {
              conflicts.push("Team already scheduled within 2hrs");
            }
            // Venue conflict
            if (f.venue_id && f.venue_id === ex.venue_id) {
              conflicts.push("Venue double-booked");
            }
          }
        }
      }
      // Also check within generated set
      return { ...f, conflict: conflicts.length ? conflicts.join("; ") : undefined };
    });
  }

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCompId || !user) throw new Error("Not ready");
      const rows = generated
        .filter((f) => f.home_team_id !== "BYE" && f.away_team_id !== "BYE")
        .map((f) => ({
          competition_id: selectedCompId,
          home_team_id: f.home_team_id,
          away_team_id: f.away_team_id,
          round_number: f.round_number,
          round_label: f.round_label,
          venue_id: f.venue_id,
          scheduled_at: f.scheduled_at,
          status: "scheduled" as const,
        }));
      const { error } = await supabase.from("fixtures").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Fixtures saved!", description: `${generated.length} fixtures created successfully.` });
      queryClient.invalidateQueries({ queryKey: ["fixtures-existing"] });
      setStep("saved");
    },
    onError: (e: any) => {
      toast({ title: "Error saving fixtures", description: e.message, variant: "destructive" });
    },
  });

  const conflictCount = generated.filter((f) => f.conflict).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />

      <main className="pt-20 pb-12">
        {/* Page Header */}
        <section className="px-4 sm:px-8 pt-8 pb-6 max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-[10px] mono tracking-[0.25em] uppercase text-nexus-muted mb-2">Tournament Engine</p>
            <h1 className="display-font text-display-lg font-bold text-foreground">Fixture Generator</h1>
            <p className="text-sm text-nexus-muted mt-2 max-w-[60ch]">
              AI-driven scheduling with automatic conflict detection for venues and participants.{" "}
              Select a competition, choose your format, and generate a complete fixture list.
            </p>
          </motion.div>
        </section>

        {/* Stepper */}
        <div className="px-4 sm:px-8 max-w-[1400px] mx-auto mb-8">
          <div className="flex items-center gap-2">
            {["Configure", "Preview & Confirm", "Complete"].map((label, i) => {
              const stepIdx = i === 0 ? "config" : i === 1 ? "preview" : "saved";
              const isActive = step === stepIdx;
              const isDone = (step === "preview" && i === 0) || (step === "saved" && i <= 1);
              return (
                <div key={label} className="flex items-center gap-2">
                  {i > 0 && <div className={`w-8 sm:w-12 h-px ${isDone ? "bg-foreground" : "bg-nexus-silver"}`} />}
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mono tracking-wide transition-all duration-300
                    ${isActive ? "bg-foreground text-primary-foreground" : isDone ? "bg-nexus-surface text-foreground" : "bg-nexus-surface/50 text-nexus-muted"}`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                      ${isActive ? "bg-primary-foreground/20" : isDone ? "bg-foreground/10" : "bg-nexus-silver/50"}`}
                    >
                      {isDone ? "✓" : i + 1}
                    </span>
                    <span className="hidden sm:inline">{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "config" && (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="px-4 sm:px-8 max-w-[1400px] mx-auto space-y-6"
            >
              {/* Competition Select */}
              <div className="hairline rounded-xl p-5 sm:p-8 bg-background card-shadow">
                <h2 className="display-font text-lg font-semibold text-foreground mb-4">1. Select Competition</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {competitions.map((comp) => (
                    <button
                      key={comp.id}
                      onClick={() => {
                        setSelectedCompId(comp.id);
                        setSelectedTeamIds([]);
                      }}
                      className={`p-4 rounded-xl text-left transition-all duration-200 btn-click hairline
                        ${selectedCompId === comp.id ? "bg-foreground text-primary-foreground shadow-lg" : "bg-background hover:bg-nexus-surface"}`}
                    >
                      <p
                        className={`text-[10px] mono tracking-widest uppercase mb-1 ${
                          selectedCompId === comp.id ? "text-primary-foreground/60" : "text-nexus-muted"
                        }`}
                      >
                        {comp.discipline} · {comp.level?.replace(/_/g, " ")}
                      </p>
                      <p className="display-font text-sm font-semibold truncate">{comp.name}</p>
                      <p
                        className={`text-[10px] mono mt-1 ${
                          selectedCompId === comp.id ? "text-primary-foreground/50" : "text-nexus-muted"
                        }`}
                      >
                        {comp.format?.replace(/_/g, " ")} · {comp.status?.replace(/_/g, " ")}
                      </p>
                    </button>
                  ))}
                  {competitions.length === 0 && (
                    <p className="text-nexus-muted mono text-sm col-span-full py-8 text-center">
                      No competitions found. Create one in the Admin Dashboard first.
                    </p>
                  )}
                </div>
              </div>

              {/* Format Select */}
              {selectedCompId && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="hairline rounded-xl p-5 sm:p-8 bg-background card-shadow">
                  <h2 className="display-font text-lg font-semibold text-foreground mb-4">2. Bracket Format</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([
                      { id: "round_robin" as const, title: "Round Robin", desc: "Every team plays every other team. Best for leagues and group stages.", icon: "🔄" },
                      { id: "single_elimination" as const, title: "Single Elimination", desc: "Knockout bracket — lose once and you're out. Best for cups and finals.", icon: "🏆" },
                    ]).map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFormat(f.id)}
                        className={`p-5 rounded-xl text-left transition-all duration-200 btn-click hairline
                          ${format === f.id ? "bg-foreground text-primary-foreground shadow-lg" : "bg-background hover:bg-nexus-surface"}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{f.icon}</span>
                          <div>
                            <p className="display-font text-sm font-semibold">{f.title}</p>
                            <p className={`text-xs mt-1 ${format === f.id ? "text-primary-foreground/60" : "text-nexus-muted"}`}>{f.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Teams */}
              {selectedCompId && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="hairline rounded-xl p-5 sm:p-8 bg-background card-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="display-font text-lg font-semibold text-foreground">3. Select Teams ({selectedTeamIds.length})</h2>
                    <button onClick={selectAllTeams} className="text-xs mono text-nexus-muted hover:text-foreground transition-colors">
                      Select All
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {teams.map((team) => {
                      const active = selectedTeamIds.includes(team.id);
                      return (
                        <button
                          key={team.id}
                          onClick={() => toggleTeam(team.id)}
                          className={`p-3 rounded-lg text-left transition-all duration-200 btn-click text-sm
                            ${active ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-foreground hover:bg-nexus-silver/50"}`}
                        >
                          <p className="font-semibold truncate text-xs">{team.name}</p>
                          <p className={`text-[10px] mono mt-0.5 ${active ? "text-primary-foreground/50" : "text-nexus-muted"}`}>
                            {team.province || team.school_name || team.club_name || "—"}
                          </p>
                        </button>
                      );
                    })}
                    {teams.length === 0 && (
                      <p className="text-nexus-muted mono text-xs col-span-full py-6 text-center">
                        No teams found for discipline "{selectedComp?.discipline}". Add teams in the Admin Dashboard.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Venues & Schedule */}
              {selectedCompId && selectedTeamIds.length >= 2 && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="hairline rounded-xl p-5 sm:p-8 bg-background card-shadow">
                  <h2 className="display-font text-lg font-semibold text-foreground mb-4">4. Venues & Schedule</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs mono text-nexus-muted uppercase tracking-wider mb-3">Venue Pool (for rotation)</p>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {venues.map((v) => {
                          const active = venuePool.includes(v.id);
                          return (
                            <button
                              key={v.id}
                              onClick={() => toggleVenue(v.id)}
                              className={`p-2.5 rounded-lg text-left text-xs transition-all btn-click
                                ${active ? "bg-foreground text-primary-foreground" : "bg-nexus-surface text-foreground hover:bg-nexus-silver/50"}`}
                            >
                              <p className="font-semibold truncate">{v.name}</p>
                              <p className={`text-[10px] mono ${active ? "text-primary-foreground/50" : "text-nexus-muted"}`}>{v.city}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs mono text-nexus-muted uppercase tracking-wider block mb-2">Start Date & Time</label>
                        <input
                          type="datetime-local"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg bg-nexus-surface text-foreground text-sm mono hairline focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        />
                      </div>
                      <div>
                        <label className="text-xs mono text-nexus-muted uppercase tracking-wider block mb-2">Minutes Between Matches</label>
                        <input
                          type="number"
                          value={matchInterval}
                          onChange={(e) => setMatchInterval(Number(e.target.value))}
                          min={15}
                          max={1440}
                          className="w-full h-10 px-3 rounded-lg bg-nexus-surface text-foreground text-sm mono hairline focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Generate Button */}
              {selectedTeamIds.length >= 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
                  <button
                    onClick={generateFixtures}
                    className="h-12 px-8 bg-foreground text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity btn-click flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    Generate {format === "round_robin" ? "Round Robin" : "Knockout"} Fixtures
                  </button>
                </motion.div>
              )}

              {/* Existing Fixtures */}
              {existingFixtures.length > 0 && (
                <div className="hairline rounded-xl p-5 sm:p-8 bg-background card-shadow">
                  <h2 className="display-font text-lg font-semibold text-foreground mb-4">
                    Existing Fixtures ({existingFixtures.length})
                  </h2>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {existingFixtures.map((f) => (
                      <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-nexus-surface/50 text-xs">
                        <div>
                          <span className="font-semibold text-foreground">{(f as any).home_team?.name || "TBD"}</span>
                          <span className="text-nexus-muted mx-2">vs</span>
                          <span className="font-semibold text-foreground">{(f as any).away_team?.name || "TBD"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="mono text-nexus-muted">{f.round_label}</span>
                          <span className={`px-2 py-0.5 rounded-full mono text-[10px] tracking-wider uppercase ${f.status === "live" ? "bg-nexus-live text-primary-foreground" : "bg-nexus-surface text-nexus-muted"}`}>
                            {f.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="px-4 sm:px-8 max-w-[1400px] mx-auto space-y-6"
            >
              {/* Summary */}
              <div className="hairline rounded-xl p-5 sm:p-8 bg-background card-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="display-font text-lg font-semibold text-foreground">
                      Generated: {generated.length} Fixtures
                    </h2>
                    <p className="text-xs mono text-nexus-muted mt-1">
                      {selectedComp?.name} · {format.replace(/_/g, " ")} · {selectedTeamIds.length} teams
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {conflictCount > 0 && (
                      <span className="px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-xs mono">
                        ⚠ {conflictCount} conflict{conflictCount > 1 ? "s" : ""}
                      </span>
                    )}
                    <button onClick={() => setStep("config")} className="h-9 px-5 bg-nexus-surface text-foreground text-xs font-semibold rounded-lg hover:bg-nexus-silver transition-colors btn-click">
                      ← Back
                    </button>
                    <button
                      onClick={() => saveMutation.mutate()}
                      disabled={saveMutation.isPending}
                      className="h-9 px-5 bg-foreground text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity btn-click disabled:opacity-50"
                    >
                      {saveMutation.isPending ? "Saving…" : "Save All Fixtures"}
                    </button>
                  </div>
                </div>

                {/* Fixture list grouped by round */}
                {Object.entries(
                  generated.reduce((acc, f) => {
                    if (!acc[f.round_label]) acc[f.round_label] = [];
                    acc[f.round_label].push(f);
                    return acc;
                  }, {} as Record<string, GeneratedFixture[]>)
                ).map(([round, matches]) => (
                  <div key={round} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-nexus-surface text-foreground text-xs mono font-semibold rounded-full tracking-wider uppercase">{round}</span>
                      <div className="flex-1 h-px bg-nexus-silver" />
                      <span className="text-xs mono text-nexus-muted">{matches.length} match{matches.length > 1 ? "es" : ""}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {matches.map((m, i) => (
                        <div
                          key={i}
                          className={`p-4 rounded-xl hairline flex items-center justify-between gap-4 transition-colors
                            ${m.conflict ? "bg-destructive/5 border-destructive/20" : "bg-background hover:bg-nexus-surface/30"}`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground truncate">{m.home_name}</span>
                              <span className="text-xs text-nexus-muted">vs</span>
                              <span className="text-sm font-semibold text-foreground truncate">{m.away_name}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] mono text-nexus-muted">📍 {m.venue_name}</span>
                              {m.scheduled_at && (
                                <span className="text-[10px] mono text-nexus-muted">
                                  🕐 {new Date(m.scheduled_at).toLocaleString("en-ZW", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </div>
                            {m.conflict && <p className="text-[10px] text-destructive font-medium mt-1">⚠ {m.conflict}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === "saved" && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-4 sm:px-8 max-w-[1400px] mx-auto"
            >
              <div className="hairline rounded-2xl p-10 sm:p-16 bg-background card-shadow-md text-center">
                <div className="w-16 h-16 rounded-full bg-foreground text-primary-foreground flex items-center justify-center mx-auto mb-6 text-2xl">✓</div>
                <h2 className="display-font text-2xl font-bold text-foreground mb-2">Fixtures Created!</h2>
                <p className="text-sm text-nexus-muted max-w-[40ch] mx-auto mb-8">
                  {generated.length} fixtures have been saved for {selectedComp?.name}.{" "}
                  They are now visible to scorers and officials.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setGenerated([]);
                      setStep("config");
                    }}
                    className="h-11 px-6 bg-nexus-surface text-foreground text-sm font-semibold rounded-xl hover:bg-nexus-silver transition-colors btn-click"
                  >
                    Generate More
                  </button>
                  <a
                    href="/scoring"
                    className="h-11 px-6 bg-foreground text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity btn-click flex items-center"
                  >
                    Go to Scoring →
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <NexusFooter />
    </div>
  );
}
