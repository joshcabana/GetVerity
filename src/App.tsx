import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppHeader from "@/components/AppHeader";
import PushNotificationManager from "@/components/PushNotificationManager";
import { lazy, Suspense } from "react";

const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Lobby = lazy(() => import("./pages/Lobby"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LiveCall = lazy(() => import("./pages/LiveCall"));
const SparkHistory = lazy(() => import("./pages/SparkHistory"));
const Chat = lazy(() => import("./pages/Chat"));
const TokenShop = lazy(() => import("./pages/TokenShop"));
const Admin = lazy(() => import("./pages/Admin"));
const Transparency = lazy(() => import("./pages/Transparency"));
const Appeal = lazy(() => import("./pages/Appeal"));
const Profile = lazy(() => import("./pages/Profile"));
const Friendfluence = lazy(() => import("./pages/Friendfluence"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const LazyFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <ErrorBoundary>
                <AppHeader />
                <PushNotificationManager />
                <Suspense fallback={<LazyFallback />}>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/lobby" element={<ProtectedRoute requireTrust><Lobby /></ProtectedRoute>} />
                    <Route path="/call/:callId" element={<ProtectedRoute requireTrust><LiveCall /></ProtectedRoute>} />
                    <Route path="/sparks" element={<ProtectedRoute requireTrust><SparkHistory /></ProtectedRoute>} />
                    <Route path="/chat/:sparkId" element={<ProtectedRoute requireTrust><Chat /></ProtectedRoute>} />
                    <Route path="/tokens" element={<ProtectedRoute><TokenShop /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
                    <Route path="/transparency" element={<Transparency />} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/appeal" element={<ProtectedRoute><Appeal /></ProtectedRoute>} />
                    <Route path="/appeal/:flagId" element={<ProtectedRoute><Appeal /></ProtectedRoute>} />
                    <Route path="/drops/friendfluence" element={<ProtectedRoute><Friendfluence /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
