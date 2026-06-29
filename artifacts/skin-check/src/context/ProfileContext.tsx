import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AuthUser } from "@/hooks/use-auth";

export interface ChildProfile {
  id: string;
  parentId: string;
  name: string;
  ageRange: "5-7" | "8-12" | "13-17";
  congenitalConditions: string[];
  createdAt: string;
}

export type ActiveProfile =
  | { type: "parent"; user: AuthUser }
  | { type: "child"; profile: ChildProfile };

interface ProfileContextValue {
  activeProfile: ActiveProfile | null;
  setActiveProfile: (profile: ActiveProfile | null) => void;
  switchProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfile, setActiveProfileState] = useState<ActiveProfile | null>(null);

  const setActiveProfile = useCallback((profile: ActiveProfile | null) => {
    setActiveProfileState(profile);
  }, []);

  const switchProfile = useCallback(() => {
    setActiveProfileState(null);
  }, []);

  return (
    <ProfileContext.Provider value={{ activeProfile, setActiveProfile, switchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}
