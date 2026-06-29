import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { DiagnosisProvider } from "./context/DiagnosisContext";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import { useAuth } from "./hooks/use-auth";
import Home from "@/pages/Home";
import Diagnosis from "@/pages/Diagnosis";
import LoginPage from "@/pages/LoginPage";
import ProfileSelect from "@/pages/ProfileSelect";
import { HeartPulse } from "lucide-react";

const queryClient = new QueryClient();

function AppShell() {
  const { isLoading, isAuthenticated } = useAuth();
  const { activeProfile } = useProfile();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3">
        <HeartPulse className="w-8 h-8 text-primary animate-pulse" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (!activeProfile) {
    return <ProfileSelect />;
  }

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/diagnosis" component={Diagnosis} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DiagnosisProvider>
        <ProfileProvider>
          <TooltipProvider>
            <AppShell />
            <Toaster />
          </TooltipProvider>
        </ProfileProvider>
      </DiagnosisProvider>
    </QueryClientProvider>
  );
}

export default App;
