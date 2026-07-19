import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import { CheckInProvider, useCheckIn } from "./context/CheckInContext";
import { ThemeProvider } from "./context/ThemeContext";
import Home from "@/pages/Home";
import Onboarding from "@/pages/Onboarding";
import { useCallback } from "react";

const queryClient = new QueryClient();

function LastDeleteUndoToast({
  label,
  toastKey,
  onUndo,
  onExpire,
}: {
  label: string;
  toastKey: string;
  onUndo: () => void;
  onExpire: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      className="fixed bottom-6 right-4 left-4 z-[9999] mx-auto max-w-xs"
    >
      <div className="relative bg-foreground text-background rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="text-sm flex-1 font-medium">{label}</span>
          <button
            onClick={onUndo}
            className="text-sm font-bold text-primary-foreground/90 hover:text-primary-foreground shrink-0 px-1"
          >
            Undo
          </button>
        </div>
        <motion.div
          key={toastKey}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: 5, ease: "linear" }}
          onAnimationComplete={onExpire}
          style={{ transformOrigin: "left", originX: 0 }}
          className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/25 rounded-b-2xl"
        />
      </div>
    </motion.div>
  );
}

function AppShell() {
  const {
    profiles,
    pendingLastDeleteIds,
    cancelPendingLastDelete,
    removeProfile,
  } = useProfile();
  const { deleteReportsForProfile } = useCheckIn();

  // Show onboarding only when there are no profiles that are NOT pending deletion.
  // This means: if the user creates a new profile while a delete is pending, navigate
  // to Home immediately instead of staying stuck on Onboarding.
  const nonPendingProfiles = profiles.filter((p) => !pendingLastDeleteIds.includes(p.id));
  const showOnboarding = nonPendingProfiles.length === 0;

  const handleExpire = useCallback(() => {
    if (pendingLastDeleteIds.length === 0) return;
    pendingLastDeleteIds.forEach((id) => {
      removeProfile(id);
      deleteReportsForProfile(id);
    });
    cancelPendingLastDelete();
  }, [pendingLastDeleteIds, removeProfile, deleteReportsForProfile, cancelPendingLastDelete]);

  const handleUndo = useCallback(() => {
    cancelPendingLastDelete();
  }, [cancelPendingLastDelete]);

  const pendingNames = pendingLastDeleteIds
    .map((id) => profiles.find((p) => p.id === id)?.name)
    .filter(Boolean) as string[];

  const toastLabel =
    pendingNames.length === 1
      ? `Deleted \u201c${pendingNames[0]}\u201d`
      : `Deleted ${pendingLastDeleteIds.length} profiles`;

  const toastKey = pendingLastDeleteIds.join(",");

  return (
    <>
      {showOnboarding ? (
        <Onboarding />
      ) : (
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/" component={Home} />
            <Route component={NotFound} />
          </Switch>
        </WouterRouter>
      )}

      <AnimatePresence>
        {pendingLastDeleteIds.length > 0 && (
          <LastDeleteUndoToast
            key={toastKey}
            label={toastLabel}
            toastKey={toastKey}
            onUndo={handleUndo}
            onExpire={handleExpire}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ProfileProvider>
          <CheckInProvider>
            <TooltipProvider>
              <AppShell />
              <Toaster />
            </TooltipProvider>
          </CheckInProvider>
        </ProfileProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
