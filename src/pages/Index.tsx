import { Helmet } from "react-helmet-async";
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
import { useScholasticAutoSync } from "@/hooks/useScholasticAutoSync";

const Index = () => {
  useScholasticAutoSync();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Nexus — Zimbabwe's School Handball & Netball Network</title>
        <meta name="description" content="Closed inter-school handball and netball platform for Zimbabwean schools — fixtures, live scoring and player verification, powered by Scholastic Services." />
        <link rel="canonical" href="https://nexuszw.online/" />
        <meta property="og:url" content="https://nexuszw.online/" />
        <meta property="og:title" content="Nexus — Zimbabwe's School Sports Network" />
        <meta property="og:description" content="Inter-school handball & netball, end to end." />
      </Helmet>
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

