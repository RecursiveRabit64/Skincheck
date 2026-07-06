import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartPulse, Baby, GraduationCap, User, ChevronRight, ArrowLeft, Shield, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useProfile, type UserType, type AgeRange, type StoredProfile } from "@/context/ProfileContext";

interface OnboardingProps {
  skipWelcome?: boolean;
  onCancel?: () => void;
  onDone?: (profile: StoredProfile) => void;
}

type Step = 0 | 1;

const PROFILE_TYPES: {
  type: UserType;
  icon: React.ElementType;
  label: string;
  sub: string;
  ages: { label: string; value: AgeRange }[];
}[] = [
  {
    type: "child",
    icon: Baby,
    label: "Child",
    sub: "Ages 5–12",
    ages: [
      { label: "5–7", value: "5-7" },
      { label: "8–12", value: "8-12" },
    ],
  },
  {
    type: "teen",
    icon: GraduationCap,
    label: "Teen",
    sub: "Ages 13–17",
    ages: [{ label: "13–17", value: "13-17" }],
  },
  {
    type: "parent",
    icon: User,
    label: "Parent",
    sub: "Ages 18+",
    ages: [
      { label: "18–35", value: "18-35" },
      { label: "35–55", value: "35-55" },
      { label: "55+", value: "55+" },
    ],
  },
];

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 32 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -32 }),
};

const DEFAULT_NAME: Record<UserType, string> = {
  child: "Child",
  teen: "Teen",
  parent: "Parent",
};

export default function Onboarding({ skipWelcome, onCancel, onDone }: OnboardingProps) {
  const { addProfile } = useProfile();
  const [step, setStep] = useState<Step>(skipWelcome ? 1 : 0);
  const [dir, setDir] = useState(1);

  const [userType, setUserType] = useState<UserType | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);

  const go = (next: Step) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const selectedTypeDef = PROFILE_TYPES.find((t) => t.type === userType);

  const handleSelectType = (type: UserType) => {
    if (type === userType) return;
    setUserType(type);
    const newTypeDef = PROFILE_TYPES.find((t) => t.type === type)!;
    const validValues = newTypeDef.ages.map((a) => a.value);
    if (ageRange && !validValues.includes(ageRange)) {
      setAgeRange(null);
    }
  };

  const canCreate = userType !== null && nameInput.trim().length > 0 && ageRange !== null;

  const handleCreate = () => {
    if (!canCreate || !userType || !ageRange) return;
    const name = nameInput.trim() || DEFAULT_NAME[userType];
    const profile = addProfile({ name, userType, ageRange });
    onDone?.(profile);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 bg-background overflow-hidden">
      <div className="w-full max-w-sm flex flex-col gap-6 relative">
        <AnimatePresence mode="wait" custom={dir}>
          {step === 0 && (
            <motion.div
              key="welcome"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="flex flex-col items-center gap-8 text-center"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
                  <span className="text-5xl leading-none">🩹</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Patch</h1>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                  Track skin concerns for the whole family. Tap body zones, record what you notice, and bring it to your doctor.
                </p>
              </div>

              <div className="w-full flex flex-col gap-2.5 bg-muted/40 rounded-2xl p-4 text-sm text-muted-foreground text-left">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-primary shrink-0" />
                  <span>Interactive body map for marking skin concerns</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-primary shrink-0" />
                  <span>Age-appropriate conditions and interface</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <HeartPulse className="w-4 h-4 text-primary shrink-0" />
                  <span>Designed for ages 5 through adult</span>
                </div>
              </div>

              <Button className="w-full h-14 rounded-2xl text-base font-semibold shadow-md" onClick={() => go(1)}>
                Get Started <ChevronRight className="w-5 h-5 ml-1" />
              </Button>

              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                Patch is for informational purposes only and does not replace professional medical advice.
              </p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="create"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="flex flex-col gap-6"
            >
              <button
                onClick={() => (skipWelcome ? onCancel?.() : go(0))}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                <ArrowLeft className="w-4 h-4" /> {skipWelcome ? "Cancel" : "Back"}
              </button>

              <div>
                <h2 className="text-2xl font-bold">Create Profile</h2>
                <p className="text-muted-foreground text-sm mt-1">Who is this profile for?</p>
              </div>

              {/* Profile type selector */}
              <div className="grid grid-cols-3 gap-2">
                {PROFILE_TYPES.map(({ type, icon: Icon, label, sub }) => {
                  const selected = userType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => handleSelectType(type)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-2xl border-2 text-center transition-all active:scale-[0.97]",
                        selected
                          ? "border-primary bg-primary/8 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                        selected ? "bg-primary/15" : "bg-muted"
                      )}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-xs font-semibold leading-tight">{label}</span>
                      <span className={cn("text-[10px] leading-tight", selected ? "text-primary/70" : "text-muted-foreground/60")}>{sub}</span>
                    </button>
                  );
                })}
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input
                  placeholder={
                    userType === "child" ? "Child's name" :
                    userType === "teen"  ? "Teen's name" :
                    userType === "parent" ? "Your name" :
                    "Enter a name"
                  }
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="rounded-xl h-12 text-base"
                  maxLength={32}
                />
                <p className="text-[11px] text-muted-foreground/70 leading-snug">
                  You can change the name later in settings.
                </p>
              </div>

              {/* Age range — only shown once a type is selected */}
              <AnimatePresence mode="wait">
                {selectedTypeDef && (
                  <motion.div
                    key={selectedTypeDef.type}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="flex flex-col gap-2"
                  >
                    <label className="text-sm font-medium text-foreground">Age Range</label>
                    <div className={cn("grid gap-2", selectedTypeDef.ages.length <= 2 ? "grid-cols-2" : "grid-cols-3")}>
                      {selectedTypeDef.ages.map(({ label, value }) => {
                        const selected = ageRange === value;
                        return (
                          <button
                            key={value}
                            onClick={() => setAgeRange(value)}
                            className={cn(
                              "py-3 px-2 rounded-xl border-2 text-sm font-semibold text-center transition-all active:scale-[0.97]",
                              selected
                                ? "border-primary bg-primary/8 text-primary"
                                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Create button */}
              <motion.div whileTap={canCreate ? { scale: 0.97 } : {}}>
                <Button
                  className={cn(
                    "w-full h-14 rounded-2xl text-base font-bold transition-all",
                    canCreate ? "shadow-md" : "opacity-40 cursor-not-allowed"
                  )}
                  onClick={handleCreate}
                  disabled={!canCreate}
                >
                  Create Profile
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
