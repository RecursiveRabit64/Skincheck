import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useDiagnose } from "@workspace/api-client-react";
import { BodyDoll, SkinCondition, ZoneData, DollMode, zonesDef } from "@/components/BodyDoll";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDiagnosisContext } from "@/context/DiagnosisContext";
import { RotateCcw, Sparkles, ChevronLeft, ChevronRight, Pill } from "lucide-react";
import { cn } from "@/lib/utils";

const CONDITIONS: SkinCondition[] = [
  "Acne", "Cystic Acne", "Blackheads",
  "Rash", "Hives", "Contact Dermatitis",
  "Eczema", "Psoriasis",
  "Infection", "Fungal",
  "Dryness", "Sunburn",
];

const MEDICATIONS = [
  "Benzoyl Peroxide",
  "Salicylic Acid",
  "Adapalene",
  "Clindamycin",
  "Retinol",
  "Niacinamide",
  "Hydrocortisone Cream",
  "Antibiotic Cream",
  "Antifungal Cream",
  "Tea Tree Oil",
  "Moisturizer",
  "Sunscreen",
];

// How much severity changes per day (positive = worse, negative = heals naturally)
const NATURAL_PROGRESSION: Record<SkinCondition, number> = {
  "Acne":               0.20,
  "Cystic Acne":        0.30,
  "Blackheads":         0.05,
  "Rash":               0.15,
  "Hives":             -0.40,
  "Contact Dermatitis": 0.10,
  "Eczema":             0.08,
  "Psoriasis":          0.05,
  "Infection":          0.45,
  "Fungal":             0.35,
  "Dryness":            0.10,
  "Sunburn":           -0.30,
};

// How much severity decreases per day with medication (negative = healing)
const MEDICATION_RATE: Record<string, number> = {
  "Benzoyl Peroxide":     -1.5,
  "Salicylic Acid":       -1.2,
  "Adapalene":            -1.3,
  "Clindamycin":          -1.6,
  "Retinol":              -1.0,
  "Niacinamide":          -0.7,
  "Hydrocortisone Cream": -2.0,
  "Antibiotic Cream":     -1.8,
  "Antifungal Cream":     -1.5,
  "Tea Tree Oil":         -0.8,
  "Moisturizer":          -0.5,
  "Sunscreen":            -0.3,
};

function simulateSeverity(zone: ZoneData, day: number): number {
  if (day === 0) return zone.severity;
  const rate = zone.medication
    ? (MEDICATION_RATE[zone.medication] ?? -0.8)
    : (NATURAL_PROGRESSION[zone.condition] ?? 0.1);
  return Math.max(0, Math.min(10, zone.severity + rate * day));
}

const zoneLabelMap: Record<string, string> = Object.fromEntries(
  zonesDef.map((z) => [z.id, z.label])
);

export default function Home() {
  const [, setLocation] = useLocation();
  const [currentCondition, setCurrentCondition] = useState<SkinCondition>("Acne");
  const [zones, setZones] = useState<Map<string, ZoneData>>(new Map());
  const [mode, setMode] = useState<DollMode>("mark");
  const [simulatedDay, setSimulatedDay] = useState(0);
  const [medicationTarget, setMedicationTarget] = useState<string | null>(null);
  const { setLastDiagnosis } = useDiagnosisContext();
  const diagnoseMutation = useDiagnose();

  // Compute what zones look like at the simulated day
  const displayZones = useMemo(() => {
    if (simulatedDay === 0) return zones;
    const result = new Map<string, ZoneData>();
    for (const [id, data] of zones.entries()) {
      result.set(id, { ...data, severity: simulateSeverity(data, simulatedDay) });
    }
    return result;
  }, [zones, simulatedDay]);

  const handleZoneInteract = (region: string, amount: number = 2) => {
    setZones((prev) => {
      const next = new Map(prev);
      const existing = next.get(region);
      let newSeverity: number;
      if (existing && existing.condition === currentCondition) {
        newSeverity = Math.min(existing.severity + amount, 10);
      } else {
        newSeverity = amount;
      }
      next.set(region, {
        condition: currentCondition,
        severity: newSeverity,
        medication: existing?.condition === currentCondition ? existing.medication : undefined,
      });
      return next;
    });
  };

  const handleApplyMedication = (med: string | undefined) => {
    if (!medicationTarget) return;
    setZones((prev) => {
      const next = new Map(prev);
      const existing = next.get(medicationTarget);
      if (existing) {
        next.set(medicationTarget, { ...existing, medication: med });
      }
      return next;
    });
    setMedicationTarget(null);
  };

  const handleDiagnose = () => {
    const affectedAreas = Array.from(zones.entries()).map(([region, data]) => ({
      region,
      condition: data.condition.toLowerCase(),
      severity: data.severity,
    }));
    if (affectedAreas.length === 0) return;

    const medicationNotes = Array.from(zones.entries())
      .filter(([, d]) => d.medication)
      .map(([id, d]) => `${zoneLabelMap[id] ?? id}: applying ${d.medication}`)
      .join("; ");

    diagnoseMutation.mutate(
      {
        data: {
          affectedAreas,
          age: null,
          additionalNotes: medicationNotes || null,
        },
      },
      {
        onSuccess: (result) => {
          setLastDiagnosis(result);
          setLocation("/diagnosis");
        },
      }
    );
  };

  const medicationZoneData = medicationTarget ? zones.get(medicationTarget) : null;

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col pt-6 pb-20 px-4">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col gap-4">

        {/* Header */}
        <header className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold tracking-tight text-foreground"
          >
            SkinCheck
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-1 text-sm"
          >
            Tap or hold areas to mark skin concerns
          </motion.p>
        </header>

        {/* Day Counter */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-center gap-3"
        >
          <button
            onClick={() => setSimulatedDay((d) => Math.max(0, d - 1))}
            disabled={simulatedDay === 0}
            data-testid="day-decrement"
            className="p-1.5 rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={simulatedDay}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "flex flex-col items-center min-w-[90px]",
              )}
            >
              <span className="text-xl font-bold text-foreground">
                {simulatedDay === 0 ? "Today" : `Day ${simulatedDay}`}
              </span>
              {simulatedDay > 0 && (
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Simulated
                </span>
              )}
            </motion.div>
          </AnimatePresence>

          <button
            onClick={() => setSimulatedDay((d) => Math.min(30, d + 1))}
            disabled={simulatedDay === 30}
            data-testid="day-increment"
            className="p-1.5 rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex rounded-xl overflow-hidden border border-border bg-muted/40 p-0.5 gap-0.5">
          <button
            data-testid="mode-mark"
            onClick={() => setMode("mark")}
            className={cn(
              "flex-1 py-1.5 text-sm font-medium rounded-lg transition-all",
              mode === "mark"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mark Condition
          </button>
          <button
            data-testid="mode-medicate"
            onClick={() => setMode("medicate")}
            className={cn(
              "flex-1 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
              mode === "medicate"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Pill className="w-3.5 h-3.5" />
            Add Medication
          </button>
        </div>

        {/* Condition Pills (only in mark mode) */}
        <AnimatePresence>
          {mode === "mark" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-1.5 justify-center">
                {CONDITIONS.map((cond) => (
                  <button
                    key={cond}
                    data-testid={`condition-${cond}`}
                    onClick={() => setCurrentCondition(cond)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all",
                      currentCondition === cond
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-white text-muted-foreground shadow-sm border border-border hover:bg-muted/30"
                    )}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Medication mode hint */}
        <AnimatePresence>
          {mode === "medicate" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-xs text-muted-foreground bg-green-50 border border-green-100 rounded-xl py-2 px-4"
            >
              Tap any marked zone to assign a medication
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body Doll */}
        <div className="flex-1 flex items-start justify-center relative">
          <BodyDoll
            zones={displayZones}
            currentCondition={currentCondition}
            mode={mode}
            onZoneInteract={(id) => handleZoneInteract(id, 2)}
            onZoneInteractHold={(id) => handleZoneInteract(id, 1)}
            onZoneMedicateClick={(id) => setMedicationTarget(id)}
          />
          <Button
            variant="outline"
            size="icon"
            data-testid="reset-button"
            className="absolute top-0 right-0 rounded-full shadow-sm bg-white"
            onClick={() => { setZones(new Map()); setSimulatedDay(0); }}
            title="Reset"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Simulate day note */}
        {simulatedDay > 0 && zones.size > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-muted-foreground"
          >
            Showing projected skin state on Day {simulatedDay}.
            {" "}
            <button
              className="underline underline-offset-2 hover:text-foreground transition-colors"
              onClick={() => setSimulatedDay(0)}
            >
              Back to today
            </button>
          </motion.p>
        )}

        {/* Get Diagnosis */}
        <div className="mt-auto pt-2">
          <Button
            data-testid="button-diagnose"
            className="w-full h-14 rounded-2xl text-lg shadow-md font-semibold"
            disabled={zones.size === 0 || diagnoseMutation.isPending}
            onClick={handleDiagnose}
          >
            {diagnoseMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-pulse" /> Analyzing...
              </span>
            ) : (
              "Get AI Assessment"
            )}
          </Button>
        </div>
      </div>

      {/* Medication Dialog */}
      <Dialog
        open={medicationTarget !== null}
        onOpenChange={(open) => { if (!open) setMedicationTarget(null); }}
      >
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {medicationTarget ? zoneLabelMap[medicationTarget] ?? medicationTarget : ""}
            </DialogTitle>
            {medicationZoneData && (
              <p className="text-sm text-muted-foreground">
                {medicationZoneData.condition} — Severity {Math.round(medicationZoneData.severity)}/10
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <p className="text-sm font-medium text-foreground">Select a medication being applied:</p>
            <div className="flex flex-wrap gap-2">
              {MEDICATIONS.map((med) => {
                const isActive = medicationZoneData?.medication === med;
                return (
                  <button
                    key={med}
                    data-testid={`medication-${med.replace(/\s+/g, "-")}`}
                    onClick={() => handleApplyMedication(isActive ? undefined : med)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      isActive
                        ? "bg-green-100 border-green-400 text-green-700 shadow-sm"
                        : "bg-white border-border text-foreground hover:bg-muted/30"
                    )}
                  >
                    {med}
                  </button>
                );
              })}
            </div>

            {medicationZoneData?.medication && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground w-full"
                onClick={() => handleApplyMedication(undefined)}
              >
                Remove medication
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
