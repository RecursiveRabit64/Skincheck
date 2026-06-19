import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useDiagnose } from "@workspace/api-client-react";
import { BodyDoll, type SkinCondition, type ZoneData, type DollMode, type DollView, zonesDef } from "@/components/BodyDoll";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDiagnosisContext } from "@/context/DiagnosisContext";
import { RotateCcw, Sparkles, Pill, Undo2, Search, ChevronDown, FlipHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Condition Groups ─────────────────────────────────────────────────────────

interface ConditionGroup {
  label: string;
  conditions: SkinCondition[];
}

const CONDITION_GROUPS: ConditionGroup[] = [
  {
    label: "Acne",
    conditions: ["Acne Vulgaris", "Cystic Acne", "Blackheads", "Whiteheads", "Hormonal Acne", "Milia"],
  },
  {
    label: "Eczema",
    conditions: ["Atopic Dermatitis", "Contact Dermatitis", "Dyshidrotic Eczema", "Neurodermatitis", "Seborrheic Dermatitis"],
  },
  {
    label: "Rash / Allergic",
    conditions: ["Hives", "Pityriasis Rosea", "Drug Rash", "Heat Rash"],
  },
  {
    label: "Inflammatory",
    conditions: ["Psoriasis", "Rosacea", "Perioral Dermatitis"],
  },
  {
    label: "Infection",
    conditions: ["Bacterial Infection", "Impetigo", "Folliculitis"],
  },
  {
    label: "Fungal",
    conditions: ["Ringworm", "Tinea Versicolor", "Athlete's Foot", "Candidiasis"],
  },
  {
    label: "Other",
    conditions: ["Dry Skin", "Sunburn", "Keratosis Pilaris", "Warts"],
  },
];

function getConditionGroup(condition: SkinCondition): string {
  for (const g of CONDITION_GROUPS) {
    if (g.conditions.includes(condition)) return g.label;
  }
  return "Other";
}

// ── Medication Bank ──────────────────────────────────────────────────────────

interface MedicationEntry {
  brand: string;
  generic: string;
  otc: boolean;
  forGroups: string[]; // group labels, or ["all"]
}

const MEDICATIONS: MedicationEntry[] = [
  // Acne — OTC
  { brand: "PanOxyl / Proactiv", generic: "Benzoyl Peroxide", otc: true, forGroups: ["Acne", "Infection"] },
  { brand: "Stridex / Paula's Choice BHA", generic: "Salicylic Acid", otc: true, forGroups: ["Acne", "Inflammatory"] },
  { brand: "Differin 0.1%", generic: "Adapalene (OTC)", otc: true, forGroups: ["Acne"] },
  { brand: "The Ordinary Niacinamide", generic: "Niacinamide", otc: true, forGroups: ["Acne", "Inflammatory"] },
  { brand: "Mario Badescu Drying Lotion", generic: "Sulfur Wash", otc: true, forGroups: ["Acne"] },
  { brand: "Hero Mighty Patch", generic: "Hydrocolloid Patches", otc: true, forGroups: ["Acne"] },
  { brand: "Tea Tree Oil", generic: "Melaleuca Oil (Antimicrobial)", otc: true, forGroups: ["Acne", "Infection", "Fungal"] },
  // Acne — Rx
  { brand: "Retin-A / Retin-A Micro", generic: "Tretinoin (Rx)", otc: false, forGroups: ["Acne"] },
  { brand: "Epiduo / Differin 0.3%", generic: "Adapalene Stronger (Rx)", otc: false, forGroups: ["Acne"] },
  { brand: "Cleocin T / generic", generic: "Clindamycin (Rx)", otc: false, forGroups: ["Acne", "Infection"] },
  { brand: "Benzaclin / Duac", generic: "Clindamycin + Benzoyl Peroxide (Rx)", otc: false, forGroups: ["Acne"] },
  { brand: "Aczone", generic: "Dapsone (Rx)", otc: false, forGroups: ["Acne"] },
  { brand: "Accutane / Absorica", generic: "Isotretinoin (Rx) — oral", otc: false, forGroups: ["Acne"] },
  { brand: "Doxycycline", generic: "Doxycycline (Rx) — oral antibiotic", otc: false, forGroups: ["Acne", "Infection", "Inflammatory"] },
  { brand: "Spironolactone", generic: "Spironolactone (Rx) — oral hormonal", otc: false, forGroups: ["Acne"] },
  { brand: "Tazorac", generic: "Tazarotene (Rx)", otc: false, forGroups: ["Acne", "Inflammatory"] },

  // Eczema — OTC
  { brand: "Cortizone-10 / generic HC", generic: "Hydrocortisone 1% (OTC)", otc: true, forGroups: ["Eczema", "Rash / Allergic", "Inflammatory"] },
  { brand: "Aveeno Eczema Therapy", generic: "Colloidal Oatmeal Cream", otc: true, forGroups: ["Eczema", "Rash / Allergic"] },
  { brand: "Benadryl / Zyrtec / Claritin", generic: "Antihistamine (OTC)", otc: true, forGroups: ["Eczema", "Rash / Allergic"] },
  { brand: "Calamine Lotion", generic: "Calamine (OTC)", otc: true, forGroups: ["Eczema", "Rash / Allergic"] },
  { brand: "CeraVe / Cetaphil", generic: "Ceramide Moisturizer", otc: true, forGroups: ["Eczema", "Other", "all"] },
  // Eczema — Rx
  { brand: "Triamcinolone cream", generic: "Triamcinolone (Rx)", otc: false, forGroups: ["Eczema", "Inflammatory", "Rash / Allergic"] },
  { brand: "Temovate", generic: "Clobetasol (Rx)", otc: false, forGroups: ["Eczema", "Inflammatory"] },
  { brand: "Protopic", generic: "Tacrolimus (Rx)", otc: false, forGroups: ["Eczema"] },
  { brand: "Elidel", generic: "Pimecrolimus (Rx)", otc: false, forGroups: ["Eczema"] },
  { brand: "Eucrisa", generic: "Crisaborole (Rx)", otc: false, forGroups: ["Eczema"] },
  { brand: "Dupixent", generic: "Dupilumab (Rx) — injectable biologic", otc: false, forGroups: ["Eczema"] },
  { brand: "Hydroxyzine / Atarax", generic: "Hydroxyzine (Rx)", otc: false, forGroups: ["Eczema", "Rash / Allergic"] },

  // Rash / Allergic — Rx
  { brand: "Prednisone", generic: "Prednisone (Rx) — oral steroid", otc: false, forGroups: ["Rash / Allergic", "Inflammatory", "Eczema"] },
  { brand: "Betamethasone cream", generic: "Betamethasone (Rx)", otc: false, forGroups: ["Rash / Allergic", "Eczema", "Inflammatory"] },

  // Inflammatory (Psoriasis / Rosacea) — OTC
  { brand: "Neutrogena T/Gel", generic: "Coal Tar", otc: true, forGroups: ["Inflammatory"] },
  { brand: "Head & Shoulders", generic: "Zinc Pyrithione (OTC)", otc: true, forGroups: ["Inflammatory", "Fungal"] },
  // Inflammatory — Rx
  { brand: "Calcipotriol / Dovonex", generic: "Calcipotriol (Rx)", otc: false, forGroups: ["Inflammatory"] },
  { brand: "Taclonex", generic: "Calcipotriol + Betamethasone (Rx)", otc: false, forGroups: ["Inflammatory"] },
  { brand: "Methotrexate", generic: "Methotrexate (Rx) — oral", otc: false, forGroups: ["Inflammatory"] },
  { brand: "Humira / Skyrizi / Taltz", generic: "Biologic (Rx) — injectable", otc: false, forGroups: ["Inflammatory"] },
  { brand: "Soolantra", generic: "Ivermectin Cream (Rx) — for rosacea", otc: false, forGroups: ["Inflammatory"] },
  { brand: "Metronidazole cream", generic: "Metronidazole (Rx) — for rosacea", otc: false, forGroups: ["Inflammatory"] },

  // Infection — OTC
  { brand: "Neosporin", generic: "Triple Antibiotic Ointment (OTC)", otc: true, forGroups: ["Infection"] },
  { brand: "Bacitracin", generic: "Bacitracin (OTC)", otc: true, forGroups: ["Infection"] },
  // Infection — Rx
  { brand: "Bactroban", generic: "Mupirocin (Rx)", otc: false, forGroups: ["Infection"] },
  { brand: "Cephalexin", generic: "Cephalexin (Rx) — oral", otc: false, forGroups: ["Infection"] },
  { brand: "Amoxicillin / Augmentin", generic: "Amoxicillin (Rx) — oral", otc: false, forGroups: ["Infection"] },
  { brand: "Trimethoprim-Sulfamethoxazole", generic: "TMP-SMX (Rx) — oral", otc: false, forGroups: ["Infection"] },

  // Fungal — OTC
  { brand: "Lotrimin / Clotrimazole", generic: "Clotrimazole (OTC)", otc: true, forGroups: ["Fungal"] },
  { brand: "Tinactin", generic: "Tolnaftate (OTC)", otc: true, forGroups: ["Fungal"] },
  { brand: "Lamisil AT", generic: "Terbinafine (OTC)", otc: true, forGroups: ["Fungal"] },
  { brand: "Monistat 7", generic: "Miconazole (OTC)", otc: true, forGroups: ["Fungal"] },
  { brand: "Selsun Blue", generic: "Selenium Sulfide (OTC)", otc: true, forGroups: ["Fungal"] },
  // Fungal — Rx
  { brand: "Nizoral", generic: "Ketoconazole (Rx/OTC)", otc: false, forGroups: ["Fungal", "Inflammatory"] },
  { brand: "Fluconazole (Diflucan)", generic: "Fluconazole (Rx) — oral", otc: false, forGroups: ["Fungal"] },
  { brand: "Itraconazole (Sporanox)", generic: "Itraconazole (Rx) — oral", otc: false, forGroups: ["Fungal"] },

  // Other / Universal — OTC
  { brand: "Aquaphor / Vaseline", generic: "Petrolatum Healing Ointment", otc: true, forGroups: ["Other", "Eczema"] },
  { brand: "Eucerin / Vanicream", generic: "Urea Moisturizing Cream", otc: true, forGroups: ["Other", "Eczema"] },
  { brand: "Aloe Vera Gel", generic: "Aloe Vera (Soothing)", otc: true, forGroups: ["Other", "Rash / Allergic"] },
  { brand: "Sunscreen SPF 30+", generic: "Broad-Spectrum Sunscreen", otc: true, forGroups: ["Other", "Acne", "Inflammatory"] },
  { brand: "Zinc Oxide cream", generic: "Zinc Oxide (OTC)", otc: true, forGroups: ["Other", "Eczema", "Rash / Allergic"] },
  { brand: "Vitamin E oil", generic: "Tocopherol (Healing)", otc: true, forGroups: ["Other"] },
  // Other — Rx
  { brand: "Urea 40% cream", generic: "Urea 40% (Rx) — for KP/thick skin", otc: false, forGroups: ["Other"] },
  { brand: "Aldara / Zyclara", generic: "Imiquimod (Rx) — for warts", otc: false, forGroups: ["Other"] },
  { brand: "Cantharidin", generic: "Cantharidin (Rx) — for warts", otc: false, forGroups: ["Other"] },
];

// ── Zone label map ────────────────────────────────────────────────────────────

const zoneLabelMap: Record<string, string> = Object.fromEntries(
  zonesDef.map((z) => [z.id, z.label])
);

type ZoneSnapshot = Map<string, ZoneData>;

export default function Home() {
  const [, setLocation] = useLocation();
  const [currentCondition, setCurrentCondition] = useState<SkinCondition>("Acne Vulgaris");
  const [openGroup, setOpenGroup] = useState<string>("Acne");
  const [zones, setZones] = useState<ZoneSnapshot>(new Map());
  const [mode, setMode] = useState<DollMode>("mark");
  const [dollView, setDollView] = useState<DollView>("front");
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
        newSeverity = existing.severity + amount;
        if (newSeverity > 10) newSeverity = 1; // cycle back
      } else {
        newSeverity = Math.min(amount, 10);
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
      condition: data.condition,
      severity: data.severity,
      medication: data.medication ?? null,
    }));
    if (areas.length === 0) return;

    const medNotes = areas
      .filter((a) => a.medication)
      .map((a) => `${zoneLabelMap[a.region] ?? a.region}: applying ${a.medication}`)
      .join("; ");

    setSessionAreas(areas);

    diagnoseMutation.mutate(
      { data: { affectedAreas: areas, age: null, additionalNotes: medNotes || null } },
      {
        onSuccess: (result) => {
          setLastDiagnosis(result);
          setLocation("/diagnosis");
        },
      }
    );
  };

  // Medication dialog filtering
  const medicationZoneData = medicationTarget ? zones.get(medicationTarget) : null;
  const conditionGroup = medicationZoneData ? getConditionGroup(medicationZoneData.condition) : null;

  const baseMeds = MEDICATIONS.filter((m) =>
    conditionGroup
      ? m.forGroups.includes(conditionGroup) || m.forGroups.includes("all")
      : true
  );

  const filteredMeds = baseMeds.filter((m) =>
    medSearch.trim() === "" ||
    m.brand.toLowerCase().includes(medSearch.toLowerCase()) ||
    m.generic.toLowerCase().includes(medSearch.toLowerCase())
  );

  const otcMeds = filteredMeds.filter((m) => m.otc);
  const rxMeds = filteredMeds.filter((m) => !m.otc);

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col pt-6 pb-24 px-4">
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
            For all ages &mdash; tap body zones to mark skin concerns
          </motion.p>
        </header>

        {/* Mode Toggle */}
        <div className="flex rounded-xl overflow-hidden border border-border bg-muted/40 p-0.5 gap-0.5">
          <button
            onClick={() => setMode("mark")}
            className={cn(
              "flex-1 py-1.5 text-sm font-medium rounded-lg transition-all",
              mode === "mark" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mark Condition
          </button>
          <button
            onClick={() => setMode("medicate")}
            className={cn(
              "flex-1 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
              mode === "medicate" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Pill className="w-3.5 h-3.5" />
            Add Medication
          </button>
        </div>

        {/* Condition Groups Accordion */}
        <AnimatePresence>
          {mode === "mark" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-1.5">
                {CONDITION_GROUPS.map((group) => {
                  const isOpen = openGroup === group.label;
                  const groupHasSelected = group.conditions.includes(currentCondition);
                  return (
                    <div key={group.label}>
                      <button
                        onClick={() => setOpenGroup(isOpen ? "" : group.label)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium border transition-all",
                          groupHasSelected
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-white text-foreground border-border hover:bg-muted/30"
                        )}
                      >
                        <span>{group.label}</span>
                        <div className="flex items-center gap-2">
                          {groupHasSelected && (
                            <span className="text-xs opacity-70 font-normal">{currentCondition}</span>
                          )}
                          <ChevronDown
                            className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")}
                          />
                        </div>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-1 pl-2 flex flex-wrap gap-1.5">
                              {group.conditions.map((cond) => (
                                <button
                                  key={cond}
                                  onClick={() => setCurrentCondition(cond)}
                                  className={cn(
                                    "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                                    currentCondition === cond
                                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                      : "bg-white text-muted-foreground border-border hover:bg-muted/30"
                                  )}
                                >
                                  {cond}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
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
              Tap any marked zone to assign a medication specific to that condition
            </motion.div>
          )}
        </AnimatePresence>

        {/* Front / Back View Toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setDollView("front")}
            className={cn(
              "flex-1 py-1 rounded-lg text-xs font-medium border transition-all",
              dollView === "front"
                ? "bg-white border-border shadow-sm text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Front View
          </button>
          <FlipHorizontal className="w-4 h-4 text-muted-foreground/50 shrink-0" />
          <button
            onClick={() => setDollView("back")}
            className={cn(
              "flex-1 py-1 rounded-lg text-xs font-medium border transition-all",
              dollView === "back"
                ? "bg-white border-border shadow-sm text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Back View
          </button>
        </div>

        {/* Body Doll */}
        <div className="flex-1 flex items-start justify-center relative">
          <BodyDoll
            zones={zones}
            currentCondition={currentCondition}
            mode={mode}
            view={dollView}
            onZoneInteract={(id) => handleZoneInteract(id, 2)}
            onZoneInteractHold={(id) => handleZoneInteract(id, 1)}
            onZoneMedicateClick={(id) => { setMedicationTarget(id); setMedSearch(""); }}
          />

          {/* Undo + Reset */}
          <div className="absolute top-0 right-0 flex flex-col gap-2">
            <Button
              variant="outline"
              size="icon"
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
              className="rounded-full shadow-sm bg-white"
              onClick={() => { pushHistory(zones); setZones(new Map()); }}
              title="Reset"
            >
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Severity note */}
        {zones.size > 0 && (
          <p className="text-xs text-center text-muted-foreground">
            Tap a zone repeatedly to increase severity (1–10). Tapping again past 10 cycles back to 1.
          </p>
        )}

        <div className="mt-auto pt-2">
          <Button
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
          <p className="text-center text-xs text-muted-foreground mt-2">
            Best used alongside professional medical advice
          </p>
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
                {medicationZoneData.condition} &mdash; Severity {Math.round(medicationZoneData.severity)}/10
                {conditionGroup && (
                  <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full">{conditionGroup}</span>
                )}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-3 pt-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search medications..."
                value={medSearch}
                onChange={(e) => setMedSearch(e.target.value)}
                className="pl-9 rounded-xl"
                autoFocus
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {filteredMeds.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No medications found</p>
              )}

              {otcMeds.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-green-700 mb-1.5 px-1">
                    Over-the-Counter
                  </p>
                  <div className="space-y-1">
                    {otcMeds.map((med) => {
                      const isActive = medicationZoneData?.medication === med.brand;
                      return (
                        <button
                          key={med.brand}
                          onClick={() => handleApplyMedication(isActive ? undefined : med.brand)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-xl border transition-all",
                            isActive
                              ? "bg-green-50 border-green-300 text-green-800"
                              : "bg-white border-border hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">{med.brand}</span>
                            {isActive && (
                              <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full shrink-0">Active</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{med.generic}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {rxMeds.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-700 mb-1.5 px-1">
                    Prescription (Doctor Required)
                  </p>
                  <div className="space-y-1">
                    {rxMeds.map((med) => {
                      const isActive = medicationZoneData?.medication === med.brand;
                      return (
                        <button
                          key={med.brand}
                          onClick={() => handleApplyMedication(isActive ? undefined : med.brand)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-xl border transition-all",
                            isActive
                              ? "bg-orange-50 border-orange-300 text-orange-800"
                              : "bg-white border-border hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">{med.brand}</span>
                            {isActive && (
                              <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.5 rounded-full shrink-0">Active</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{med.generic}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {medicationZoneData?.medication && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground w-full text-xs"
                onClick={() => handleApplyMedication(undefined)}
              >
                Remove current medication
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
