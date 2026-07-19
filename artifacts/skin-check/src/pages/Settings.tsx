import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, X, ChevronRight, Pencil, Trash2, Plus, Users, Shield,
  Info, Baby, GraduationCap, User, Check, Home, Sun, Moon, Smartphone,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useProfile,
  type StoredProfile,
  type UserType,
  type AgeRange,
  type Family,
} from "@/context/ProfileContext";
import { useCheckIn } from "@/context/CheckInContext";
import Onboarding from "@/pages/Onboarding";

// ── Constants ─────────────────────────────────────────────────────────────────

const PROFILE_TYPE_DEFS: {
  type: UserType;
  label: string;
  displayLabel: string;
  sub: string;
  icon: React.ElementType;
  ages: { label: string; value: AgeRange }[];
}[] = [
  {
    type: "child", label: "Child", displayLabel: "Child", sub: "Ages 5–12", icon: Baby,
    ages: [{ label: "5–7", value: "5-7" }, { label: "8–12", value: "8-12" }],
  },
  {
    type: "teen", label: "Teen", displayLabel: "Teen", sub: "Ages 13–17", icon: GraduationCap,
    ages: [{ label: "13–17", value: "13-17" }],
  },
  {
    type: "parent", label: "Caregiver", displayLabel: "Caregiver", sub: "Ages 18+", icon: User,
    ages: [{ label: "18–35", value: "18-35" }, { label: "35–55", value: "35-55" }, { label: "55+", value: "55+" }],
  },
];

const TYPE_LABEL: Record<UserType, string> = { child: "Child", teen: "Teen", parent: "Caregiver" };
const TYPE_ICON: Record<UserType, React.ElementType> = { child: Baby, teen: GraduationCap, parent: User };

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Types ─────────────────────────────────────────────────────────────────────

type SettingsScreen = "main" | "edit-profile" | "families" | "family-detail" | "privacy" | "about";

// ── Slide variants ────────────────────────────────────────────────────────────

const slide = {
  enter: (d: number) => ({ opacity: 0, x: d * 40 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d * -40 }),
};

// ── Small helpers ─────────────────────────────────────────────────────────────

function ProfileAvatar({ profile, size = "md" }: { profile: StoredProfile; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";
  return (
    <div className={cn("rounded-full flex items-center justify-center font-bold shrink-0", sz, avatarColor(profile.name))}>
      {profile.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">{children}</p>;
}

function SettingsCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-white rounded-2xl border border-border overflow-hidden", className)}>{children}</div>;
}

function SettingsRow({
  icon: Icon,
  label,
  sub,
  onPress,
  right,
  danger,
  last,
}: {
  icon?: React.ElementType;
  label: string;
  sub?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <>
      <motion.button
        whileTap={onPress ? { scale: 0.98 } : {}}
        onClick={onPress}
        disabled={!onPress}
        className={cn(
          "w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors",
          onPress ? "hover:bg-muted/30 active:bg-muted/50 cursor-pointer" : "cursor-default",
          danger ? "text-destructive" : "text-foreground"
        )}
      >
        {Icon && (
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", danger ? "bg-destructive/10" : "bg-muted")}>
            <Icon className={cn("w-4 h-4", danger ? "text-destructive" : "text-foreground/70")} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium", danger ? "text-destructive" : "text-foreground")}>{label}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
        </div>
        {right !== undefined ? right : onPress ? <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" /> : null}
      </motion.button>
      {!last && <div className="h-px bg-border mx-4" />}
    </>
  );
}

// ── Undo Toast ────────────────────────────────────────────────────────────────

function UndoToast({
  profile,
  onUndo,
  onExpire,
}: {
  profile: StoredProfile;
  onUndo: () => void;
  onExpire: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      className="fixed bottom-6 right-4 left-4 z-[9999] mx-auto max-w-xs"
    >
      <div className="relative bg-foreground text-background rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="text-sm flex-1 font-medium">Deleted &ldquo;{profile.name}&rdquo;</span>
          <button
            onClick={onUndo}
            className="text-sm font-bold text-primary-foreground/90 hover:text-primary-foreground shrink-0 px-1"
          >
            Undo
          </button>
        </div>
        <motion.div
          key={profile.id}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: 5, ease: "linear" }}
          onAnimationComplete={onExpire}
          style={{ transformOrigin: "left", originX: 0 }}
          className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/25 rounded-b-2xl"
        />
      </div>
    </motion.div>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────────────────────────────

function DeleteConfirmDialog({
  profile,
  onConfirm,
  onCancel,
}: {
  profile: StoredProfile;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9990] flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-8"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-background rounded-3xl p-6 flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-foreground">Delete this profile?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All skin history and reports for <span className="font-semibold text-foreground">{profile.name}</span> will be removed. This can be undone for a few seconds after deleting.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" className="flex-1 h-12 rounded-xl" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Batch Delete Confirm Dialog ───────────────────────────────────────────────

function BatchDeleteConfirmDialog({
  count,
  onConfirm,
  onCancel,
}: {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9990] flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-8"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-background rounded-3xl p-6 flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-foreground">
            Delete {count} {count === 1 ? "profile" : "profiles"}?
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All skin history and reports for {count === 1 ? "this profile" : "these profiles"} will be removed. This can be undone for a few seconds.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" className="flex-1 h-12 rounded-xl" onClick={onConfirm}>
            Delete {count === 1 ? "Profile" : `${count} Profiles`}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

function MainScreen({
  activeProfile,
  profiles,
  families,
  onNav,
  onEditProfile,
  onDeleteRequest,
  onBatchDeleteRequest,
  onAdd,
  onSwitchProfile,
}: {
  activeProfile: StoredProfile | null;
  profiles: StoredProfile[];
  families: Family[];
  onNav: (screen: SettingsScreen) => void;
  onEditProfile: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onBatchDeleteRequest: (ids: string[]) => void;
  onAdd: () => void;
  onSwitchProfile: (id: string) => void;
}) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { theme, setTheme } = useTheme();

  const allSelected = profiles.length > 0 && selectedIds.size === profiles.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(profiles.map((p) => p.id)));
  };

  const exitSelect = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Profiles — highest priority section */}
      <div>
        <div className="flex items-center justify-between mb-1 px-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profiles</p>
          {profiles.length > 0 && (
            selectMode ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAll}
                  className="text-xs font-semibold text-primary"
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </button>
                <button onClick={exitSelect} className="text-xs font-semibold text-muted-foreground">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSelectMode(true)}
                className="text-xs font-semibold text-primary"
              >
                Select
              </button>
            )
          )}
        </div>

        <SettingsCard>
          {profiles.map((p, i) => {
            const Icon = TYPE_ICON[p.userType];
            const isActive = p.id === activeProfile?.id;
            const isSelected = selectedIds.has(p.id);
            return (
              <div key={p.id}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 transition-colors",
                    selectMode
                      ? "cursor-pointer active:bg-muted/40"
                      : !isActive ? "cursor-pointer hover:bg-muted/20 active:bg-muted/40" : "",
                    selectMode && isSelected && "bg-primary/5"
                  )}
                  onClick={selectMode ? () => toggleSelect(p.id) : !isActive ? () => onSwitchProfile(p.id) : undefined}
                >
                  {selectMode ? (
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                      isSelected ? "bg-primary border-primary" : "border-muted-foreground/40"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  ) : (
                    <ProfileAvatar profile={p} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                      {isActive && (
                        <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Icon className="w-3 h-3" />
                      {TYPE_LABEL[p.userType]}{p.userType !== "parent" ? ` · ${p.ageRange}` : ""}
                    </div>
                  </div>
                  {!selectMode && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); onEditProfile(p.id); }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); onDeleteRequest(p.id); }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  )}
                </div>
                {i < profiles.length - 1 && <div className="h-px bg-border mx-4" />}
              </div>
            );
          })}
        </SettingsCard>

        {selectMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mt-2"
          >
            <Button
              variant="destructive"
              className="w-full h-11 rounded-2xl font-semibold"
              onClick={() => onBatchDeleteRequest(Array.from(selectedIds))}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete {selectedIds.size} {selectedIds.size === 1 ? "Profile" : "Profiles"}
            </Button>
          </motion.div>
        )}

        {!selectMode && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onAdd}
            className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:bg-muted/20 hover:border-primary/30 hover:text-foreground transition-all"
          >
            <Plus className="w-4 h-4" /> Add Profile
          </motion.button>
        )}
      </div>

      {/* Families */}
      <div>
        <SectionLabel>Families</SectionLabel>
        <SettingsCard>
          <SettingsRow
            icon={Users}
            label="Manage Families"
            sub={families.length > 0 ? `${families.length} ${families.length === 1 ? "family" : "families"}` : "Organize profiles by family"}
            onPress={() => onNav("families")}
            last
          />
        </SettingsCard>
      </div>

      {/* Appearance */}
      <div>
        <SectionLabel>Appearance</SectionLabel>
        <SettingsCard>
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                {theme === "dark" ? <Moon className="w-4 h-4 text-foreground" /> : theme === "light" ? <Sun className="w-4 h-4 text-foreground" /> : <Smartphone className="w-4 h-4 text-foreground" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Theme</p>
                <p className="text-xs text-muted-foreground">{theme === "auto" ? "Auto (time of day)" : theme === "dark" ? "Dark mode" : "Light mode"}</p>
              </div>
            </div>
            <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
              {(["light", "auto", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                    theme === t ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === "light" ? <Sun className="w-3.5 h-3.5" /> : t === "dark" ? <Moon className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>
        </SettingsCard>
      </div>

      {/* App */}
      <div>
        <SectionLabel>App</SectionLabel>
        <SettingsCard>
          <SettingsRow icon={Shield} label="Privacy" onPress={() => onNav("privacy")} />
          <SettingsRow icon={Info} label="About Patch" onPress={() => onNav("about")} last />
        </SettingsCard>
      </div>
    </div>
  );
}

// ── Edit Profile Screen ───────────────────────────────────────────────────────

function EditProfileScreen({
  profile,
  onSave,
}: {
  profile: StoredProfile;
  onSave: (patch: Partial<Pick<StoredProfile, "name" | "ageRange" | "userType">>) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [userType, setUserType] = useState<UserType>(profile.userType);
  const [ageRange, setAgeRange] = useState<AgeRange>(profile.ageRange);

  const typeDef = PROFILE_TYPE_DEFS.find((t) => t.type === userType)!;
  const validAge = typeDef.ages.some((a) => a.value === ageRange);
  const canSave = name.trim().length > 0;

  const handleTypeChange = (type: UserType) => {
    if (type === userType) return;
    setUserType(type);
    if (type === "parent") {
      setAgeRange("35-55");
      return;
    }
    const def = PROFILE_TYPE_DEFS.find((t) => t.type === type)!;
    const validValues = def.ages.map((a) => a.value);
    if (!validValues.includes(ageRange)) setAgeRange(def.ages[0].value);
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave({ name: name.trim(), userType, ageRange });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Profile type */}
      <div>
        <SectionLabel>Profile Type</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {PROFILE_TYPE_DEFS.map(({ type, displayLabel, sub, icon: Icon }) => {
            const selected = userType === type;
            return (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 text-center transition-all active:scale-[0.97]",
                  selected ? "border-primary bg-primary/8 text-primary" : "border-border bg-white text-muted-foreground hover:border-primary/40"
                )}
              >
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", selected ? "bg-primary/15" : "bg-muted")}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold">{displayLabel}</span>
                <span className={cn("text-[10px]", selected ? "text-primary/70" : "text-muted-foreground/60")}>{sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Name */}
      <div>
        <SectionLabel>Name</SectionLabel>
        <SettingsCard>
          <div className="px-4 py-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name"
              className="border-0 p-0 h-auto text-base shadow-none focus-visible:ring-0"
              maxLength={32}
            />
          </div>
        </SettingsCard>
        <p className="text-[11px] text-muted-foreground mt-1.5 px-1">
          You can change this at any time from settings.
        </p>
      </div>

      {/* Age range — hidden for parent/caregiver */}
      {userType !== "parent" && (
        <div>
          <SectionLabel>Age Range</SectionLabel>
          <div className={cn("grid gap-2", typeDef.ages.length <= 2 ? "grid-cols-2" : "grid-cols-3")}>
            {typeDef.ages.map(({ label, value }) => {
              const selected = ageRange === value;
              return (
                <button
                  key={value}
                  onClick={() => setAgeRange(value)}
                  className={cn(
                    "py-3 rounded-2xl border-2 text-sm font-semibold text-center transition-all active:scale-[0.97]",
                    selected ? "border-primary bg-primary/8 text-primary" : "border-border bg-white text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {!validAge && (
            <p className="text-[11px] text-amber-600 mt-1.5 px-1">Select an age range for the new profile type.</p>
          )}
        </div>
      )}

      {/* Save */}
      <motion.div whileTap={canSave ? { scale: 0.97 } : {}}>
        <Button
          className={cn("w-full h-13 rounded-2xl text-base font-bold", !canSave && "opacity-40 cursor-not-allowed")}
          onClick={handleSave}
          disabled={!canSave}
        >
          <Check className="w-4 h-4 mr-2" /> Save Changes
        </Button>
      </motion.div>
    </div>
  );
}

// ── Families Screen ───────────────────────────────────────────────────────────

function FamiliesScreen({
  families,
  profiles,
  onSelectFamily,
  onCreate,
}: {
  families: Family[];
  profiles: StoredProfile[];
  onSelectFamily: (id: string) => void;
  onCreate: () => void;
}) {
  const memberCount = (familyId: string) => profiles.filter((p) => p.familyId === familyId).length;

  return (
    <div className="flex flex-col gap-4">
      {families.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No families yet</p>
            <p className="text-sm text-muted-foreground mt-0.5">Create a family to link caregiver and child profiles together.</p>
          </div>
        </div>
      ) : (
        <SettingsCard>
          {families.map((family, i) => {
            const count = memberCount(family.id);
            return (
              <SettingsRow
                key={family.id}
                icon={Users}
                label={family.name}
                sub={count === 0 ? "No members" : `${count} member${count === 1 ? "" : "s"}`}
                onPress={() => onSelectFamily(family.id)}
                last={i === families.length - 1}
              />
            );
          })}
        </SettingsCard>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onCreate}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:bg-muted/20 hover:border-primary/30 hover:text-foreground transition-all"
      >
        <Plus className="w-4 h-4" /> Create a Family
      </motion.button>
    </div>
  );
}

// ── Create Family dialog ──────────────────────────────────────────────────────

function CreateFamilySheet({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9990] flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-8"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-background rounded-3xl p-6 flex flex-col gap-4 shadow-2xl"
      >
        <h3 className="text-lg font-bold">Create a Family</h3>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Family name</label>
          <Input
            autoFocus
            placeholder="e.g. Smith Family"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-xl text-base"
            maxLength={40}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && onConfirm(name.trim())}
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={onCancel}>Cancel</Button>
          <Button className="flex-1 h-12 rounded-xl font-bold" onClick={() => name.trim() && onConfirm(name.trim())} disabled={!name.trim()}>
            Create
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Family Detail Screen ──────────────────────────────────────────────────────

function FamilyDetailScreen({
  family,
  profiles,
  onRename,
  onDelete,
  onAddProfile,
  onRemoveProfile,
}: {
  family: Family;
  profiles: StoredProfile[];
  onRename: (name: string) => void;
  onDelete: () => void;
  onAddProfile: (profileId: string) => void;
  onRemoveProfile: (profileId: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(family.name);
  const [showAddPicker, setShowAddPicker] = useState(false);

  const members = profiles.filter((p) => p.familyId === family.id);
  const caregivers = members.filter((p) => p.userType === "parent");
  const children = members.filter((p) => p.userType !== "parent");
  const unassigned = profiles.filter((p) => !p.familyId);
  const isEmpty = members.length === 0;

  const ProfileRow = ({ p, last }: { p: StoredProfile; last: boolean }) => {
    const Icon = TYPE_ICON[p.userType];
    return (
      <>
        <div className="flex items-center gap-3 px-4 py-3">
          <ProfileAvatar profile={p} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon className="w-3 h-3" />{TYPE_LABEL[p.userType]} · {p.ageRange}
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onRemoveProfile(p.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>
        </div>
        {!last && <div className="h-px bg-border mx-4" />}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Name / rename */}
      {renaming ? (
        <div className="flex gap-2">
          <Input
            autoFocus
            value={renameVal}
            onChange={(e) => setRenameVal(e.target.value)}
            className="flex-1 h-11 rounded-xl"
            maxLength={40}
          />
          <Button
            className="h-11 px-4 rounded-xl"
            onClick={() => { if (renameVal.trim()) { onRename(renameVal.trim()); setRenaming(false); } }}
            disabled={!renameVal.trim()}
          >
            Save
          </Button>
          <Button variant="outline" className="h-11 px-3 rounded-xl" onClick={() => { setRenameVal(family.name); setRenaming(false); }}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-foreground">{family.name}</p>
          <button onClick={() => setRenaming(true)} className="text-xs text-primary font-medium px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">
            Rename
          </button>
        </div>
      )}

      {/* Caregivers */}
      <div>
        <SectionLabel>Caregivers</SectionLabel>
        <SettingsCard>
          {caregivers.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No caregivers in this family</p>
          ) : (
            caregivers.map((p, i) => <ProfileRow key={p.id} p={p} last={i === caregivers.length - 1} />)
          )}
        </SettingsCard>
      </div>

      {/* Children */}
      <div>
        <SectionLabel>Children &amp; Teens</SectionLabel>
        <SettingsCard>
          {children.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No children or teens in this family</p>
          ) : (
            children.map((p, i) => <ProfileRow key={p.id} p={p} last={i === children.length - 1} />)
          )}
        </SettingsCard>
      </div>

      {/* Add profile */}
      {unassigned.length > 0 && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAddPicker(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:bg-muted/20 hover:border-primary/30 hover:text-foreground transition-all"
        >
          <Plus className="w-4 h-4" /> Add Existing Profile
        </motion.button>
      )}

      {/* Delete family */}
      {isEmpty && (
        <button
          onClick={onDelete}
          className="text-sm text-destructive font-medium py-2 hover:underline"
        >
          Delete this family
        </button>
      )}

      {/* Profile picker overlay */}
      <AnimatePresence>
        {showAddPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-8"
            onClick={() => setShowAddPicker(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-background rounded-3xl p-5 flex flex-col gap-3 shadow-2xl"
            >
              <h3 className="text-base font-bold">Add Profile to {family.name}</h3>
              <div className="flex flex-col gap-1">
                {unassigned.map((p) => {
                  const Icon = TYPE_ICON[p.userType];
                  return (
                    <motion.button
                      key={p.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { onAddProfile(p.id); setShowAddPicker(false); }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 text-left transition-colors"
                    >
                      <ProfileAvatar profile={p} size="sm" />
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Icon className="w-3 h-3" />{TYPE_LABEL[p.userType]} · {p.ageRange}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              <Button variant="outline" className="h-11 rounded-xl" onClick={() => setShowAddPicker(false)}>Cancel</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Manage Profiles Screen ────────────────────────────────────────────────────

function ManageProfilesScreen({
  profiles,
  activeId,
  pendingDeleteId,
  onSwitch,
  onDeleteRequest,
  onAdd,
}: {
  profiles: StoredProfile[];
  activeId: string | null;
  pendingDeleteId: string | null;
  onSwitch: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onAdd: () => void;
}) {
  const visible = profiles.filter((p) => p.id !== pendingDeleteId);
  return (
    <div className="flex flex-col gap-4">
      {visible.length > 0 && (
        <SettingsCard>
          {visible.map((p, i) => {
            const Icon = TYPE_ICON[p.userType];
            const isActive = p.id === activeId;
            return (
              <div key={p.id}>
                <div className={cn("flex items-center gap-3 px-4 py-3.5 transition-colors", !isActive && "cursor-pointer hover:bg-muted/20")}
                  onClick={() => { if (!isActive) onSwitch(p.id); }}>
                  <ProfileAvatar profile={p} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                      {isActive && <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full shrink-0">Active</span>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Icon className="w-3 h-3" />{TYPE_LABEL[p.userType]} · {p.ageRange}
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onDeleteRequest(p.id); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
                {i < visible.length - 1 && <div className="h-px bg-border mx-4" />}
              </div>
            );
          })}
        </SettingsCard>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:bg-muted/20 hover:border-primary/30 hover:text-foreground transition-all"
      >
        <Plus className="w-4 h-4" /> Add New Profile
      </motion.button>
    </div>
  );
}

// ── Privacy Screen ────────────────────────────────────────────────────────────

function PrivacyScreen() {
  const items = [
    { icon: "🔒", title: "Stored locally", body: "All information is stored on this device only. Nothing is uploaded to any server." },
    { icon: "🚫", title: "No account required", body: "You don't need to create an account or provide any personal information to use Patch." },
    { icon: "📤", title: "User-controlled sharing", body: "Your information is only shared if you choose to export it. No data is shared automatically." },
  ];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Patch is designed with your family's privacy in mind. Here's how your data is handled.
      </p>
      <div className="flex flex-col gap-3">
        {items.map(({ icon, title, body }) => (
          <SettingsCard key={title}>
            <div className="flex items-start gap-3.5 px-4 py-4">
              <span className="text-2xl leading-none mt-0.5">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{body}</p>
              </div>
            </div>
          </SettingsCard>
        ))}
      </div>
      <p className="text-xs text-center text-muted-foreground/60 leading-relaxed px-2">
        This information is for Phase 1 of the app. Future versions may introduce optional cloud sync with explicit consent.
      </p>
    </div>
  );
}

// ── About Screen ─────────────────────────────────────────────────────────────

function AboutScreen() {
  return (
    <div className="flex flex-col gap-4">
      <SettingsCard>
        <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
          <span className="text-5xl">🩹</span>
          <p className="text-xl font-bold text-foreground">Patch</p>
          <p className="text-sm text-muted-foreground">Version 1.0 (Phase 1 MVP)</p>
        </div>
      </SettingsCard>

      <SettingsCard>
        <div className="px-4 py-4 flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">About</p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            Created as a capstone project to help children and families monitor skin health over time. Patch lets you track skin concerns by tapping body zones, logging symptoms, and reviewing history — all without needing an account.
          </p>
        </div>
      </SettingsCard>

      <SettingsCard>
        <div className="px-4 py-4">
          <p className="text-sm font-semibold text-foreground mb-2">Credits</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Designed and built with care for families managing skin conditions. Icons by Lucide. UI framework by shadcn/ui and Tailwind CSS.
          </p>
        </div>
      </SettingsCard>

      <p className="text-[11px] text-center text-muted-foreground/60 px-4 leading-relaxed">
        Patch is for informational purposes only and does not replace professional medical advice. Always consult a qualified healthcare provider.
      </p>
    </div>
  );
}

// ── Settings (orchestrator) ───────────────────────────────────────────────────

interface SettingsProps {
  onClose: () => void;
  onSwitchProfile: (id: string) => void;
}

export default function Settings({ onClose, onSwitchProfile }: SettingsProps) {
  const {
    profiles, families, activeProfile,
    updateProfile, removeProfile,
    addFamily, renameFamily, deleteFamily,
    addProfileToFamily, removeProfileFromFamily,
    setPendingLastDelete, switchProfile,
  } = useProfile();
  const { deleteReportsForProfile } = useCheckIn();

  const [screen, setScreen] = useState<SettingsScreen>("main");
  const [screenDir, setScreenDir] = useState(1);
  const [detailFamilyId, setDetailFamilyId] = useState<string | null>(null);
  const [showCreateFamily, setShowCreateFamily] = useState(false);
  const [deleteConfirmProfile, setDeleteConfirmProfile] = useState<StoredProfile | null>(null);
  const [pendingDeleteProfile, setPendingDeleteProfile] = useState<StoredProfile | null>(null);
  const pendingDeleteRef = useRef<string | null>(null);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [batchDeleteConfirmIds, setBatchDeleteConfirmIds] = useState<string[] | null>(null);

  const push = (s: SettingsScreen) => { setScreenDir(1); setScreen(s); };
  const pop = () => { setScreenDir(-1); setScreen("main"); };

  const handleEditProfile = (id: string) => {
    setEditingProfileId(id);
    push("edit-profile");
  };

  const handleUpdateProfile = (patch: Partial<Pick<StoredProfile, "name" | "ageRange" | "userType">>) => {
    if (!editingProfileId) return;
    updateProfile(editingProfileId, patch);
    pop();
  };

  const handleDeleteRequest = (profile: StoredProfile) => {
    setDeleteConfirmProfile(profile);
  };

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteConfirmProfile) return;
    const profileToDelete = deleteConfirmProfile;
    setDeleteConfirmProfile(null);

    const remaining = profiles.filter((p) => p.id !== profileToDelete.id);

    if (remaining.length === 0) {
      // Last profile — mark as pending so App-level toast + Onboarding show with undo
      setPendingLastDelete([profileToDelete.id]);
      onClose();
      return;
    }

    pendingDeleteRef.current = profileToDelete.id;
    setPendingDeleteProfile(profileToDelete);
    if (profileToDelete.id === activeProfile?.id) {
      const other = remaining[0];
      if (other) switchProfile(other.id);
    }
  }, [deleteConfirmProfile, activeProfile, profiles, switchProfile, setPendingLastDelete, onClose]);

  const handleUndo = useCallback(() => {
    pendingDeleteRef.current = null;
    setPendingDeleteProfile(null);
  }, []);

  const handleDeleteExpire = useCallback(() => {
    const id = pendingDeleteRef.current;
    if (id) {
      removeProfile(id);
      deleteReportsForProfile(id);
    }
    pendingDeleteRef.current = null;
    setPendingDeleteProfile(null);
  }, [removeProfile, deleteReportsForProfile]);

  const handleBatchDeleteRequest = useCallback((ids: string[]) => {
    setBatchDeleteConfirmIds(ids);
  }, []);

  const handleBatchDeleteConfirm = useCallback(() => {
    if (!batchDeleteConfirmIds || batchDeleteConfirmIds.length === 0) return;
    const ids = batchDeleteConfirmIds;
    setBatchDeleteConfirmIds(null);

    const remaining = profiles.filter((p) => !ids.includes(p.id));
    if (remaining.length === 0) {
      // All profiles deleted — show App-level Onboarding + undo toast
      setPendingLastDelete(ids);
      onClose();
      return;
    }
    // Some profiles remain — delete immediately (confirmation dialog was the guard)
    ids.forEach((id) => {
      removeProfile(id);
      deleteReportsForProfile(id);
    });
    // Switch active if it was deleted
    if (activeProfile && ids.includes(activeProfile.id)) {
      onSwitchProfile(remaining[0].id);
    }
  }, [batchDeleteConfirmIds, profiles, activeProfile, setPendingLastDelete, removeProfile, deleteReportsForProfile, onSwitchProfile, onClose]);

  const handleCreateFamily = (name: string) => {
    addFamily(name);
    setShowCreateFamily(false);
  };

  const detailFamily = detailFamilyId ? families.find((f) => f.id === detailFamilyId) : null;

  const editingProfile = editingProfileId ? profiles.find((p) => p.id === editingProfileId) ?? null : null;

  const screenTitle: Record<SettingsScreen, string> = {
    main: "Settings",
    "edit-profile": "Edit Profile",
    families: "Families",
    "family-detail": detailFamily?.name ?? "Family",
    privacy: "Privacy",
    about: "About",
  };

  if (showAddProfile) {
    return (
      <div className="fixed inset-0 z-[200] bg-background">
        <Onboarding
          skipWelcome
          onCancel={() => setShowAddProfile(false)}
          onDone={() => setShowAddProfile(false)}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
      className="fixed inset-0 z-[100] bg-background/85 backdrop-blur-md flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-background/95 backdrop-blur-sm border-b border-border/50 shrink-0">
        {screen === "main" ? (
          <div className="w-8" />
        ) : (
          <motion.button whileTap={{ scale: 0.9 }} onClick={pop} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
        )}
        <p className="text-base font-bold text-foreground">{screenTitle[screen]}</p>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" custom={screenDir}>
          <motion.div
            key={screen + (detailFamilyId ?? "")}
            custom={screenDir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="px-4 py-5 pb-24"
          >
            {screen === "main" && (
              <MainScreen
                activeProfile={activeProfile}
                profiles={profiles.filter((p) => p.id !== pendingDeleteProfile?.id)}
                families={families}
                onNav={(s) => push(s)}
                onEditProfile={handleEditProfile}
                onDeleteRequest={(id) => {
                  const p = profiles.find((x) => x.id === id);
                  if (p) handleDeleteRequest(p);
                }}
                onBatchDeleteRequest={handleBatchDeleteRequest}
                onAdd={() => setShowAddProfile(true)}
                onSwitchProfile={onSwitchProfile}
              />
            )}
            {screen === "edit-profile" && editingProfile && (
              <EditProfileScreen profile={editingProfile} onSave={handleUpdateProfile} />
            )}
            {screen === "families" && (
              <FamiliesScreen
                families={families}
                profiles={profiles}
                onSelectFamily={(id) => { setDetailFamilyId(id); push("family-detail"); }}
                onCreate={() => setShowCreateFamily(true)}
              />
            )}
            {screen === "family-detail" && detailFamily && (
              <FamilyDetailScreen
                family={detailFamily}
                profiles={profiles}
                onRename={(name) => renameFamily(detailFamily.id, name)}
                onDelete={() => { deleteFamily(detailFamily.id); setDetailFamilyId(null); pop(); }}
                onAddProfile={(profileId) => addProfileToFamily(profileId, detailFamily.id)}
                onRemoveProfile={(profileId) => removeProfileFromFamily(profileId)}
              />
            )}
            {screen === "privacy" && <PrivacyScreen />}
            {screen === "about" && <AboutScreen />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Single delete confirmation */}
      <AnimatePresence>
        {deleteConfirmProfile && (
          <DeleteConfirmDialog
            profile={deleteConfirmProfile}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteConfirmProfile(null)}
          />
        )}
      </AnimatePresence>

      {/* Batch delete confirmation */}
      <AnimatePresence>
        {batchDeleteConfirmIds && batchDeleteConfirmIds.length > 0 && (
          <BatchDeleteConfirmDialog
            count={batchDeleteConfirmIds.length}
            onConfirm={handleBatchDeleteConfirm}
            onCancel={() => setBatchDeleteConfirmIds(null)}
          />
        )}
      </AnimatePresence>

      {/* Create family sheet */}
      <AnimatePresence>
        {showCreateFamily && (
          <CreateFamilySheet
            onConfirm={handleCreateFamily}
            onCancel={() => setShowCreateFamily(false)}
          />
        )}
      </AnimatePresence>

      {/* Undo toast */}
      <AnimatePresence>
        {pendingDeleteProfile && (
          <UndoToast
            profile={pendingDeleteProfile}
            onUndo={handleUndo}
            onExpire={handleDeleteExpire}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
