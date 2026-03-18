import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { useAuth } from "@/context/AuthContext";

type Athlete = {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  province: string;
  disciplines: string[];
  date_of_birth: string | null;
  school_name: string | null;
  club_name: string | null;
  id_card_number: string | null;
  qr_code: string | null;
  photo_url: string | null;
  is_active: boolean | null;
  is_suspended: boolean | null;
  medical_waiver_signed: boolean | null;
  personal_bests: Record<string, unknown> | null;
  created_at: string;
};

const DISCIPLINES_COLORS: Record<string, string> = {
  Football: "bg-foreground text-primary-foreground",
  Athletics: "bg-muted text-foreground",
  Cricket: "bg-foreground text-primary-foreground",
  Volleyball: "bg-muted text-foreground",
  Basketball: "bg-foreground text-primary-foreground",
  Rugby: "bg-muted text-foreground",
  Swimming: "bg-foreground text-primary-foreground",
  Chess: "bg-muted text-foreground",
  Debate: "bg-foreground text-primary-foreground",
  Quiz: "bg-muted text-foreground",
  Netball: "bg-foreground text-primary-foreground",
  Hockey: "bg-muted text-foreground",
};

function AthleteIDCard({ athlete }: { athlete: Athlete }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const year = athlete.date_of_birth ? new Date(athlete.date_of_birth).getFullYear() : null;
  const age = year ? new Date().getFullYear() - year : null;
  const cardNum = athlete.id_card_number || `ZIM-${athlete.id.slice(0, 8).toUpperCase()}`;

  // Simple deterministic QR-like pattern using athlete ID
  const qrSeed = athlete.id.replace(/-/g, "");
  const qrCells = Array.from({ length: 121 }, (_, i) => parseInt(qrSeed[i % qrSeed.length], 16) % 2 === 0);

  const handlePrint = () => {
    if (!cardRef.current) return;
    const w = window.open("", "_blank", "width=500,height=340");
    if (!w) return;
    w.document.write(`<html><head><title>Athlete ID — ${athlete.first_name} ${athlete.last_name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: 500px; font-family: 'Segoe UI', sans-serif; background: #fff; }
      </style>
    </head><body>${cardRef.current.outerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group">
      {/* The printable card */}
      <div ref={cardRef} className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden bg-foreground text-primary-foreground shadow-2xl" style={{ maxWidth: 420 }}>
        {/* Header strip */}
        <div className="absolute inset-x-0 top-0 h-[6px] bg-primary-foreground/20" />
        {/* Grid pattern background */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 20px,#fff 20px,#fff 21px),repeating-linear-gradient(90deg,transparent,transparent 20px,#fff 20px,#fff 21px)" }} />
        
        <div className="relative z-10 p-5 h-full flex flex-col justify-between">
          {/* Top: organization + card type */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[8px] tracking-[0.3em] uppercase opacity-60 font-semibold">NEXUS · Zimbabwe Sports Grid</p>
              <p className="text-[11px] tracking-[0.12em] uppercase font-bold mt-0.5">Official Athlete ID</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] tracking-widest uppercase opacity-50">Season 2026</p>
              {athlete.is_suspended ? (
                <span className="text-[9px] tracking-widest font-bold text-red-300">SUSPENDED</span>
              ) : (
                <span className="text-[9px] tracking-widest font-bold opacity-70">{athlete.is_active !== false ? "ACTIVE" : "INACTIVE"}</span>
              )}
            </div>
          </div>

          {/* Middle: photo + details */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 border-primary-foreground/20 bg-primary-foreground/10">
              {athlete.photo_url ? (
                <img src={athlete.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black opacity-50">
                  {athlete.first_name[0]}{athlete.last_name[0]}
                </div>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black leading-tight tracking-tight truncate">
                {athlete.display_name || `${athlete.first_name} ${athlete.last_name}`}
              </h2>
              <p className="text-[11px] opacity-60 mt-0.5">{athlete.first_name} {athlete.last_name}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {athlete.disciplines.slice(0, 3).map(d => (
                  <span key={d} className="text-[8px] tracking-[0.12em] uppercase font-bold px-2 py-0.5 rounded bg-primary-foreground/20">{d}</span>
                ))}
              </div>
            </div>
            {/* QR mini */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 grid bg-primary-foreground/10 rounded p-1" style={{ gridTemplateColumns: "repeat(11, 1fr)", gap: "0.5px" }}>
                {qrCells.map((on, i) => (
                  <div key={i} className={`rounded-[0.5px] ${on ? "bg-primary-foreground" : ""}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom: metadata row */}
          <div className="flex items-end justify-between">
            <div className="flex gap-4">
              <div>
                <p className="text-[7px] tracking-[0.2em] uppercase opacity-40 font-semibold">Province</p>
                <p className="text-[10px] font-bold">{athlete.province}</p>
              </div>
              {age && (
                <div>
                  <p className="text-[7px] tracking-[0.2em] uppercase opacity-40 font-semibold">Age</p>
                  <p className="text-[10px] font-bold">{age}</p>
                </div>
              )}
              {(athlete.school_name || athlete.club_name) && (
                <div>
                  <p className="text-[7px] tracking-[0.2em] uppercase opacity-40 font-semibold">Affiliation</p>
                  <p className="text-[10px] font-bold truncate max-w-[80px]">{athlete.school_name || athlete.club_name}</p>
                </div>
              )}
              {athlete.medical_waiver_signed && (
                <div>
                  <p className="text-[7px] tracking-[0.2em] uppercase opacity-40 font-semibold">Medical</p>
                  <p className="text-[10px] font-bold">✓ Cleared</p>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-[7px] tracking-[0.2em] uppercase opacity-40 font-semibold">Card No.</p>
              <p className="text-[9px] font-black tracking-widest opacity-70">{cardNum}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button onClick={handlePrint} className="flex-1 h-9 text-xs font-semibold tracking-wide rounded-lg bg-foreground text-primary-foreground hover:opacity-85 transition-opacity">
          🖨 Print / Save PDF
        </button>
      </div>
    </motion.div>
  );
}

export default function AthleteIDPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");

  const PROVINCES = ["","Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"];

  const { data: athletes = [], isLoading } = useQuery({
    queryKey: ["id-athletes"],
    queryFn: async () => {
      const { data } = await supabase.from("athletes")
        .select("id, first_name, last_name, display_name, province, disciplines, date_of_birth, school_name, club_name, id_card_number, qr_code, photo_url, is_active, is_suspended, medical_waiver_signed, personal_bests, created_at")
        .order("first_name").limit(200);
      return (data || []) as Athlete[];
    },
  });

  const filtered = athletes.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${a.first_name} ${a.last_name} ${a.display_name || ""}`.toLowerCase().includes(q) || (a.id_card_number || "").toLowerCase().includes(q);
    const matchProv = !selectedProvince || a.province === selectedProvince;
    return matchSearch && matchProv;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />
      <div className="max-w-[1400px] mx-auto pt-20">
        {/* Header */}
        <div className="px-4 sm:px-8 py-10 hairline-b">
          <p className="text-[10px] mono tracking-[0.25em] uppercase text-nexus-muted">Identity Management</p>
          <h1 className="display-font text-display-lg font-bold text-foreground mt-1">Athlete ID Cards</h1>
          <p className="text-sm text-nexus-muted mt-2">Digital identity cards with QR codes for all registered athletes. Print-ready PDF generation.</p>
        </div>

        {/* Filters */}
        <div className="px-4 sm:px-8 py-5 hairline-b flex flex-col sm:flex-row gap-3">
          <input
            placeholder="Search by name or card number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-nexus-surface hairline rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-nexus-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
          />
          <select
            value={selectedProvince}
            onChange={e => setSelectedProvince(e.target.value)}
            className="sm:w-48 bg-nexus-surface hairline rounded-xl px-4 py-2.5 text-sm text-foreground cursor-pointer focus:outline-none"
          >
            {PROVINCES.map(p => <option key={p} value={p}>{p || "All Provinces"}</option>)}
          </select>
          <div className="flex items-center gap-2 text-xs mono text-nexus-muted">
            <span>{filtered.length} athlete{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Grid */}
        <div className="p-4 sm:p-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-full aspect-[1.586/1] rounded-2xl bg-nexus-surface animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-4xl mb-4">🪪</p>
              <p className="display-font text-xl font-bold text-foreground mb-2">No athletes found</p>
              <p className="text-sm text-nexus-muted max-w-sm mx-auto">
                {athletes.length === 0
                  ? "Register athletes via the Admin Dashboard or Registration panel to generate their ID cards here."
                  : "No athletes match your search criteria. Try a different name or province."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map(a => <AthleteIDCard key={a.id} athlete={a} />)}
            </div>
          )}
        </div>
      </div>
      <NexusFooter />
    </div>
  );
}
