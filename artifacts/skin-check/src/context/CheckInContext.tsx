import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface ZoneEntry {
  condition: string;
  severity: number;
  medication?: string;
}

export interface CheckInReport {
  id: string;
  profileId: string;
  date: string;
  zones: Record<string, ZoneEntry>;
  scratchScore?: number;
  createdAt: string;
}

interface CheckInStore {
  reports: CheckInReport[];
}

interface CheckInContextValue {
  reports: CheckInReport[];
  saveReport: (profileId: string, zones: Map<string, ZoneEntry>, scratchScore?: number) => CheckInReport;
  getReportsForProfile: (profileId: string) => CheckInReport[];
  deleteReport: (id: string) => void;
  deleteReportsForProfile: (profileId: string) => void;
}

const STORAGE_KEY = "skincheck_reports_v1";

function loadStore(): CheckInStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { reports: [] };
    return JSON.parse(raw) as CheckInStore;
  } catch {
    return { reports: [] };
  }
}

function saveStore(store: CheckInStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const CheckInContext = createContext<CheckInContextValue | null>(null);

export function CheckInProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<CheckInStore>(loadStore);

  const persist = useCallback((updater: (prev: CheckInStore) => CheckInStore) => {
    setStore((prev) => {
      const next = updater(prev);
      saveStore(next);
      return next;
    });
  }, []);

  const saveReport = useCallback(
    (profileId: string, zones: Map<string, ZoneEntry>, scratchScore?: number): CheckInReport => {
      const today = todayStr();
      const zonesRecord: Record<string, ZoneEntry> = {};
      zones.forEach((v, k) => { zonesRecord[k] = v; });

      const report: CheckInReport = {
        id: generateId(),
        profileId,
        date: today,
        zones: zonesRecord,
        scratchScore,
        createdAt: new Date().toISOString(),
      };

      persist((prev) => {
        const withoutToday = prev.reports.filter(
          (r) => !(r.profileId === profileId && r.date === today)
        );
        return { reports: [...withoutToday, report] };
      });

      return report;
    },
    [persist]
  );

  const getReportsForProfile = useCallback(
    (profileId: string): CheckInReport[] =>
      store.reports
        .filter((r) => r.profileId === profileId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [store.reports]
  );

  const deleteReport = useCallback((id: string) => {
    persist((prev) => ({ reports: prev.reports.filter((r) => r.id !== id) }));
  }, [persist]);

  const deleteReportsForProfile = useCallback((profileId: string) => {
    persist((prev) => ({ reports: prev.reports.filter((r) => r.profileId !== profileId) }));
  }, [persist]);

  return (
    <CheckInContext.Provider value={{ reports: store.reports, saveReport, getReportsForProfile, deleteReport, deleteReportsForProfile }}>
      {children}
    </CheckInContext.Provider>
  );
}

export function useCheckIn(): CheckInContextValue {
  const ctx = useContext(CheckInContext);
  if (!ctx) throw new Error("useCheckIn must be inside CheckInProvider");
  return ctx;
}
