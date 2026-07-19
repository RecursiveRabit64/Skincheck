import { useState, useRef, useMemo, useCallback, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BodyDoll, type SkinCondition, type ZoneData, type DollView, zonesDef, frontZonesDef, backZonesDef } from "@/components/BodyDoll";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile, type AgeRange, type StoredProfile } from "@/context/ProfileContext";
import { useCheckIn, type ZoneEntry } from "@/context/CheckInContext";
import { RotateCcw, Undo2, Search, FlipHorizontal, Users, Settings2, X, ChevronRight, ArrowLeft, Baby, GraduationCap, User, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ParentDashboard from "@/pages/ParentDashboard";
import Onboarding from "@/pages/Onboarding";
import Settings from "@/pages/Settings";

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "home" | "phase1" | "phase2" | "phase3" | "done" | "view";
type ZoneSnapshot = Map<string, ZoneData>;

// ── Condition Data ────────────────────────────────────────────────────────────

interface ConditionGroup {
  label: string;
  conditions: SkinCondition[];
}

const CONDITION_GROUPS_BY_AGE: Record<AgeRange, ConditionGroup[]> = {
  // ── New age ranges ──────────────────────────────────────────────────────────
  "1-5": [
    { label: "Rash & Skin",   conditions: ["Rash", "Hives", "Bug Bite", "Sunburn"] },
    { label: "Eczema",        conditions: ["Eczema", "Dry Skin"] },
    { label: "Infection",     conditions: ["Ringworm", "Warts"] },
  ],
  "6-9": [
    { label: "Rash & Skin",   conditions: ["Rash", "Hives", "Bug Bite", "Sunburn"] },
    { label: "Eczema",        conditions: ["Eczema", "Dry Skin"] },
    { label: "Infection",     conditions: ["Ringworm", "Warts"] },
  ],
  "10-12": [
    { label: "Rash & Skin",   conditions: ["Rash", "Hives", "Bug Bite", "Sunburn", "Contact Dermatitis"] },
    { label: "Eczema",        conditions: ["Eczema", "Dry Skin"] },
    { label: "Skin",          conditions: ["Acne", "Psoriasis", "Keratosis Pilaris"] },
    { label: "Infection",     conditions: ["Ringworm", "Fungal Rash", "Warts"] },
  ],
  "13-15": [
    { label: "Acne",          conditions: ["Acne", "Blackheads", "Whiteheads", "Cystic Acne"] },
    { label: "Rash",          conditions: ["Rash", "Hives", "Sunburn", "Contact Dermatitis"] },
    { label: "Eczema",        conditions: ["Eczema", "Dry Skin"] },
    { label: "Skin",          conditions: ["Psoriasis", "Keratosis Pilaris"] },
    { label: "Infection",     conditions: ["Ringworm", "Athlete's Foot", "Warts"] },
  ],
  "16-18": [
    { label: "Acne",          conditions: ["Acne", "Blackheads", "Whiteheads", "Cystic Acne"] },
    { label: "Rash",          conditions: ["Rash", "Hives", "Sunburn", "Contact Dermatitis"] },
    { label: "Eczema",        conditions: ["Eczema", "Dry Skin"] },
    { label: "Skin",          conditions: ["Psoriasis", "Keratosis Pilaris"] },
    { label: "Infection",     conditions: ["Ringworm", "Athlete's Foot", "Warts"] },
  ],
  "18+": [
    { label: "Acne",          conditions: ["Acne", "Blackheads", "Cystic Acne"] },
    { label: "Rash",          conditions: ["Rash", "Hives", "Sunburn", "Contact Dermatitis"] },
    { label: "Eczema",        conditions: ["Eczema", "Seborrheic Dermatitis", "Dry Skin"] },
    { label: "Inflammatory",  conditions: ["Psoriasis", "Rosacea"] },
    { label: "Infection",     conditions: ["Ringworm", "Athlete's Foot", "Warts"] },
  ],
  // ── Legacy age ranges (backward compat) ────────────────────────────────────
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

const CHIP_DOT: Record<ColorKey, string> = {
  red: "bg-red-400", orange: "bg-orange-400", amber: "bg-amber-400",
  yellow: "bg-yellow-400", lime: "bg-lime-400", teal: "bg-teal-500",
  violet: "bg-violet-400", blue: "bg-blue-400", rose: "bg-rose-400",
  stone: "bg-stone-400",
};
function conditionDotClass(condition: SkinCondition, active: boolean): string {
  if (active) return "bg-card/90";
  const key = CONDITION_COLOR[condition] ?? "violet";
  return CHIP_DOT[key];
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
  return (ageRange === "1-5" || ageRange === "5-7" || ageRange === "6-9") ? SEVERITY_YOUNG : SEVERITY_OLDER;
}

// ── Scratch Frequency ─────────────────────────────────────────────────────────

interface ScratchOption { emoji: string; label: string; sublabel?: string; value: number }

const SCRATCH_5_7: ScratchOption[] = [
  { emoji: "😊", label: "Nope!",    sublabel: "I didn't scratch at all",   value: 1 },
  { emoji: "😐", label: "A little", sublabel: "Just a few times today",    value: 5 },
  { emoji: "😢", label: "A lot!",   sublabel: "I kept scratching",         value: 9 },
];
const SCRATCH_8_12: ScratchOption[] = [
  { emoji: "😊", label: "Not really", sublabel: "Didn't scratch much",      value: 2 },
  { emoji: "😐", label: "Some",       sublabel: "Scratched a few times",    value: 5 },
  { emoji: "😢", label: "A lot!",     sublabel: "Couldn't stop scratching", value: 9 },
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

const CONDITION_EMOJI: Record<string, string> = {
  "Acne": "😤", "Blackheads": "⚫", "Whiteheads": "⚪", "Cystic Acne": "😣",
  "Eczema": "🔴", "Dry Skin": "🌵", "Seborrheic Dermatitis": "💧",
  "Rash": "🔥", "Hives": "🐝", "Sunburn": "☀️", "Bug Bite": "🦟", "Contact Dermatitis": "💥",
  "Psoriasis": "❄️", "Rosacea": "🌹",
  "Ringworm": "🔵", "Athlete's Foot": "👟", "Fungal Rash": "🍄",
  "Warts": "🎯", "Keratosis Pilaris": "🐓",
};

const CONDITION_DISPLAY_NAME: Partial<Record<SkinCondition, string>> = {
  "Keratosis Pilaris":     "Chicken Skin",
  "Contact Dermatitis":    "Skin Reaction",
  "Seborrheic Dermatitis": "Flaky Scalp",
  "Athlete's Foot":        "Foot Fungus",
};

function displayConditionName(condition: SkinCondition): string {
  return CONDITION_DISPLAY_NAME[condition] ?? condition;
}

type Phase1Mode = "add" | "inspect";

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

const PROGRESS_STEPS = ["Body", "Skin", "Review"] as const;

function ProgressDots({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center">
      {PROGRESS_STEPS.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const current = step === n;
        return (
          <Fragment key={n}>
            <div className="flex flex-col items-center gap-0.5">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 transition-all",
                done    ? "bg-primary border-primary text-white" :
                current ? "bg-primary/10 border-primary text-primary" :
                          "bg-muted border-muted/80 text-muted-foreground/40"
              )}>
                {done ? "✓" : n}
              </div>
              <span className={cn("text-[8px] font-medium leading-none", current ? "text-primary" : "text-muted-foreground/40")}>
                {label}
              </span>
            </div>
            {i < 2 && (
              <div className={cn("h-[2px] w-5 mb-3 mx-0.5 rounded-full transition-all", step > n ? "bg-primary" : "bg-muted")} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Streak helper ─────────────────────────────────────────────────────────────

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort((a, b) => b.localeCompare(a));
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T12:00:00");
    prev.setDate(prev.getDate() - 1);
    if (prev.toISOString().slice(0, 10) === sorted[i]) streak++;
    else break;
  }
  return streak;
}

function streakEmoji(n: number): string {
  if (n === 0) return "🌱";
  if (n < 3)  return "✨";
  if (n < 7)  return "🔥";
  if (n < 14) return "🔥🔥";
  if (n < 30) return "⭐";
  return "🏆";
}

function formatLastCheckin(date: string | null): string | null {
  if (!date) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (date === today) return "Today";
  const d = new Date();
  d.setDate(d.getDate() - 1);
  if (date === d.toISOString().slice(0, 10)) return "Yesterday";
  const parsed = new Date(date + "T00:00:00");
  return parsed.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ── Home Landing ──────────────────────────────────────────────────────────────

function HomeLanding({
  profile,
  profiles,
  lastCheckinDate,
  completedToday,
  streak,
  onStart,
  onViewToday,
  onOpenDashboard,
  onOpenSettings,
}: {
  profile: StoredProfile | null;
  profiles: StoredProfile[];
  lastCheckinDate: string | null;
  completedToday: boolean;
  streak: number;
  onStart: () => void;
  onViewToday: () => void;
  onOpenDashboard: () => void;
  onOpenSettings: () => void;
}) {
  const { text, emoji } = getGreeting();
  const isParent = profile?.userType === "parent";
  const lastCheckinLabel = formatLastCheckin(completedToday ? null : lastCheckinDate);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-primary/5 via-background to-background">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        {profile && (
          <div className="flex items-center gap-2">
            <motion.div
              whileTap={{ scale: 0.9 }}
              onClick={onOpenSettings}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer shrink-0",
                profileColor(profiles, profile.id)
              )}
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

      {/* ── Greeting ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="px-5 pt-3 pb-1"
      >
        <p className="text-2xl font-bold text-foreground">
          {text}, {profile?.name ?? "there"}! {emoji}
        </p>
      </motion.div>

      {/* ── Parent monitor bar ── */}
      {isParent && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="mx-5 mt-3"
        >
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onOpenDashboard}
            className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/8 to-primary/4 px-4 py-3 flex items-center gap-3 cursor-pointer shadow-sm active:opacity-80 transition-all"
          >
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Family Monitor</p>
              <p className="text-xs text-muted-foreground">View children's check-in reports</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </motion.div>
        </motion.div>
      )}

      {/* ── Today's check-in status card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.07 }}
        className="mx-5 mt-4"
      >
        <div className={cn(
          "rounded-2xl border px-4 py-4 flex items-center gap-4 shadow-sm",
          completedToday
            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
            : "bg-card border-border"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0",
            completedToday ? "bg-green-100" : "bg-primary/10"
          )}>
            {completedToday ? "✅" : "📋"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Today's skin check</p>
            {completedToday ? (
              <p className="text-base font-bold mt-0.5 text-green-700 dark:text-green-300">Completed!</p>
            ) : lastCheckinDate ? (
              <p className="text-base font-bold mt-0.5 text-foreground">Not completed yet</p>
            ) : (
              <p className="text-sm font-medium mt-0.5 text-muted-foreground leading-snug">No history yet — start your first check-in!</p>
            )}
          </div>
          <div className="text-right shrink-0">
            {!completedToday && lastCheckinDate && (
              <>
                <p className="text-[10px] text-muted-foreground">Est. time</p>
                <p className="text-sm font-semibold text-foreground">~2 min</p>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Spacer + buttons ── */}
      <div className="flex-1" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.14 }}
        className="px-5 space-y-2.5"
      >
        {completedToday ? (
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              className="w-full h-16 rounded-2xl text-lg font-bold shadow-lg"
              onClick={onViewToday}
            >
              View Today's Check-In
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </motion.div>
        ) : (
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              className="w-full h-16 rounded-2xl text-lg font-bold shadow-lg"
              onClick={onStart}
            >
              {lastCheckinDate ? "Start Check-In" : "Start First Check-In"}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </motion.div>
        )}

        {lastCheckinLabel && !completedToday && (
          <p className="text-center text-sm text-muted-foreground">
            Last check-in: <span className="font-semibold text-foreground">{lastCheckinLabel}</span>
          </p>
        )}
      </motion.div>

      {/* ── Streak bar ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="mx-5 mt-6 mb-8"
      >
        <div className="rounded-2xl border border-border bg-card px-4 py-3 flex items-center gap-3 shadow-sm">
          <span className="text-2xl leading-none">{streakEmoji(streak)}</span>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Progress</p>
            {streak > 0 ? (
              <p className="text-sm font-bold text-foreground">
                {streak} day streak{streak === 1 ? "" : ""}
                {streak >= 7 ? " — amazing! 🎉" : streak >= 3 ? " — keep it up!" : ""}
              </p>
            ) : (
              <p className="text-sm font-semibold text-muted-foreground">Start your first streak!</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Severity Tray ─────────────────────────────────────────────────────────────

function SeverityTray({
  zoneId,
  zoneData,
  currentCondition,
  ageRange,
  onSelect,
  onClear,
}: {
  zoneId: string;
  zoneData: ZoneData | undefined;
  currentCondition: SkinCondition;
  ageRange: AgeRange;
  onSelect: (severity: number) => void;
  onClear: () => void;
}) {
  const options = getSeverityOptions(ageRange);
  const label = zoneLabelMap[zoneId] ?? zoneId;
  const currentEntry = zoneData?.conditions.find((c) => c.condition === currentCondition);
  const otherConditions = zoneData?.conditions.filter((c) => c.condition !== currentCondition) ?? [];

  return (
    <motion.div
      key="severity-tray"
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 320 }}
      className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border rounded-t-3xl shadow-2xl px-5 pt-4 pb-8 max-w-md mx-auto"
      style={{ marginLeft: "auto", marginRight: "auto" }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-base">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{displayConditionName(currentCondition)}</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onClear} className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-2" title="Remove this condition">
          <X className="w-4 h-4" />
        </motion.button>
      </div>

      {otherConditions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {otherConditions.map((c) => (
            <span key={c.condition} className="text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              {displayConditionName(c.condition as SkinCondition)}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm font-medium text-muted-foreground mb-3 mt-2">How bad is it?</p>

      <div className="grid grid-cols-3 gap-3">
        {options.map((opt) => {
          const isSelected = currentEntry?.severity === opt.value;
          return (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.93 }}
              onClick={() => onSelect(opt.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 transition-all",
                isSelected
                  ? `${opt.ring} ring-2 ring-offset-1 border-transparent bg-primary/5`
                  : "border-border bg-card hover:bg-muted/30"
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

  const [phase1Mode, setPhase1Mode] = useState<Phase1Mode>("add");
  const [inspectZone, setInspectZone] = useState<string | null>(null);
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
    if (phase1Mode === "inspect") {
      setInspectZone(id);
      return;
    }
    // Just open the tray — don't pre-add the condition so no severity is pre-selected
    setActiveTrayZone(id);
  }, [phase1Mode]);

  const handleSeveritySelect = (severity: number) => {
    if (!activeTrayZone) return;
    setZones((prev) => {
      const next = new Map(prev);
      const existing = next.get(activeTrayZone);
      const hasCondition = existing?.conditions.some((c) => c.condition === currentCondition) ?? false;
      if (!hasCondition) pushHistory(prev);
      if (existing) {
        if (hasCondition) {
          const updated = existing.conditions.map((c) =>
            c.condition === currentCondition ? { ...c, severity } : c
          );
          next.set(activeTrayZone, { ...existing, conditions: updated });
        } else {
          next.set(activeTrayZone, { ...existing, conditions: [...existing.conditions, { condition: currentCondition, severity }] });
        }
      } else {
        next.set(activeTrayZone, { conditions: [{ condition: currentCondition, severity }] });
      }
      return next;
    });
    setActiveTrayZone(null);
  };

  const handleClearZone = () => {
    if (!activeTrayZone) return;
    const existing = zones.get(activeTrayZone);
    const hasCondition = existing?.conditions.some((c) => c.condition === currentCondition) ?? false;
    if (!hasCondition) {
      setActiveTrayZone(null);
      return;
    }
    setZones((prev) => {
      pushHistory(prev);
      const next = new Map(prev);
      const ex = next.get(activeTrayZone);
      if (ex) {
        const remaining = ex.conditions.filter((c) => c.condition !== currentCondition);
        if (remaining.length === 0) next.delete(activeTrayZone);
        else next.set(activeTrayZone, { ...ex, conditions: remaining });
      }
      return next;
    });
    setActiveTrayZone(null);
  };

  const activeZoneData = activeTrayZone ? zones.get(activeTrayZone) : undefined;
  const inspectZoneData = inspectZone ? zones.get(inspectZone) : undefined;

  const switchMode = (m: Phase1Mode) => {
    setPhase1Mode(m);
    setActiveTrayZone(null);
    setInspectZone(null);
  };

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

      <div className="px-4 mb-2">
        <h2 className="text-xl font-bold">Where does it bother you?</h2>
      </div>

      {/* Mode toggle */}
      <div className="flex mx-4 mb-2 bg-muted rounded-xl p-0.5 gap-0.5">
        <button
          onClick={() => switchMode("add")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-semibold transition-all",
            phase1Mode === "add" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
          )}
        >
          <Plus className="w-3.5 h-3.5" /> Add conditions
        </button>
        <button
          onClick={() => switchMode("inspect")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-semibold transition-all",
            phase1Mode === "inspect" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
          )}
        >
          <Search className="w-3.5 h-3.5" /> View conditions
        </button>
      </div>

      {/* Condition cards — only in add mode */}
      {phase1Mode === "add" && (
        <div className="px-4 mb-2">
          <div className="grid grid-cols-2 gap-1.5 max-h-[148px] overflow-y-auto scrollbar-none">
            {allConditions.map((cond) => {
              const isActive = currentCondition === cond;
              return (
                <motion.button
                  key={cond}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentCondition(cond)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left",
                    conditionChipClass(cond, isActive)
                  )}
                >
                  <span className="text-base leading-none shrink-0">{CONDITION_EMOJI[cond] ?? "🩹"}</span>
                  <span className="truncate">{displayConditionName(cond)}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Front/Back toggle */}
      <div className="flex items-center justify-center gap-2 px-4 mb-2">
        <button
          onClick={() => setDollView("front")}
          className={cn("flex-1 py-1 rounded-lg text-xs font-medium border transition-all", dollView === "front" ? "bg-card border-border shadow-sm text-foreground" : "border-transparent text-muted-foreground")}
        >
          Front
        </button>
        <FlipHorizontal className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        <button
          onClick={() => setDollView("back")}
          className={cn("flex-1 py-1 rounded-lg text-xs font-medium border transition-all", dollView === "back" ? "bg-card border-border shadow-sm text-foreground" : "border-transparent text-muted-foreground")}
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
        />

        {/* Undo / Reset (add mode only) */}
        {phase1Mode === "add" && (
          <div className="absolute top-0 right-4 flex flex-col gap-2">
            <motion.button whileTap={{ scale: 0.88 }} onClick={handleUndo} disabled={history.current.length === 0}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-border bg-card shadow-sm disabled:opacity-30 text-muted-foreground"
            >
              <Undo2 className="w-4 h-4" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => { pushHistory(zones); setZones(new Map()); }}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-border bg-card shadow-sm text-muted-foreground"
            >
              <RotateCcw className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Inspect widget — shown in inspect mode */}
      {phase1Mode === "inspect" ? (
        <div className="px-4 py-2">
          <AnimatePresence mode="wait">
            {inspectZone && inspectZoneData ? (
              <motion.div
                key={inspectZone}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="bg-card border border-border rounded-2xl px-4 py-3 shadow-sm"
              >
                <p className="text-xs font-semibold text-muted-foreground truncate mb-2">{zoneLabelMap[inspectZone] ?? inspectZone}</p>
                {inspectZoneData.conditions.map((ce, idx) => (
                  <div key={ce.condition} className={cn("flex items-center gap-3", idx > 0 && "border-t border-border/50 mt-2 pt-2")}>
                    <span className="text-2xl leading-none">{CONDITION_EMOJI[ce.condition] ?? "🩹"}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{displayConditionName(ce.condition as SkinCondition)}</p>
                      <p className="text-xs text-muted-foreground">{ce.severity <= 4 ? "😊 Mild" : ce.severity <= 7 ? "😐 Moderate" : "😢 Severe"}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : inspectZone && !inspectZoneData ? (
              <motion.div
                key="no-data"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="bg-muted/50 rounded-2xl px-4 py-3 text-center"
              >
                <p className="text-sm text-muted-foreground">No conditions marked here.</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">Switch to Add mode to mark this area.</p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-2"
              >
                <p className="text-xs text-muted-foreground/70">Add conditions or touch a body part with conditions on it</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* Marked count (add mode) */
        <div className="px-4 py-2 text-center">
          {zones.size > 0 ? (
            <p className="text-xs text-muted-foreground">
              {zones.size} area{zones.size !== 1 ? "s" : ""} marked
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/60">Tap a body part to get started</p>
          )}
        </div>
      )}

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

      {/* Severity Tray — add mode only */}
      <AnimatePresence>
        {phase1Mode === "add" && activeTrayZone && (
          <SeverityTray
            zoneId={activeTrayZone}
            zoneData={activeZoneData}
            currentCondition={currentCondition}
            ageRange={ageRange}
            onSelect={handleSeveritySelect}
            onClear={handleClearZone}
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
          {new Date().getHours() < 17
            ? "How has your skin felt so far today?"
            : "How did your skin feel today?"
          }
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {isYoung ? "Let us know how itchy it's been" : "Tell us how itchy your skin was"}
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
                    : "border-border bg-card hover:bg-muted/20 hover:border-muted-foreground/20"
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

        {/* Ages 8–12: 3 stacked cards (same style as 5-7) */}
        {isMid && (
          <div className="flex flex-col gap-4">
            {SCRATCH_8_12.map((opt) => (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.96 }}
                onClick={() => setScratchScore(opt.value)}
                className={cn(
                  "w-full flex items-center gap-5 p-5 rounded-2xl border-2 transition-all text-left",
                  scratchScore === opt.value
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:bg-muted/20 hover:border-muted-foreground/20"
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
                      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
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

// ── Phase 3 — Review ─────────────────────────────────────────────────────────

function formatZoneList(labels: string[]): string {
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} & ${labels[1]}`;
  return `${labels.slice(0, 2).join(", ")} +${labels.length - 2} more`;
}

function severityMeta(sev: number): { label: string; dot: string; text: string } {
  if (sev <= 4) return { label: "Mild",     dot: "bg-yellow-400", text: "text-yellow-700" };
  if (sev <= 7) return { label: "Moderate", dot: "bg-orange-400", text: "text-orange-600" };
  return              { label: "Severe",   dot: "bg-red-500",    text: "text-red-600"    };
}

function scratchSummaryText(score: number | null): string {
  if (score === null) return "Itchiness not recorded.";
  if (score <= 2) return "Little to no scratching today.";
  if (score <= 4) return "Some minor scratching today.";
  if (score <= 6) return "Moderate scratching today.";
  if (score <= 8) return "Quite a bit of scratching today.";
  return "Significant scratching today.";
}

function Phase3({
  zones,
  scratchScore,
  onSubmit,
  onBack,
  readonly = false,
}: {
  zones: ZoneSnapshot;
  scratchScore: number | null;
  onSubmit: () => void;
  onBack: () => void;
  readonly?: boolean;
}) {
  const conditionGroups = useMemo(() => {
    const groups = new Map<string, { zoneLabels: string[]; maxSeverity: number }>();
    zones.forEach((data, zoneId) => {
      data.conditions.forEach(({ condition, severity }) => {
        if (!groups.has(condition)) groups.set(condition, { zoneLabels: [], maxSeverity: 0 });
        const g = groups.get(condition)!;
        const zlabel = zoneLabelMap[zoneId] ?? zoneId;
        if (!g.zoneLabels.includes(zlabel)) g.zoneLabels.push(zlabel);
        g.maxSeverity = Math.max(g.maxSeverity, severity);
      });
    });
    return Array.from(groups.entries()).map(([condition, g]) => ({ condition, ...g }));
  }, [zones]);

  const overallMaxSev = conditionGroups.reduce((m, g) => Math.max(m, g.maxSeverity), 0);
  const overallStatus =
    conditionGroups.length === 0 ? { emoji: "✅", label: "All clear!", sub: "No skin issues recorded today.", color: "bg-green-50 border-green-200" } :
    overallMaxSev <= 4           ? { emoji: "🟡", label: "Mostly clear",            sub: "Only mild areas noted.",             color: "bg-yellow-50 border-yellow-200" } :
    overallMaxSev <= 7           ? { emoji: "🟠", label: "A few areas to watch",    sub: "Some moderate areas noted.",         color: "bg-orange-50 border-orange-200" } :
                                   { emoji: "🔴", label: "Needs attention",          sub: "Severe areas noted — see a doctor.", color: "bg-red-50 border-red-200" };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </motion.button>
        <ProgressDots step={3} />
        <div className="w-16" />
      </div>

      <div className="px-4 mb-4">
        <h2 className="text-xl font-bold">{readonly ? "Today's Check-In" : "Review Your Check-In"}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{readonly ? "Your recorded skin check for today" : "Here's a summary of today"}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
        {/* Overall status */}
        <div className={cn("rounded-2xl border px-4 py-3 flex items-center gap-3", overallStatus.color)}>
          <span className="text-2xl leading-none">{overallStatus.emoji}</span>
          <div>
            <p className="text-sm font-bold text-foreground">{overallStatus.label}</p>
            <p className="text-xs text-muted-foreground">{overallStatus.sub}</p>
          </div>
        </div>

        {/* Condition breakdown */}
        {conditionGroups.length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
            {conditionGroups.map(({ condition, zoneLabels, maxSeverity }) => {
              const { label: sevLabel, dot, text: textColor } = severityMeta(maxSeverity);
              return (
                <div key={condition} className="flex items-start gap-3 px-4 py-3">
                  <div className={cn("w-2.5 h-2.5 rounded-full mt-1 shrink-0", dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{displayConditionName(condition as SkinCondition)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{formatZoneList(zoneLabels)}</p>
                  </div>
                  <span className={cn("text-xs font-semibold shrink-0 mt-0.5", textColor)}>{sevLabel}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Scratch summary */}
        <div className="rounded-2xl border border-border bg-card px-4 py-3 flex items-center gap-3">
          <span className="text-xl leading-none">🤚</span>
          <p className="text-sm text-foreground">{scratchSummaryText(scratchScore)}</p>
        </div>
      </div>

      {/* Submit / Done button */}
      <div className="px-4 pb-8 pt-2">
        <motion.div whileTap={{ scale: 0.97 }}>
          {readonly ? (
            <Button variant="outline" className="w-full h-14 rounded-2xl text-base font-bold shadow-sm" onClick={onBack}>
              Done
            </Button>
          ) : (
            <Button className="w-full h-14 rounded-2xl text-base font-bold shadow-md" onClick={onSubmit}>
              Submit Check-In ✓
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ── Done Screen ───────────────────────────────────────────────────────────────

function DoneScreen({ isEditing, onContinue }: { isEditing: boolean; onContinue: () => void }) {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-8 text-center bg-gradient-to-b from-green-50 via-background to-background">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 200 }}
      >
        <span className="text-8xl leading-none">🎉</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        className="mt-6 flex flex-col items-center"
      >
        <h1 className="text-2xl font-bold text-foreground">Skin Check Complete!</h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-[280px] leading-relaxed">
          {isEditing
            ? "Your check-in has been updated. Great job staying on top of your skin health!"
            : "Great job! We'll use today's information to help you and your family better understand your skin over time."}
        </p>
        <motion.div whileTap={{ scale: 0.97 }} className="mt-10 w-full max-w-[280px]">
          <Button
            className="w-full h-14 rounded-2xl text-base font-bold shadow-md"
            onClick={onContinue}
          >
            Continue
          </Button>
        </motion.div>
      </motion.div>
    </div>
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

  const [phase, setPhase] = useState<Phase>("home");
  const [dir, setDir] = useState(1);
  const [zones, setZones] = useState<ZoneSnapshot>(new Map());
  const [scratchScore, setScratchScore] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);

  const goTo = useCallback((next: Phase, direction = 1) => {
    setDir(direction);
    setPhase(next);
  }, []);

  // Derived stats for current profile
  const { lastCheckinDate, completedToday, streak, todayReport } = useMemo(() => {
    if (!activeProfile) return { lastCheckinDate: null, completedToday: false, streak: 0, todayReport: null };
    const reports = getReportsForProfile(activeProfile.id);
    const today = new Date().toISOString().slice(0, 10);
    const last = reports[0]?.date ?? null;
    const done = last === today;
    const dates = reports.map((r) => r.date);
    const todayRpt = done ? reports[0] : null;
    return { lastCheckinDate: last, completedToday: done, streak: calcStreak(dates), todayReport: todayRpt };
  }, [activeProfile, getReportsForProfile]);

  const handleStart = () => {
    setZones(new Map());
    setScratchScore(null);
    setIsEditing(false);
    goTo("phase1", 1);
  };

  const handleViewToday = () => {
    if (!todayReport) return;
    const loadedZones = new Map<string, ZoneData>();
    Object.entries(todayReport.zones).forEach(([k, v]) => {
      const entry = v as unknown as Record<string, unknown>;
      if (Array.isArray(entry.conditions)) {
        loadedZones.set(k, {
          conditions: (entry.conditions as Array<{ condition: string; severity: number }>).map((c) => ({
            condition: c.condition as SkinCondition,
            severity: c.severity,
          })),
          medication: entry.medication as string | undefined,
        });
      } else {
        loadedZones.set(k, {
          conditions: [{ condition: entry.condition as SkinCondition, severity: entry.severity as number }],
          medication: entry.medication as string | undefined,
        });
      }
    });
    setZones(loadedZones);
    setScratchScore(todayReport.scratchScore ?? null);
    goTo("view", 1);
  };

  const handleFinish = () => {
    if (!activeProfile || zones.size === 0) return;
    const entries = new Map<string, ZoneEntry>();
    zones.forEach((v, k) =>
      entries.set(k, {
        conditions: v.conditions.map((c) => ({ condition: c.condition, severity: c.severity })),
        medication: v.medication,
      })
    );
    saveReport(activeProfile.id, entries, scratchScore ?? undefined);
    goTo("done", 1);
  };

  const handleSwitchProfile = (id: string) => {
    switchProfile(id);
    setZones(new Map());
    setScratchScore(null);
    goTo("home");
    setShowSettings(false);
  };

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
              completedToday={completedToday}
              streak={streak}
              onStart={handleStart}
              onViewToday={handleViewToday}
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
              onFinish={() => goTo("phase3", 1)}
              onBack={() => goTo("phase1", -1)}
            />
          </motion.div>
        )}

        {phase === "phase3" && (
          <motion.div key="phase3" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: "easeInOut" }}>
            <Phase3
              zones={zones}
              scratchScore={scratchScore}
              onSubmit={handleFinish}
              onBack={() => goTo("phase2", -1)}
            />
          </motion.div>
        )}

        {phase === "view" && (
          <motion.div key="view" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: "easeInOut" }}>
            <Phase3
              zones={zones}
              scratchScore={scratchScore}
              onSubmit={() => {}}
              onBack={() => goTo("home", -1)}
              readonly
            />
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div key="done" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: "easeInOut" }}>
            <DoneScreen
              isEditing={isEditing}
              onContinue={() => {
                setZones(new Map());
                setScratchScore(null);
                goTo("home", -1);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings slide-over */}
      <AnimatePresence>
        {showSettings && (
          <Settings
            onClose={() => setShowSettings(false)}
            onSwitchProfile={(id) => { handleSwitchProfile(id); }}
          />
        )}
      </AnimatePresence>

      {/* Parent dashboard slide-over */}
      <AnimatePresence>
        {showDashboard && <ParentDashboard onClose={() => setShowDashboard(false)} />}
      </AnimatePresence>
    </div>
  );
}
