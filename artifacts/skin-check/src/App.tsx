import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import { CheckInProvider } from "./context/CheckInContext";
import Home from "@/pages/Home";
import Onboarding from "@/pages/Onboarding";

const queryClient = new QueryClient();

function AppShell() {
  const { profiles } = useProfile();

  if (profiles.length === 0) {
    return <Onboarding />;
  }

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <CheckInProvider>
          <TooltipProvider>
            <AppShell />
            <Toaster />
          </TooltipProvider>
        </CheckInProvider>
      </ProfileProvider>
    </QueryClientProvider>
  );
}

export default App;
