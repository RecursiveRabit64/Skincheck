import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type SkinCondition =
  | "Acne" | "Rash" | "Eczema" | "Infection" | "Dryness" | "Sunburn"
  | "Psoriasis" | "Hives" | "Cystic Acne" | "Blackheads"
  | "Contact Dermatitis" | "Fungal";

export interface ZoneData {
  condition: SkinCondition;
  severity: number;
  medication?: string;
}

export type DollMode = "mark" | "medicate";

interface ZoneDef {
  id: string;
  d: string;
  label: string;
}

const zonesDef: ZoneDef[] = [
  // Face
  { id: "scalp",        d: "M82,12 Q100,2 118,12 Q120,28 80,28 Z", label: "Scalp" },
  { id: "forehead",     d: "M80,28 Q100,18 120,28 Q118,48 82,48 Z", label: "Forehead" },
  { id: "left_ear",     d: "M60,55 Q51,57 51,68 Q51,78 60,80 Q66,76 66,68 Q66,57 60,55 Z", label: "Left Ear" },
  { id: "right_ear",    d: "M140,55 Q149,57 149,68 Q149,78 140,80 Q134,76 134,68 Q134,57 140,55 Z", label: "Right Ear" },
  { id: "left_cheek",   d: "M68,52 Q60,72 78,88 Q90,70 68,52 Z", label: "Left Cheek" },
  { id: "right_cheek",  d: "M132,52 Q140,72 122,88 Q110,70 132,52 Z", label: "Right Cheek" },
  { id: "nose",         d: "M95,48 L105,48 L100,72 Z", label: "Nose" },
  { id: "lips",         d: "M88,76 Q94,72 100,76 Q106,72 112,76 Q108,88 100,91 Q92,88 88,76 Z", label: "Lips" },
  { id: "chin",         d: "M86,88 Q100,104 114,88 Q100,102 86,88 Z", label: "Chin" },
  { id: "neck",         d: "M86,100 L114,100 L118,120 L82,120 Z", label: "Neck" },

  // Upper body
  { id: "left_shoulder",  d: "M38,132 Q60,112 82,122 L76,152 L28,152 Z", label: "Left Shoulder" },
  { id: "right_shoulder", d: "M162,132 Q140,112 118,122 L124,152 L172,152 Z", label: "Right Shoulder" },
  { id: "chest",          d: "M76,152 L124,152 L124,202 L76,202 Z", label: "Chest" },
  { id: "abdomen",        d: "M76,202 L124,202 L120,258 L80,258 Z", label: "Abdomen" },

  // Arms
  { id: "left_upper_arm",  d: "M24,152 L46,152 L38,212 L16,212 Z", label: "Left Upper Arm" },
  { id: "right_upper_arm", d: "M154,152 L176,152 L184,212 L162,212 Z", label: "Right Upper Arm" },
  { id: "left_forearm",    d: "M16,212 L38,212 L28,278 L6,278 Z", label: "Left Forearm" },
  { id: "right_forearm",   d: "M162,212 L184,212 L194,278 L172,278 Z", label: "Right Forearm" },
  { id: "left_hand",       d: "M6,278 L28,278 L24,306 L4,306 Z", label: "Left Hand" },
  { id: "right_hand",      d: "M172,278 L194,278 L196,306 L174,306 Z", label: "Right Hand" },

  // Lower body
  { id: "left_thigh",  d: "M80,258 L100,258 L96,348 L72,348 Z", label: "Left Thigh" },
  { id: "right_thigh", d: "M100,258 L120,258 L128,348 L104,348 Z", label: "Right Thigh" },
  { id: "left_knee",   d: "M72,348 L96,348 L92,370 L68,370 Z", label: "Left Knee" },
  { id: "right_knee",  d: "M104,348 L128,348 L132,370 L108,370 Z", label: "Right Knee" },
  { id: "left_shin",   d: "M68,370 L92,370 L88,452 L64,452 Z", label: "Left Shin" },
  { id: "right_shin",  d: "M108,370 L132,370 L136,452 L112,452 Z", label: "Right Shin" },
  { id: "left_foot",   d: "M60,452 L88,452 L84,486 L56,486 Z", label: "Left Foot" },
  { id: "right_foot",  d: "M112,452 L140,452 L144,486 L116,486 Z", label: "Right Foot" },
];

interface BodyDollProps {
  zones: Map<string, ZoneData>;
  currentCondition: SkinCondition;
  mode: DollMode;
  onZoneInteract: (region: string) => void;
  onZoneInteractHold: (region: string) => void;
  onZoneMedicateClick: (region: string) => void;
}

export function BodyDoll({
  zones,
  currentCondition,
  mode,
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

  return (
    <div className="relative w-full max-w-[260px] mx-auto" style={{ aspectRatio: "200/495" }}>
      <svg
        viewBox="0 0 200 495"
        className="w-full h-full drop-shadow-sm"
        style={{ touchAction: "none", userSelect: "none" }}
      >
        <g stroke="hsl(var(--primary) / 0.25)" strokeWidth="1.5" fill="hsl(var(--background))">
          {zonesDef.map((zone) => {
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

                {/* Medication dot indicator */}
                {hasMed && (() => {
                  const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
                  pathEl.setAttribute("d", zone.d);
                  return null;
                })()}

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

        {/* Medication dot overlays — rendered as separate SVG circles */}
        {zonesDef.map((zone) => {
          const data = zones.get(zone.id);
          if (!data?.medication) return null;
          // Parse center from first coordinate in path
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

export { zonesDef };
