import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useDiagnose } from "@workspace/api-client-react";
import { BodyDoll, SkinCondition, ZoneData, DollMode, zonesDef } from "@/components/BodyDoll";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDiagnosisContext } from "@/context/DiagnosisContext";
import { RotateCcw, Sparkles, Pill, Undo2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const CONDITIONS: SkinCondition[] = [
  "Acne", "Cystic Acne", "Blackheads",
  "Rash", "Hives", "Contact Dermatitis",
  "Eczema", "Psoriasis",
  "Infection", "Fungal",
  "Dryness", "Sunburn",
];

interface BrandMed {
  brand: string;
  generic: string;
  category: string;
}

const BRAND_MEDICATIONS: BrandMed[] = [
  { brand: "Proactiv", generic: "Benzoyl Peroxide", category: "Acne" },
  { brand: "PanOxyl", generic: "Benzoyl Peroxide", category: "Acne" },
  { brand: "AcneFree", generic: "Benzoyl Peroxide", category: "Acne" },
  { brand: "Differin", generic: "Adapalene (Retinoid)", category: "Acne / Retinoid" },
  { brand: "Retin-A", generic: "Tretinoin (Prescription Retinoid)", category: "Prescription" },
  { brand: "Retin-A Micro", generic: "Tretinoin Gel (Prescription)", category: "Prescription" },
  { brand: "Tazorac", generic: "Tazarotene (Prescription Retinoid)", category: "Prescription" },
  { brand: "Epiduo", generic: "Adapalene + Benzoyl Peroxide", category: "Combination" },
  { brand: "Benzaclin", generic: "Clindamycin + Benzoyl Peroxide", category: "Combination Antibiotic" },
  { brand: "Clindamycin / Cleocin T", generic: "Clindamycin (Topical Antibiotic)", category: "Antibiotic" },
  { brand: "Aczone", generic: "Dapsone (Topical Antibiotic)", category: "Antibiotic" },
  { brand: "Neosporin", generic: "Triple Antibiotic Ointment", category: "Antibiotic" },
  { brand: "Bactroban", generic: "Mupirocin (Prescription Antibiotic)", category: "Prescription" },
  { brand: "Nizoral", generic: "Ketoconazole (Antifungal)", category: "Antifungal" },
  { brand: "Lotrimin", generic: "Clotrimazole (Antifungal)", category: "Antifungal" },
  { brand: "Tinactin", generic: "Tolnaftate (Antifungal)", category: "Antifungal" },
  { brand: "Lamisil", generic: "Terbinafine (Antifungal)", category: "Antifungal" },
  { brand: "Cortizone-10", generic: "Hydrocortisone 1%", category: "Anti-inflammatory" },
  { brand: "Stridex", generic: "Salicylic Acid Pads", category: "Exfoliant / Acne" },
  { brand: "Clean & Clear", generic: "Salicylic Acid", category: "Acne" },
  { brand: "Clearasil", generic: "Salicylic Acid / Benzoyl Peroxide", category: "Acne" },
  { brand: "Neutrogena T/Sal", generic: "Salicylic Acid Shampoo", category: "Scalp" },
  { brand: "Neutrogena T/Gel", generic: "Coal Tar (Psoriasis/Dandruff)", category: "Scalp" },
  { brand: "Paula's Choice BHA", generic: "Salicylic Acid 2%", category: "Exfoliant" },
  { brand: "The Ordinary Niacinamide", generic: "Niacinamide 10% + Zinc", category: "Serum" },
  { brand: "The Ordinary Retinol", generic: "Retinol (Vitamin A)", category: "Retinoid" },
  { brand: "La Roche-Posay Effaclar", generic: "Salicylic Acid + Niacinamide", category: "Acne" },
  { brand: "La Roche-Posay Toleriane", generic: "Ceramide Moisturizer", category: "Moisturizer" },
  { brand: "CeraVe Moisturizer", generic: "Ceramides + Hyaluronic Acid", category: "Moisturizer" },
  { brand: "Cetaphil", generic: "Gentle Moisturizing Lotion", category: "Moisturizer" },
  { brand: "Aveeno", generic: "Colloidal Oatmeal Moisturizer", category: "Moisturizer" },
  { brand: "Vanicream", generic: "Fragrance-Free Moisturizer", category: "Moisturizer" },
  { brand: "Eucerin", generic: "Urea / Ceramide Repair Cream", category: "Moisturizer" },
  { brand: "Aquaphor", generic: "Petrolatum Healing Ointment", category: "Barrier / Healing" },
  { brand: "Bioderma Sensibio", generic: "Micellar Water / Gentle Cleanser", category: "Cleanser" },
  { brand: "Murad Acne Control", generic: "Salicylic Acid Treatment", category: "Acne" },
  { brand: "Tea Tree Oil", generic: "Melaleuca Oil (Antimicrobial)", category: "Natural" },
  { brand: "Aloe Vera Gel", generic: "Aloe Vera (Soothing)", category: "Natural" },
  { brand: "Hydrocolloid Patches", generic: "Acne Absorption Patch", category: "Physical Treatment" },
  { brand: "Accutane / Isotretinoin", generic: "Isotretinoin (Oral Retinoid — Prescription)", category: "Prescription Oral" },
  { brand: "Doxycycline", generic: "Doxycycline (Oral Antibiotic — Prescription)", category: "Prescription Oral" },
  { brand: "Spironolactone", generic: "Spironolactone (Hormonal — Prescription)", category: "Prescription Oral" },
  { brand: "Zinc Supplement", generic: "Zinc (Oral Supplement)", category: "Supplement" },
];

const zoneLabelMap: Record<string, string> = Object.fromEntries(
  zonesDef.map((z) => [z.id, z.label])
);

type ZoneSnapshot = Map<string, ZoneData>;

export default function Home() {
  const [, setLocation] = useLocation();
  const [currentCondition, setCurrentCondition] = useState<SkinCondition>("Acne");
  const [zones, setZones] = useState<ZoneSnapshot>(new Map());
  const [mode, setMode] = useState<DollMode>("mark");
  const [medicationTarget, setMedicationTarget] = useState<string | null>(null);
  const [medSearch, setMedSearch] = useState("");
  const history = useRef<ZoneSnapshot[]>([]);
  const { setLastDiagnosis, setSessionAreas } = useDiagnosisContext();
  const diagnoseMutation = useDiagnose();

  const pushHistory = (current: ZoneSnapshot) => {
    history.current = [...history.current.slice(-30), new Map(current)];
  };

  const handleUndo = () => {
    if (history.current.length === 0) return;
    const prev = history.current[history.current.length - 1];
    history.current = history.current.slice(0, -1);
    setZones(new Map(prev));
  };

  const handleZoneInteract = (region: string, amount: number = 2) => {
    setZones((prev) => {
      pushHistory(prev);
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
      if (existing) next.set(medicationTarget, { ...existing, medication: med });
      return next;
    });
    setMedicationTarget(null);
    setMedSearch("");
  };

  const handleDiagnose = () => {
    const areas = Array.from(zones.entries()).map(([region, data]) => ({
      region,
      condition: data.condition.toLowerCase(),
      severity: data.severity,
      medication: data.medication ?? null,
    }));
    if (areas.length === 0) return;

    const medicationNotes = areas
      .filter((a) => a.medication)
      .map((a) => `${zoneLabelMap[a.region] ?? a.region}: applying ${a.medication}`)
      .join("; ");

    setSessionAreas(areas);

    diagnoseMutation.mutate(
      { data: { affectedAreas: areas, age: null, additionalNotes: medicationNotes || null } },
      {
        onSuccess: (result) => {
          setLastDiagnosis(result);
          setLocation("/diagnosis");
        },
      }
    );
  };

  const medicationZoneData = medicationTarget ? zones.get(medicationTarget) : null;

  const filteredMeds = BRAND_MEDICATIONS.filter(
    (m) =>
      medSearch.trim() === "" ||
      m.brand.toLowerCase().includes(medSearch.toLowerCase()) ||
      m.generic.toLowerCase().includes(medSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(medSearch.toLowerCase())
  );

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col pt-6 pb-20 px-4">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col gap-4">

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

        {/* Condition pills */}
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

        <AnimatePresence>
          {mode === "medicate" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-xs text-muted-foreground bg-green-50 border border-green-100 rounded-xl py-2 px-4"
            >
              Tap any marked zone (red area) to assign a medication
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body Doll */}
        <div className="flex-1 flex items-start justify-center relative">
          <BodyDoll
            zones={zones}
            currentCondition={currentCondition}
            mode={mode}
            onZoneInteract={(id) => handleZoneInteract(id, 2)}
            onZoneInteractHold={(id) => handleZoneInteract(id, 1)}
            onZoneMedicateClick={(id) => { setMedicationTarget(id); setMedSearch(""); }}
          />

          {/* Undo + Reset controls */}
          <div className="absolute top-0 right-0 flex flex-col gap-2">
            <Button
              variant="outline"
              size="icon"
              data-testid="button-undo"
              className="rounded-full shadow-sm bg-white"
              onClick={handleUndo}
              disabled={history.current.length === 0}
              title="Undo"
            >
              <Undo2 className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              data-testid="reset-button"
              className="rounded-full shadow-sm bg-white"
              onClick={() => { pushHistory(zones); setZones(new Map()); }}
              title="Reset"
            >
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

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
        onOpenChange={(open) => { if (!open) { setMedicationTarget(null); setMedSearch(""); } }}
      >
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {medicationTarget ? (zoneLabelMap[medicationTarget] ?? medicationTarget) : ""}
            </DialogTitle>
            {medicationZoneData && (
              <p className="text-sm text-muted-foreground">
                {medicationZoneData.condition} — Severity {Math.round(medicationZoneData.severity)}/10
              </p>
            )}
          </DialogHeader>

          <div className="space-y-3 pt-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="medication-search"
                placeholder="Search brand or ingredient..."
                value={medSearch}
                onChange={(e) => setMedSearch(e.target.value)}
                className="pl-9 rounded-xl"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {filteredMeds.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No medications found</p>
              )}
              {filteredMeds.map((med) => {
                const isActive = medicationZoneData?.medication === med.brand;
                return (
                  <button
                    key={med.brand}
                    data-testid={`medication-${med.brand.replace(/\s+/g, "-")}`}
                    onClick={() => handleApplyMedication(isActive ? undefined : med.brand)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl border transition-all flex flex-col gap-0.5",
                      isActive
                        ? "bg-green-50 border-green-300 text-green-800"
                        : "bg-white border-border hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{med.brand}</span>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                        {med.category}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{med.generic}</span>
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
