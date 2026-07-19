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
  conditions: Array<{ condition: SkinCondition; severity: number }>;
  medication?: string;
}

export type DollMode = "mark" | "medicate";
export type DollView = "front" | "back";

interface ZoneDef {
  id: string;
  d: string;
  label: string;
  cx?: number;
  cy?: number;
}

// ── Path helpers ──────────────────────────────────────────────────────────────

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

function el(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx},${cy} A ${rx},${ry} 0 0 1 ${cx + rx},${cy} A ${rx},${ry} 0 0 1 ${cx - rx},${cy} Z`;
}

// ── Arm zone polygon helpers ───────────────────────────────────────────────────
//
// These polygons trace the ACTUAL rotated rectangle of each arm segment,
// matching the silhouette shape precisely.
//
// Viewer-left arm (body RIGHT):
//   Upper arm: translate(54,136) rotate(+18°) rect x=-11..11, y=0..62
//   Forearm:   translate(35,213) rotate(-8°)  rect x=-10..10, y=0..50
//
// Viewer-right arm (body LEFT):
//   Upper arm: translate(146,136) rotate(-18°) rect x=-11..11, y=0..62
//   Forearm:   translate(165,213) rotate(+8°)  rect x=-10..10, y=0..50
//
// cos18≈0.951 sin18≈0.309  cos8≈0.990 sin8≈0.139

const ARM_RIGHT_UPPER = "M 43.5,132.6 L 64.5,139.4 L 45.3,198.4 L 24.4,191.6 Z";
const ARM_RIGHT_FORE  = "M 25.1,214.4 L 44.9,211.6 L 51.9,261.1 L 32.1,263.9 Z";
const ARM_LEFT_UPPER  = "M 135.5,139.4 L 156.5,132.6 L 175.6,191.6 L 154.7,198.4 Z";
const ARM_LEFT_FORE   = "M 155.1,211.6 L 174.9,214.4 L 168.0,263.9 L 148.2,261.1 Z";

// ── Labeling convention ───────────────────────────────────────────────────────
//
// All zones are labeled from the BODY's perspective (anatomical standard):
//   Viewer's LEFT side of SVG  = body's RIGHT side
//   Viewer's RIGHT side of SVG = body's LEFT side

// ── Front zone definitions ────────────────────────────────────────────────────

export const frontZonesDef: ZoneDef[] = [
  // ── Face ─────────────────────────────────────────────────────────────────
  { id: "scalp",            d: "M70,9 Q100,-1 130,9 Q133,28 100,36 Q67,28 70,9 Z",  label: "Scalp",          cx: 100, cy: 18 },
  { id: "forehead",         d: el(100, 36, 30, 12),                                   label: "Forehead",       cx: 100, cy: 36 },
  { id: "right_ear",        d: "M60,46 Q50,50 50,64 Q50,76 60,79 Q67,74 66,64 Q66,52 60,46 Z",  label: "Right Ear",  cx: 53, cy: 63 },
  { id: "left_ear",         d: "M140,46 Q150,50 150,64 Q150,76 140,79 Q133,74 134,64 Q134,52 140,46 Z", label: "Left Ear", cx: 147, cy: 63 },
  { id: "right_cheek",      d: el(75, 63, 15, 18),                                    label: "Right Cheek",    cx: 75,  cy: 63 },
  { id: "left_cheek",       d: el(125, 63, 15, 18),                                   label: "Left Cheek",     cx: 125, cy: 63 },
  { id: "nose",             d: el(100, 57, 13, 15),                                   label: "Nose",           cx: 100, cy: 57 },
  { id: "lips",             d: el(100, 71, 17, 9),                                    label: "Mouth",          cx: 100, cy: 71 },
  { id: "chin",             d: el(100, 78, 14, 6),                                    label: "Chin",           cx: 100, cy: 78 },

  // ── Neck ─────────────────────────────────────────────────────────────────
  { id: "neck",             d: rr(88, 77, 24, 22, 11),      label: "Neck",           cx: 100, cy: 88 },

  // ── Shoulders ─────────────────────────────────────────────────────────────
  { id: "right_shoulder",   d: el(54, 118, 22, 18),          label: "Right Shoulder", cx: 54,  cy: 118 },
  { id: "left_shoulder",    d: el(146, 118, 22, 18),         label: "Left Shoulder",  cx: 146, cy: 118 },

  // ── Torso ─────────────────────────────────────────────────────────────────
  { id: "chest",            d: rr(65, 104, 70, 52, 15),      label: "Chest",          cx: 100, cy: 130 },
  { id: "abdomen",          d: rr(74, 159, 52, 42, 13),      label: "Abdomen",        cx: 100, cy: 180 },
  { id: "pelvis",           d: "M74,204 H126 Q132,226 124,246 Q114,263 100,261 Q86,263 76,246 Q68,226 74,204 Z",
                                                              label: "Pelvis",         cx: 100, cy: 228 },

  // ── Arms — viewer-left (body RIGHT) — polygon zones match rotated rects ───
  { id: "right_upper_arm",  d: ARM_RIGHT_UPPER,              label: "Right Upper Arm",  cx: 45,  cy: 166 },
  { id: "right_inner_elbow", d: el(40, 197, 17, 13),         label: "Right Inner Elbow", cx: 40, cy: 197 },
  { id: "right_forearm",    d: ARM_RIGHT_FORE,               label: "Right Forearm",    cx: 39,  cy: 238 },
  { id: "right_wrist",      d: el(42, 267, 12, 7),           label: "Right Wrist",      cx: 42,  cy: 267 },
  { id: "right_hand",       d: el(42, 287, 14, 20),          label: "Right Hand",       cx: 42,  cy: 287 },

  // ── Arms — viewer-right (body LEFT) ───────────────────────────────────────
  { id: "left_upper_arm",   d: ARM_LEFT_UPPER,               label: "Left Upper Arm",   cx: 156, cy: 166 },
  { id: "left_elbow",       d: el(165, 200, 14, 12),         label: "Left Elbow",       cx: 165, cy: 200 },
  { id: "left_forearm",     d: ARM_LEFT_FORE,                label: "Left Forearm",     cx: 162, cy: 238 },
  { id: "left_wrist",       d: el(158, 267, 12, 7),          label: "Left Wrist",       cx: 158, cy: 267 },
  { id: "left_hand",        d: el(158, 287, 14, 20),         label: "Left Hand",        cx: 158, cy: 287 },

  // ── Thighs (viewer-left = body RIGHT) ────────────────────────────────────
  { id: "right_thigh",       d: rr(68, 262, 11, 62, 5),      label: "Right Thigh",        cx: 74,  cy: 293 },
  { id: "right_inner_thigh", d: rr(81, 262, 10, 62, 5),      label: "Right Inner Thigh",  cx: 86,  cy: 293 },
  { id: "left_inner_thigh",  d: rr(109, 262, 10, 62, 5),     label: "Left Inner Thigh",   cx: 114, cy: 293 },
  { id: "left_thigh",        d: rr(121, 262, 11, 62, 5),     label: "Left Thigh",         cx: 126, cy: 293 },

  // ── Knees ─────────────────────────────────────────────────────────────────
  { id: "right_knee",       d: el(80, 332, 15, 13),          label: "Right Knee",       cx: 80,  cy: 332 },
  { id: "left_knee",        d: el(120, 332, 15, 13),         label: "Left Knee",        cx: 120, cy: 332 },

  // ── Shins ─────────────────────────────────────────────────────────────────
  { id: "right_shin",       d: rr(69, 345, 22, 66, 11),      label: "Right Shin",       cx: 80,  cy: 378 },
  { id: "left_shin",        d: rr(109, 345, 22, 66, 11),     label: "Left Shin",        cx: 120, cy: 378 },

  // ── Ankles ────────────────────────────────────────────────────────────────
  { id: "right_ankle",      d: el(80, 419, 13, 8),           label: "Right Ankle",      cx: 80,  cy: 419 },
  { id: "left_ankle",       d: el(120, 419, 13, 8),          label: "Left Ankle",       cx: 120, cy: 419 },

  // ── Feet ──────────────────────────────────────────────────────────────────
  { id: "right_foot",       d: el(74, 434, 22, 12),          label: "Right Foot",       cx: 74,  cy: 434 },
  { id: "left_foot",        d: el(126, 434, 22, 12),         label: "Left Foot",        cx: 126, cy: 434 },
];

// ── Back zone definitions ─────────────────────────────────────────────────────

export const backZonesDef: ZoneDef[] = [
  { id: "occipital",              d: "M70,9 Q100,-1 130,9 Q133,28 100,36 Q67,28 70,9 Z",       label: "Back of Head",            cx: 100, cy: 18 },
  { id: "nape",                   d: rr(88, 77, 24, 22, 11),                                    label: "Nape of Neck",            cx: 100, cy: 88 },

  { id: "right_shoulder_back",    d: el(54, 118, 22, 18),                                       label: "Right Shoulder (Back)",   cx: 54,  cy: 118 },
  { id: "left_shoulder_back",     d: el(146, 118, 22, 18),                                      label: "Left Shoulder (Back)",    cx: 146, cy: 118 },
  { id: "upper_back",             d: rr(65, 104, 70, 52, 15),                                   label: "Upper Back",              cx: 100, cy: 130 },
  { id: "lower_back",             d: rr(74, 159, 52, 42, 13),                                   label: "Lower Back",              cx: 100, cy: 180 },

  { id: "back_right_upper_arm",   d: ARM_RIGHT_UPPER,                                           label: "Right Upper Arm (Back)",  cx: 45,  cy: 166 },
  { id: "right_elbow_back",       d: el(35, 200, 14, 12),                                       label: "Right Elbow (Back)",      cx: 35,  cy: 200 },
  { id: "back_right_forearm",     d: ARM_RIGHT_FORE,                                            label: "Right Forearm (Back)",    cx: 39,  cy: 238 },
  { id: "back_right_wrist",       d: el(42, 267, 12, 7),                                        label: "Right Wrist (Back)",      cx: 42,  cy: 267 },
  { id: "back_right_hand",        d: el(42, 287, 14, 20),                                       label: "Right Hand (Back)",       cx: 42,  cy: 287 },

  { id: "back_left_upper_arm",    d: ARM_LEFT_UPPER,                                            label: "Left Upper Arm (Back)",   cx: 156, cy: 166 },
  { id: "left_elbow_back",        d: el(165, 200, 14, 12),                                      label: "Left Elbow (Back)",       cx: 165, cy: 200 },
  { id: "back_left_forearm",      d: ARM_LEFT_FORE,                                             label: "Left Forearm (Back)",     cx: 162, cy: 238 },
  { id: "back_left_wrist",        d: el(158, 267, 12, 7),                                       label: "Left Wrist (Back)",       cx: 158, cy: 267 },
  { id: "back_left_hand",         d: el(158, 287, 14, 20),                                      label: "Left Hand (Back)",        cx: 158, cy: 287 },

  { id: "right_buttock",          d: rr(68, 204, 24, 50, 12),                                   label: "Right Buttock",           cx: 80,  cy: 229 },
  { id: "left_buttock",           d: rr(108, 204, 24, 50, 12),                                  label: "Left Buttock",            cx: 120, cy: 229 },

  { id: "back_right_thigh",       d: rr(68, 262, 24, 62, 12),                                   label: "Right Thigh (Back)",      cx: 80,  cy: 293 },
  { id: "back_left_thigh",        d: rr(108, 262, 24, 62, 12),                                  label: "Left Thigh (Back)",       cx: 120, cy: 293 },

  { id: "right_back_knee",        d: el(80, 332, 15, 13),                                       label: "Right Knee (Back)",       cx: 80,  cy: 332 },
  { id: "left_back_knee",         d: el(120, 332, 15, 13),                                      label: "Left Knee (Back)",        cx: 120, cy: 332 },

  { id: "right_calf",             d: rr(69, 345, 22, 66, 11),                                   label: "Right Calf",              cx: 80,  cy: 378 },
  { id: "left_calf",              d: rr(109, 345, 22, 66, 11),                                  label: "Left Calf",               cx: 120, cy: 378 },

  { id: "right_heel",             d: el(74, 434, 22, 12),                                       label: "Right Heel",              cx: 74,  cy: 434 },
  { id: "left_heel",              d: el(126, 434, 22, 12),                                      label: "Left Heel",               cx: 126, cy: 434 },
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

// ── Silhouette colors ─────────────────────────────────────────────────────────

const SKIN  = "hsl(28 35% 89%)";
const LINE  = "hsl(28 20% 74%)";
const JOINT = "hsl(28 28% 83%)";

// ── Hand silhouette ───────────────────────────────────────────────────────────

function HandShape({ cx, cy }: { cx: number; cy: number }) {
  return (
    <rect
      fill={SKIN}
      stroke={LINE}
      strokeWidth="0.8"
      x={cx - 12}
      y={cy - 13}
      width={24}
      height={26}
      rx={8}
    />
  );
}

// ── Front Silhouette ──────────────────────────────────────────────────────────

function FrontSilhouette() {
  return (
    <g stroke={LINE} strokeWidth="0.8" style={{ pointerEvents: "none" }}>
      {/* ── Head + ears ── */}
      <ellipse fill={SKIN} cx="100" cy="42" rx="30" ry="33" />
      <ellipse fill={SKIN} cx="66"  cy="55" rx="6"  ry="10" />
      <ellipse fill={SKIN} cx="134" cy="55" rx="6"  ry="10" />

      {/* ── Eyebrows ── */}
      <path d="M80,44 Q88,40 96,42.5" fill="none" stroke={LINE} strokeWidth="2.2" strokeLinecap="round" opacity="0.80" />
      <path d="M104,42.5 Q112,40 120,44" fill="none" stroke={LINE} strokeWidth="2.2" strokeLinecap="round" opacity="0.80" />

      {/* ── Eyes ── */}
      <ellipse fill={LINE} cx="88" cy="50" rx="6" ry="4.8" opacity="0.50" />
      <ellipse fill={LINE} cx="112" cy="50" rx="6" ry="4.8" opacity="0.50" />
      <ellipse fill="white" cx="90" cy="49" rx="1.8" ry="1.6" opacity="0.70" />
      <ellipse fill="white" cx="114" cy="49" rx="1.8" ry="1.6" opacity="0.70" />

      {/* ── Nose ── */}
      <path
        d="M 96,54 Q 100,67 96,69 Q 100,74 104,69 Q 100,67 104,54"
        fill="none"
        stroke={LINE}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.80"
      />

      {/* ── Mouth ── */}
      <path d="M86,72 Q100,78 114,72" fill="none" stroke={LINE} strokeWidth="1.6" strokeLinecap="round" opacity="0.70" />

      {/* ── Neck ── */}
      <rect   fill={SKIN}  x="88" y="77" width="24" height="22" rx="11" />
      <rect   fill={JOINT} x="85" y="96" width="30" height="7"  rx="3.5" />

      {/* ── Shoulder ball joints ── */}
      <circle fill={JOINT} cx="54"  cy="118" r="18" />
      <circle fill={JOINT} cx="146" cy="118" r="18" />

      {/* ── Chest ── */}
      <rect fill={SKIN} x="65" y="104" width="70" height="52" rx="15" />

      {/* ── Abdomen ── */}
      <rect fill={SKIN} x="74" y="159" width="52" height="42" rx="13" />

      {/* ── Pelvis ── */}
      <path fill={SKIN} d="M 70,204 H 130 Q 136,228 126,250 Q 116,266 100,264 Q 84,266 74,250 Q 64,228 70,204 Z" />

      {/* ── Viewer-left arm (body RIGHT) ── */}
      <g transform="translate(54,136)">
        <rect fill={SKIN} x="-11" y="0" width="22" height="62" rx="11" transform="rotate(18,0,0)" />
      </g>
      <circle fill={JOINT} cx="35" cy="199" r="13" />
      <g transform="translate(35,213)">
        <rect fill={SKIN} x="-10" y="0" width="20" height="50" rx="10" transform="rotate(-8,0,0)" />
      </g>
      <ellipse fill={JOINT} cx="42" cy="265" rx="12" ry="7" />
      <HandShape cx={42} cy={283} />

      {/* ── Viewer-right arm (body LEFT) ── */}
      <g transform="translate(146,136)">
        <rect fill={SKIN} x="-11" y="0" width="22" height="62" rx="11" transform="rotate(-18,0,0)" />
      </g>
      <circle fill={JOINT} cx="165" cy="199" r="13" />
      <g transform="translate(165,213)">
        <rect fill={SKIN} x="-10" y="0" width="20" height="50" rx="10" transform="rotate(8,0,0)" />
      </g>
      <ellipse fill={JOINT} cx="158" cy="265" rx="12" ry="7" />
      <HandShape cx={158} cy={283} />

      {/* ── Viewer-left leg (body RIGHT) ── */}
      <rect    fill={SKIN}  x="68"  y="262" width="24" height="62" rx="12" />
      <line x1="80" y1="264" x2="80" y2="322" stroke={LINE} strokeWidth="1" opacity="0.55" />
      <circle  fill={JOINT} cx="80"  cy="332" r="14" />
      <rect    fill={SKIN}  x="69"  y="345" width="22" height="66" rx="11" />
      <ellipse fill={JOINT} cx="80"  cy="419" rx="13" ry="8" />
      <ellipse fill={SKIN}  cx="74"  cy="434" rx="22" ry="12" />

      {/* ── Viewer-right leg (body LEFT) ── */}
      <rect    fill={SKIN}  x="108" y="262" width="24" height="62" rx="12" />
      <line x1="120" y1="264" x2="120" y2="322" stroke={LINE} strokeWidth="1" opacity="0.55" />
      <circle  fill={JOINT} cx="120" cy="332" r="14" />
      <rect    fill={SKIN}  x="109" y="345" width="22" height="66" rx="11" />
      <ellipse fill={JOINT} cx="120" cy="419" rx="13" ry="8" />
      <ellipse fill={SKIN}  cx="126" cy="434" rx="22" ry="12" />
    </g>
  );
}

// ── Back Silhouette ───────────────────────────────────────────────────────────

function BackSilhouette() {
  return (
    <g stroke={LINE} strokeWidth="0.8" style={{ pointerEvents: "none" }}>
      <ellipse fill={SKIN} cx="100" cy="42" rx="30" ry="33" />

      <rect   fill={SKIN}  x="88" y="77" width="24" height="22" rx="11" />
      <rect   fill={JOINT} x="85" y="96" width="30" height="7"  rx="3.5" />

      <circle fill={JOINT} cx="54"  cy="118" r="18" />
      <circle fill={JOINT} cx="146" cy="118" r="18" />

      <rect fill={SKIN} x="65" y="104" width="70" height="52" rx="15" />
      <rect fill={SKIN} x="74" y="159" width="52" height="42" rx="13" />

      <g transform="translate(54,136)">
        <rect fill={SKIN} x="-11" y="0" width="22" height="62" rx="11" transform="rotate(18,0,0)" />
      </g>
      <circle fill={JOINT} cx="35" cy="199" r="13" />
      <g transform="translate(35,213)">
        <rect fill={SKIN} x="-10" y="0" width="20" height="50" rx="10" transform="rotate(-8,0,0)" />
      </g>
      <ellipse fill={JOINT} cx="42" cy="265" rx="12" ry="7" />
      <HandShape cx={42} cy={283} />

      <g transform="translate(146,136)">
        <rect fill={SKIN} x="-11" y="0" width="22" height="62" rx="11" transform="rotate(-18,0,0)" />
      </g>
      <circle fill={JOINT} cx="165" cy="199" r="13" />
      <g transform="translate(165,213)">
        <rect fill={SKIN} x="-10" y="0" width="20" height="50" rx="10" transform="rotate(8,0,0)" />
      </g>
      <ellipse fill={JOINT} cx="158" cy="265" rx="12" ry="7" />
      <HandShape cx={158} cy={283} />

      <rect fill={SKIN} x="68"  y="204" width="24" height="50" rx="12" />
      <rect fill={SKIN} x="108" y="204" width="24" height="50" rx="12" />

      <rect    fill={SKIN}  x="68"  y="262" width="24" height="62" rx="12" />
      <circle  fill={JOINT} cx="80"  cy="332" r="14" />
      <rect    fill={SKIN}  x="69"  y="345" width="22" height="66" rx="11" />
      <ellipse fill={JOINT} cx="80"  cy="419" rx="13" ry="8" />
      <ellipse fill={SKIN}  cx="74"  cy="434" rx="22" ry="12" />

      <rect    fill={SKIN}  x="108" y="262" width="24" height="62" rx="12" />
      <circle  fill={JOINT} cx="120" cy="332" r="14" />
      <rect    fill={SKIN}  x="109" y="345" width="22" height="66" rx="11" />
      <ellipse fill={JOINT} cx="120" cy="419" rx="13" ry="8" />
      <ellipse fill={SKIN}  cx="126" cy="434" rx="22" ry="12" />
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
    const conditions = data?.conditions ?? [];
    const avgSeverity = conditions.length > 0
      ? Math.round(conditions.reduce((s, c) => s + c.severity, 0) / conditions.length)
      : 0;
    const { fill: fillColor, stroke: strokeColor } = zoneColors(avgSeverity);
    const strokeWidth = avgSeverity > 0 ? 2 : 0.8;

    if (readonly) {
      return (
        <path
          key={zone.id}
          d={zone.d}
          fill={fillColor}
          stroke={avgSeverity > 0 ? strokeColor : "none"}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ cursor: "default" }}
        />
      );
    }

    const isClickable = mode === "mark" || (mode === "medicate" && avgSeverity > 0);

    return (
      <Tooltip key={zone.id} delayDuration={0}>
        <TooltipTrigger asChild>
          <motion.path
            d={zone.d}
            fill={fillColor}
            stroke={avgSeverity > 0 ? strokeColor : "rgba(0,0,0,0)"}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            data-testid={`zone-${zone.id}`}
            className={isClickable ? "cursor-pointer transition-all" : "cursor-default"}
            whileTap={isClickable ? { scale: 0.93, opacity: 0.75 } : {}}
            onClick={(e) => {
              e.preventDefault();
              if (mode === "mark") onZoneInteract?.(zone.id);
              else if (avgSeverity > 0) onZoneMedicateClick?.(zone.id);
            }}
          />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[180px]">
          <p className="font-semibold text-sm">{zone.label}</p>
          {conditions.length > 0 ? (
            conditions.map((c) => (
              <p key={c.condition} className="text-xs text-muted-foreground">
                {c.condition} — {sevLabel(c.severity)}
              </p>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">Tap to mark</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  });

  return (
    <div className="relative w-full max-w-[220px] mx-auto" style={{ aspectRatio: "200/450" }}>
      <svg
        viewBox="0 0 200 450"
        className="w-full h-full"
        style={{ touchAction: readonly ? "auto" : "none", userSelect: "none" }}
      >
        {view === "front" ? <FrontSilhouette /> : <BackSilhouette />}
        <g>{zonePaths}</g>

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
