import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type UserType = "child" | "teen" | "parent";
export type AgeRange = "5-7" | "8-12" | "13-17" | "18-35" | "35-55" | "55+";

export interface StoredProfile {
  id: string;
  name: string;
  userType: UserType;
  ageRange: AgeRange;
  createdAt: string;
}

interface ProfileStore {
  profiles: StoredProfile[];
  activeProfileId: string | null;
}

interface ProfileContextValue {
  profiles: StoredProfile[];
  activeProfile: StoredProfile | null;
  activeProfileId: string | null;
  addProfile: (data: { name: string; userType: UserType; ageRange: AgeRange }) => StoredProfile;
  switchProfile: (id: string) => void;
  removeProfile: (id: string) => void;
}

const STORAGE_KEY = "skincheck_v3";

function loadStore(): ProfileStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { profiles: [], activeProfileId: null };
    return JSON.parse(raw) as ProfileStore;
  } catch {
    return { profiles: [], activeProfileId: null };
  }
}

function saveStore(store: ProfileStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<ProfileStore>(loadStore);

  const persist = useCallback((next: ProfileStore) => {
    saveStore(next);
    setStore(next);
  }, []);

  const addProfile = useCallback(
    (data: { name: string; userType: UserType; ageRange: AgeRange }): StoredProfile => {
      const newProfile: StoredProfile = {
        id: generateId(),
        name: data.name.trim() || (data.userType === "parent" ? "Parent" : data.userType === "teen" ? "Teen" : "Child"),
        userType: data.userType,
        ageRange: data.ageRange,
        createdAt: new Date().toISOString(),
      };
      setStore((prev) => {
        const next = { profiles: [...prev.profiles, newProfile], activeProfileId: newProfile.id };
        saveStore(next);
        return next;
      });
      return newProfile;
    },
    []
  );

  const switchProfile = useCallback((id: string) => {
    setStore((prev) => {
      if (!prev.profiles.find((p) => p.id === id)) return prev;
      const next = { ...prev, activeProfileId: id };
      saveStore(next);
      return next;
    });
  }, []);

  const removeProfile = useCallback((id: string) => {
    setStore((prev) => {
      const remaining = prev.profiles.filter((p) => p.id !== id);
      const activeId = prev.activeProfileId === id ? (remaining[0]?.id ?? null) : prev.activeProfileId;
      const next = { profiles: remaining, activeProfileId: activeId };
      saveStore(next);
      return next;
    });
  }, []);

  const activeProfile = store.profiles.find((p) => p.id === store.activeProfileId) ?? null;

  return (
    <ProfileContext.Provider value={{ profiles: store.profiles, activeProfile, activeProfileId: store.activeProfileId, addProfile, switchProfile, removeProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be inside ProfileProvider");
  return ctx;
}
