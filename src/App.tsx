import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "sonner";
import Index from "@/pages/Index";
import SpacesPage from "@/pages/SpacesPage";
import SpaceDetailPage from "@/pages/SpaceDetailPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import ProfilePage from "@/pages/ProfilePage";
import BookingDetailPage from "@/pages/BookingDetailPage";
import BecomeCaregiverPage from "@/pages/BecomeCaregiverPage";
import CaregiverDashboardPage from "@/pages/CaregiverDashboardPage";
import MessagesPage from "@/pages/MessagesPage";
import HelpCenterPage from "@/pages/HelpCenterPage";
import HowItWorksPage from "@/pages/HowItWorksPage";
import NotFound from "@/pages/NotFound";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/spaces" element={<SpacesPage />} />
            <Route path="/spaces/:id" element={<SpaceDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/bookings/:id" element={<BookingDetailPage />} />
            <Route path="/become-caregiver" element={<BecomeCaregiverPage />} />
            <Route path="/caregiver/dashboard" element={<CaregiverDashboardPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/help" element={<HelpCenterPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
