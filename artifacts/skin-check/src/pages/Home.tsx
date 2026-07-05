import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BodyDoll, type SkinCondition, type ZoneData, type DollMode, type DollView, zonesDef } from "@/components/BodyDoll";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useProfile, type AgeRange, type StoredProfile } from "@/context/ProfileContext";
import { useCheckIn, type ZoneEntry } from "@/context/CheckInContext";
import { RotateCcw, Pill, Undo2, Search, ChevronDown, FlipHorizontal, CheckCircle2, Settings2, Users, Baby, GraduationCap, User, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ParentDashboard from "@/pages/ParentDashboard";
import Onboarding from "@/pages/Onboarding";

// ── Condition Groups by Age ───────────────────────────────────────────────────

interface ConditionGroup {
  label: string;
  conditions: SkinCondition[];
}

const CONDITION_GROUPS_BY_AGE: Record<AgeRange, ConditionGroup[]> = {
  "5-7": [
    { label: "Rash & Irritation", conditions: ["Rash", "Hives", "Bug Bite", "Sunburn"] },
    { label: "Eczema & Dry Skin", conditions: ["Eczema", "Dry Skin"] },
    { label: "Infection", conditions: ["Ringworm", "Warts"] },
  ],
  "8-12": [
    { label: "Rash & Irritation", conditions: ["Rash", "Hives", "Bug Bite", "Sunburn", "Contact Dermatitis"] },
    { label: "Eczema & Dry Skin", conditions: ["Eczema", "Dry Skin"] },
    { label: "Skin Condition", conditions: ["Psoriasis", "Keratosis Pilaris"] },
    { label: "Infection", conditions: ["Ringworm", "Fungal Rash", "Warts"] },
  ],
  "13-17": [
    { label: "Acne", conditions: ["Acne", "Blackheads", "Whiteheads", "Cystic Acne"] },
    { label: "Rash & Irritation", conditions: ["Rash", "Hives", "Sunburn", "Contact Dermatitis"] },
    { label: "Eczema & Dry Skin", conditions: ["Eczema", "Dry Skin"] },
    { label: "Skin Condition", conditions: ["Psoriasis", "Keratosis Pilaris"] },
    { label: "Infection", conditions: ["Ringworm", "Athlete's Foot", "Warts"] },
  ],
  "18-35": [
    { label: "Acne", conditions: ["Acne", "Blackheads", "Cystic Acne"] },
    { label: "Rash & Irritation", conditions: ["Rash", "Hives", "Sunburn", "Contact Dermatitis"] },
    { label: "Eczema", conditions: ["Eczema", "Seborrheic Dermatitis", "Dry Skin"] },
    { label: "Inflammatory", conditions: ["Psoriasis", "Rosacea"] },
    { label: "Infection", conditions: ["Ringworm", "Athlete's Foot", "Warts"] },
  ],
  "35-55": [
    { label: "Acne", conditions: ["Acne", "Cystic Acne"] },
    { label: "Rash & Irritation", conditions: ["Rash", "Hives", "Sunburn", "Contact Dermatitis"] },
    { label: "Eczema", conditions: ["Eczema", "Seborrheic Dermatitis", "Dry Skin"] },
    { label: "Inflammatory", conditions: ["Psoriasis", "Rosacea"] },
    { label: "Infection", conditions: ["Ringworm", "Athlete's Foot", "Warts", "Keratosis Pilaris"] },
  ],
  "55+": [
    { label: "Rash & Irritation", conditions: ["Rash", "Hives", "Sunburn", "Contact Dermatitis"] },
    { label: "Eczema & Dry Skin", conditions: ["Eczema", "Dry Skin", "Seborrheic Dermatitis"] },
    { label: "Inflammatory", conditions: ["Psoriasis", "Rosacea"] },
    { label: "Infection", conditions: ["Ringworm", "Warts", "Keratosis Pilaris"] },
  ],
};

// ── Medication Bank ───────────────────────────────────────────────────────────

interface MedicationEntry {
  brand: string;
  generic: string;
  otc: boolean;
  forGroups: string[];
}

const MEDICATIONS: MedicationEntry[] = [
  { brand: "PanOxyl / Proactiv", generic: "Benzoyl Peroxide", otc: true, forGroups: ["Acne", "Infection"] },
  { brand: "Stridex BHA", generic: "Salicylic Acid", otc: true, forGroups: ["Acne", "Inflammatory"] },
  { brand: "Differin 0.1%", generic: "Adapalene (OTC)", otc: true, forGroups: ["Acne"] },
  { brand: "Hero Mighty Patch", generic: "Hydrocolloid Patches", otc: true, forGroups: ["Acne"] },
  { brand: "Retin-A", generic: "Tretinoin (Rx)", otc: false, forGroups: ["Acne"] },
  { brand: "Clindamycin (Rx)", generic: "Clindamycin cream", otc: false, forGroups: ["Acne", "Infection"] },
  { brand: "Cortizone-10", generic: "Hydrocortisone 1% (OTC)", otc: true, forGroups: ["Eczema & Dry Skin", "Rash & Irritation", "Inflammatory", "Eczema"] },
  { brand: "Aveeno Eczema Therapy", generic: "Colloidal Oatmeal", otc: true, forGroups: ["Eczema & Dry Skin", "Rash & Irritation", "Eczema"] },
  { brand: "Benadryl / Zyrtec", generic: "Antihistamine (OTC)", otc: true, forGroups: ["Rash & Irritation", "Eczema & Dry Skin", "Eczema"] },
  { brand: "Calamine Lotion", generic: "Calamine (OTC)", otc: true, forGroups: ["Rash & Irritation", "Eczema & Dry Skin"] },
  { brand: "CeraVe / Cetaphil", generic: "Ceramide Moisturizer", otc: true, forGroups: ["all"] },
  { brand: "Protopic (Rx)", generic: "Tacrolimus cream", otc: false, forGroups: ["Eczema & Dry Skin", "Eczema"] },
  { brand: "Dupixent (Rx)", generic: "Dupilumab injectable", otc: false, forGroups: ["Eczema & Dry Skin", "Eczema"] },
  { brand: "Coal Tar (Neutrogena T/Gel)", generic: "Coal Tar Shampoo", otc: true, forGroups: ["Inflammatory"] },
  { brand: "Calcipotriol / Dovonex (Rx)", generic: "Calcipotriol cream", otc: false, forGroups: ["Inflammatory"] },
  { brand: "Neosporin", generic: "Triple Antibiotic Ointment", otc: true, forGroups: ["Infection"] },
  { brand: "Bactroban (Rx)", generic: "Mupirocin cream", otc: false, forGroups: ["Infection"] },
  { brand: "Lotrimin / Clotrimazole", generic: "Clotrimazole (OTC)", otc: true, forGroups: ["Infection", "Fungal Rash", "Athlete's Foot"] },
  { brand: "Lamisil AT", generic: "Terbinafine (OTC)", otc: true, forGroups: ["Infection", "Fungal Rash", "Athlete's Foot"] },
  { brand: "Aquaphor / Vaseline", generic: "Petrolatum Ointment", otc: true, forGroups: ["all"] },
  { brand: "Aloe Vera Gel", generic: "Aloe Vera (Soothing)", otc: true, forGroups: ["Rash & Irritation", "Sunburn"] },
  { brand: "Sunscreen SPF 30+", generic: "Broad-Spectrum Sunscreen", otc: true, forGroups: ["all"] },
];

function getConditionGroup(condition: SkinCondition, groups: ConditionGroup[]): string {
  for (const g of groups) {
    if (g.conditions.includes(condition)) return g.label;
  }
  return "";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const zoneLabelMap: Record<string, string> = Object.fromEntries(
  zonesDef.map((z) => [z.id, z.label])
);

type ZoneSnapshot = Map<string, ZoneData>;

const PROFILE_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
];

const USER_TYPE_ICON: Record<string, React.ElementType> = {
  child: Baby,
  teen: GraduationCap,
  parent: User,
};

const USER_TYPE_LABELS: Record<string, string> = {
  child: "Child",
  teen: "Teen",
  parent: "Parent",
};

function profileColorClass(profiles: StoredProfile[], id: string): string {
  const idx = profiles.findIndex((p) => p.id === id);
  return PROFILE_COLORS[Math.max(0, idx) % PROFILE_COLORS.length];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Home() {
  const { activeProfile, profiles, switchProfile, removeProfile } = useProfile();
  const { saveReport } = useCheckIn();
  const { toast } = useToast();

  const ageRange = activeProfile?.ageRange ?? "13-17";
  const conditionGroups = CONDITION_GROUPS_BY_AGE[ageRange];
  const defaultCondition = conditionGroups[0].conditions[0];

  const [currentCondition, setCurrentCondition] = useState<SkinCondition>(defaultCondition);
  const [openGroup, setOpenGroup] = useState<string>(conditionGroups[0].label);
  const [zones, setZones] = useState<ZoneSnapshot>(new Map());
  const [mode, setMode] = useState<DollMode>("mark");
  const [dollView, setDollView] = useState<DollView>("front");
  const [medicationTarget, setMedicationTarget] = useState<string | null>(null);
  const [medSearch, setMedSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const history = useRef<ZoneSnapshot[]>([]);

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
        if (newSeverity > 10) newSeverity = 1;
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

  const handleFinish = () => {
    const count = zones.size;
    if (count === 0) return;
    if (activeProfile) {
      const entries = new Map<string, ZoneEntry>();
      zones.forEach((v, k) => entries.set(k, v));
      saveReport(activeProfile.id, entries);
    }
    toast({
      title: "Check-in saved!",
      description: `${count} area${count !== 1 ? "s" : ""} recorded. Bring this to your doctor visit.`,
    });
    pushHistory(zones);
    setZones(new Map());
    setMode("mark");
  };

  const handleSwitchProfile = (id: string) => {
    switchProfile(id);
    setZones(new Map());
    history.current = [];
    setMode("mark");
    setShowSettings(false);
  };

  const medicationZoneData = medicationTarget ? zones.get(medicationTarget) : null;
  const conditionGroup = medicationZoneData
    ? getConditionGroup(medicationZoneData.condition, conditionGroups)
    : null;

  const filteredMeds = useMemo(() => {
    const base = MEDICATIONS.filter(
      (m) => m.forGroups.includes("all") || (conditionGroup && m.forGroups.includes(conditionGroup))
    );
    if (!medSearch.trim()) return base;
    const q = medSearch.toLowerCase();
    return base.filter((m) => m.brand.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q));
  }, [conditionGroup, medSearch]);

  const otcMeds = filteredMeds.filter((m) => m.otc);
  const rxMeds = filteredMeds.filter((m) => !m.otc);

  const isParent = activeProfile?.userType === "parent";

  // If add-profile flow is open, show it full screen
  if (showAddProfile) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <Onboarding
          skipWelcome
          onCancel={() => setShowAddProfile(false)}
          onDone={() => setShowAddProfile(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col pt-4 pb-24 px-4">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col gap-3">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeProfile && (
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                profileColorClass(profiles, activeProfile.id)
              )}>
                {activeProfile.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-foreground truncate leading-tight">
                {activeProfile?.name ?? "Today's Check-in"}
              </h1>
              <p className="text-muted-foreground text-[11px] mt-0 leading-tight">
                {activeProfile ? `${USER_TYPE_LABELS[activeProfile.userType]} · ${activeProfile.ageRange}` : "Tap zones to mark concerns"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isParent && (
              <button
                onClick={() => setShowDashboard(true)}
                className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors relative"
                title="Family Monitor"
              >
                <Users className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors"
              title="Profiles & Settings"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
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
            Medications
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
                {conditionGroups.map((group) => {
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
                          <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")} />
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
                            <div className="pt-1.5 pl-2 flex flex-wrap gap-1.5">
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
              Tap any marked zone to log a medication for that area
            </motion.div>
          )}
        </AnimatePresence>

        {/* Front / Back Toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setDollView("front")}
            className={cn(
              "flex-1 py-1 rounded-lg text-xs font-medium border transition-all",
              dollView === "front" ? "bg-white border-border shadow-sm text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Front View
          </button>
          <FlipHorizontal className="w-4 h-4 text-muted-foreground/50 shrink-0" />
          <button
            onClick={() => setDollView("back")}
            className={cn(
              "flex-1 py-1 rounded-lg text-xs font-medium border transition-all",
              dollView === "back" ? "bg-white border-border shadow-sm text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
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
            onZoneMedicateClick={(id) => {
              setMedicationTarget(id);
              setMedSearch("");
            }}
          />

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

        {zones.size > 0 && (
          <p className="text-xs text-center text-muted-foreground">
            {zones.size} area{zones.size !== 1 ? "s" : ""} marked · tap again to increase severity
          </p>
        )}

        {/* Finish button */}
        <div className="mt-auto pt-2">
          <Button
            className="w-full h-14 rounded-2xl text-base shadow-md font-semibold flex items-center gap-2"
            disabled={zones.size === 0}
            onClick={handleFinish}
          >
            <CheckCircle2 className="w-5 h-5" />
            Finish Today's Check-in
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Saves your notes to bring to a doctor visit
          </p>
        </div>
      </div>

      {/* ── Medication Dialog ── */}
      <Dialog
        open={medicationTarget !== null}
        onOpenChange={(open) => {
          if (!open) { setMedicationTarget(null); setMedSearch(""); }
        }}
      >
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {medicationTarget ? (zoneLabelMap[medicationTarget] ?? medicationTarget) : ""}
            </DialogTitle>
            {medicationZoneData && (
              <p className="text-sm text-muted-foreground">
                {medicationZoneData.condition} — Severity {Math.round(medicationZoneData.severity)}/10
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

            <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
              {filteredMeds.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No medications found</p>
              )}

              {otcMeds.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-green-700 mb-1.5 px-1">Over-the-Counter</p>
                  <div className="space-y-1">
                    {otcMeds.map((med) => {
                      const isActive = medicationZoneData?.medication === med.brand;
                      return (
                        <button
                          key={med.brand}
                          onClick={() => handleApplyMedication(isActive ? undefined : med.brand)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-xl border transition-all",
                            isActive ? "bg-green-50 border-green-300 text-green-800" : "bg-white border-border hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="text-sm font-medium">{med.brand}</span>
                              <span className="block text-xs text-muted-foreground">{med.generic}</span>
                            </div>
                            {isActive && (
                              <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full shrink-0">Active</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {rxMeds.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-700 mb-1.5 px-1">Prescription (Rx)</p>
                  <div className="space-y-1">
                    {rxMeds.map((med) => {
                      const isActive = medicationZoneData?.medication === med.brand;
                      return (
                        <button
                          key={med.brand}
                          onClick={() => handleApplyMedication(isActive ? undefined : med.brand)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-xl border transition-all",
                            isActive ? "bg-orange-50 border-orange-300 text-orange-800" : "bg-white border-border hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="text-sm font-medium">{med.brand}</span>
                              <span className="block text-xs text-muted-foreground">{med.generic}</span>
                            </div>
                            {isActive && (
                              <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.5 rounded-full shrink-0">Active</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Settings / Profile Switcher Dialog ── */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Profiles</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 pt-1">
            {profiles.map((p, i) => {
              const Icon = USER_TYPE_ICON[p.userType] ?? User;
              const isActive = p.id === activeProfile?.id;
              const color = PROFILE_COLORS[i % PROFILE_COLORS.length];
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    isActive ? "border-primary/40 bg-primary/5" : "border-border bg-white hover:bg-muted/20"
                  )}
                >
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0", color)}>
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">{p.name}</span>
                      {isActive && (
                        <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full shrink-0">Active</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                      <Icon className="w-3 h-3" />
                      <span>{USER_TYPE_LABELS[p.userType]} · {p.ageRange}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!isActive && (
                      <button
                        onClick={() => handleSwitchProfile(p.id)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                      >
                        Switch
                      </button>
                    )}
                    {profiles.length > 1 && (
                      <button
                        onClick={() => {
                          removeProfile(p.id);
                          if (isActive) setShowSettings(false);
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Remove profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => {
                setShowSettings(false);
                setShowAddProfile(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-muted/20 hover:text-foreground transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Profile
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Parent Dashboard (full screen slide-over) ── */}
      <AnimatePresence>
        {showDashboard && (
          <ParentDashboard onClose={() => setShowDashboard(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
