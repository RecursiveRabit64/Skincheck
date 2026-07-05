import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type SkinCondition =
  | "Acne" | "Blackheads" | "Whiteheads" | "Cystic Acne"
  | "Eczema" | "Dry Skin" | "Seborrheic Dermatitis"
  | "Rash" | "Hives" | "Sunburn" | "Bug Bite" | "Contact Dermatitis"
  | "Psoriasis" | "Rosacea"
  | "Ringworm" | "Athlete's Foot" | "Fungal Rash"
  | "Warts" | "Keratosis Pilaris";

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
  { id: "scalp",             d: "M70,8 Q100,-2 130,8 Q134,28 100,36 Q66,28 70,8 Z",                                     label: "Scalp" },
  { id: "forehead",          d: "M68,30 Q100,22 132,30 Q130,54 100,58 Q70,54 68,30 Z",                                   label: "Forehead" },
  { id: "left_ear",          d: "M60,54 Q50,57 50,68 Q50,79 60,82 Q67,77 66,68 Q66,58 60,54 Z",                         label: "Left Ear" },
  { id: "right_ear",         d: "M140,54 Q150,57 150,68 Q150,79 140,82 Q133,77 134,68 Q134,58 140,54 Z",                label: "Right Ear" },
  { id: "left_cheek",        d: "M68,52 Q60,70 74,86 Q88,78 90,62 Q80,50 68,52 Z",                                      label: "Left Cheek" },
  { id: "right_cheek",       d: "M132,52 Q140,70 126,86 Q112,78 110,62 Q120,50 132,52 Z",                               label: "Right Cheek" },
  { id: "nose",              d: "M93,52 Q100,46 107,52 Q110,66 107,74 Q100,78 93,74 Q90,66 93,52 Z",                    label: "Nose" },
  { id: "lips",              d: "M86,76 Q93,70 100,74 Q107,70 114,76 Q111,90 100,93 Q89,90 86,76 Z",                    label: "Lips" },
  { id: "chin",              d: "M84,88 Q100,102 116,88 Q112,107 100,110 Q88,107 84,88 Z",                               label: "Chin" },
  { id: "neck",              d: "M87,99 L113,99 Q116,118 116,124 Q100,128 84,124 Q84,118 87,99 Z",                       label: "Neck" },

  // Upper body
  { id: "left_shoulder",     d: "M84,124 Q62,112 40,128 Q26,140 26,158 L76,158 Q74,144 76,136 Q82,130 84,124 Z",        label: "Left Shoulder" },
  { id: "right_shoulder",    d: "M116,124 Q118,130 124,136 Q126,144 124,158 L174,158 Q174,140 160,128 Q138,112 116,124 Z", label: "Right Shoulder" },
  { id: "chest",             d: "M74,158 Q100,154 126,158 L122,212 Q100,216 78,212 Z",                                   label: "Chest" },
  { id: "abdomen",           d: "M78,212 Q100,216 122,212 L120,262 Q100,267 80,262 Z",                                   label: "Abdomen" },

  // Arms (front)
  { id: "left_upper_arm",    d: "M22,156 L48,156 L40,216 L14,216 Z",                                                     label: "Left Upper Arm" },
  { id: "right_upper_arm",   d: "M152,156 L178,156 L186,216 L160,216 Z",                                                 label: "Right Upper Arm" },
  { id: "left_forearm",      d: "M12,214 L40,214 L32,274 L4,272 Z",                                                      label: "Left Forearm" },
  { id: "right_forearm",     d: "M160,214 L188,214 L196,272 L168,274 Z",                                                 label: "Right Forearm" },
  { id: "left_wrist",        d: "M4,270 L32,270 L30,286 L2,284 Z",                                                       label: "Left Wrist" },
  { id: "right_wrist",       d: "M168,270 L196,270 L198,284 L170,286 Z",                                                 label: "Right Wrist" },
  { id: "left_hand",         d: "M2,284 L30,284 L26,310 L0,308 Z",                                                       label: "Left Hand" },
  { id: "right_hand",        d: "M170,284 L198,284 L200,308 L172,310 Z",                                                 label: "Right Hand" },

  // Lower body (front)
  { id: "left_inner_thigh",  d: "M80,262 L102,262 L100,334 L82,336 Z",                                                   label: "Left Inner Thigh" },
  { id: "right_inner_thigh", d: "M98,262 L120,262 L118,336 L100,334 Z",                                                  label: "Right Inner Thigh" },
  { id: "left_thigh",        d: "M64,262 L82,262 L80,336 L62,338 Z",                                                     label: "Left Thigh" },
  { id: "right_thigh",       d: "M118,262 L134,262 L136,338 L118,336 Z",                                                 label: "Right Thigh" },
  { id: "left_knee",         d: "M60,336 L86,334 L86,360 L60,362 Z",                                                     label: "Left Knee" },
  { id: "right_knee",        d: "M114,334 L140,336 L140,362 L114,360 Z",                                                 label: "Right Knee" },
  { id: "left_shin",         d: "M58,360 L86,358 L84,450 L58,454 Z",                                                     label: "Left Shin" },
  { id: "right_shin",        d: "M114,358 L140,360 L142,454 L116,450 Z",                                                 label: "Right Shin" },
  { id: "left_ankle",        d: "M56,452 L84,450 L82,466 L54,468 Z",                                                     label: "Left Ankle" },
  { id: "right_ankle",       d: "M116,450 L142,452 L144,468 L118,466 Z",                                                 label: "Right Ankle" },
  { id: "left_foot",         d: "M48,466 L82,462 L80,490 L44,490 Z",                                                     label: "Left Foot" },
  { id: "right_foot",        d: "M118,462 L152,466 L156,490 L120,490 Z",                                                 label: "Right Foot" },
];

export const backZonesDef: ZoneDef[] = [
  // Head / neck (back)
  { id: "occipital",              d: "M70,8 Q100,-2 130,8 Q134,28 100,36 Q66,28 70,8 Z",                                 label: "Back of Head" },
  { id: "nape",                   d: "M87,99 L113,99 Q116,118 116,124 Q100,128 84,124 Q84,118 87,99 Z",                  label: "Nape of Neck" },

  // Back torso
  { id: "upper_back",             d: "M76,158 Q100,154 124,158 L122,212 Q100,216 78,212 Z",                              label: "Upper Back" },
  { id: "lower_back",             d: "M78,212 Q100,216 122,212 L120,262 Q100,266 80,262 Z",                              label: "Lower Back" },
  { id: "left_shoulder_back",     d: "M84,124 Q62,112 40,128 Q26,140 26,158 L76,158 Q74,144 76,136 Q82,130 84,124 Z",   label: "Left Shoulder (Back)" },
  { id: "right_shoulder_back",    d: "M116,124 Q118,130 124,136 Q126,144 124,158 L174,158 Q174,140 160,128 Q138,112 116,124 Z", label: "Right Shoulder (Back)" },

  // Buttocks
  { id: "left_buttock",           d: "M80,262 L102,262 L100,324 L70,322 Z",                                              label: "Left Buttock" },
  { id: "right_buttock",          d: "M98,262 L120,262 L130,322 L100,324 Z",                                             label: "Right Buttock" },

  // Arms (back)
  { id: "back_left_upper_arm",    d: "M22,156 L48,156 L40,216 L14,216 Z",                                                label: "Back of Left Upper Arm" },
  { id: "back_right_upper_arm",   d: "M152,156 L178,156 L186,216 L160,216 Z",                                            label: "Back of Right Upper Arm" },
  { id: "left_inner_elbow",       d: "M12,214 L40,214 L38,230 L10,228 Z",                                                label: "Left Elbow" },
  { id: "right_inner_elbow",      d: "M160,214 L188,214 L190,230 L162,228 Z",                                            label: "Right Elbow" },
  { id: "back_left_forearm",      d: "M10,228 L38,228 L30,274 L4,270 Z",                                                 label: "Back of Left Forearm" },
  { id: "back_right_forearm",     d: "M162,228 L190,228 L196,270 L168,274 Z",                                            label: "Back of Right Forearm" },
  { id: "back_left_wrist",        d: "M4,270 L30,272 L28,286 L2,284 Z",                                                  label: "Left Wrist (Back)" },
  { id: "back_right_wrist",       d: "M168,272 L196,270 L198,284 L170,286 Z",                                            label: "Right Wrist (Back)" },
  { id: "back_left_hand",         d: "M2,284 L28,284 L24,310 L0,308 Z",                                                  label: "Back of Left Hand" },
  { id: "back_right_hand",        d: "M170,284 L198,284 L200,308 L172,310 Z",                                            label: "Back of Right Hand" },

  // Legs (back)
  { id: "back_left_thigh",        d: "M66,322 L100,322 L96,376 L62,380 Z",                                               label: "Back of Left Thigh" },
  { id: "back_right_thigh",       d: "M100,322 L134,322 L138,380 L104,376 Z",                                            label: "Back of Right Thigh" },
  { id: "left_back_knee",         d: "M60,378 L96,374 L94,400 L58,404 Z",                                                label: "Back of Left Knee" },
  { id: "right_back_knee",        d: "M104,374 L140,378 L142,404 L106,400 Z",                                            label: "Back of Right Knee" },
  { id: "left_calf",              d: "M56,402 L94,398 L90,456 L54,460 Z",                                                label: "Left Calf" },
  { id: "right_calf",             d: "M106,398 L142,402 L146,460 L110,456 Z",                                            label: "Right Calf" },
  { id: "left_heel",              d: "M50,458 L88,454 L86,484 L48,484 Z",                                                label: "Left Heel" },
  { id: "right_heel",             d: "M112,454 L150,458 L152,484 L110,484 Z",                                            label: "Right Heel" },
];

export const zonesDef: ZoneDef[] = [...frontZonesDef, ...backZonesDef];

// ── Human Silhouette ─────────────────────────────────────────────────────────

function FrontSilhouette() {
  return (
    <g fill="hsl(28 35% 89%)" stroke="hsl(28 20% 74%)" strokeWidth="0.6" style={{ pointerEvents: "none" }}>
      {/* Head */}
      <ellipse cx="100" cy="42" rx="34" ry="40" />
      {/* Left ear */}
      <ellipse cx="63" cy="53" rx="8" ry="12" />
      {/* Right ear */}
      <ellipse cx="137" cy="53" rx="8" ry="12" />
      {/* Neck */}
      <path d="M87,80 L113,80 Q116,108 116,124 Q100,129 84,124 Q84,108 87,80 Z" />
      {/* Left shoulder */}
      <path d="M84,124 Q62,112 40,128 Q26,140 24,158 L76,158 Q74,144 76,136 Q80,130 84,124 Z" />
      {/* Right shoulder */}
      <path d="M116,124 Q120,130 124,136 Q126,144 124,158 L176,158 Q174,140 160,128 Q138,112 116,124 Z" />
      {/* Torso */}
      <path d="M72,158 Q100,153 128,158 L124,264 Q100,269 76,264 Z" />
      {/* Left upper arm */}
      <path d="M20,156 L48,156 L40,218 L12,216 Z" />
      {/* Left forearm */}
      <path d="M10,214 L40,214 L32,276 L2,272 Z" />
      {/* Left hand */}
      <ellipse cx="16" cy="294" rx="13" ry="17" />
      {/* Right upper arm */}
      <path d="M152,156 L180,156 L188,218 L160,218 Z" />
      {/* Right forearm */}
      <path d="M160,214 L190,214 L198,272 L168,276 Z" />
      {/* Right hand */}
      <ellipse cx="184" cy="294" rx="13" ry="17" />
      {/* Hip flare */}
      <path d="M76,264 Q100,260 124,264 L132,300 Q100,305 68,300 Z" />
      {/* Left thigh */}
      <path d="M64,298 L104,298 L100,340 L60,344 Z" />
      {/* Left lower leg */}
      <path d="M58,342 L100,338 L96,456 L54,460 Z" />
      {/* Left foot */}
      <ellipse cx="72" cy="474" rx="22" ry="13" />
      {/* Right thigh */}
      <path d="M96,298 L136,298 L140,344 L100,340 Z" />
      {/* Right lower leg */}
      <path d="M100,338 L142,342 L146,460 L104,456 Z" />
      {/* Right foot */}
      <ellipse cx="128" cy="474" rx="22" ry="13" />
    </g>
  );
}

function BackSilhouette() {
  return (
    <g fill="hsl(28 35% 89%)" stroke="hsl(28 20% 74%)" strokeWidth="0.6" style={{ pointerEvents: "none" }}>
      {/* Head back */}
      <ellipse cx="100" cy="42" rx="34" ry="40" />
      {/* Hair shadow on back of head */}
      <ellipse cx="100" cy="28" rx="34" ry="28" fill="hsl(28 28% 80%)" stroke="none" />
      {/* Neck */}
      <path d="M87,80 L113,80 Q116,108 116,124 Q100,129 84,124 Q84,108 87,80 Z" />
      {/* Left shoulder back */}
      <path d="M84,124 Q62,112 40,128 Q26,140 24,158 L76,158 Q74,144 76,136 Q80,130 84,124 Z" />
      {/* Right shoulder back */}
      <path d="M116,124 Q120,130 124,136 Q126,144 124,158 L176,158 Q174,140 160,128 Q138,112 116,124 Z" />
      {/* Back torso */}
      <path d="M72,158 Q100,153 128,158 L124,264 Q100,269 76,264 Z" />
      {/* Shoulder blade hints */}
      <ellipse cx="89" cy="178" rx="14" ry="20" fill="hsl(28 28% 83%)" stroke="none" />
      <ellipse cx="111" cy="178" rx="14" ry="20" fill="hsl(28 28% 83%)" stroke="none" />
      {/* Left upper arm */}
      <path d="M20,156 L48,156 L40,218 L12,216 Z" />
      {/* Left forearm */}
      <path d="M10,214 L40,214 L32,276 L2,272 Z" />
      {/* Left hand */}
      <ellipse cx="16" cy="294" rx="13" ry="17" />
      {/* Right upper arm */}
      <path d="M152,156 L180,156 L188,218 L160,218 Z" />
      {/* Right forearm */}
      <path d="M160,214 L190,214 L198,272 L168,276 Z" />
      {/* Right hand */}
      <ellipse cx="184" cy="294" rx="13" ry="17" />
      {/* Buttocks */}
      <path d="M76,264 Q100,260 124,264 L132,328 Q100,333 68,328 Z" />
      {/* Left back thigh */}
      <path d="M64,326 L104,326 L100,382 L60,386 Z" />
      {/* Left calf */}
      <path d="M56,384 L100,380 L96,462 L52,466 Z" />
      {/* Left heel */}
      <ellipse cx="72" cy="478" rx="22" ry="13" />
      {/* Right back thigh */}
      <path d="M96,326 L136,326 L140,386 L100,382 Z" />
      {/* Right calf */}
      <path d="M100,380 L144,384 L148,466 L104,462 Z" />
      {/* Right heel */}
      <ellipse cx="128" cy="478" rx="22" ry="13" />
    </g>
  );
}

// ── Props & Component ─────────────────────────────────────────────────────────

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

  const startHold = useCallback(
    (id: string) => {
      onZoneInteract(id);
      setActiveZone(id);
      intervalRef.current = setInterval(() => onZoneInteractHold(id), 150);
    },
    [onZoneInteract, onZoneInteractHold]
  );

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
    <div className="relative w-full max-w-[240px] mx-auto" style={{ aspectRatio: "200/495" }}>
      <svg
        viewBox="0 0 200 495"
        className="w-full h-full"
        style={{ touchAction: "none", userSelect: "none" }}
      >
        {/* Human silhouette background */}
        {view === "front" ? <FrontSilhouette /> : <BackSilhouette />}

        {/* Interactive zones */}
        <g>
          {currentZones.map((zone) => {
            const data = zones.get(zone.id);
            const severity = data?.severity ?? 0;

            const redOpacity = Math.min(severity * 0.082, 0.82);
            const fillColor =
              severity > 0 ? `rgba(239,68,68,${redOpacity.toFixed(3)})` : "transparent";

            const strokeColor =
              mode === "medicate" && severity > 0
                ? "hsl(142 71% 45%)"
                : severity > 0
                ? `rgba(200,60,60,0.5)`
                : "rgba(160,110,85,0.22)";

            const strokeWidth = severity > 0 ? (mode === "medicate" ? 2.5 : 1.8) : 1;

            return (
              <Tooltip key={zone.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  <motion.path
                    d={zone.d}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    data-testid={`zone-${zone.id}`}
                    className={
                      mode === "mark"
                        ? "cursor-pointer hover:brightness-90 transition-all"
                        : severity > 0
                        ? "cursor-pointer hover:brightness-90 transition-all"
                        : "cursor-default"
                    }
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (mode === "mark") startHold(zone.id);
                      else if (severity > 0) onZoneMedicateClick(zone.id);
                    }}
                    onMouseUp={() => {
                      if (mode === "mark") stopHold();
                    }}
                    onMouseLeave={() => {
                      if (mode === "mark") stopHold();
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      if (mode === "mark") startHold(zone.id);
                      else if (severity > 0) onZoneMedicateClick(zone.id);
                    }}
                    onTouchEnd={() => {
                      if (mode === "mark") stopHold();
                    }}
                    onTouchCancel={() => {
                      if (mode === "mark") stopHold();
                    }}
                    whileTap={{ scale: mode === "mark" ? 0.93 : 1 }}
                    animate={activeZone === zone.id ? { scale: [1, 0.93, 1] } : {}}
                  />
                </TooltipTrigger>

                <TooltipContent side="right" className="max-w-[160px]">
                  <p className="font-semibold text-sm">{zone.label}</p>
                  {severity > 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        {data?.condition} — Severity {Math.round(severity)}/10
                      </p>
                      {data?.medication && (
                        <p className="text-xs text-green-600 font-medium">
                          Treating: {data.medication}
                        </p>
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
