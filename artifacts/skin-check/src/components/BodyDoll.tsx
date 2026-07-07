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
  cx?: number; // center x for medication dot
  cy?: number; // center y for medication dot
}

// ── Path helpers ──────────────────────────────────────────────────────────────

/** Rounded rectangle as SVG path. r is clamped to half the shorter side. */
function rr(x: number, y: number, w: number, h: number, r: number): string {
  const r2 = Math.min(r, w / 2, h / 2);
  return [
    `M ${x + r2},${y}`,
    `H ${x + w - r2}`,
    `Q ${x + w},${y} ${x + w},${y + r2}`,
    `V ${y + h - r2}`,
    `Q ${x + w},${y + h} ${x + w - r2},${y + h}`,
    `H ${x + r2}`,
    `Q ${x},${y + h} ${x},${y + h - r2}`,
    `V ${y + r2}`,
    `Q ${x},${y} ${x + r2},${y}`,
    `Z`,
  ].join(" ");
}

/** Ellipse as SVG path. */
function el(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx},${cy} A ${rx},${ry} 0 0 1 ${cx + rx},${cy} A ${rx},${ry} 0 0 1 ${cx - rx},${cy} Z`;
}

// ── Zone definitions ──────────────────────────────────────────────────────────
//
// Layout (viewBox 0 0 200 490):
//   Head cy=42  ·  Neck y=99  ·  Shoulders cy=140
//   Chest y=128  ·  Abdomen y=183
//   Upper arms y=138  ·  Elbows cy=200  ·  Forearms y=209
//   Wrists cy=267  ·  Hands cy=285
//   Thighs y=257  ·  Knees cy=340  ·  Shins y=349
//   Ankles cy=436  ·  Feet cy=455

export const frontZonesDef: ZoneDef[] = [
  // ── Face (kept as organic paths to match head ellipse) ───────────────────
  { id: "scalp",            d: "M70,8 Q100,-2 130,8 Q134,28 100,36 Q66,28 70,8 Z",                                   label: "Scalp",         cx: 100, cy: 18 },
  { id: "forehead",         d: "M68,30 Q100,22 132,30 Q130,54 100,58 Q70,54 68,30 Z",                                label: "Forehead",      cx: 100, cy: 40 },
  { id: "left_ear",         d: "M60,54 Q50,57 50,68 Q50,79 60,82 Q67,77 66,68 Q66,58 60,54 Z",                      label: "Left Ear",      cx: 53, cy: 68 },
  { id: "right_ear",        d: "M140,54 Q150,57 150,68 Q150,79 140,82 Q133,77 134,68 Q134,58 140,54 Z",             label: "Right Ear",     cx: 147, cy: 68 },
  { id: "left_cheek",       d: "M68,52 Q60,70 74,86 Q88,78 90,62 Q80,50 68,52 Z",                                   label: "Left Cheek",    cx: 74, cy: 68 },
  { id: "right_cheek",      d: "M132,52 Q140,70 126,86 Q112,78 110,62 Q120,50 132,52 Z",                            label: "Right Cheek",   cx: 126, cy: 68 },
  { id: "nose",             d: "M93,52 Q100,46 107,52 Q110,66 107,74 Q100,78 93,74 Q90,66 93,52 Z",                 label: "Nose",          cx: 100, cy: 62 },
  { id: "lips",             d: "M86,76 Q93,70 100,74 Q107,70 114,76 Q111,90 100,93 Q89,90 86,76 Z",                 label: "Lips",          cx: 100, cy: 82 },
  { id: "chin",             d: "M84,88 Q100,102 116,88 Q112,107 100,110 Q88,107 84,88 Z",                            label: "Chin",          cx: 100, cy: 98 },

  // ── Neck ─────────────────────────────────────────────────────────────────
  // rr(90,99,20,26,10) — pill shape
  { id: "neck",             d: rr(90, 99, 20, 26, 10),   label: "Neck",                cx: 100, cy: 112 },

  // ── Shoulders ─────────────────────────────────────────────────────────────
  // el(60,140,26,20) and el(140,140,26,20)
  { id: "left_shoulder",    d: el(60, 140, 26, 20),       label: "Left Shoulder",       cx: 60,  cy: 140 },
  { id: "right_shoulder",   d: el(140, 140, 26, 20),      label: "Right Shoulder",      cx: 140, cy: 140 },

  // ── Torso ─────────────────────────────────────────────────────────────────
  // rr(77,128,46,52,14) — chest
  { id: "chest",            d: rr(77, 128, 46, 52, 14),   label: "Chest",               cx: 100, cy: 154 },
  // rr(79,183,42,48,12) — abdomen
  { id: "abdomen",          d: rr(79, 183, 42, 48, 12),   label: "Abdomen",             cx: 100, cy: 207 },

  // ── Arms — left ───────────────────────────────────────────────────────────
  // rr(18,138,24,56,12) — upper arm pill
  { id: "left_upper_arm",   d: rr(18, 138, 24, 56, 12),   label: "Left Upper Arm",      cx: 30, cy: 166 },
  // el(30,200,14,11) — elbow oval
  { id: "left_forearm",     d: rr(18, 209, 24, 52, 12),   label: "Left Forearm",        cx: 30, cy: 235 },
  { id: "left_wrist",       d: el(30, 267, 13, 8),         label: "Left Wrist",          cx: 30, cy: 267 },
  { id: "left_hand",        d: el(30, 285, 15, 17),        label: "Left Hand",           cx: 30, cy: 285 },

  // ── Arms — right ──────────────────────────────────────────────────────────
  { id: "right_upper_arm",  d: rr(158, 138, 24, 56, 12),  label: "Right Upper Arm",     cx: 170, cy: 166 },
  { id: "right_forearm",    d: rr(158, 209, 24, 52, 12),  label: "Right Forearm",       cx: 170, cy: 235 },
  { id: "right_wrist",      d: el(170, 267, 13, 8),        label: "Right Wrist",         cx: 170, cy: 267 },
  { id: "right_hand",       d: el(170, 285, 15, 17),       label: "Right Hand",          cx: 170, cy: 285 },

  // ── Thighs — front view split into inner/outer strips ────────────────────
  // Left leg: x 68-80 outer (left_thigh), x 80-92 inner (left_inner_thigh)
  { id: "left_thigh",       d: rr(68, 257, 12, 76, 6),    label: "Left Thigh",          cx: 74,  cy: 295 },
  { id: "left_inner_thigh", d: rr(80, 257, 12, 76, 6),    label: "Left Inner Thigh",    cx: 86,  cy: 295 },
  // Right leg: x 108-120 inner (right_inner_thigh), x 120-132 outer (right_thigh)
  { id: "right_inner_thigh",d: rr(108, 257, 12, 76, 6),   label: "Right Inner Thigh",   cx: 114, cy: 295 },
  { id: "right_thigh",      d: rr(120, 257, 12, 76, 6),   label: "Right Thigh",         cx: 126, cy: 295 },

  // ── Knees ─────────────────────────────────────────────────────────────────
  { id: "left_knee",        d: el(80, 340, 14, 11),        label: "Left Knee",           cx: 80,  cy: 340 },
  { id: "right_knee",       d: el(120, 340, 14, 11),       label: "Right Knee",          cx: 120, cy: 340 },

  // ── Shins ─────────────────────────────────────────────────────────────────
  // rr(68,349,24,80,12) — shin pill
  { id: "left_shin",        d: rr(68, 349, 24, 80, 12),    label: "Left Shin",           cx: 80,  cy: 389 },
  { id: "right_shin",       d: rr(108, 349, 24, 80, 12),   label: "Right Shin",          cx: 120, cy: 389 },

  // ── Ankles ────────────────────────────────────────────────────────────────
  { id: "left_ankle",       d: el(80, 436, 14, 8),          label: "Left Ankle",          cx: 80,  cy: 436 },
  { id: "right_ankle",      d: el(120, 436, 14, 8),         label: "Right Ankle",         cx: 120, cy: 436 },

  // ── Feet ──────────────────────────────────────────────────────────────────
  { id: "left_foot",        d: el(73, 455, 22, 13),         label: "Left Foot",           cx: 73,  cy: 455 },
  { id: "right_foot",       d: el(127, 455, 22, 13),        label: "Right Foot",          cx: 127, cy: 455 },
];

export const backZonesDef: ZoneDef[] = [
  // ── Head / neck (back) ───────────────────────────────────────────────────
  { id: "occipital",             d: "M70,8 Q100,-2 130,8 Q134,28 100,36 Q66,28 70,8 Z",    label: "Back of Head",        cx: 100, cy: 18 },
  { id: "nape",                  d: rr(90, 99, 20, 26, 10),                                  label: "Nape of Neck",        cx: 100, cy: 112 },

  // ── Torso (back) ─────────────────────────────────────────────────────────
  { id: "left_shoulder_back",    d: el(60, 140, 26, 20),                                     label: "Left Shoulder (Back)",  cx: 60,  cy: 140 },
  { id: "right_shoulder_back",   d: el(140, 140, 26, 20),                                    label: "Right Shoulder (Back)", cx: 140, cy: 140 },
  { id: "upper_back",            d: rr(77, 128, 46, 52, 14),                                 label: "Upper Back",          cx: 100, cy: 154 },
  { id: "lower_back",            d: rr(79, 183, 42, 48, 12),                                 label: "Lower Back",          cx: 100, cy: 207 },

  // ── Arms — back left ─────────────────────────────────────────────────────
  { id: "back_left_upper_arm",   d: rr(18, 138, 24, 56, 12),                                 label: "Back of Left Upper Arm", cx: 30, cy: 166 },
  { id: "left_inner_elbow",      d: el(30, 200, 14, 11),                                     label: "Left Elbow",          cx: 30, cy: 200 },
  { id: "back_left_forearm",     d: rr(18, 209, 24, 52, 12),                                 label: "Back of Left Forearm", cx: 30, cy: 235 },
  { id: "back_left_wrist",       d: el(30, 267, 13, 8),                                      label: "Left Wrist (Back)",   cx: 30, cy: 267 },
  { id: "back_left_hand",        d: el(30, 285, 15, 17),                                     label: "Back of Left Hand",   cx: 30, cy: 285 },

  // ── Arms — back right ────────────────────────────────────────────────────
  { id: "back_right_upper_arm",  d: rr(158, 138, 24, 56, 12),                                label: "Back of Right Upper Arm", cx: 170, cy: 166 },
  { id: "right_inner_elbow",     d: el(170, 200, 14, 11),                                    label: "Right Elbow",         cx: 170, cy: 200 },
  { id: "back_right_forearm",    d: rr(158, 209, 24, 52, 12),                                label: "Back of Right Forearm", cx: 170, cy: 235 },
  { id: "back_right_wrist",      d: el(170, 267, 13, 8),                                     label: "Right Wrist (Back)",  cx: 170, cy: 267 },
  { id: "back_right_hand",       d: el(170, 285, 15, 17),                                    label: "Back of Right Hand",  cx: 170, cy: 285 },

  // ── Buttocks ─────────────────────────────────────────────────────────────
  // rr(68,234,24,46,12)
  { id: "left_buttock",          d: rr(68, 234, 24, 46, 12),                                 label: "Left Buttock",        cx: 80,  cy: 257 },
  { id: "right_buttock",         d: rr(108, 234, 24, 46, 12),                                label: "Right Buttock",       cx: 120, cy: 257 },

  // ── Thighs (back — full width, no inner split) ───────────────────────────
  // rr(68,284,24,62,12)
  { id: "back_left_thigh",       d: rr(68, 284, 24, 62, 12),                                 label: "Back of Left Thigh",  cx: 80,  cy: 315 },
  { id: "back_right_thigh",      d: rr(108, 284, 24, 62, 12),                                label: "Back of Right Thigh", cx: 120, cy: 315 },

  // ── Knees (back) ─────────────────────────────────────────────────────────
  { id: "left_back_knee",        d: el(80, 353, 14, 11),                                     label: "Back of Left Knee",   cx: 80,  cy: 353 },
  { id: "right_back_knee",       d: el(120, 353, 14, 11),                                    label: "Back of Right Knee",  cx: 120, cy: 353 },

  // ── Calves ───────────────────────────────────────────────────────────────
  // rr(68,362,24,80,12)
  { id: "left_calf",             d: rr(68, 362, 24, 80, 12),                                 label: "Left Calf",           cx: 80,  cy: 402 },
  { id: "right_calf",            d: rr(108, 362, 24, 80, 12),                                label: "Right Calf",          cx: 120, cy: 402 },

  // ── Heels ────────────────────────────────────────────────────────────────
  { id: "left_heel",             d: el(73, 455, 22, 13),                                     label: "Left Heel",           cx: 73,  cy: 455 },
  { id: "right_heel",            d: el(127, 455, 22, 13),                                    label: "Right Heel",          cx: 127, cy: 455 },
];

export const zonesDef: ZoneDef[] = [...frontZonesDef, ...backZonesDef];

// ── Severity → color ──────────────────────────────────────────────────────────

function zoneColors(severity: number): { fill: string; stroke: string } {
  if (severity <= 0) return { fill: "transparent", stroke: "rgba(130,85,60,0.35)" };
  if (severity <= 4) return { fill: "rgba(234,179,8,0.42)",  stroke: "rgba(150,108,0,0.60)"  };
  if (severity <= 7) return { fill: "rgba(249,115,22,0.48)", stroke: "rgba(170,70,0,0.62)"   };
  return              { fill: "rgba(239,68,68,0.62)",  stroke: "rgba(175,35,35,0.70)" };
}

function sevLabel(severity: number): string {
  if (severity <= 0) return "Clear";
  if (severity <= 4) return "😊 Mild";
  if (severity <= 7) return "😐 Moderate";
  return "😢 Severe";
}

// ── Silhouettes ───────────────────────────────────────────────────────────────
//
// Each body segment is a <rect rx> (pill/capsule) or <ellipse>.
// Small gaps between segments give the separated-joint look.
// Joint connectors (elbows, knees, wrists, ankles) are oval shapes.

const SKIN  = "hsl(28 35% 89%)";
const LINE  = "hsl(28 20% 74%)";
const JOINT = "hsl(28 30% 84%)"; // slightly different shade for joint ovals

function FrontSilhouette() {
  return (
    <g stroke={LINE} strokeWidth="0.8" style={{ pointerEvents: "none" }}>
      {/* ── Head + ears ── */}
      <ellipse fill={SKIN} cx="100" cy="42" rx="30" ry="34" />
      <ellipse fill={SKIN} cx="65"  cy="54" rx="7"  ry="11" />
      <ellipse fill={SKIN} cx="135" cy="54" rx="7"  ry="11" />

      {/* ── Neck ── */}
      <rect fill={SKIN} x="90" y="99" width="20" height="26" rx="10" />

      {/* ── Shoulder ovals ── */}
      <ellipse fill={JOINT} cx="60"  cy="140" rx="26" ry="20" />
      <ellipse fill={JOINT} cx="140" cy="140" rx="26" ry="20" />

      {/* ── Torso ── */}
      <rect fill={SKIN} x="77" y="128" width="46" height="52" rx="14" />
      <rect fill={SKIN} x="79" y="183" width="42" height="48" rx="12" />

      {/* ── Pelvis connector ── */}
      <rect fill={JOINT} x="70" y="234" width="60" height="22" rx="11" />

      {/* ── Left arm ── */}
      <rect    fill={SKIN}  x="18" y="138" width="24" height="56" rx="12" />
      <ellipse fill={JOINT} cx="30" cy="200" rx="14" ry="11" />
      <rect    fill={SKIN}  x="18" y="209" width="24" height="52" rx="12" />
      <ellipse fill={JOINT} cx="30" cy="267" rx="13" ry="8"  />
      <ellipse fill={SKIN}  cx="30" cy="285" rx="15" ry="17" />

      {/* ── Right arm ── */}
      <rect    fill={SKIN}  x="158" y="138" width="24" height="56" rx="12" />
      <ellipse fill={JOINT} cx="170" cy="200" rx="14" ry="11" />
      <rect    fill={SKIN}  x="158" y="209" width="24" height="52" rx="12" />
      <ellipse fill={JOINT} cx="170" cy="267" rx="13" ry="8"  />
      <ellipse fill={SKIN}  cx="170" cy="285" rx="15" ry="17" />

      {/* ── Left leg ── */}
      <rect    fill={SKIN}  x="68"  y="257" width="24" height="76" rx="12" />
      <ellipse fill={JOINT} cx="80"  cy="340" rx="14" ry="11" />
      <rect    fill={SKIN}  x="68"  y="349" width="24" height="80" rx="12" />
      <ellipse fill={JOINT} cx="80"  cy="436" rx="14" ry="8"  />
      <ellipse fill={SKIN}  cx="73"  cy="455" rx="22" ry="13" />

      {/* ── Right leg ── */}
      <rect    fill={SKIN}  x="108" y="257" width="24" height="76" rx="12" />
      <ellipse fill={JOINT} cx="120" cy="340" rx="14" ry="11" />
      <rect    fill={SKIN}  x="108" y="349" width="24" height="80" rx="12" />
      <ellipse fill={JOINT} cx="120" cy="436" rx="14" ry="8"  />
      <ellipse fill={SKIN}  cx="127" cy="455" rx="22" ry="13" />
    </g>
  );
}

function BackSilhouette() {
  return (
    <g stroke={LINE} strokeWidth="0.8" style={{ pointerEvents: "none" }}>
      {/* ── Head (back) ── */}
      <ellipse fill={SKIN} cx="100" cy="42" rx="30" ry="34" />

      {/* ── Nape ── */}
      <rect fill={SKIN} x="90" y="99" width="20" height="26" rx="10" />

      {/* ── Shoulder ovals ── */}
      <ellipse fill={JOINT} cx="60"  cy="140" rx="26" ry="20" />
      <ellipse fill={JOINT} cx="140" cy="140" rx="26" ry="20" />

      {/* ── Torso (back) ── */}
      <rect fill={SKIN} x="77" y="128" width="46" height="52" rx="14" />
      <rect fill={SKIN} x="79" y="183" width="42" height="48" rx="12" />

      {/* ── Left arm (back) ── */}
      <rect    fill={SKIN}  x="18" y="138" width="24" height="56" rx="12" />
      <ellipse fill={JOINT} cx="30" cy="200" rx="14" ry="11" />
      <rect    fill={SKIN}  x="18" y="209" width="24" height="52" rx="12" />
      <ellipse fill={JOINT} cx="30" cy="267" rx="13" ry="8"  />
      <ellipse fill={SKIN}  cx="30" cy="285" rx="15" ry="17" />

      {/* ── Right arm (back) ── */}
      <rect    fill={SKIN}  x="158" y="138" width="24" height="56" rx="12" />
      <ellipse fill={JOINT} cx="170" cy="200" rx="14" ry="11" />
      <rect    fill={SKIN}  x="158" y="209" width="24" height="52" rx="12" />
      <ellipse fill={JOINT} cx="170" cy="267" rx="13" ry="8"  />
      <ellipse fill={SKIN}  cx="170" cy="285" rx="15" ry="17" />

      {/* ── Buttocks ── */}
      <rect fill={SKIN} x="68"  y="234" width="24" height="46" rx="12" />
      <rect fill={SKIN} x="108" y="234" width="24" height="46" rx="12" />

      {/* ── Left leg (back) ── */}
      <rect    fill={SKIN}  x="68"  y="284" width="24" height="62" rx="12" />
      <ellipse fill={JOINT} cx="80"  cy="353" rx="14" ry="11" />
      <rect    fill={SKIN}  x="68"  y="362" width="24" height="80" rx="12" />
      <ellipse fill={JOINT} cx="80"  cy="449" rx="14" ry="8"  />
      <ellipse fill={SKIN}  cx="73"  cy="455" rx="22" ry="13" />

      {/* ── Right leg (back) ── */}
      <rect    fill={SKIN}  x="108" y="284" width="24" height="62" rx="12" />
      <ellipse fill={JOINT} cx="120" cy="353" rx="14" ry="11" />
      <rect    fill={SKIN}  x="108" y="362" width="24" height="80" rx="12" />
      <ellipse fill={JOINT} cx="120" cy="449" rx="14" ry="8"  />
      <ellipse fill={SKIN}  cx="127" cy="455" rx="22" ry="13" />
    </g>
  );
}

// ── Props & Component ─────────────────────────────────────────────────────────

interface BodyDollProps {
  zones: Map<string, ZoneData>;
  currentCondition?: SkinCondition;
  mode?: DollMode;
  view?: DollView;
  readonly?: boolean;
  onZoneInteract?: (region: string) => void;
  onZoneMedicateClick?: (region: string) => void;
}

export function BodyDoll({
  zones,
  currentCondition,
  mode = "mark",
  view = "front",
  readonly = false,
  onZoneInteract,
  onZoneMedicateClick,
}: BodyDollProps) {
  void currentCondition;
  const currentZones = view === "front" ? frontZonesDef : backZonesDef;

  const zonePaths = currentZones.map((zone) => {
    const data = zones.get(zone.id);
    const severity = data?.severity ?? 0;
    const { fill: fillColor, stroke: strokeColor } = zoneColors(severity);
    const strokeWidth = severity > 0 ? 2 : 0.8;

    if (readonly) {
      return (
        <path
          key={zone.id}
          d={zone.d}
          fill={fillColor}
          stroke={severity > 0 ? strokeColor : "none"}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ cursor: "default" }}
        />
      );
    }

    const isClickable = mode === "mark" || (mode === "medicate" && severity > 0);

    return (
      <Tooltip key={zone.id} delayDuration={0}>
        <TooltipTrigger asChild>
          <motion.path
            d={zone.d}
            fill={fillColor}
            stroke={severity > 0 ? strokeColor : "rgba(0,0,0,0)"}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            data-testid={`zone-${zone.id}`}
            className={isClickable ? "cursor-pointer transition-all" : "cursor-default"}
            whileTap={isClickable ? { scale: 0.93, opacity: 0.75 } : {}}
            onClick={(e) => {
              e.preventDefault();
              if (mode === "mark") onZoneInteract?.(zone.id);
              else if (severity > 0) onZoneMedicateClick?.(zone.id);
            }}
          />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[160px]">
          <p className="font-semibold text-sm">{zone.label}</p>
          {severity > 0 ? (
            <>
              <p className="text-xs text-muted-foreground">{data?.condition} — {sevLabel(severity)}</p>
              {data?.medication && (
                <p className="text-xs text-green-600 font-medium">Treating: {data.medication}</p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Tap to mark</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  });

  return (
    <div className="relative w-full max-w-[220px] mx-auto" style={{ aspectRatio: "200/480" }}>
      <svg
        viewBox="0 0 200 480"
        className="w-full h-full"
        style={{ touchAction: readonly ? "auto" : "none", userSelect: "none" }}
      >
        {view === "front" ? <FrontSilhouette /> : <BackSilhouette />}
        <g>{zonePaths}</g>

        {/* Medication dots */}
        {!readonly && currentZones.map((zone) => {
          const data = zones.get(zone.id);
          if (!data?.medication) return null;
          const dotCx = zone.cx ?? 100;
          const dotCy = zone.cy ?? 100;
          return (
            <circle
              key={`med-dot-${zone.id}`}
              cx={dotCx}
              cy={dotCy}
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
