import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Baby, User, Check, ChevronRight, HeartPulse, Shield, Activity, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useProfile, type UserType, type AgeRange, type StoredProfile, type SkinBackground } from "@/context/ProfileContext";

// ── Age groups ─────────────────────────────────────────────────────────────────

const AGE_GROUPS: { label: string; ages: { label: string; value: AgeRange; userType: UserType }[] }[] = [
  {
    label: "Child",
    ages: [
      { label: "1–5",   value: "1-5",   userType: "child" },
      { label: "6–9",   value: "6-9",   userType: "child" },
      { label: "10–12", value: "10-12", userType: "child" },
    ],
  },
  {
    label: "Teen",
    ages: [
      { label: "13–15", value: "13-15", userType: "teen" },
      { label: "16–18", value: "16-18", userType: "teen" },
    ],
  },
  {
    label: "Adult",
    ages: [
      { label: "18+", value: "18+", userType: "adult" },
    ],
  },
];

// ── Skin background data ───────────────────────────────────────────────────────

const DIAGNOSED_CONDITIONS = [
  "Eczema (Atopic Dermatitis)",
  "Dry Skin",
  "Acne",
  "Contact Dermatitis",
  "Psoriasis",
  "Rosacea",
  "Hives (Urticaria)",
  "Seborrheic Dermatitis",
  "Keratosis Pilaris (KP)",
  "Ringworm / Tinea",
  "Athlete's Foot",
  "Warts",
];

const ALLERGY_OPTIONS = [
  "Nickel (jewelry, belt buckles)",
  "Fragrances / Perfumes",
  "Latex (rubber gloves)",
  "Preservatives (parabens, formaldehyde)",
  "Fabric dyes",
  "Lanolin (wool alcohol)",
  "Neomycin (antibiotic cream)",
  "Sunscreen chemicals (oxybenzone, etc.)",
  "Balsam of Peru",
];

const CONDITION_TREATMENTS: Record<string, string[]> = {
  "Eczema (Atopic Dermatitis)": [
    "Moisturizer / emollient (fragrance-free)",
    "Hydrocortisone cream (OTC)",
    "Topical corticosteroids (prescription)",
    "Antihistamines (oral)",
    "Tacrolimus / pimecrolimus cream",
  ],
  "Dry Skin": [
    "Moisturizer / emollient (fragrance-free)",
    "Gentle / unscented cleanser",
    "Oat-based cream (colloidal oatmeal)",
  ],
  "Acne": [
    "Benzoyl peroxide wash or cream",
    "Salicylic acid products",
    "Adapalene / retinoids (Differin)",
    "Antibiotic cream or gel",
    "Oral antibiotics (prescription)",
    "Isotretinoin (prescription)",
  ],
  "Contact Dermatitis": [
    "Moisturizer / emollient (fragrance-free)",
    "Hydrocortisone cream (OTC)",
    "Topical corticosteroids (prescription)",
    "Antihistamines (oral)",
    "Calamine lotion",
  ],
  "Psoriasis": [
    "Topical corticosteroids (prescription)",
    "Coal tar preparations",
    "Vitamin D analog creams (calcipotriol)",
    "Biologics (prescription)",
  ],
  "Rosacea": [
    "Sunscreen (SPF 30+)",
    "Metronidazole cream (prescription)",
    "Azelaic acid cream",
    "Brimonidine gel (prescription)",
  ],
  "Hives (Urticaria)": [
    "Antihistamines (oral)",
    "Oral corticosteroids (short-term)",
    "Epinephrine auto-injector (severe reactions)",
  ],
  "Seborrheic Dermatitis": [
    "Antifungal shampoo (ketoconazole 2%)",
    "Selenium sulfide shampoo",
    "Zinc pyrithione shampoo",
    "Hydrocortisone cream (OTC)",
  ],
  "Keratosis Pilaris (KP)": [
    "Moisturizer / emollient",
    "Lactic acid lotion",
    "Urea cream (10–40%)",
    "Exfoliating body wash",
  ],
  "Ringworm / Tinea": [
    "Antifungal cream (clotrimazole / miconazole)",
    "Oral antifungal medication (prescription)",
  ],
  "Athlete's Foot": [
    "Antifungal cream or powder (clotrimazole)",
    "Antifungal spray",
    "Oral antifungal (prescription, severe)",
  ],
  "Warts": [
    "Salicylic acid (OTC wart remover)",
    "Cryotherapy by doctor",
    "Duct tape occlusion",
  ],
};

const ALLERGY_TREATMENTS: Record<string, string[]> = {
  "Nickel (jewelry, belt buckles)": ["Barrier cream (before contact)", "Topical corticosteroids (for reactions)"],
  "Fragrances / Perfumes": ["Fragrance-free moisturizer / products", "Antihistamines (oral)"],
  "Latex (rubber gloves)": ["Latex-free gloves and products", "Antihistamines (oral) for reactions"],
  "Preservatives (parabens, formaldehyde)": ["Preservative-free personal care products"],
  "Fabric dyes": ["Dye-free / unscented products"],
  "Lanolin (wool alcohol)": ["Lanolin-free moisturizer"],
  "Neomycin (antibiotic cream)": ["Mupirocin (Bactroban) as alternative antibiotic"],
  "Sunscreen chemicals (oxybenzone, etc.)": ["Mineral sunscreen (zinc oxide / titanium dioxide)"],
  "Balsam of Peru": ["Avoiding fragrances, vanilla, and cinnamon in products / foods"],
};

const DEFAULT_TREATMENTS = [
  "Moisturizer / emollient (fragrance-free)",
  "Sunscreen (SPF 30+)",
  "Gentle / unscented cleanser",
  "Antihistamines (oral)",
  "Hydrocortisone cream (OTC)",
];

function getRelevantTreatments(conditions: string[], allergies: string[]): string[] {
  const set = new Set<string>();
  conditions.forEach((c) => CONDITION_TREATMENTS[c]?.forEach((t) => set.add(t)));
  allergies.forEach((a) => ALLERGY_TREATMENTS[a]?.forEach((t) => set.add(t)));
  if (set.size === 0) DEFAULT_TREATMENTS.forEach((t) => set.add(t));
  return Array.from(set);
}

// ── Small shared components ───────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full transition-all duration-300",
            i < current ? "w-3 h-3 bg-primary" : "w-2 h-2 bg-muted-foreground/25"
          )}
        />
      ))}
    </div>
  );
}

function CheckItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3 rounded-2xl border-2 text-left transition-all active:scale-[0.98]",
        checked
          ? "border-primary bg-primary/5 text-primary"
          : "border-border bg-background text-foreground hover:border-primary/30"
      )}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all",
          checked ? "bg-primary border-primary" : "border-muted-foreground/40"
        )}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className="text-sm font-medium leading-snug">{label}</span>
    </button>
  );
}

const slide = {
  enter: (d: number) => ({ opacity: 0, x: d * 36 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d * -36 }),
};

// ── Main Onboarding component ─────────────────────────────────────────────────

interface OnboardingProps {
  skipWelcome?: boolean;
  onCancel?: () => void;
  onDone?: (profile: StoredProfile) => void;
}

export default function Onboarding({ skipWelcome, onCancel, onDone }: OnboardingProps) {
  const { addProfile } = useProfile();

  const [step, setStep] = useState<number>(skipWelcome ? 1 : 0);
  const [dir, setDir] = useState(1);

  // Profile state
  const [profileFor, setProfileFor] = useState<"child" | "caregiver" | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [selectedAge, setSelectedAge] = useState<{ value: AgeRange; userType: UserType } | null>(null);

  // Skin background state
  const [conditions, setConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [treatments, setTreatments] = useState<string[]>([]);

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const back = () => {
    if (step === 1) { skipWelcome ? onCancel?.() : go(0); return; }
    if (step === 2) { go(1); return; }
    if (step === 3) { go(2); return; }
    if (step === 4) { go(3); return; }
    if (step === 5) { go(4); return; }
    if (step === 6) { go(5); return; }
  };

  const handleSelectFor = (type: "child" | "caregiver") => {
    if (type !== profileFor) {
      setProfileFor(type);
      setSelectedAge(null);
      setNameInput("");
    }
    go(2);
  };

  const buildAndCreate = (bg?: SkinBackground): StoredProfile => {
    const userType: UserType = profileFor === "caregiver" ? "caregiver" : (selectedAge?.userType ?? "child");
    const ageRange: AgeRange = profileFor === "caregiver" ? "18+" : (selectedAge?.value ?? "6-9");
    return addProfile({ name: nameInput.trim(), userType, ageRange, skinBackground: bg });
  };

  const handleContinueFromNameAge = () => go(3);

  const handleSkipSkinBg = () => {
    const profile = buildAndCreate();
    onDone?.(profile);
  };

  const handleStartSkinBg = () => go(4);

  const handleNextFromConditions = () => go(5);

  const handleNextFromAllergies = () => {
    // Reset selected treatments so user picks from the relevant filtered list
    setTreatments([]);
    go(6);
  };

  const handleFinish = () => {
    const profile = buildAndCreate({ diagnosedConditions: conditions, allergies, currentTreatments: treatments });
    onDone?.(profile);
  };

  const toggle = (list: string[], set: (l: string[]) => void, item: string) => {
    set(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const canContinueFromNameAge =
    profileFor !== null && (profileFor === "caregiver" || selectedAge !== null);

  // Skin bg step: 4 → 1/3, 5 → 2/3, 6 → 3/3
  const skinStep = step >= 4 ? step - 3 : 0;
  const showHeader = step > 0 && step !== 3;
  const relevantTreatments = getRelevantTreatments(conditions, allergies);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Top bar with back + progress */}
      {showHeader && (
        <div className="flex items-center justify-between px-5 pt-10 pb-4 shrink-0">
          <button
            onClick={back}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {step <= 2 ? (
            <StepDots current={step} total={2} />
          ) : step >= 4 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">{skinStep} of 3</span>
              <StepDots current={skinStep} total={3} />
            </div>
          ) : (
            <div />
          )}

          <div className="w-9" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-sm mx-auto px-5 pb-10">
          <AnimatePresence mode="wait" custom={dir}>

            {/* ── Step 0: Welcome ─────────────────────────────────────────── */}
            {step === 0 && (
              <motion.div
                key="welcome"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="flex flex-col items-center gap-8 text-center pt-16"
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
                    <span>Designed for ages 1 through adult</span>
                  </div>
                </div>

                <Button
                  className="w-full h-14 rounded-2xl text-base font-semibold shadow-md"
                  onClick={() => go(1)}
                >
                  Get Started <ChevronRight className="w-5 h-5 ml-1" />
                </Button>

                <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                  Patch is for informational purposes only and does not replace professional medical advice.
                </p>
              </motion.div>
            )}

            {/* ── Step 1: Who is this profile for? ────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="who"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="flex flex-col gap-6 pt-4"
              >
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Who is this profile for?</h2>
                  <p className="text-muted-foreground text-sm mt-1">Choose the best fit — you can always edit it later.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleSelectFor("child")}
                    className="flex items-center gap-4 p-5 rounded-3xl border-2 border-border bg-background text-left transition-all hover:border-primary/40 hover:bg-primary/3 active:scale-[0.98] group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Baby className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-base">Child or Teen</p>
                      <p className="text-sm text-muted-foreground mt-0.5">For a young person, ages 1 through 18+</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary/60 transition-colors shrink-0" />
                  </button>

                  <button
                    onClick={() => handleSelectFor("caregiver")}
                    className="flex items-center gap-4 p-5 rounded-3xl border-2 border-border bg-background text-left transition-all hover:border-primary/40 hover:bg-primary/3 active:scale-[0.98] group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-base">Caregiver</p>
                      <p className="text-sm text-muted-foreground mt-0.5">For myself — I look after others</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary/60 transition-colors shrink-0" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Name + Age ───────────────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="name-age"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="flex flex-col gap-6 pt-4"
              >
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {profileFor === "caregiver" ? "Your details" : "Tell us about them"}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">You can change this later in settings.</p>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-foreground">Name</label>
                  <Input
                    placeholder={
                      profileFor === "caregiver" ? "Your name" :
                      profileFor === "child"     ? "Their name" : "Enter a name"
                    }
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="rounded-xl h-12 text-base"
                    maxLength={32}
                    autoFocus
                  />
                </div>

                {/* Age range — child only */}
                {profileFor === "child" && (
                  <div className="flex flex-col gap-4">
                    <label className="text-sm font-semibold text-foreground">Age Range</label>
                    {AGE_GROUPS.map((group) => (
                      <div key={group.label} className="flex flex-col gap-2">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</p>
                        <div className={cn("grid gap-2", group.ages.length === 3 ? "grid-cols-3" : group.ages.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
                          {group.ages.map((age) => {
                            const sel = selectedAge?.value === age.value;
                            return (
                              <button
                                key={age.value}
                                onClick={() => setSelectedAge({ value: age.value, userType: age.userType })}
                                className={cn(
                                  "py-3 rounded-2xl border-2 text-sm font-bold text-center transition-all active:scale-[0.97]",
                                  sel ? "border-primary bg-primary/8 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                )}
                              >
                                {age.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <motion.div whileTap={canContinueFromNameAge ? { scale: 0.97 } : {}}>
                  <Button
                    className={cn("w-full h-13 rounded-2xl text-base font-bold", !canContinueFromNameAge && "opacity-40 cursor-not-allowed")}
                    disabled={!canContinueFromNameAge}
                    onClick={handleContinueFromNameAge}
                  >
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* ── Step 3: Skin background intro ────────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="skin-intro"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="flex flex-col items-center gap-8 pt-16 text-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-9 h-9 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">One more thing</h2>
                    <p className="text-muted-foreground text-sm mt-2 leading-relaxed max-w-xs">
                      A quick skin background helps personalize reports and suggestions. You can skip and add it later from settings.
                    </p>
                  </div>
                </div>

                <div className="w-full flex flex-col gap-2.5 bg-muted/40 rounded-2xl p-4 text-sm text-muted-foreground text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <span className="text-xs">1</span>
                    </div>
                    <span>Diagnosed skin conditions</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <span className="text-xs">2</span>
                    </div>
                    <span>Known allergies</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <span className="text-xs">3</span>
                    </div>
                    <span>Current treatments (3 quick questions)</span>
                  </div>
                </div>

                <div className="w-full flex flex-col gap-3">
                  <Button
                    className="w-full h-14 rounded-2xl text-base font-bold shadow-md"
                    onClick={handleStartSkinBg}
                  >
                    Let's do it!
                  </Button>
                  <button
                    onClick={handleSkipSkinBg}
                    className="w-full h-12 rounded-2xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                  >
                    Skip for now →
                  </button>
                </div>

                <button
                  onClick={back}
                  className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to profile
                </button>
              </motion.div>
            )}

            {/* ── Step 4: Diagnosed conditions ─────────────────────────────── */}
            {step === 4 && (
              <motion.div
                key="conditions"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="flex flex-col gap-5 pt-2"
              >
                <div>
                  <h2 className="text-xl font-bold text-foreground">Diagnosed conditions</h2>
                  <p className="text-muted-foreground text-sm mt-1">Has a doctor diagnosed any of these? Select all that apply.</p>
                </div>

                <div className="flex flex-col gap-2">
                  {DIAGNOSED_CONDITIONS.map((item) => (
                    <CheckItem
                      key={item}
                      label={item}
                      checked={conditions.includes(item)}
                      onToggle={() => toggle(conditions, setConditions, item)}
                    />
                  ))}
                </div>

                <Button
                  className="w-full h-13 rounded-2xl text-base font-bold"
                  onClick={handleNextFromConditions}
                >
                  {conditions.length === 0 ? "None of these — Next" : `Next (${conditions.length} selected)`}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {/* ── Step 5: Allergies ─────────────────────────────────────────── */}
            {step === 5 && (
              <motion.div
                key="allergies"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="flex flex-col gap-5 pt-2"
              >
                <div>
                  <h2 className="text-xl font-bold text-foreground">Known allergies</h2>
                  <p className="text-muted-foreground text-sm mt-1">Any known skin or product allergies? Select all that apply.</p>
                </div>

                <div className="flex flex-col gap-2">
                  {ALLERGY_OPTIONS.map((item) => (
                    <CheckItem
                      key={item}
                      label={item}
                      checked={allergies.includes(item)}
                      onToggle={() => toggle(allergies, setAllergies, item)}
                    />
                  ))}
                </div>

                <Button
                  className="w-full h-13 rounded-2xl text-base font-bold"
                  onClick={handleNextFromAllergies}
                >
                  {allergies.length === 0 ? "None of these — Next" : `Next (${allergies.length} selected)`}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {/* ── Step 6: Current treatments ───────────────────────────────── */}
            {step === 6 && (
              <motion.div
                key="treatments"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="flex flex-col gap-5 pt-2"
              >
                <div>
                  <h2 className="text-xl font-bold text-foreground">Current treatments</h2>
                  <p className="text-muted-foreground text-sm mt-1">What treatments are being used? Select all that apply.</p>
                </div>

                <div className="flex items-start gap-2 bg-primary/5 rounded-2xl px-4 py-3">
                  <span className="text-primary mt-0.5">💡</span>
                  <p className="text-xs text-primary/80 leading-relaxed">
                    We'll use this to track what seems to help over time.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {relevantTreatments.map((item) => (
                    <CheckItem
                      key={item}
                      label={item}
                      checked={treatments.includes(item)}
                      onToggle={() => toggle(treatments, setTreatments, item)}
                    />
                  ))}
                </div>

                <Button
                  className="w-full h-13 rounded-2xl text-base font-bold shadow-md"
                  onClick={handleFinish}
                >
                  Finish Setup <Check className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
