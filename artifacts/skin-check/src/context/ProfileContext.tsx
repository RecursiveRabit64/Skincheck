import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type UserType = "child" | "teen" | "adult" | "caregiver" | "parent";
export type AgeRange =
  // New ranges
  | "1-5" | "6-9" | "10-12" | "13-15" | "16-18" | "18+"
  // Legacy ranges (backward compat)
  | "5-7" | "8-12" | "13-17" | "18-35" | "35-55" | "55+";

export interface SkinBackground {
  diagnosedConditions: string[];
  allergies: string[];
  currentTreatments: string[];
}

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
  skinBackground?: SkinBackground;
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
  addProfile: (data: { name: string; userType: UserType; ageRange: AgeRange; skinBackground?: SkinBackground }) => StoredProfile;
  updateProfile: (id: string, patch: Partial<Pick<StoredProfile, "name" | "ageRange" | "userType">>) => void;
  updateSkinBackground: (id: string, bg: SkinBackground) => void;
  switchProfile: (id: string) => void;
  removeProfile: (id: string) => void;
  addFamily: (name: string) => Family;
  renameFamily: (id: string, name: string) => void;
  deleteFamily: (id: string) => void;
  addProfileToFamily: (profileId: string, familyId: string) => void;
  removeProfileFromFamily: (profileId: string) => void;
  pendingLastDeleteIds: string[];
  setPendingLastDelete: (ids: string[]) => void;
  cancelPendingLastDelete: () => void;
}

const STORAGE_KEY = "skincheck_v3";

const DEFAULT_NAME: Record<UserType, string> = {
  child: "Child",
  teen: "Teen",
  adult: "Adult",
  caregiver: "Caregiver",
  parent: "Caregiver",
};

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
  const [pendingLastDeleteIds, setPendingLastDeleteIds] = useState<string[]>([]);

  const persist = useCallback((updater: (prev: ProfileStore) => ProfileStore) => {
    setStore((prev) => {
      const next = updater(prev);
      saveStore(next);
      return next;
    });
  }, []);

  const addProfile = useCallback(
    (data: { name: string; userType: UserType; ageRange: AgeRange; skinBackground?: SkinBackground }): StoredProfile => {
      const newProfile: StoredProfile = {
        id: generateId(),
        name: data.name.trim() || DEFAULT_NAME[data.userType],
        userType: data.userType,
        ageRange: data.ageRange,
        createdAt: new Date().toISOString(),
        ...(data.skinBackground ? { skinBackground: data.skinBackground } : {}),
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

  const updateSkinBackground = useCallback(
    (id: string, bg: SkinBackground) => {
      persist((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) => (p.id === id ? { ...p, skinBackground: bg } : p)),
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

  const setPendingLastDelete = useCallback((ids: string[]) => {
    setPendingLastDeleteIds(ids);
  }, []);

  const cancelPendingLastDelete = useCallback(() => {
    setPendingLastDeleteIds([]);
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
        updateSkinBackground,
        switchProfile,
        removeProfile,
        addFamily,
        renameFamily,
        deleteFamily,
        addProfileToFamily,
        removeProfileFromFamily,
        pendingLastDeleteIds,
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
