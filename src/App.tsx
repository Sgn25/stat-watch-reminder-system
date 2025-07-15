
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { cleanupBodyScroll } from "@/lib/dialogUtils";
import Index from "./pages/Index";
import Parameters from "./pages/Parameters";
import Reminders from "./pages/Reminders";
import CalendarPage from "./pages/Calendar";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import React from "react";
import ParameterDetailPage from "./pages/ParameterDetailPage";
import AddParameterPage from "./pages/AddParameterPage";
import AddReminderPage from "./pages/AddReminderPage";
import EditParameterPage from "./pages/EditParameterPage";
import EditReminderPage from "./pages/EditReminderPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EmailVerified from "./pages/EmailVerified";
import CompleteProfile from './pages/CompleteProfile';

const queryClient = new QueryClient();

const App = () => {
  // Cleanup any existing body scroll locks on app load
  React.useEffect(() => {
    cleanupBodyScroll();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PageTransition>
            <Routes>
              <Route path="/email-verified" element={<EmailVerified />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<Index />} />
              <Route path="/parameters" element={<Parameters />} />
              <Route path="/parameters/:id" element={<ParameterDetailPage />} />
              <Route path="/parameters/add" element={<AddParameterPage />} />
              <Route path="/parameters/:id/edit" element={<EditParameterPage />} />
              <Route path="/parameters/:parameterId/reminders/add" element={<AddReminderPage />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/reminders/add" element={<AddReminderPage />} />
              <Route path="/reminders/:reminderId/edit" element={<EditReminderPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
