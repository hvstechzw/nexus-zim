import { NexusHeader } from "@/components/NexusHeader";
import { NexusHero } from "@/components/NexusHero";
import { HomeQuickActions } from "@/components/HomeQuickActions";
import { LiveScoreboard } from "@/components/LiveScoreboard";
import { SchoolsDirectory } from "@/components/SchoolsDirectory";
import { EventsGrid } from "@/components/EventsGrid";
import { StandingsTable } from "@/components/StandingsTable";
import { BroadcastHub } from "@/components/BroadcastHub";
import { ScholasticPartnerSection } from "@/components/ScholasticPartnerSection";
import { NexusFooter } from "@/components/NexusFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NexusHeader />

      <main>
        <NexusHero />
        <HomeQuickActions />
        <LiveScoreboard />
        <SchoolsDirectory />
        <EventsGrid />
        <StandingsTable />
        <BroadcastHub />
        <ScholasticPartnerSection />
      </main>

      <NexusFooter />
    </div>
  );
};

export default Index;

