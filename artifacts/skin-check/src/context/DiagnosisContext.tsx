import { createContext, useContext, useState, ReactNode } from "react";
import type { DiagnosisResult } from "@workspace/api-client-react";
import type { AreaEntry } from "@/lib/simulation";

interface DiagnosisContextType {
  lastDiagnosis: DiagnosisResult | null;
  setLastDiagnosis: (d: DiagnosisResult | null) => void;
  sessionAreas: AreaEntry[];
  setSessionAreas: (areas: AreaEntry[]) => void;
}

const DiagnosisContext = createContext<DiagnosisContextType | undefined>(undefined);

export function DiagnosisProvider({ children }: { children: ReactNode }) {
  const [lastDiagnosis, setLastDiagnosis] = useState<DiagnosisResult | null>(null);
  const [sessionAreas, setSessionAreas] = useState<AreaEntry[]>([]);

  return (
    <DiagnosisContext.Provider value={{ lastDiagnosis, setLastDiagnosis, sessionAreas, setSessionAreas }}>
      {children}
    </DiagnosisContext.Provider>
  );
}

export function useDiagnosisContext() {
  const ctx = useContext(DiagnosisContext);
  if (!ctx) throw new Error("useDiagnosisContext must be used within a DiagnosisProvider");
  return ctx;
}
