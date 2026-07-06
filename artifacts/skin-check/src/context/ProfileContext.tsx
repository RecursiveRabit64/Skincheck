import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type UserType = "child" | "teen" | "parent";
export type AgeRange = "5-7" | "8-12" | "13-17" | "18-35" | "35-55" | "55+";

export interface Family {
  id: string;
  name: string;
}

export interface StoredProfile {
  id: string;
  name: string;
  userType: UserType;
  ageRange: AgeRange;
  createdAt: string;
  familyId?: string;
}

interface ProfileStore {
  profiles: StoredProfile[];
  activeProfileId: string | null;
  families: Family[];
}

interface ProfileContextValue {
  profiles: StoredProfile[];
  families: Family[];
  activeProfile: StoredProfile | null;
  activeProfileId: string | null;
  addProfile: (data: { name: string; userType: UserType; ageRange: AgeRange }) => StoredProfile;
  updateProfile: (id: string, patch: Partial<Pick<StoredProfile, "name" | "ageRange" | "userType">>) => void;
  switchProfile: (id: string) => void;
  removeProfile: (id: string) => void;
  addFamily: (name: string) => Family;
  renameFamily: (id: string, name: string) => void;
  deleteFamily: (id: string) => void;
  addProfileToFamily: (profileId: string, familyId: string) => void;
  removeProfileFromFamily: (profileId: string) => void;
  pendingLastDeleteId: string | null;
  setPendingLastDelete: (id: string) => void;
  cancelPendingLastDelete: () => void;
}

const STORAGE_KEY = "skincheck_v3";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadStore(): ProfileStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { profiles: [], activeProfileId: null, families: [] };
    const parsed = JSON.parse(raw) as Partial<ProfileStore>;
    return {
      profiles: parsed.profiles ?? [],
      activeProfileId: parsed.activeProfileId ?? null,
      families: parsed.families ?? [],
    };
  } catch {
    return { profiles: [], activeProfileId: null, families: [] };
  }
}

function saveStore(store: ProfileStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<ProfileStore>(loadStore);
  const [pendingLastDeleteId, setPendingLastDeleteId] = useState<string | null>(null);

  const persist = useCallback((updater: (prev: ProfileStore) => ProfileStore) => {
    setStore((prev) => {
      const next = updater(prev);
      saveStore(next);
      return next;
    });
  }, []);

  const addProfile = useCallback(
    (data: { name: string; userType: UserType; ageRange: AgeRange }): StoredProfile => {
      const newProfile: StoredProfile = {
        id: generateId(),
        name: data.name.trim() || (data.userType === "parent" ? "Caregiver" : data.userType === "teen" ? "Teen" : "Child"),
        userType: data.userType,
        ageRange: data.ageRange,
        createdAt: new Date().toISOString(),
      };
      let created = newProfile;
      persist((prev) => {
        created = newProfile;
        return { ...prev, profiles: [...prev.profiles, newProfile], activeProfileId: newProfile.id };
      });
      return created;
    },
    [persist]
  );

  const updateProfile = useCallback(
    (id: string, patch: Partial<Pick<StoredProfile, "name" | "ageRange" | "userType">>) => {
      persist((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
    },
    [persist]
  );

  const switchProfile = useCallback(
    (id: string) => {
      persist((prev) => {
        if (!prev.profiles.find((p) => p.id === id)) return prev;
        return { ...prev, activeProfileId: id };
      });
    },
    [persist]
  );

  const removeProfile = useCallback(
    (id: string) => {
      persist((prev) => {
        const remaining = prev.profiles.filter((p) => p.id !== id);
        const activeId = prev.activeProfileId === id ? (remaining[0]?.id ?? null) : prev.activeProfileId;
        return { ...prev, profiles: remaining, activeProfileId: activeId };
      });
    },
    [persist]
  );

  const addFamily = useCallback(
    (name: string): Family => {
      const family: Family = { id: generateId(), name: name.trim() || "Family" };
      persist((prev) => ({ ...prev, families: [...prev.families, family] }));
      return family;
    },
    [persist]
  );

  const renameFamily = useCallback(
    (id: string, name: string) => {
      persist((prev) => ({
        ...prev,
        families: prev.families.map((f) => (f.id === id ? { ...f, name: name.trim() || f.name } : f)),
      }));
    },
    [persist]
  );

  const deleteFamily = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        families: prev.families.filter((f) => f.id !== id),
        profiles: prev.profiles.map((p) => (p.familyId === id ? { ...p, familyId: undefined } : p)),
      }));
    },
    [persist]
  );

  const addProfileToFamily = useCallback(
    (profileId: string, familyId: string) => {
      persist((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) => (p.id === profileId ? { ...p, familyId } : p)),
      }));
    },
    [persist]
  );

  const removeProfileFromFamily = useCallback(
    (profileId: string) => {
      persist((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) => (p.id === profileId ? { ...p, familyId: undefined } : p)),
      }));
    },
    [persist]
  );

  const setPendingLastDelete = useCallback((id: string) => {
    setPendingLastDeleteId(id);
  }, []);

  const cancelPendingLastDelete = useCallback(() => {
    setPendingLastDeleteId(null);
  }, []);

  const activeProfile = store.profiles.find((p) => p.id === store.activeProfileId) ?? null;

  return (
    <ProfileContext.Provider
      value={{
        profiles: store.profiles,
        families: store.families,
        activeProfile,
        activeProfileId: store.activeProfileId,
        addProfile,
        updateProfile,
        switchProfile,
        removeProfile,
        addFamily,
        renameFamily,
        deleteFamily,
        addProfileToFamily,
        removeProfileFromFamily,
        pendingLastDeleteId,
        setPendingLastDelete,
        cancelPendingLastDelete,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be inside ProfileProvider");
  return ctx;
}
