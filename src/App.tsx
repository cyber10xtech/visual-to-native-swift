import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import NotFound from "./pages/NotFound";

// Customer App Pages
import CustomerSignIn from "./pages/customer/CustomerSignIn";
import CustomerRegister from "./pages/customer/CustomerRegister";
import ForgotPassword from "./pages/customer/ForgotPassword";
import ResetPassword from "./pages/customer/ResetPassword";
import CustomerHome from "./pages/customer/CustomerHome";
import CustomerHub from "./pages/customer/CustomerHub";
import CustomerMessages from "./pages/customer/CustomerMessages";
import CustomerChat from "./pages/customer/CustomerChat";
import CustomerAlerts from "./pages/customer/CustomerAlerts";
import CustomerSettings from "./pages/customer/CustomerSettings";
import ProfessionalProfile from "./pages/customer/ProfessionalProfile";
import EditProfile from "./pages/customer/EditProfile";
import PaymentMethods from "./pages/customer/PaymentMethods";
import NotificationSettings from "./pages/customer/NotificationSettings";
import PrivacySecurity from "./pages/customer/PrivacySecurity";
import HelpSupport from "./pages/customer/HelpSupport";
import LiveChatSupport from "./pages/customer/LiveChatSupport";
import InviteFriends from "./pages/customer/InviteFriends";
import TermsPrivacy from "./pages/customer/TermsPrivacy";
import BookingRequest from "./pages/customer/BookingRequest";
import CustomerInstall from "./pages/customer/CustomerInstall";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Root redirects to customer home */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            
            {/* Customer App Routes - simplified paths */}
            <Route path="/sign-in" element={<CustomerSignIn />} />
            <Route path="/register" element={<CustomerRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/home" element={<ProtectedRoute><CustomerHome /></ProtectedRoute>} />
            <Route path="/hub" element={<ProtectedRoute><CustomerHub /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><CustomerMessages /></ProtectedRoute>} />
            <Route path="/chat/:id" element={<ProtectedRoute><CustomerChat /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><CustomerAlerts /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><CustomerSettings /></ProtectedRoute>} />
            <Route path="/professional/:id" element={<ProtectedRoute><ProfessionalProfile /></ProtectedRoute>} />
            <Route path="/book/:id" element={<ProtectedRoute><BookingRequest /></ProtectedRoute>} />
            <Route path="/settings/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/settings/payments" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />
            <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
            <Route path="/settings/privacy" element={<ProtectedRoute><PrivacySecurity /></ProtectedRoute>} />
            <Route path="/settings/help" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
            <Route path="/live-chat" element={<ProtectedRoute><LiveChatSupport /></ProtectedRoute>} />
            <Route path="/invite" element={<ProtectedRoute><InviteFriends /></ProtectedRoute>} />
            <Route path="/terms" element={<TermsPrivacy />} />
            <Route path="/install" element={<CustomerInstall />} />
            
            {/* Legacy /customer/* routes redirect to new paths */}
            <Route path="/customer/*" element={<Navigate to="/home" replace />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
