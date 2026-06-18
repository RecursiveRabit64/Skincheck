import { createContext, useContext, useState, ReactNode } from "react";
import type { DiagnosisResult } from "@workspace/api-client-react/src/generated/api.schemas";

interface DiagnosisContextType {
  lastDiagnosis: DiagnosisResult | null;
  setLastDiagnosis: (diagnosis: DiagnosisResult | null) => void;
}

const DiagnosisContext = createContext<DiagnosisContextType | undefined>(undefined);

export function DiagnosisProvider({ children }: { children: ReactNode }) {
  const [lastDiagnosis, setLastDiagnosis] = useState<DiagnosisResult | null>(null);

  return (
    <DiagnosisContext.Provider value={{ lastDiagnosis, setLastDiagnosis }}>
      {children}
    </DiagnosisContext.Provider>
  );
}

export function useDiagnosisContext() {
  const context = useContext(DiagnosisContext);
  if (context === undefined) {
    throw new Error("useDiagnosisContext must be used within a DiagnosisProvider");
  }
  return context;
}
