import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NashHeader } from "@/components/nash/NashHeader";
import { LiveScoreBug } from "@/components/nash/LiveScoreBug";
import { TierBadge } from "@/components/nash/TierBadge";
import { SportBadge } from "@/components/nash/SportBadge";
import { AwardBadge } from "@/components/nash/AwardBadge";
import { Trophy, Tv, Star, Award, Sparkles, MapPin } from "lucide-react";

/**
 * Broadcast Graphics Gallery — NASH-branded CG samples for stream producers
 * to preview the visual identity before going live. Each panel is captured
 * via OBS Browser Source from /broadcast/:fixtureId for real fixtures; this
 * page is the design reference.
 */
export default function BroadcastGalleryPage() {
  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div>
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Broadcast · Graphics Gallery</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">NASH-Branded CG Overlays</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Visual reference for stream producers. Live overlays render at <code className="text-[10px] bg-muted px-1 rounded">/broadcast/:fixtureId</code> for OBS Browser Source capture.</p>
        </div>

        {/* Live Score Bug */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><Tv className="h-4 w-4 text-accent" /> Score Bug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Bottom-of-screen overlay; readable from across a hall thanks to large tabular score digits.</p>
            <div className="grid gap-3">
              <LiveScoreBug homeName="Prince Edward" awayName="Churchill" homeScore={27} awayScore={24} period="H2" clock="14:32" status="live" />
              <LiveScoreBug homeName="St George's" awayName="Falcon College" homeScore={42} awayScore={38} period="Q4" clock="03:18" status="live" />
              <LiveScoreBug homeName="Marist Brothers" awayName="Allan Wilson" homeScore={1} awayScore={1} period="HT" status="ht" />
              <LiveScoreBug homeName="Lord Malvern" awayName="Eveline Girls" homeScore={3} awayScore={2} period="FT" status="ft" />
            </div>
          </CardContent>
        </Card>

        {/* Goal Celebration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> Goal Celebration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Triggered on every goal event from the scorer console. Fades out after 4 seconds.</p>
            <div className="grid md:grid-cols-2 gap-3">
              <GoalCard scorer="T. Mukundi" assist="K. Sibanda" team="Prince Edward" minute="48" />
              <GoalCard scorer="N. Phiri" team="St George's" minute="64" />
            </div>
          </CardContent>
        </Card>

        {/* Player Spotlight */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><Star className="h-4 w-4 text-accent" /> Player Spotlight</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Triggered when a player makes a milestone play. Shows photo, NASH ID, key season stats.</p>
            <SpotlightCard name="Tatenda Mukundi" nashId="NASH-2026-000147" position="Goal Attack" school="Prince Edward School" stats={[{ k: "Goals", v: "18" }, { k: "Avg", v: "73%" }, { k: "MoM", v: "3" }]} />
          </CardContent>
        </Card>

        {/* Man of the Match */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><Award className="h-4 w-4 text-accent" /> Player of the Match</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Drops in at full time after MoM voting closes. Gold-accent treatment for the announcement.</p>
            <MoMCard name="Tatenda Mukundi" team="Prince Edward" stats="3 goals · 4 assists · 2 saves" />
          </CardContent>
        </Card>

        {/* Bracket Reveal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><Trophy className="h-4 w-4 text-accent" /> Bracket Reveal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Used at fixture launch or between matches to show competition progression.</p>
            <BracketRevealCard tier="national" sport="HB" name="NASH Games 2026 — Handball Boys U18" />
          </CardContent>
        </Card>

        {/* Sponsor billboard */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display tracking-wide flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> Sponsor Billboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Rotates through configured sponsors during stoppage time. NASH logo always anchors the lockup.</p>
            <SponsorBillboard name="Your Sponsor Here" tagline="Title sponsor of the 2026 NASH Games" />
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}

function GoalCard({ scorer, assist, team, minute }: { scorer: string; assist?: string; team: string; minute: string }) {
  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 border-2 border-accent rounded p-4 text-primary-foreground">
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-3xl text-accent">GOAL!</span>
        <Badge variant="outline" className="border-accent text-accent font-mono">{minute}'</Badge>
      </div>
      <div className="mt-2 font-display text-lg leading-tight">{scorer}</div>
      <div className="text-xs opacity-80">{team}{assist ? ` · assist: ${assist}` : ""}</div>
    </div>
  );
}

function SpotlightCard({ name, nashId, position, school, stats }: { name: string; nashId: string; position: string; school: string; stats: { k: string; v: string }[] }) {
  return (
    <div className="bg-card border-2 border-accent rounded p-4 flex gap-4">
      <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-accent flex items-center justify-center font-bold text-2xl text-accent">{name.split(" ").map(n => n[0]).join("")}</div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-bold text-lg leading-tight truncate">{name}</div>
        <div className="text-xs text-muted-foreground">{position} · {school}</div>
        <div className="font-mono text-[10px] text-accent mt-0.5">{nashId}</div>
        <div className="flex gap-3 mt-2">
          {stats.map((s) => (
            <div key={s.k} className="text-center">
              <div className="font-display font-bold text-lg tabular-nums text-accent">{s.v}</div>
              <div className="text-[9px] uppercase text-muted-foreground tracking-wider">{s.k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MoMCard({ name, team, stats }: { name: string; team: string; stats: string }) {
  return (
    <div className="bg-gradient-to-br from-accent to-[hsl(var(--nash-gold-light))] text-accent-foreground border-2 border-accent rounded p-6 text-center">
      <AwardBadge kind="best_player" className="bg-primary text-primary-foreground border-primary" />
      <div className="font-display font-black text-3xl mt-3 leading-none">PLAYER OF THE MATCH</div>
      <div className="font-display font-bold text-2xl mt-2">{name}</div>
      <div className="text-sm opacity-80">{team}</div>
      <div className="text-xs mt-2 font-mono">{stats}</div>
    </div>
  );
}

function BracketRevealCard({ tier, sport, name }: { tier: "national" | "provincial" | "district" | "zonal"; sport: string; name: string }) {
  return (
    <div className="bg-primary text-primary-foreground border-2 border-accent rounded p-6">
      <div className="flex items-center justify-between mb-2">
        <TierBadge tier={tier} />
        <SportBadge code={sport} />
      </div>
      <div className="font-display font-bold text-xl mt-2">{name}</div>
      <div className="text-xs text-accent mt-1">Bracket reveal · Round of 16</div>
    </div>
  );
}

function SponsorBillboard({ name, tagline }: { name: string; tagline: string }) {
  return (
    <div className="bg-card border-2 border-border rounded p-6 flex items-center gap-6">
      <div className="text-center px-4 border-r-2 border-accent/30 pr-6">
        <p className="text-[9px] font-display tracking-[0.3em] uppercase text-accent">NASH</p>
        <p className="font-display font-bold">NEXUS</p>
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-display tracking-wider uppercase text-muted-foreground">Title Sponsor</div>
        <div className="font-display font-bold text-xl">{name}</div>
        <div className="text-xs text-muted-foreground">{tagline}</div>
      </div>
    </div>
  );
}
