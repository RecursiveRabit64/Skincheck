import { useState, useRef } from "react";
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

type Step = 0 | 1 | 2;

const USER_TYPES: {
  type: UserType;
  icon: React.ElementType;
  label: string;
  sub: string;
  color: string;
  ages: { label: string; value: AgeRange }[];
}[] = [
  {
    type: "child",
    icon: Baby,
    label: "Child",
    sub: "Ages 5–12",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    ages: [
      { label: "5–7 years old", value: "5-7" },
      { label: "8–12 years old", value: "8-12" },
    ],
  },
  {
    type: "teen",
    icon: GraduationCap,
    label: "Teen",
    sub: "Ages 13–17",
    color: "bg-purple-50 border-purple-200 text-purple-700",
    ages: [{ label: "13–17 years old", value: "13-17" }],
  },
  {
    type: "parent",
    icon: User,
    label: "Parent / Adult",
    sub: "Ages 18+",
    color: "bg-green-50 border-green-200 text-green-700",
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

const NAME_PLACEHOLDER: Record<UserType, string> = {
  child: "Child's name (optional)",
  teen: "Teen's name (optional)",
  parent: "Your name (optional)",
};

export default function Onboarding({ skipWelcome, onCancel, onDone }: OnboardingProps) {
  const { addProfile } = useProfile();
  const [step, setStep] = useState<Step>(skipWelcome ? 1 : 0);
  const [dir, setDir] = useState(1);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [nameInput, setNameInput] = useState("");
  const nameRef = useRef(nameInput);
  nameRef.current = nameInput;

  const go = (next: Step) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const selectedType = USER_TYPES.find((t) => t.type === userType);

  const handleSelectType = (type: UserType) => {
    setUserType(type);
    go(2);
  };

  const handleComplete = (ageRange: AgeRange) => {
    if (!userType) return;
    const name = nameRef.current.trim() || DEFAULT_NAME[userType];
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
                  <HeartPulse className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">SkinCheck</h1>
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
                SkinCheck is for informational purposes only and does not replace professional medical advice.
              </p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="who"
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

              <div className="text-center">
                <h2 className="text-2xl font-bold">Who's this profile for?</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  We'll tailor the experience to the right age group.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {USER_TYPES.map(({ type, icon: Icon, label, sub, color }) => (
                  <button
                    key={type}
                    onClick={() => handleSelectType(type)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:shadow-sm active:scale-[0.98]",
                      color
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-base">{label}</p>
                      <p className="text-sm opacity-75">{sub}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 ml-auto opacity-50" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && selectedType && (
            <motion.div
              key="age-name"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="flex flex-col gap-6"
            >
              <button
                onClick={() => go(1)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="text-center">
                <h2 className="text-2xl font-bold">Almost done!</h2>
                <p className="text-muted-foreground text-sm mt-1">Give this profile a name and choose an age range.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Profile name</label>
                <Input
                  placeholder={NAME_PLACEHOLDER[selectedType.type]}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="rounded-xl h-12 text-base"
                  autoFocus
                  maxLength={32}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Age range</label>
                <div className="flex flex-col gap-3">
                  {selectedType.ages.map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => handleComplete(value)}
                      className={cn(
                        "flex items-center justify-between p-5 rounded-2xl border-2 text-left font-semibold text-lg transition-all hover:shadow-sm active:scale-[0.98]",
                        selectedType.color
                      )}
                    >
                      {label}
                      <ChevronRight className="w-5 h-5 opacity-50" />
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                You can update the name and age range anytime from settings.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
