import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import CompetitionsPage from "./pages/CompetitionsPage.tsx";
import CompetitionDetailPage from "./pages/CompetitionDetailPage.tsx";
import ScoringPage from "./pages/ScoringPage.tsx";
import FixturesPage from "./pages/FixturesPage.tsx";
import AthleteIDPage from "./pages/AthleteIDPage.tsx";
import BroadcastCGPage from "./pages/BroadcastCGPage.tsx";
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
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/competitions" element={<CompetitionsPage />} />
              <Route path="/competition/:id" element={<CompetitionDetailPage />} />
              <Route path="/scoring" element={<ScoringPage />} />
              <Route path="/fixtures" element={<FixturesPage />} />
              <Route path="/athletes/id-cards" element={<AthleteIDPage />} />
              <Route path="/broadcast" element={<BroadcastCGPage />} />
              <Route path="/broadcast/:fixtureId" element={<BroadcastCGPage />} />
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
