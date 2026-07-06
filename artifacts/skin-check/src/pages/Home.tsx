import { useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BodyDoll, type SkinCondition, type ZoneData, type DollView, zonesDef, frontZonesDef, backZonesDef } from "@/components/BodyDoll";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useProfile, type AgeRange, type StoredProfile } from "@/context/ProfileContext";
import { useCheckIn, type ZoneEntry } from "@/context/CheckInContext";
import { RotateCcw, Undo2, Search, FlipHorizontal, Users, Settings2, X, ChevronRight, ArrowLeft, Baby, GraduationCap, User, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ParentDashboard from "@/pages/ParentDashboard";
import Onboarding from "@/pages/Onboarding";

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "home" | "phase1" | "phase2";
type ZoneSnapshot = Map<string, ZoneData>;

// ── Condition Data ────────────────────────────────────────────────────────────

interface ConditionGroup {
  label: string;
  conditions: SkinCondition[];
}

const CONDITION_GROUPS_BY_AGE: Record<AgeRange, ConditionGroup[]> = {
  "5-7":   [
    { label: "Rash & Skin",   conditions: ["Rash", "Hives", "Bug Bite", "Sunburn"] },
    { label: "Eczema",        conditions: ["Eczema", "Dry Skin"] },
    { label: "Infection",     conditions: ["Ringworm", "Warts"] },
  ],
  "8-12":  [
    { label: "Rash & Skin",   conditions: ["Rash", "Hives", "Bug Bite", "Sunburn", "Contact Dermatitis"] },
    { label: "Eczema",        conditions: ["Eczema", "Dry Skin"] },
    { label: "Skin",          conditions: ["Psoriasis", "Keratosis Pilaris"] },
    { label: "Infection",     conditions: ["Ringworm", "Fungal Rash", "Warts"] },
  ],
  "13-17": [
    { label: "Acne",          conditions: ["Acne", "Blackheads", "Whiteheads", "Cystic Acne"] },
    { label: "Rash",          conditions: ["Rash", "Hives", "Sunburn", "Contact Dermatitis"] },
    { label: "Eczema",        conditions: ["Eczema", "Dry Skin"] },
    { label: "Skin",          conditions: ["Psoriasis", "Keratosis Pilaris"] },
    { label: "Infection",     conditions: ["Ringworm", "Athlete's Foot", "Warts"] },
  ],
  "18-35": [
    { label: "Acne",          conditions: ["Acne", "Blackheads", "Cystic Acne"] },
    { label: "Rash",          conditions: ["Rash", "Hives", "Sunburn", "Contact Dermatitis"] },
    { label: "Eczema",        conditions: ["Eczema", "Seborrheic Dermatitis", "Dry Skin"] },
    { label: "Inflammatory",  conditions: ["Psoriasis", "Rosacea"] },
    { label: "Infection",     conditions: ["Ringworm", "Athlete's Foot", "Warts"] },
  ],
  "35-55": [
    { label: "Acne",          conditions: ["Acne", "Cystic Acne"] },
    { label: "Rash",          conditions: ["Rash", "Hives", "Sunburn", "Contact Dermatitis"] },
    { label: "Eczema",        conditions: ["Eczema", "Seborrheic Dermatitis", "Dry Skin"] },
    { label: "Inflammatory",  conditions: ["Psoriasis", "Rosacea"] },
    { label: "Infection",     conditions: ["Ringworm", "Athlete's Foot", "Warts", "Keratosis Pilaris"] },
  ],
  "55+":   [
    { label: "Rash",          conditions: ["Rash", "Hives", "Sunburn", "Contact Dermatitis"] },
    { label: "Eczema",        conditions: ["Eczema", "Dry Skin", "Seborrheic Dermatitis"] },
    { label: "Inflammatory",  conditions: ["Psoriasis", "Rosacea"] },
    { label: "Infection",     conditions: ["Ringworm", "Warts", "Keratosis Pilaris"] },
  ],
};

// Condition → color group
type ColorKey = "red" | "orange" | "amber" | "yellow" | "lime" | "teal" | "violet" | "blue" | "rose" | "stone";

const CONDITION_COLOR: Record<string, ColorKey> = {
  "Rash": "red",         "Hives": "red",         "Cystic Acne": "red",
  "Acne": "orange",      "Sunburn": "orange",     "Bug Bite": "amber",
  "Blackheads": "stone", "Warts": "stone",        "Whiteheads": "yellow",
  "Seborrheic Dermatitis": "yellow",
  "Contact Dermatitis": "lime",   "Athlete's Foot": "teal",
  "Ringworm": "teal",    "Fungal Rash": "teal",
  "Eczema": "violet",    "Psoriasis": "violet",   "Keratosis Pilaris": "violet",
  "Dry Skin": "blue",
  "Rosacea": "rose",
};

const CHIP_OFF: Record<ColorKey, string> = {
  red:    "bg-red-50 text-red-700 border-red-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  amber:  "bg-amber-50 text-amber-700 border-amber-200",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
  lime:   "bg-lime-50 text-lime-700 border-lime-200",
  teal:   "bg-teal-50 text-teal-700 border-teal-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  blue:   "bg-blue-50 text-blue-700 border-blue-200",
  rose:   "bg-rose-50 text-rose-700 border-rose-200",
  stone:  "bg-stone-100 text-stone-600 border-stone-200",
};
const CHIP_ON: Record<ColorKey, string> = {
  red:    "bg-red-500 text-white border-red-500",
  orange: "bg-orange-500 text-white border-orange-500",
  amber:  "bg-amber-500 text-white border-amber-500",
  yellow: "bg-yellow-500 text-white border-yellow-500",
  lime:   "bg-lime-500 text-white border-lime-500",
  teal:   "bg-teal-500 text-white border-teal-500",
  violet: "bg-violet-500 text-white border-violet-500",
  blue:   "bg-blue-500 text-white border-blue-500",
  rose:   "bg-rose-500 text-white border-rose-500",
  stone:  "bg-stone-500 text-white border-stone-500",
};

function conditionChipClass(condition: SkinCondition, active: boolean): string {
  const key = CONDITION_COLOR[condition] ?? "violet";
  return active ? CHIP_ON[key] : CHIP_OFF[key];
}

// ── Severity ─────────────────────────────────────────────────────────────────

interface SeverityOption { emoji: string; label: string; value: number; ring: string }

const SEVERITY_YOUNG: SeverityOption[] = [
  { emoji: "😊", label: "Just a little", value: 3,  ring: "ring-green-300" },
  { emoji: "😐", label: "A bit itchy",   value: 6,  ring: "ring-yellow-300" },
  { emoji: "😢", label: "Really itchy",  value: 9,  ring: "ring-red-300" },
];
const SEVERITY_OLDER: SeverityOption[] = [
  { emoji: "😊", label: "Mild",     value: 3,  ring: "ring-green-300" },
  { emoji: "😐", label: "Moderate", value: 6,  ring: "ring-yellow-300" },
  { emoji: "😢", label: "Severe",   value: 9,  ring: "ring-red-300" },
];

function getSeverityOptions(ageRange: AgeRange): SeverityOption[] {
  return ageRange === "5-7" ? SEVERITY_YOUNG : SEVERITY_OLDER;
}

// ── Scratch Frequency ─────────────────────────────────────────────────────────

interface ScratchOption { emoji: string; label: string; sublabel?: string; value: number }

const SCRATCH_5_7: ScratchOption[] = [
  { emoji: "😊", label: "Nope!",    sublabel: "I didn't scratch at all",   value: 1 },
  { emoji: "😐", label: "A little", sublabel: "Just a few times today",    value: 5 },
  { emoji: "😢", label: "A lot!",   sublabel: "I kept scratching",         value: 9 },
];
const SCRATCH_8_12: ScratchOption[] = [
  { emoji: "😄", label: "Not at all", value: 1  },
  { emoji: "😊", label: "Barely",     value: 3  },
  { emoji: "😐", label: "Sometimes",  value: 5  },
  { emoji: "😕", label: "A lot",      value: 7  },
  { emoji: "😢", label: "Constantly", value: 10 },
];

function scratchEmojiFor(v: number): string {
  if (v <= 2) return "😄";
  if (v <= 4) return "😊";
  if (v <= 6) return "😐";
  if (v <= 8) return "😕";
  return "😢";
}
function scratchLabelFor(v: number): string {
  if (v <= 2) return "Barely any";
  if (v <= 4) return "A little";
  if (v <= 6) return "Moderate";
  if (v <= 8) return "Quite a bit";
  return "Constantly";
}

// ── Greeting ──────────────────────────────────────────────────────────────────

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 17) return { text: "Good afternoon", emoji: "🌤️" };
  return { text: "Good evening", emoji: "🌙" };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const zoneLabelMap: Record<string, string> = Object.fromEntries(zonesDef.map((z) => [z.id, z.label]));

const USER_TYPE_ICON: Record<string, React.ElementType> = { child: Baby, teen: GraduationCap, parent: User };
const USER_TYPE_LABELS: Record<string, string> = { child: "Child", teen: "Teen", parent: "Parent" };
const PROFILE_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
];
function profileColor(profiles: StoredProfile[], id: string): string {
  const idx = profiles.findIndex((p) => p.id === id);
  return PROFILE_COLORS[Math.max(0, idx) % PROFILE_COLORS.length];
}

// ── Progress Dots ─────────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2].map((n) => (
        <motion.div
          key={n}
          className={cn("h-2 rounded-full transition-all duration-300", n === step ? "w-6 bg-primary" : "w-2 bg-muted-foreground/20")}
        />
      ))}
    </div>
  );
}

// ── Home Landing ──────────────────────────────────────────────────────────────

function HomeLanding({
  profile,
  profiles,
  lastCheckinDate,
  onStart,
  onOpenDashboard,
  onOpenSettings,
}: {
  profile: StoredProfile | null;
  profiles: StoredProfile[];
  lastCheckinDate: string | null;
  onStart: () => void;
  onOpenDashboard: () => void;
  onOpenSettings: () => void;
}) {
  const { text, emoji } = getGreeting();
  const isParent = profile?.userType === "parent";

  const lastCheckinLabel = lastCheckinDate
    ? (() => {
        const today = new Date().toISOString().slice(0, 10);
        if (lastCheckinDate === today) return "Today";
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastCheckinDate === yesterday.toISOString().slice(0, 10)) return "Yesterday";
        const d = new Date(lastCheckinDate + "T00:00:00");
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      })()
    : null;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-primary/5 via-background to-background px-5 pt-5 pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        {profile && (
          <div className="flex items-center gap-2">
            <motion.div
              whileTap={{ scale: 0.9 }}
              onClick={onOpenSettings}
              className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer", profileColor(profiles, profile.id))}
            >
              {profile.name.slice(0, 2).toUpperCase()}
            </motion.div>
            <div>
              <p className="text-sm font-semibold leading-none">{profile.name}</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                {USER_TYPE_LABELS[profile.userType]} · {profile.ageRange}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-0.5">
          {isParent && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={onOpenDashboard} className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground">
              <Users className="w-5 h-5" />
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.9 }} onClick={onOpenSettings} className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground">
            <Settings2 className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col"
      >
        <p className="text-muted-foreground text-sm font-medium">
          {text}, {profile?.name ?? "friend"}! {emoji}
        </p>
        <h1 className="text-2xl font-bold text-foreground mt-1 leading-snug">
          Ready for today's<br />skin check?
        </h1>

        {/* Decorative body illustration */}
        <div className="flex-1 flex items-center justify-center py-6 relative">
          <div className="w-[140px] opacity-60 pointer-events-none select-none">
            <BodyDoll zones={new Map()} view="front" readonly />
          </div>
          {lastCheckinLabel && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white border border-border rounded-full px-3 py-1 text-[11px] text-muted-foreground shadow-sm whitespace-nowrap">
              Last check-in: <span className="font-semibold text-foreground">{lastCheckinLabel}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              className="w-full h-16 rounded-2xl text-lg font-bold shadow-lg flex items-center gap-3"
              onClick={onStart}
            >
              Start Check-In
              <ChevronRight className="w-5 h-5" />
            </Button>
          </motion.div>
          {!lastCheckinLabel && (
            <p className="text-center text-xs text-muted-foreground">Takes about 2 minutes</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Severity Tray ─────────────────────────────────────────────────────────────

function SeverityTray({
  zoneId,
  zoneData,
  ageRange,
  onSelect,
  onClear,
  onClose,
}: {
  zoneId: string;
  zoneData: ZoneData | undefined;
  ageRange: AgeRange;
  onSelect: (severity: number) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const options = getSeverityOptions(ageRange);
  const label = zoneLabelMap[zoneId] ?? zoneId;

  return (
    <motion.div
      key="severity-tray"
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 320 }}
      className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-border rounded-t-3xl shadow-2xl px-5 pt-4 pb-8 max-w-md mx-auto"
      style={{ marginLeft: "auto", marginRight: "auto" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-base">{label}</p>
          {zoneData && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {zoneData.condition}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {zoneData && (
            <button
              onClick={onClear}
              className="text-xs text-destructive px-2 py-1 rounded-lg hover:bg-destructive/10 transition-colors"
            >
              Clear zone
            </button>
          )}
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <p className="text-sm font-medium text-muted-foreground mb-3">How bad is it?</p>

      <div className="grid grid-cols-3 gap-3">
        {options.map((opt) => {
          const isSelected = zoneData?.severity === opt.value;
          return (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.93 }}
              onClick={() => onSelect(opt.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 transition-all",
                isSelected
                  ? `${opt.ring} ring-2 ring-offset-1 border-transparent bg-primary/5`
                  : "border-border bg-white hover:bg-muted/30"
              )}
            >
              <span className="text-3xl leading-none">{opt.emoji}</span>
              <span className="text-xs font-semibold text-foreground">{opt.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Phase 1 ───────────────────────────────────────────────────────────────────

function Phase1({
  profile,
  zones,
  setZones,
  onContinue,
  onBack,
}: {
  profile: StoredProfile;
  zones: ZoneSnapshot;
  setZones: React.Dispatch<React.SetStateAction<ZoneSnapshot>>;
  onContinue: () => void;
  onBack: () => void;
}) {
  const ageRange = profile.ageRange;
  const conditionGroups = CONDITION_GROUPS_BY_AGE[ageRange];
  const allConditions = conditionGroups.flatMap((g) => g.conditions);
  const defaultCondition = allConditions[0];

  const [currentCondition, setCurrentCondition] = useState<SkinCondition>(defaultCondition);
  const [dollView, setDollView] = useState<DollView>("front");
  const [activeTrayZone, setActiveTrayZone] = useState<string | null>(null);
  const history = useRef<ZoneSnapshot[]>([]);

  const pushHistory = useCallback((snap: ZoneSnapshot) => {
    history.current = [...history.current.slice(-30), new Map(snap)];
  }, []);

  const handleUndo = () => {
    if (history.current.length === 0) return;
    const prev = history.current[history.current.length - 1];
    history.current = history.current.slice(0, -1);
    setZones(new Map(prev));
  };

  const handleZoneTap = useCallback((id: string) => {
    setZones((prev) => {
      pushHistory(prev);
      const next = new Map(prev);
      const existing = next.get(id);
      if (existing && existing.condition === currentCondition) {
        next.set(id, { ...existing, severity: existing.severity > 0 ? existing.severity : 3 });
      } else {
        next.set(id, { condition: currentCondition, severity: 3 });
      }
      return next;
    });
    setActiveTrayZone(id);
  }, [currentCondition, pushHistory, setZones]);

  const handleSeveritySelect = (severity: number) => {
    if (!activeTrayZone) return;
    setZones((prev) => {
      const next = new Map(prev);
      const existing = next.get(activeTrayZone);
      if (existing) next.set(activeTrayZone, { ...existing, severity });
      return next;
    });
    setActiveTrayZone(null);
  };

  const handleClearZone = () => {
    if (!activeTrayZone) return;
    setZones((prev) => {
      pushHistory(prev);
      const next = new Map(prev);
      next.delete(activeTrayZone);
      return next;
    });
    setActiveTrayZone(null);
  };

  const activeZoneData = activeTrayZone ? zones.get(activeTrayZone) : undefined;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </motion.button>
        <ProgressDots step={1} />
        <div className="w-16" />
      </div>

      <div className="px-4 mb-3">
        <h2 className="text-xl font-bold">Where does it bother you?</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Tap the body to mark the area</p>
      </div>

      {/* Condition chips — horizontal scroll */}
      <div className="px-4 mb-3 flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {allConditions.map((cond) => (
          <motion.button
            key={cond}
            whileTap={{ scale: 0.93 }}
            onClick={() => setCurrentCondition(cond)}
            className={cn(
              "shrink-0 h-9 px-3.5 rounded-full border text-sm font-medium transition-all",
              conditionChipClass(cond, currentCondition === cond)
            )}
          >
            {cond}
          </motion.button>
        ))}
      </div>

      {/* Front/Back toggle */}
      <div className="flex items-center justify-center gap-2 px-4 mb-2">
        <button
          onClick={() => setDollView("front")}
          className={cn("flex-1 py-1 rounded-lg text-xs font-medium border transition-all", dollView === "front" ? "bg-white border-border shadow-sm text-foreground" : "border-transparent text-muted-foreground")}
        >
          Front
        </button>
        <FlipHorizontal className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        <button
          onClick={() => setDollView("back")}
          className={cn("flex-1 py-1 rounded-lg text-xs font-medium border transition-all", dollView === "back" ? "bg-white border-border shadow-sm text-foreground" : "border-transparent text-muted-foreground")}
        >
          Back
        </button>
      </div>

      {/* Doll */}
      <div className="flex-1 flex items-start justify-center px-4 relative">
        <BodyDoll
          zones={zones}
          currentCondition={currentCondition}
          mode="mark"
          view={dollView}
          onZoneInteract={handleZoneTap}
          onZoneInteractHold={() => {}}
          onZoneMedicateClick={() => {}}
        />

        {/* Undo / Reset */}
        <div className="absolute top-0 right-4 flex flex-col gap-2">
          <motion.button whileTap={{ scale: 0.88 }} onClick={handleUndo} disabled={history.current.length === 0}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-border bg-white shadow-sm disabled:opacity-30 text-muted-foreground"
          >
            <Undo2 className="w-4 h-4" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => { pushHistory(zones); setZones(new Map()); }}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-border bg-white shadow-sm text-muted-foreground"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Marked count */}
      <div className="px-4 py-2 text-center">
        {zones.size > 0 ? (
          <p className="text-xs text-muted-foreground">
            {zones.size} area{zones.size !== 1 ? "s" : ""} marked
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/60">Tap a body part to get started</p>
        )}
      </div>

      {/* Continue button */}
      <div className="px-4 pb-8 pt-2">
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            className="w-full h-14 rounded-2xl text-base font-bold shadow-md"
            disabled={zones.size === 0}
            onClick={onContinue}
          >
            Continue Check-In
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </motion.div>
      </div>

      {/* Severity Tray */}
      <AnimatePresence>
        {activeTrayZone && (
          <SeverityTray
            zoneId={activeTrayZone}
            zoneData={activeZoneData}
            ageRange={ageRange}
            onSelect={handleSeveritySelect}
            onClear={handleClearZone}
            onClose={() => setActiveTrayZone(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Phase 2 ───────────────────────────────────────────────────────────────────

function Phase2({
  ageRange,
  scratchScore,
  setScratchScore,
  onFinish,
  onBack,
}: {
  ageRange: AgeRange;
  scratchScore: number | null;
  setScratchScore: (v: number) => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  const isYoung = ageRange === "5-7";
  const isMid = ageRange === "8-12";
  const isTeen = !isYoung && !isMid;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </motion.button>
        <ProgressDots step={2} />
        <div className="w-16" />
      </div>

      <div className="px-4 mb-6">
        <h2 className="text-xl font-bold">
          {isYoung ? "Did you scratch today?" : "How much did you scratch today?"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {isYoung ? "Let us know how your skin felt" : "Tell us how itchy your skin was"}
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-start px-4">

        {/* Ages 5–7: 3 big stacked cards */}
        {isYoung && (
          <div className="flex flex-col gap-4">
            {SCRATCH_5_7.map((opt) => (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.96 }}
                onClick={() => setScratchScore(opt.value)}
                className={cn(
                  "w-full flex items-center gap-5 p-5 rounded-2xl border-2 transition-all text-left",
                  scratchScore === opt.value
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-white hover:bg-muted/20 hover:border-muted-foreground/20"
                )}
              >
                <span className="text-5xl leading-none shrink-0">{opt.emoji}</span>
                <div>
                  <p className="text-lg font-bold">{opt.label}</p>
                  {opt.sublabel && <p className="text-sm text-muted-foreground mt-0.5">{opt.sublabel}</p>}
                </div>
                {scratchScore === opt.value && (
                  <div className="ml-auto w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}

        {/* Ages 8–12: 5 medium cards in a row */}
        {isMid && (
          <div className="grid grid-cols-5 gap-2">
            {SCRATCH_8_12.map((opt) => (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.92 }}
                onClick={() => setScratchScore(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 transition-all",
                  scratchScore === opt.value
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-white hover:bg-muted/20"
                )}
              >
                <span className="text-3xl leading-none">{opt.emoji}</span>
                <span className="text-[10px] font-semibold text-center leading-tight text-foreground">{opt.label}</span>
              </motion.button>
            ))}
          </div>
        )}

        {/* Ages 13-17 & adults: big emoji + 1-10 grid */}
        {isTeen && (
          <div className="flex flex-col items-center gap-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={scratchScore ?? "none"}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-7xl leading-none">
                  {scratchScore ? scratchEmojiFor(scratchScore) : "🤔"}
                </span>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  {scratchScore ? scratchLabelFor(scratchScore) : "How much did you scratch?"}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="grid grid-cols-5 gap-2.5 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <motion.button
                  key={n}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setScratchScore(n)}
                  className={cn(
                    "aspect-square rounded-2xl border-2 text-base font-bold transition-all",
                    scratchScore === n
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "border-border bg-white text-foreground hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  {n}
                </motion.button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">1 = barely any · 10 = couldn't stop</p>
          </div>
        )}
      </div>

      {/* Finish button */}
      <div className="px-4 pb-8 pt-4">
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            className="w-full h-14 rounded-2xl text-base font-bold shadow-md"
            disabled={scratchScore === null}
            onClick={onFinish}
          >
            Finish Check-In ✓
          </Button>
        </motion.div>
        {scratchScore === null && (
          <p className="text-center text-xs text-muted-foreground mt-2">Pick an option above to continue</p>
        )}
      </div>
    </div>
  );
}

// ── Profile Switcher ──────────────────────────────────────────────────────────

function ProfileSettings({
  profiles,
  activeId,
  onSwitch,
  onRemove,
  onAdd,
  onClose,
}: {
  profiles: StoredProfile[];
  activeId: string | null;
  onSwitch: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onClose: () => void;
}) {
  return (
    <DialogContent className="max-w-sm rounded-2xl">
      <DialogHeader>
        <DialogTitle>Profiles</DialogTitle>
      </DialogHeader>
      <div className="space-y-2 pt-1">
        {profiles.map((p, i) => {
          const Icon = USER_TYPE_ICON[p.userType] ?? User;
          const isActive = p.id === activeId;
          const color = PROFILE_COLORS[i % PROFILE_COLORS.length];
          return (
            <div key={p.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all", isActive ? "border-primary/40 bg-primary/5" : "border-border bg-white hover:bg-muted/20")}>
              <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0", color)}>
                {p.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm truncate">{p.name}</span>
                  {isActive && <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full shrink-0">Active</span>}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                  <Icon className="w-3 h-3" />
                  <span>{USER_TYPE_LABELS[p.userType]} · {p.ageRange}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!isActive && (
                  <motion.button whileTap={{ scale: 0.93 }} onClick={() => onSwitch(p.id)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-medium"
                  >
                    Switch
                  </motion.button>
                )}
                {profiles.length > 1 && (
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => onRemove(p.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </div>
            </div>
          );
        })}
        <motion.button whileTap={{ scale: 0.97 }} onClick={onAdd}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-muted/20"
        >
          <Plus className="w-4 h-4" /> Add Profile
        </motion.button>
      </div>
    </DialogContent>
  );
}

// ── Slide transition variants ─────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir * -40 }),
};

// ── Main Home ─────────────────────────────────────────────────────────────────

export default function Home() {
  const { activeProfile, profiles, switchProfile, removeProfile } = useProfile();
  const { saveReport, getReportsForProfile } = useCheckIn();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("home");
  const [dir, setDir] = useState(1);
  const [zones, setZones] = useState<ZoneSnapshot>(new Map());
  const [scratchScore, setScratchScore] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);

  const goTo = useCallback((next: Phase, direction = 1) => {
    setDir(direction);
    setPhase(next);
  }, []);

  const handleFinish = () => {
    if (!activeProfile || zones.size === 0) return;
    const entries = new Map<string, ZoneEntry>();
    zones.forEach((v, k) => entries.set(k, { condition: v.condition, severity: v.severity, medication: v.medication }));
    saveReport(activeProfile.id, entries, scratchScore ?? undefined);
    toast({ title: "Check-in complete! 🎉", description: `${zones.size} area${zones.size !== 1 ? "s" : ""} logged. Great job!` });
    setZones(new Map());
    setScratchScore(null);
    goTo("home", -1);
  };

  const handleSwitchProfile = (id: string) => {
    switchProfile(id);
    setZones(new Map());
    setScratchScore(null);
    goTo("home");
    setShowSettings(false);
  };

  // Last check-in for current profile
  const lastCheckinDate = useMemo(() => {
    if (!activeProfile) return null;
    const reports = getReportsForProfile(activeProfile.id);
    return reports[0]?.date ?? null;
  }, [activeProfile, getReportsForProfile]);

  if (showAddProfile) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <Onboarding skipWelcome onCancel={() => setShowAddProfile(false)} onDone={() => setShowAddProfile(false)} />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait" custom={dir}>
        {phase === "home" && (
          <motion.div key="home" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: "easeInOut" }}>
            <HomeLanding
              profile={activeProfile}
              profiles={profiles}
              lastCheckinDate={lastCheckinDate}
              onStart={() => goTo("phase1", 1)}
              onOpenDashboard={() => setShowDashboard(true)}
              onOpenSettings={() => setShowSettings(true)}
            />
          </motion.div>
        )}

        {phase === "phase1" && activeProfile && (
          <motion.div key="phase1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: "easeInOut" }}>
            <Phase1
              profile={activeProfile}
              zones={zones}
              setZones={setZones}
              onContinue={() => goTo("phase2", 1)}
              onBack={() => goTo("home", -1)}
            />
          </motion.div>
        )}

        {phase === "phase2" && activeProfile && (
          <motion.div key="phase2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: "easeInOut" }}>
            <Phase2
              ageRange={activeProfile.ageRange}
              scratchScore={scratchScore}
              setScratchScore={setScratchScore}
              onFinish={handleFinish}
              onBack={() => goTo("phase1", -1)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile settings dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <ProfileSettings
          profiles={profiles}
          activeId={activeProfile?.id ?? null}
          onSwitch={handleSwitchProfile}
          onRemove={(id) => { removeProfile(id); if (id === activeProfile?.id) setShowSettings(false); }}
          onAdd={() => { setShowSettings(false); setShowAddProfile(true); }}
          onClose={() => setShowSettings(false)}
        />
      </Dialog>

      {/* Parent dashboard slide-over */}
      <AnimatePresence>
        {showDashboard && <ParentDashboard onClose={() => setShowDashboard(false)} />}
      </AnimatePresence>
    </div>
  );
}
