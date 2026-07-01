import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { InstallPrompt } from "@/components/InstallPrompt";

// ── Existing pages (preserved; will be repurposed in subsequent sessions) ──
import Index from "./pages/Index.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import CompetitionDetailPage from "./pages/CompetitionDetailPage.tsx";
import ScoringPage from "./pages/ScoringPage.tsx";
import FixturesPage from "./pages/FixturesPage.tsx";
import AthleteIDPage from "./pages/AthleteIDPage.tsx";
import BroadcastCGPage from "./pages/BroadcastCGPage.tsx";
import SchoolsPage from "./pages/SchoolsPage.tsx";
import SchoolProfilePage from "./pages/SchoolProfilePage.tsx";
import InterSchoolPage from "./pages/InterSchoolPage.tsx";
import SportsDayPage from "./pages/SportsDayPage.tsx";
import PracticeScoringPage from "./pages/PracticeScoringPage.tsx";
import LivePage from "./pages/LivePage.tsx";
import FixtureScoringPage from "./pages/FixtureScoringPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import AdminSyncPage from "./pages/AdminSyncPage.tsx";
import PlayerVerifyPage from "./pages/PlayerVerifyPage.tsx";
import TeamBuilderPage from "./pages/TeamBuilderPage.tsx";
import AdminRegionsPage from "./pages/AdminRegionsPage.tsx";
import PlayerProfilePage from "./pages/PlayerProfilePage.tsx";
import MatchConsolePage from "./pages/MatchConsolePage.tsx";
import MatchLivePage from "./pages/MatchLivePage.tsx";
import TournamentWizardPage from "./pages/TournamentWizardPage.tsx";
import BracketPage from "./pages/BracketPage.tsx";
import StandingsPage from "./pages/StandingsPage.tsx";
import FeedPage from "./pages/FeedPage.tsx";
import NotFound from "./pages/NotFound.tsx";

// ── New NASH page shells (Step 5) ──
import NashNationalDashboard from "./pages/nash/NashNationalDashboard.tsx";
import NaphNationalDashboard from "./pages/nash/NaphNationalDashboard.tsx";
import ProvincialDashboard from "./pages/nash/ProvincialDashboard.tsx";
import DistrictDashboard from "./pages/nash/DistrictDashboard.tsx";
import ZonalDashboard from "./pages/nash/ZonalDashboard.tsx";
import CoachDashboard from "./pages/coach/CoachDashboard.tsx";
import TeamRegistrationPage from "./pages/coach/TeamRegistrationPage.tsx";
import TeamSheetPage from "./pages/coach/TeamSheetPage.tsx";
import OfficialDashboard from "./pages/official/OfficialDashboard.tsx";
import OfficialAssignmentsPage from "./pages/official/OfficialAssignmentsPage.tsx";
import AthleteDashboard from "./pages/athlete/AthleteDashboard.tsx";
import OrganiserDashboard from "./pages/organiser/OrganiserDashboard.tsx";
import AthletesRegistryPage from "./pages/admin/AthletesRegistryPage.tsx";
import AthleteRegisterPage from "./pages/admin/AthleteRegisterPage.tsx";
import BroadcastGalleryPage from "./pages/BroadcastGalleryPage.tsx";
import CompetitionsAdminPage from "./pages/admin/CompetitionsAdminPage.tsx";
import TeamsAdminPage from "./pages/admin/TeamsAdminPage.tsx";
import OfficialRegistryPage from "./pages/admin/OfficialRegistryPage.tsx";
import EligibilityFlagsPage from "./pages/admin/EligibilityFlagsPage.tsx";
import NashSeasonsPage from "./pages/admin/NashSeasonsPage.tsx";
import NashSportsPage from "./pages/admin/NashSportsPage.tsx";
import NashOrganisationsPage from "./pages/admin/NashOrganisationsPage.tsx";
import NashMembersPage from "./pages/admin/NashMembersPage.tsx";
import VenuesDatabasePage from "./pages/admin/VenuesDatabasePage.tsx";
import MoPSEReportPage from "./pages/admin/MoPSEReportPage.tsx";
import FinancesPage from "./pages/admin/FinancesPage.tsx";
import CalendarPage from "./pages/CalendarPage.tsx";
import RecordsPage from "./pages/RecordsPage.tsx";
import NashGamesPage from "./pages/NashGamesPage.tsx";
import ResultsPage from "./pages/ResultsPage.tsx";
import ToolsPage from "./pages/ToolsPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <InstallPrompt />
          <BrowserRouter>
            <Routes>
              {/* ───────────────────── PUBLIC ───────────────────── */}
              <Route path="/" element={<FeedPage />} />
              <Route path="/home" element={<Index />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/records" element={<RecordsPage />} />
              <Route path="/nashgames" element={<NashGamesPage />} />
              <Route path="/live" element={<LivePage />} />
              <Route path="/live/:fixtureId" element={<MatchLivePage />} />
              <Route path="/standings/:competitionId" element={<StandingsPage />} />
              <Route path="/bracket/:competitionId" element={<BracketPage />} />
              <Route path="/schools" element={<SchoolsPage />} />
              <Route path="/schools/:id" element={<SchoolProfilePage />} />
              <Route path="/players/:nashId" element={<PlayerProfilePage />} />
              <Route path="/competition/:id" element={<CompetitionDetailPage />} />

              {/* Legacy paths preserved for share-link continuity */}
              <Route path="/feed" element={<Navigate to="/" replace />} />
              <Route path="/competitions" element={<Navigate to="/inter-school" replace />} />
              <Route path="/inter-school" element={<InterSchoolPage />} />
              <Route path="/sports-day" element={<SportsDayPage />} />
              <Route path="/practice" element={<PracticeScoringPage />} />
              <Route path="/competition/:id/bracket" element={<BracketPage />} />
              <Route path="/competition/:id/standings" element={<StandingsPage />} />

              {/* ───────────────────── AUTH ───────────────────── */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* ───────────────────── ROLE DASHBOARDS ───────────────────── */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/platform" element={<AdminDashboard />} />

              <Route path="/federation/nash" element={<NashNationalDashboard />} />
              <Route path="/federation/naph" element={<NaphNationalDashboard />} />
              <Route path="/federation/technical/:sport" element={<NashNationalDashboard />} />

              <Route path="/province" element={<ProvincialDashboard />} />
              <Route path="/province/:provinceId" element={<ProvincialDashboard />} />
              <Route path="/province/:provinceId/technical/:sport" element={<ProvincialDashboard />} />

              <Route path="/district" element={<DistrictDashboard />} />
              <Route path="/district/:districtId" element={<DistrictDashboard />} />
              <Route path="/district/:districtId/technical/:sport" element={<DistrictDashboard />} />

              <Route path="/zone" element={<ZonalDashboard />} />
              <Route path="/zone/:zoneId" element={<ZonalDashboard />} />

              <Route path="/school/dashboard" element={<CoachDashboard />} />
              <Route path="/school/teams" element={<TeamRegistrationPage />} />
              <Route path="/school/players" element={<AthletesRegistryPage />} />
              <Route path="/school/eligibility" element={<EligibilityFlagsPage />} />

              <Route path="/coach/dashboard" element={<CoachDashboard />} />
              <Route path="/coach/team/:teamId" element={<TeamRegistrationPage />} />
              <Route path="/coach/registration" element={<TeamRegistrationPage />} />
              <Route path="/coach/team-sheet/:fixtureId" element={<TeamSheetPage />} />

              <Route path="/official/dashboard" element={<OfficialDashboard />} />
              <Route path="/official/assignments" element={<OfficialAssignmentsPage />} />
              <Route path="/official/profile" element={<OfficialDashboard />} />

              <Route path="/athlete/profile" element={<AthleteDashboard />} />
              <Route path="/athlete/stats" element={<AthleteDashboard />} />
              <Route path="/athlete/competitions" element={<AthleteDashboard />} />

              <Route path="/organiser/dashboard" element={<OrganiserDashboard />} />
              <Route path="/organiser/competitions" element={<OrganiserDashboard />} />

              <Route path="/broadcast" element={<BroadcastGalleryPage />} />
              <Route path="/broadcast/gallery" element={<BroadcastGalleryPage />} />
              <Route path="/broadcast/:fixtureId" element={<BroadcastCGPage />} />
              <Route path="/score/:fixtureId" element={<MatchConsolePage />} />
              <Route path="/scoring" element={<ScoringPage />} />
              <Route path="/scoring/:fixtureId" element={<FixtureScoringPage />} />

              {/* ───────────────────── ADMIN / MANAGEMENT ───────────────────── */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/seasons" element={<NashSeasonsPage />} />
              <Route path="/admin/sports" element={<NashSportsPage />} />
              <Route path="/admin/organisations" element={<NashOrganisationsPage />} />
              <Route path="/admin/members" element={<NashMembersPage />} />
              <Route path="/admin/athletes" element={<AthletesRegistryPage />} />
              <Route path="/admin/athletes/new" element={<AthleteRegisterPage />} />
              <Route path="/admin/officials" element={<OfficialRegistryPage />} />
              <Route path="/admin/venues" element={<VenuesDatabasePage />} />
              <Route path="/admin/competitions/new" element={<TournamentWizardPage />} />
              <Route path="/admin/competitions" element={<CompetitionsAdminPage />} />
              <Route path="/admin/teams" element={<TeamsAdminPage />} />
              <Route path="/admin/eligibility" element={<EligibilityFlagsPage />} />
              <Route path="/admin/sync" element={<AdminSyncPage />} />
              <Route path="/admin/reports" element={<MoPSEReportPage />} />
              <Route path="/admin/finances" element={<FinancesPage />} />
              <Route path="/admin/regions" element={<AdminRegionsPage />} />
              <Route path="/admin/verify" element={<PlayerVerifyPage />} />

              {/* Legacy team/athlete tools (kept until rebuilt) */}
              <Route path="/fixtures" element={<FixturesPage />} />
              <Route path="/athletes/id-cards" element={<AthleteIDPage />} />
              <Route path="/schools/:id/teams/new" element={<TeamBuilderPage />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
