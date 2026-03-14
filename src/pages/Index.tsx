import { NexusHeader } from "@/components/NexusHeader";
import { NexusHero } from "@/components/NexusHero";
import { LiveScoreboard } from "@/components/LiveScoreboard";
import { LevelSwitcher } from "@/components/LevelSwitcher";
import { EventsGrid } from "@/components/EventsGrid";
import { StandingsTable } from "@/components/StandingsTable";
import { BroadcastHub } from "@/components/BroadcastHub";
import { RegistrationPanel } from "@/components/RegistrationPanel";
import { NexusFooter } from "@/components/NexusFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />

      <main>
        <NexusHero />
        <LiveScoreboard />
        <LevelSwitcher />
        <EventsGrid />
        <StandingsTable />
        <BroadcastHub />
        <RegistrationPanel />
      </main>

      <NexusFooter />
    </div>
  );
};

export default Index;
