import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
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
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/live" element={<LivePage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/sync" element={<AdminSyncPage />} />
              <Route path="/admin/verify" element={<PlayerVerifyPage />} />
              <Route path="/competitions" element={<Navigate to="/inter-school" replace />} />
              <Route path="/competition/:id" element={<CompetitionDetailPage />} />
              <Route path="/scoring" element={<ScoringPage />} />
              <Route path="/scoring/:fixtureId" element={<FixtureScoringPage />} />
              <Route path="/fixtures" element={<FixturesPage />} />
              <Route path="/athletes/id-cards" element={<AthleteIDPage />} />
              <Route path="/broadcast" element={<BroadcastCGPage />} />
              <Route path="/broadcast/:fixtureId" element={<BroadcastCGPage />} />
              <Route path="/schools" element={<SchoolsPage />} />
              <Route path="/schools/:id" element={<SchoolProfilePage />} />
              <Route path="/inter-school" element={<InterSchoolPage />} />
              <Route path="/sports-day" element={<SportsDayPage />} />
              <Route path="/practice" element={<PracticeScoringPage />} />
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
