import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type SkinCondition =
  // Acne
  | "Acne Vulgaris" | "Cystic Acne" | "Blackheads" | "Whiteheads" | "Hormonal Acne" | "Milia"
  // Eczema
  | "Atopic Dermatitis" | "Contact Dermatitis" | "Dyshidrotic Eczema" | "Neurodermatitis" | "Seborrheic Dermatitis"
  // Rash / Allergic
  | "Hives" | "Pityriasis Rosea" | "Drug Rash" | "Heat Rash"
  // Inflammatory
  | "Psoriasis" | "Rosacea" | "Perioral Dermatitis"
  // Infection
  | "Bacterial Infection" | "Impetigo" | "Folliculitis"
  // Fungal
  | "Ringworm" | "Tinea Versicolor" | "Athlete's Foot" | "Candidiasis"
  // Other
  | "Dry Skin" | "Sunburn" | "Keratosis Pilaris" | "Warts";

export interface ZoneData {
  condition: SkinCondition;
  severity: number;
  medication?: string;
}

export type DollMode = "mark" | "medicate";
export type DollView = "front" | "back";

interface ZoneDef {
  id: string;
  d: string;
  label: string;
}

export const frontZonesDef: ZoneDef[] = [
  // Face
  { id: "scalp",             d: "M82,12 Q100,2 118,12 Q120,28 80,28 Z",                            label: "Scalp" },
  { id: "forehead",          d: "M80,28 Q100,18 120,28 Q118,48 82,48 Z",                            label: "Forehead" },
  { id: "left_ear",          d: "M60,55 Q51,57 51,68 Q51,78 60,80 Q66,76 66,68 Q66,57 60,55 Z",    label: "Left Ear" },
  { id: "right_ear",         d: "M140,55 Q149,57 149,68 Q149,78 140,80 Q134,76 134,68 Q134,57 140,55 Z", label: "Right Ear" },
  { id: "left_cheek",        d: "M68,52 Q60,72 78,88 Q90,70 68,52 Z",                              label: "Left Cheek" },
  { id: "right_cheek",       d: "M132,52 Q140,72 122,88 Q110,70 132,52 Z",                         label: "Right Cheek" },
  { id: "nose",              d: "M95,48 L105,48 L100,72 Z",                                         label: "Nose" },
  { id: "lips",              d: "M88,76 Q94,72 100,76 Q106,72 112,76 Q108,88 100,91 Q92,88 88,76 Z", label: "Lips" },
  { id: "chin",              d: "M86,88 Q100,104 114,88 Q100,102 86,88 Z",                          label: "Chin" },
  { id: "neck",              d: "M86,100 L114,100 L118,120 L82,120 Z",                              label: "Neck" },

  // Upper body
  { id: "left_shoulder",     d: "M38,132 Q60,112 82,122 L76,152 L28,152 Z",                        label: "Left Shoulder" },
  { id: "right_shoulder",    d: "M162,132 Q140,112 118,122 L124,152 L172,152 Z",                   label: "Right Shoulder" },
  { id: "chest",             d: "M76,152 L124,152 L124,202 L76,202 Z",                              label: "Chest" },
  { id: "abdomen",           d: "M76,202 L124,202 L120,258 L80,258 Z",                              label: "Abdomen" },

  // Arms (front)
  { id: "left_upper_arm",    d: "M24,152 L46,152 L38,212 L16,212 Z",                               label: "Left Upper Arm" },
  { id: "right_upper_arm",   d: "M154,152 L176,152 L184,212 L162,212 Z",                           label: "Right Upper Arm" },
  { id: "left_forearm",      d: "M16,212 L38,212 L30,270 L8,270 Z",                                label: "Left Forearm" },
  { id: "right_forearm",     d: "M162,212 L184,212 L192,270 L170,270 Z",                           label: "Right Forearm" },
  { id: "left_wrist",        d: "M8,270 L30,270 L28,284 L6,284 Z",                                 label: "Left Wrist" },
  { id: "right_wrist",       d: "M170,270 L192,270 L194,284 L172,284 Z",                           label: "Right Wrist" },
  { id: "left_hand",         d: "M6,284 L28,284 L24,308 L4,308 Z",                                 label: "Left Hand" },
  { id: "right_hand",        d: "M172,284 L194,284 L196,308 L174,308 Z",                           label: "Right Hand" },

  // Lower body (front)
  { id: "left_inner_thigh",  d: "M80,260 L100,260 L100,320 L84,320 Z",                             label: "Left Inner Thigh" },
  { id: "right_inner_thigh", d: "M100,260 L120,260 L116,320 L100,320 Z",                           label: "Right Inner Thigh" },
  { id: "left_thigh",        d: "M66,260 L82,260 L80,348 L64,348 Z",                               label: "Left Thigh" },
  { id: "right_thigh",       d: "M118,260 L132,260 L132,348 L116,348 Z",                           label: "Right Thigh" },
  { id: "left_knee",         d: "M64,348 L88,348 L86,370 L62,370 Z",                               label: "Left Knee (Front)" },
  { id: "right_knee",        d: "M112,348 L136,348 L136,370 L112,370 Z",                           label: "Right Knee (Front)" },
  { id: "left_shin",         d: "M62,370 L86,370 L84,448 L60,448 Z",                               label: "Left Shin" },
  { id: "right_shin",        d: "M114,370 L138,370 L138,448 L114,448 Z",                           label: "Right Shin" },
  { id: "left_ankle",        d: "M60,448 L84,448 L82,462 L58,462 Z",                               label: "Left Ankle" },
  { id: "right_ankle",       d: "M114,448 L138,448 L140,462 L116,462 Z",                           label: "Right Ankle" },
  { id: "left_foot",         d: "M56,462 L82,462 L78,488 L52,488 Z",                               label: "Left Foot (Top)" },
  { id: "right_foot",        d: "M118,462 L142,462 L148,488 L124,488 Z",                           label: "Right Foot (Top)" },
];

export const backZonesDef: ZoneDef[] = [
  // Head / neck (back)
  { id: "occipital",         d: "M82,12 Q100,2 118,12 Q120,28 80,28 Z",                            label: "Back of Head" },
  { id: "nape",              d: "M86,100 L114,100 L116,120 L84,120 Z",                              label: "Nape of Neck" },

  // Back torso
  { id: "upper_back",        d: "M76,122 L124,122 L124,202 L76,202 Z",                             label: "Upper Back" },
  { id: "lower_back",        d: "M78,202 L122,202 L118,258 L82,258 Z",                             label: "Lower Back" },
  { id: "left_shoulder_back",  d: "M38,132 Q60,112 80,122 L76,158 L26,158 Z",                      label: "Left Shoulder (Back)" },
  { id: "right_shoulder_back", d: "M162,132 Q140,112 120,122 L124,158 L174,158 Z",                 label: "Right Shoulder (Back)" },

  // Buttocks
  { id: "left_buttock",      d: "M80,258 L100,258 L98,318 L72,318 Z",                              label: "Left Buttock" },
  { id: "right_buttock",     d: "M100,258 L120,258 L128,318 L102,318 Z",                           label: "Right Buttock" },

  // Arms (back)
  { id: "back_left_upper_arm",  d: "M24,158 L46,158 L40,210 L18,210 Z",                            label: "Back of Left Upper Arm" },
  { id: "back_right_upper_arm", d: "M154,158 L176,158 L182,210 L160,210 Z",                        label: "Back of Right Upper Arm" },
  { id: "left_inner_elbow",     d: "M18,208 L40,208 L38,224 L16,224 Z",                            label: "Left Inner Elbow" },
  { id: "right_inner_elbow",    d: "M160,208 L182,208 L184,224 L162,224 Z",                        label: "Right Inner Elbow" },
  { id: "back_left_forearm",    d: "M16,224 L38,224 L30,270 L8,270 Z",                             label: "Back of Left Forearm" },
  { id: "back_right_forearm",   d: "M162,224 L184,224 L192,270 L170,270 Z",                        label: "Back of Right Forearm" },
  { id: "back_left_wrist",      d: "M8,270 L30,270 L28,284 L6,284 Z",                              label: "Left Wrist (Back)" },
  { id: "back_right_wrist",     d: "M170,270 L192,270 L194,284 L172,284 Z",                        label: "Right Wrist (Back)" },
  { id: "back_left_hand",       d: "M6,284 L28,284 L24,308 L4,308 Z",                              label: "Back of Left Hand" },
  { id: "back_right_hand",      d: "M172,284 L194,284 L196,308 L174,308 Z",                        label: "Back of Right Hand" },

  // Legs (back)
  { id: "back_left_thigh",      d: "M68,318 L96,318 L90,370 L64,370 Z",                            label: "Back of Left Thigh" },
  { id: "back_right_thigh",     d: "M104,318 L132,318 L136,370 L110,370 Z",                        label: "Back of Right Thigh" },
  { id: "left_back_knee",       d: "M64,370 L90,370 L88,394 L62,394 Z",                            label: "Back of Left Knee" },
  { id: "right_back_knee",      d: "M110,370 L136,370 L138,394 L112,394 Z",                        label: "Back of Right Knee" },
  { id: "left_calf",            d: "M62,394 L88,394 L84,450 L58,450 Z",                            label: "Left Calf" },
  { id: "right_calf",           d: "M112,394 L138,394 L142,450 L116,450 Z",                        label: "Right Calf" },
  { id: "left_heel",            d: "M56,450 L84,450 L80,480 L52,480 Z",                            label: "Left Heel" },
  { id: "right_heel",           d: "M116,450 L142,450 L148,480 L122,480 Z",                        label: "Right Heel" },
  { id: "left_side_foot",       d: "M50,468 L58,460 L56,488 L48,484 Z",                            label: "Left Side of Foot" },
  { id: "right_side_foot",      d: "M142,460 L150,468 L152,484 L144,488 Z",                        label: "Right Side of Foot" },
];

// Combined for label mapping
export const zonesDef: ZoneDef[] = [...frontZonesDef, ...backZonesDef];

interface BodyDollProps {
  zones: Map<string, ZoneData>;
  currentCondition: SkinCondition;
  mode: DollMode;
  view: DollView;
  onZoneInteract: (region: string) => void;
  onZoneInteractHold: (region: string) => void;
  onZoneMedicateClick: (region: string) => void;
}

export function BodyDoll({
  zones,
  currentCondition,
  mode,
  view,
  onZoneInteract,
  onZoneInteractHold,
  onZoneMedicateClick,
}: BodyDollProps) {
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHold = useCallback((id: string) => {
    onZoneInteract(id);
    setActiveZone(id);
    intervalRef.current = setInterval(() => onZoneInteractHold(id), 150);
  }, [onZoneInteract, onZoneInteractHold]);

  const stopHold = useCallback(() => {
    setActiveZone(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => stopHold(), [stopHold]);

  const currentZones = view === "front" ? frontZonesDef : backZonesDef;

  return (
    <div className="relative w-full max-w-[260px] mx-auto" style={{ aspectRatio: "200/495" }}>
      <svg
        viewBox="0 0 200 495"
        className="w-full h-full drop-shadow-sm"
        style={{ touchAction: "none", userSelect: "none" }}
      >
        <g stroke="hsl(var(--primary) / 0.25)" strokeWidth="1.5" fill="hsl(var(--background))">
          {currentZones.map((zone) => {
            const data = zones.get(zone.id);
            const severity = data?.severity ?? 0;
            const hasMed = !!data?.medication;

            const redOpacity = Math.min(severity * 0.082, 0.82);
            const fillColor = severity > 0
              ? `rgba(239,68,68,${redOpacity.toFixed(3)})`
              : "white";

            const strokeColor = mode === "medicate" && severity > 0
              ? "hsl(142 71% 45%)"
              : "hsl(var(--primary) / 0.25)";

            return (
              <Tooltip key={zone.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  <motion.path
                    d={zone.d}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={mode === "medicate" && severity > 0 ? 2.5 : 1.5}
                    data-testid={`zone-${zone.id}`}
                    className={
                      mode === "mark"
                        ? "cursor-pointer hover:brightness-90 transition-all"
                        : severity > 0
                        ? "cursor-pointer hover:brightness-90 transition-all"
                        : "cursor-default opacity-50"
                    }
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (mode === "mark") startHold(zone.id);
                      else if (severity > 0) onZoneMedicateClick(zone.id);
                    }}
                    onMouseUp={() => { if (mode === "mark") stopHold(); }}
                    onMouseLeave={() => { if (mode === "mark") stopHold(); }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      if (mode === "mark") startHold(zone.id);
                      else if (severity > 0) onZoneMedicateClick(zone.id);
                    }}
                    onTouchEnd={() => { if (mode === "mark") stopHold(); }}
                    onTouchCancel={() => { if (mode === "mark") stopHold(); }}
                    whileTap={{ scale: mode === "mark" ? 0.93 : 1 }}
                    animate={activeZone === zone.id ? { scale: [1, 0.93, 1] } : {}}
                  />
                </TooltipTrigger>

                <TooltipContent side="right" className="max-w-[160px]">
                  <p className="font-semibold text-sm">{zone.label}</p>
                  {severity > 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground">{data?.condition} — Severity {Math.round(severity)}/10</p>
                      {hasMed && (
                        <p className="text-xs text-green-600 font-medium">Treating: {data?.medication}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Clear</p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </g>

        {/* Medication dot overlays */}
        {currentZones.map((zone) => {
          const data = zones.get(zone.id);
          if (!data?.medication) return null;
          const match = zone.d.match(/M([\d.]+),([\d.]+)/);
          if (!match) return null;
          const cx = parseFloat(match[1]) + 6;
          const cy = parseFloat(match[2]) + 6;
          return (
            <circle
              key={`med-dot-${zone.id}`}
              cx={cx}
              cy={cy}
              r={5}
              fill="hsl(142 71% 45%)"
              stroke="white"
              strokeWidth="1.5"
              style={{ pointerEvents: "none" }}
            />
          );
        })}
      </svg>
    </div>
  );
}
