import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, type ChildProfile } from "@/context/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User, Plus, Lock, ChevronRight, Trash2, LogOut,
  Baby, Users, AlertCircle, Check
} from "lucide-react";
import { cn } from "@/lib/utils";

const CONGENITAL_CONDITIONS = [
  "Atopic Dermatitis",
  "Psoriasis",
  "Ichthyosis",
  "Epidermolysis Bullosa",
  "Port-Wine Stain",
  "Hemangioma",
  "Nevus (Mole / Birthmark)",
  "Sebaceous Nevus",
  "Keratosis Pilaris",
  "Albinism",
  "Vitiligo (Congenital)",
  "Mastocytosis",
  "Other",
];

const AGE_RANGES = ["5-7", "8-12", "13-17"] as const;
type AgeRange = typeof AGE_RANGES[number];

function ageRangeLabel(range: AgeRange): string {
  const labels: Record<AgeRange, string> = {
    "5-7": "Young Child (5–7)",
    "8-12": "Pre-teen (8–12)",
    "13-17": "Teenager (13–17)",
  };
  return labels[range];
}

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function avatarColor(name: string): string {
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700",
    "bg-green-100 text-green-700",
    "bg-violet-100 text-violet-700",
    "bg-teal-100 text-teal-700",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export default function ProfileSelect() {
  const { user, logout } = useAuth();
  const { setActiveProfile } = useProfile();
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  const [unlockTarget, setUnlockTarget] = useState<ChildProfile | null>(null);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlockLoading, setUnlockLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createConfirm, setCreateConfirm] = useState("");
  const [createAgeRange, setCreateAgeRange] = useState<AgeRange | "">("");
  const [createConditions, setCreateConditions] = useState<string[]>([]);
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ChildProfile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetch("/api/profiles", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setProfiles(d.profiles ?? []))
      .catch(() => setProfiles([]))
      .finally(() => setLoadingProfiles(false));
  }, []);

  const handleSelectParent = () => {
    if (user) setActiveProfile({ type: "parent", user });
  };

  const handleUnlock = async () => {
    if (!unlockTarget || !unlockPassword) return;
    setUnlockLoading(true);
    setUnlockError("");
    try {
      const res = await fetch(`/api/profiles/${unlockTarget.id}/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: unlockPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUnlockError(data.error ?? "Incorrect password");
        return;
      }
      setActiveProfile({ type: "child", profile: data.profile });
      setUnlockTarget(null);
      setUnlockPassword("");
    } catch {
      setUnlockError("Something went wrong. Please try again.");
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreateError("");
    if (!createName.trim()) { setCreateError("Name is required"); return; }
    if (!createAgeRange) { setCreateError("Age range is required"); return; }
    if (createPassword.length < 4) { setCreateError("Password must be at least 4 characters"); return; }
    if (createPassword !== createConfirm) { setCreateError("Passwords don't match"); return; }
    setCreateLoading(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          password: createPassword,
          ageRange: createAgeRange,
          congenitalConditions: createConditions,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error ?? "Failed to create profile"); return; }
      setProfiles((prev) => [...prev, data.profile]);
      setShowCreate(false);
      setCreateName(""); setCreatePassword(""); setCreateConfirm("");
      setCreateAgeRange(""); setCreateConditions([]); setCreateError("");
    } catch {
      setCreateError("Something went wrong. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/profiles/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setProfiles((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch {
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleCondition = (c: string) => {
    setCreateConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : user?.email ?? "Parent";

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-start pt-12 pb-24 px-4 bg-background">
      <div className="w-full max-w-sm">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Who's using SkinCheck?</h1>
          <p className="text-muted-foreground text-sm mt-1">Select a profile to continue</p>
        </motion.div>

        <div className="space-y-3">
          {/* Parent profile */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={handleSelectParent} className="w-full group">
              <Card className="p-4 rounded-2xl bg-white border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt={displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{displayName}</div>
                    <div className="text-xs text-muted-foreground">Parent account</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Card>
            </button>
          </motion.div>

          {/* Child profiles */}
          {!loadingProfiles && profiles.map((profile, i) => (
            <motion.div key={profile.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * (i + 1) }}>
              <div className="relative group">
                <button
                  onClick={() => { setUnlockTarget(profile); setUnlockPassword(""); setUnlockError(""); }}
                  className="w-full"
                >
                  <Card className="p-4 rounded-2xl bg-white border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold text-sm", avatarColor(profile.name))}>
                        {initials(profile.name)}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{profile.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {ageRangeLabel(profile.ageRange as AgeRange)}
                          {profile.congenitalConditions.length > 0 && (
                            <span className="ml-2 text-primary">{profile.congenitalConditions.length} condition{profile.congenitalConditions.length > 1 ? "s" : ""} noted</span>
                          )}
                        </div>
                      </div>
                      <Lock className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Card>
                </button>
                <button
                  onClick={() => setDeleteTarget(profile)}
                  className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                  title="Delete profile"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}

          {loadingProfiles && (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Add child profile */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <button onClick={() => { setShowCreate(true); setCreateError(""); }} className="w-full group">
              <Card className="p-4 rounded-2xl bg-muted/30 border-dashed border-border hover:border-primary/40 hover:bg-muted/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">Add child profile</div>
                    <div className="text-xs text-muted-foreground/70">Set name, age range, and medical history</div>
                  </div>
                </div>
              </Card>
            </button>
          </motion.div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </div>

      {/* Unlock Dialog */}
      <Dialog open={!!unlockTarget} onOpenChange={(open) => { if (!open) setUnlockTarget(null); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {unlockTarget && (
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0", avatarColor(unlockTarget.name))}>
                  {initials(unlockTarget.name)}
                </div>
              )}
              {unlockTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Enter child's password"
                value={unlockPassword}
                onChange={(e) => { setUnlockPassword(e.target.value); setUnlockError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
                className="rounded-xl"
                autoFocus
              />
              {unlockError && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {unlockError}
                </div>
              )}
            </div>
            <Button
              className="w-full rounded-xl"
              onClick={handleUnlock}
              disabled={!unlockPassword || unlockLoading}
            >
              {unlockLoading ? "Verifying..." : "Continue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Child Profile Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); setCreateError(""); } }}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Baby className="w-5 h-5 text-primary" /> New Child Profile
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Child's name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Emma"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="rounded-xl"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>Age range <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                {AGE_RANGES.map((range) => (
                  <button
                    key={range}
                    onClick={() => setCreateAgeRange(range)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-sm font-medium border transition-all",
                      createAgeRange === range
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border bg-white text-muted-foreground hover:bg-muted/30"
                    )}
                  >
                    {range}
                  </button>
                ))}
              </div>
              {createAgeRange && (
                <p className="text-[11px] text-muted-foreground">{ageRangeLabel(createAgeRange)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Password <span className="text-destructive">*</span></Label>
              <Input
                type="password"
                placeholder="At least 4 characters"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Confirm password <span className="text-destructive">*</span></Label>
              <Input
                type="password"
                placeholder="Re-enter password"
                value={createConfirm}
                onChange={(e) => setCreateConfirm(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                Congenital / inherited skin conditions
                <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Select conditions this child was born with. These will be noted in their assessments.
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {CONGENITAL_CONDITIONS.map((cond) => {
                  const selected = createConditions.includes(cond);
                  return (
                    <button
                      key={cond}
                      onClick={() => toggleCondition(cond)}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-all",
                        selected
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "border-border bg-white text-muted-foreground hover:bg-muted/30"
                      )}
                    >
                      {selected && <Check className="w-3 h-3" />}
                      {cond}
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence>
              {createError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-1.5 text-xs text-destructive"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {createError}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              className="w-full rounded-xl"
              onClick={handleCreate}
              disabled={createLoading}
            >
              {createLoading ? "Creating..." : "Create Profile"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete profile?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete <strong>{deleteTarget?.name}'s</strong> profile. This action cannot be undone.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
