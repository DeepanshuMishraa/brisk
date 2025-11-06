import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import "./App.css";
import { MainPage } from "@/pages/MainPage";
import { WidgetPage } from "@/pages/WidgetPage";
import { StatsPage } from "@/pages/StatsPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { AnimatedRoute } from "@/components/AnimatedRoute";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "sonner";
import { useOnboardingStore } from "@/store/onboardingStore";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isOnboarded } = useOnboardingStore();

  if (!isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const location = useLocation();

  return (
    <ThemeProvider defaultTheme="dark" storageKey="brisk-ui-theme">
      <AnimatePresence mode="sync">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/onboarding"
            element={
              <AnimatedRoute>
                <OnboardingPage />
              </AnimatedRoute>
            }
          />
          <Route
            path="/"
            element={
              <AnimatedRoute>
                <ProtectedRoute>
                  <MainPage />
                </ProtectedRoute>
              </AnimatedRoute>
            }
          />
          <Route
            path="/widget"
            element={
              <AnimatedRoute>
                <ProtectedRoute>
                  <WidgetPage />
                </ProtectedRoute>
              </AnimatedRoute>
            }
          />
          <Route
            path="/stats"
            element={
              <AnimatedRoute>
                <ProtectedRoute>
                  <StatsPage />
                </ProtectedRoute>
              </AnimatedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
      <Toaster richColors />
    </ThemeProvider>
  );
}
