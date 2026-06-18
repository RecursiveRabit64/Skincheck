import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type SkinCondition = "Acne" | "Rash" | "Eczema" | "Infection" | "Dryness" | "Sunburn";

export interface ZoneData {
  condition: SkinCondition;
  severity: number;
}

interface BodyDollProps {
  zones: Map<string, ZoneData>;
  currentCondition: SkinCondition;
  onZoneInteract: (region: string) => void;
  onZoneInteractHold: (region: string) => void;
}

const zonesDef = [
  { id: "forehead", d: "M75,30 Q100,10 125,30 Q120,50 80,50 Q75,30 75,30", label: "Forehead" },
  { id: "left_cheek", d: "M70,55 Q60,75 80,90 Q90,70 70,55", label: "Left Cheek" },
  { id: "right_cheek", d: "M130,55 Q140,75 120,90 Q110,70 130,55", label: "Right Cheek" },
  { id: "nose", d: "M95,50 L105,50 L100,75 Z", label: "Nose" },
  { id: "chin", d: "M85,90 Q100,105 115,90 Z", label: "Chin" },
  { id: "neck", d: "M85,100 L115,100 L120,120 L80,120 Z", label: "Neck" },
  { id: "left_shoulder", d: "M40,130 Q60,110 80,120 L75,150 L30,150 Z", label: "Left Shoulder" },
  { id: "right_shoulder", d: "M160,130 Q140,110 120,120 L125,150 L170,150 Z", label: "Right Shoulder" },
  { id: "chest", d: "M75,150 L125,150 L125,200 L75,200 Z", label: "Chest" },
  { id: "abdomen", d: "M75,200 L125,200 L120,260 L80,260 Z", label: "Abdomen" },
  { id: "left_upper_arm", d: "M25,150 L45,150 L35,210 L15,210 Z", label: "Left Upper Arm" },
  { id: "right_upper_arm", d: "M155,150 L175,150 L185,210 L165,210 Z", label: "Right Upper Arm" },
  { id: "left_forearm", d: "M15,210 L35,210 L25,280 L5,280 Z", label: "Left Forearm" },
  { id: "right_forearm", d: "M165,210 L185,210 L195,280 L175,280 Z", label: "Right Forearm" },
  { id: "left_thigh", d: "M80,260 L100,260 L95,350 L70,350 Z", label: "Left Thigh" },
  { id: "right_thigh", d: "M100,260 L120,260 L130,350 L105,350 Z", label: "Right Thigh" },
  { id: "left_shin", d: "M70,350 L95,350 L90,450 L65,450 Z", label: "Left Shin" },
  { id: "right_shin", d: "M105,350 L130,350 L135,450 L110,450 Z", label: "Right Shin" },
];

export function BodyDoll({ zones, currentCondition, onZoneInteract, onZoneInteractHold }: BodyDollProps) {
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startHold = useCallback((id: string) => {
    onZoneInteract(id); // initial click
    setActiveZone(id);
    intervalRef.current = setInterval(() => {
      onZoneInteractHold(id);
    }, 150); // fast increment on hold
  }, [onZoneInteract, onZoneInteractHold]);

  const stopHold = useCallback(() => {
    setActiveZone(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopHold();
  }, [stopHold]);

  return (
    <div className="relative w-full max-w-[300px] mx-auto aspect-[2/5]">
      <svg viewBox="0 0 200 500" className="w-full h-full drop-shadow-sm" style={{ touchAction: "none" }}>
        {/* Base doll silhouette */}
        <g stroke="hsl(var(--primary) / 0.2)" strokeWidth="2" fill="hsl(var(--background))">
          {zonesDef.map((zone) => {
            const data = zones.get(zone.id);
            const severity = data?.severity || 0;
            const isHovered = false; // We use CSS for hover
            
            // Calc redness based on severity (0 to 10 -> 0 to 0.8 opacity)
            const redOpacity = Math.min(severity * 0.08, 0.8);
            const fillColor = severity > 0 
              ? `rgba(239, 68, 68, ${redOpacity})` 
              : "white";

            return (
              <Tooltip key={zone.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  <motion.path
                    d={zone.d}
                    fill={fillColor}
                    className="cursor-pointer transition-colors hover:fill-red-50"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      startHold(zone.id);
                    }}
                    onMouseUp={stopHold}
                    onMouseLeave={stopHold}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      startHold(zone.id);
                    }}
                    onTouchEnd={stopHold}
                    onTouchCancel={stopHold}
                    whileTap={{ scale: 0.95 }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold text-sm">{zone.label}</p>
                  {severity > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {data?.condition} - Severity {severity}/10
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Clean skin</p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
