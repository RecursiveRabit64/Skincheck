import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Baby, GraduationCap, UserPlus, CalendarDays, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BodyDoll, type ZoneData, type SkinCondition, frontZonesDef, backZonesDef } from "@/components/BodyDoll";
import { useProfile, type StoredProfile } from "@/context/ProfileContext";
import { useCheckIn, type CheckInReport } from "@/context/CheckInContext";
import { cn } from "@/lib/utils";
import Onboarding from "@/pages/Onboarding";

interface ParentDashboardProps {
  onClose: () => void;
}

const PROFILE_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
];

function getProfileColor(index: number) {
  return PROFILE_COLORS[index % PROFILE_COLORS.length];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yestStr = yesterday.toISOString().slice(0, 10);

  if (dateStr === todayStr) return "Today";
  if (dateStr === yestStr) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysAgo(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  return `${diff} days ago`;
}

function reportToZoneMap(report: CheckInReport): Map<string, ZoneData> {
  const m = new Map<string, ZoneData>();
  for (const [k, v] of Object.entries(report.zones)) {
    m.set(k, { condition: v.condition as SkinCondition, severity: v.severity, medication: v.medication });
  }
  return m;
}

function getConditionSummary(report: CheckInReport): string[] {
  const condMap: Record<string, string[]> = {};
  const allZones = [...frontZonesDef, ...backZonesDef];
  const zoneLabel = Object.fromEntries(allZones.map((z) => [z.id, z.label]));

  for (const [zoneId, entry] of Object.entries(report.zones)) {
    const cond = entry.condition;
    if (!condMap[cond]) condMap[cond] = [];
    condMap[cond].push(zoneLabel[zoneId] ?? zoneId);
  }

  return Object.entries(condMap).map(([cond, zones]) => {
    const zoneStr = zones.length <= 2 ? zones.join(", ") : `${zones.slice(0, 2).join(", ")} +${zones.length - 2}`;
    return `${cond} · ${zoneStr}`;
  });
}

function maxSeverity(report: CheckInReport): number {
  return Math.max(0, ...Object.values(report.zones).map((z) => z.severity));
}

function severityColor(sev: number): string {
  if (sev >= 7) return "bg-red-400";
  if (sev >= 4) return "bg-orange-400";
  return "bg-yellow-400";
}

// ── Child Card ────────────────────────────────────────────────────────────────

function ChildCard({ profile, reports, colorClass, onSwitchToCheckin }: {
  profile: StoredProfile;
  reports: CheckInReport[];
  colorClass: string;
  onSwitchToCheckin: () => void;
}) {
  const { switchProfile } = useProfile();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dollView, setDollView] = useState<"front" | "back">("front");

  const sorted = useMemo(
    () => [...reports].sort((a, b) => b.date.localeCompare(a.date)),
    [reports]
  );

  const selected = sorted[selectedIdx] ?? null;
  const zoneMap = useMemo(() => (selected ? reportToZoneMap(selected) : new Map()), [selected]);
  const conditionSummary = useMemo(() => (selected ? getConditionSummary(selected) : []), [selected]);
  const initials = profile.name.slice(0, 2).toUpperCase();

  const handleCheckin = () => {
    switchProfile(profile.id);
    onSwitchToCheckin();
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0", colorClass)}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{profile.name}</span>
            <span className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0",
              profile.userType === "child" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
            )}>
              {profile.userType === "child" ? <Baby className="inline w-3 h-3 mr-0.5" /> : <GraduationCap className="inline w-3 h-3 mr-0.5" />}
              {profile.ageRange}
            </span>
          </div>
          {sorted.length > 0 ? (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Last check-in {daysAgo(sorted[0].date)}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground mt-0.5">No check-ins yet</p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl text-xs h-7 px-2.5 shrink-0"
          onClick={handleCheckin}
        >
          Check-in
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="px-4 pb-4 flex flex-col items-center gap-2 py-4 text-center bg-muted/20 mx-4 mb-4 rounded-xl">
          <AlertCircle className="w-6 h-6 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">No check-ins recorded yet.</p>
          <Button size="sm" className="rounded-xl text-xs h-8 mt-1" onClick={handleCheckin}>
            Start First Check-in
          </Button>
        </div>
      ) : (
        <>
          {/* Date timeline */}
          <div className="px-4 pb-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {sorted.map((r, i) => {
                const sev = maxSeverity(r);
                const isSelected = i === selectedIdx;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedIdx(i)}
                    className={cn(
                      "flex-shrink-0 flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all",
                      isSelected
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    <div className={cn("w-2 h-2 rounded-full", sev > 0 ? severityColor(sev) : "bg-muted-foreground/30")} />
                    <span className="text-[10px] font-medium leading-none">{formatDate(r.date)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation arrows + date label */}
          {selected && (
            <div className="flex items-center justify-between px-4 py-1">
              <button
                onClick={() => setSelectedIdx((i) => Math.min(sorted.length - 1, i + 1))}
                disabled={selectedIdx === sorted.length - 1}
                className="p-1 rounded-full text-muted-foreground disabled:opacity-30 hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="font-medium">
                  {new Date(selected.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}
                </span>
                <span>· {Object.keys(selected.zones).length} area{Object.keys(selected.zones).length !== 1 ? "s" : ""}</span>
              </div>
              <button
                onClick={() => setSelectedIdx((i) => Math.max(0, i - 1))}
                disabled={selectedIdx === 0}
                className="p-1 rounded-full text-muted-foreground disabled:opacity-30 hover:text-foreground transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mini doll + conditions */}
          {selected && (
            <div className="flex gap-3 px-4 pb-4 pt-1">
              {/* Mini doll with front/back toggle */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="w-[80px]">
                  <BodyDoll zones={zoneMap} view={dollView} readonly />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setDollView("front")}
                    className={cn("text-[9px] px-1.5 py-0.5 rounded-md border transition-all", dollView === "front" ? "bg-primary/10 border-primary/20 text-primary" : "border-border text-muted-foreground")}
                  >
                    Front
                  </button>
                  <button
                    onClick={() => setDollView("back")}
                    className={cn("text-[9px] px-1.5 py-0.5 rounded-md border transition-all", dollView === "back" ? "bg-primary/10 border-primary/20 text-primary" : "border-border text-muted-foreground")}
                  >
                    Back
                  </button>
                </div>
              </div>

              {/* Conditions list */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Conditions noted</p>
                {conditionSummary.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No zones marked</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {conditionSummary.map((line, i) => {
                      const [cond, rest] = line.split(" · ");
                      return (
                        <div key={i} className="flex flex-col">
                          <span className="text-xs font-medium text-foreground leading-tight">{cond}</span>
                          <span className="text-[10px] text-muted-foreground leading-tight">{rest}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Parent Dashboard ──────────────────────────────────────────────────────────

export default function ParentDashboard({ onClose }: ParentDashboardProps) {
  const { profiles } = useProfile();
  const { getReportsForProfile } = useCheckIn();
  const [showAddProfile, setShowAddProfile] = useState(false);

  const childProfiles = profiles.filter((p) => p.userType !== "parent");

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
    <motion.div
      className="fixed inset-0 z-40 bg-background flex flex-col"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-border bg-white">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Family Monitor</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {childProfiles.length} {childProfiles.length === 1 ? "profile" : "profiles"} being tracked
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {childProfiles.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Baby className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div>
              <p className="font-semibold text-base">No children added yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add a child or teen profile to start tracking their check-ins.</p>
            </div>
            <Button className="rounded-xl" onClick={() => setShowAddProfile(true)}>
              <UserPlus className="w-4 h-4 mr-2" /> Add First Profile
            </Button>
          </div>
        ) : (
          <>
            {childProfiles.map((profile, i) => (
              <ChildCard
                key={profile.id}
                profile={profile}
                reports={getReportsForProfile(profile.id)}
                colorClass={getProfileColor(i)}
                onSwitchToCheckin={onClose}
              />
            ))}

            <button
              onClick={() => setShowAddProfile(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-muted/20 hover:text-foreground transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Add Another Profile
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
