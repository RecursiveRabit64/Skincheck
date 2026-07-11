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

// ── Arm geometry (SVG rotate(+θ) = clockwise visually in SVG y-down space) ───
//
//  rotate(+18) on a pivot at the top → bottom goes LEFT  → use for LEFT  upper arm
//  rotate(-18) on a pivot at the top → bottom goes RIGHT → use for RIGHT upper arm
//
//  Left upper arm:  pivot (54,136) rotate(+18) → bottom ≈ (35, 195)
//  Right upper arm: pivot (146,136) rotate(-18) → bottom ≈ (165, 195)
//  Left forearm:    pivot (35,213) rotate(-8)   → bottom ≈ (42, 263)  (slight inward)
//  Right forearm:   pivot (165,213) rotate(+8)  → bottom ≈ (158, 263) (slight inward)

// ── Zone definitions ──────────────────────────────────────────────────────────
//
// Arm zone hitboxes are ellipses centered at each segment's midpoint, sized
// to cover the angled visual area.  All other zones use rr() or el() as before.

export const frontZonesDef: ZoneDef[] = [
  // ── Face ─────────────────────────────────────────────────────────────────
  { id: "scalp",            d: "M70,8 Q100,-2 130,8 Q134,28 100,36 Q66,28 70,8 Z",                                   label: "Scalp",         cx: 100, cy: 18 },
  { id: "forehead",         d: "M68,30 Q100,22 132,30 Q130,54 100,58 Q70,54 68,30 Z",                                label: "Forehead",      cx: 100, cy: 40 },
  { id: "left_ear",         d: "M60,48 Q50,51 50,62 Q50,73 60,76 Q67,71 66,62 Q66,52 60,48 Z",                      label: "Left Ear",      cx: 53, cy: 62 },
  { id: "right_ear",        d: "M140,48 Q150,51 150,62 Q150,73 140,76 Q133,71 134,62 Q134,52 140,48 Z",             label: "Right Ear",     cx: 147, cy: 62 },
  { id: "left_cheek",       d: "M68,52 Q60,70 74,86 Q88,78 90,62 Q80,50 68,52 Z",                                   label: "Left Cheek",    cx: 74, cy: 68 },
  { id: "right_cheek",      d: "M132,52 Q140,70 126,86 Q112,78 110,62 Q120,50 132,52 Z",                            label: "Right Cheek",   cx: 126, cy: 68 },
  { id: "nose",             d: "M93,52 Q100,46 107,52 Q110,66 107,74 Q100,78 93,74 Q90,66 93,52 Z",                 label: "Nose",          cx: 100, cy: 62 },
  { id: "lips",             d: "M86,76 Q93,70 100,74 Q107,70 114,76 Q111,90 100,93 Q89,90 86,76 Z",                 label: "Lips",          cx: 100, cy: 82 },
  { id: "chin",             d: "M84,88 Q100,102 116,88 Q112,107 100,110 Q88,107 84,88 Z",                           label: "Chin",          cx: 100, cy: 98 },

  // ── Neck ─────────────────────────────────────────────────────────────────
  { id: "neck",             d: rr(88, 77, 24, 22, 11),     label: "Neck",                cx: 100, cy: 88 },

  // ── Shoulders ─────────────────────────────────────────────────────────────
  { id: "left_shoulder",    d: el(54, 118, 22, 18),         label: "Left Shoulder",       cx: 54,  cy: 118 },
  { id: "right_shoulder",   d: el(146, 118, 22, 18),        label: "Right Shoulder",      cx: 146, cy: 118 },

  // ── Torso ─────────────────────────────────────────────────────────────────
  { id: "chest",            d: rr(70, 104, 60, 54, 16),     label: "Chest",               cx: 100, cy: 131 },
  { id: "abdomen",          d: rr(78, 161, 44, 40, 13),     label: "Abdomen",             cx: 100, cy: 181 },

  // ── Arms — left ───────────────────────────────────────────────────────────
  // Upper arm pivot (54,136) rotate(+18): bottom ≈ (35,195); midpoint ≈ (45,166)
  { id: "left_upper_arm",   d: el(45, 166, 17, 36),         label: "Left Upper Arm",      cx: 45,  cy: 166 },
  // Forearm pivot (35,213) rotate(-8): bottom ≈ (42,263); midpoint ≈ (39,238)
  { id: "left_forearm",     d: el(39, 238, 14, 28),         label: "Left Forearm",        cx: 39,  cy: 238 },
  { id: "left_wrist",       d: el(42, 267, 12, 7),          label: "Left Wrist",          cx: 42,  cy: 267 },
  { id: "left_hand",        d: el(42, 287, 14, 22),         label: "Left Hand",           cx: 42,  cy: 287 },

  // ── Arms — right ──────────────────────────────────────────────────────────
  // Upper arm pivot (146,136) rotate(-18): bottom ≈ (165,195); midpoint ≈ (156,166)
  { id: "right_upper_arm",  d: el(156, 166, 17, 36),        label: "Right Upper Arm",     cx: 156, cy: 166 },
  // Forearm pivot (165,213) rotate(+8): bottom ≈ (158,263); midpoint ≈ (162,238)
  { id: "right_forearm",    d: el(162, 238, 14, 28),        label: "Right Forearm",       cx: 162, cy: 238 },
  { id: "right_wrist",      d: el(158, 267, 12, 7),         label: "Right Wrist",         cx: 158, cy: 267 },
  { id: "right_hand",       d: el(158, 287, 14, 22),        label: "Right Hand",          cx: 158, cy: 287 },

  // ── Thighs ────────────────────────────────────────────────────────────────
  { id: "left_thigh",       d: rr(68, 262, 12, 76, 6),     label: "Left Thigh",          cx: 74,  cy: 300 },
  { id: "left_inner_thigh", d: rr(80, 262, 12, 76, 6),     label: "Left Inner Thigh",    cx: 86,  cy: 300 },
  { id: "right_inner_thigh",d: rr(108, 262, 12, 76, 6),    label: "Right Inner Thigh",   cx: 114, cy: 300 },
  { id: "right_thigh",      d: rr(120, 262, 12, 76, 6),    label: "Right Thigh",         cx: 126, cy: 300 },

  // ── Knees ─────────────────────────────────────────────────────────────────
  { id: "left_knee",        d: el(80, 344, 16, 14),         label: "Left Knee",           cx: 80,  cy: 344 },
  { id: "right_knee",       d: el(120, 344, 16, 14),        label: "Right Knee",          cx: 120, cy: 344 },

  // ── Shins ─────────────────────────────────────────────────────────────────
  { id: "left_shin",        d: rr(69, 357, 22, 80, 11),     label: "Left Shin",           cx: 80,  cy: 397 },
  { id: "right_shin",       d: rr(109, 357, 22, 80, 11),    label: "Right Shin",          cx: 120, cy: 397 },

  // ── Ankles ────────────────────────────────────────────────────────────────
  { id: "left_ankle",       d: el(80, 444, 13, 8),          label: "Left Ankle",          cx: 80,  cy: 444 },
  { id: "right_ankle",      d: el(120, 444, 13, 8),         label: "Right Ankle",         cx: 120, cy: 444 },

  // ── Feet ──────────────────────────────────────────────────────────────────
  { id: "left_foot",        d: el(74, 460, 23, 13),         label: "Left Foot",           cx: 74,  cy: 460 },
  { id: "right_foot",       d: el(126, 460, 23, 13),        label: "Right Foot",          cx: 126, cy: 460 },
];

export const backZonesDef: ZoneDef[] = [
  // ── Head / neck (back) ───────────────────────────────────────────────────
  { id: "occipital",             d: "M70,8 Q100,-2 130,8 Q134,28 100,36 Q66,28 70,8 Z",    label: "Back of Head",           cx: 100, cy: 18 },
  { id: "nape",                  d: rr(88, 77, 24, 22, 11),                                  label: "Nape of Neck",           cx: 100, cy: 88 },

  // ── Torso (back) ─────────────────────────────────────────────────────────
  { id: "left_shoulder_back",    d: el(54, 118, 22, 18),                                     label: "Left Shoulder (Back)",   cx: 54,  cy: 118 },
  { id: "right_shoulder_back",   d: el(146, 118, 22, 18),                                    label: "Right Shoulder (Back)",  cx: 146, cy: 118 },
  { id: "upper_back",            d: rr(70, 104, 60, 54, 16),                                 label: "Upper Back",             cx: 100, cy: 131 },
  { id: "lower_back",            d: rr(78, 161, 44, 40, 13),                                 label: "Lower Back",             cx: 100, cy: 181 },

  // ── Arms — back left ─────────────────────────────────────────────────────
  { id: "back_left_upper_arm",   d: el(45, 166, 17, 36),                                     label: "Back of Left Upper Arm", cx: 45,  cy: 166 },
  { id: "left_inner_elbow",      d: el(35, 200, 14, 12),                                     label: "Left Elbow",             cx: 35,  cy: 200 },
  { id: "back_left_forearm",     d: el(39, 238, 14, 28),                                     label: "Back of Left Forearm",   cx: 39,  cy: 238 },
  { id: "back_left_wrist",       d: el(42, 267, 12, 7),                                      label: "Left Wrist (Back)",      cx: 42,  cy: 267 },
  { id: "back_left_hand",        d: el(42, 287, 14, 22),                                     label: "Back of Left Hand",      cx: 42,  cy: 287 },

  // ── Arms — back right ────────────────────────────────────────────────────
  { id: "back_right_upper_arm",  d: el(156, 166, 17, 36),                                    label: "Back of Right Upper Arm",cx: 156, cy: 166 },
  { id: "right_inner_elbow",     d: el(165, 200, 14, 12),                                    label: "Right Elbow",            cx: 165, cy: 200 },
  { id: "back_right_forearm",    d: el(162, 238, 14, 28),                                    label: "Back of Right Forearm",  cx: 162, cy: 238 },
  { id: "back_right_wrist",      d: el(158, 267, 12, 7),                                     label: "Right Wrist (Back)",     cx: 158, cy: 267 },
  { id: "back_right_hand",       d: el(158, 287, 14, 22),                                    label: "Back of Right Hand",     cx: 158, cy: 287 },

  // ── Buttocks ─────────────────────────────────────────────────────────────
  { id: "left_buttock",          d: rr(68, 204, 24, 54, 12),                                 label: "Left Buttock",           cx: 80,  cy: 231 },
  { id: "right_buttock",         d: rr(108, 204, 24, 54, 12),                                label: "Right Buttock",          cx: 120, cy: 231 },

  // ── Thighs (back) ────────────────────────────────────────────────────────
  { id: "back_left_thigh",       d: rr(68, 262, 24, 74, 12),                                 label: "Back of Left Thigh",     cx: 80,  cy: 299 },
  { id: "back_right_thigh",      d: rr(108, 262, 24, 74, 12),                                label: "Back of Right Thigh",    cx: 120, cy: 299 },

  // ── Knees (back) ─────────────────────────────────────────────────────────
  { id: "left_back_knee",        d: el(80, 344, 16, 14),                                     label: "Back of Left Knee",      cx: 80,  cy: 344 },
  { id: "right_back_knee",       d: el(120, 344, 16, 14),                                    label: "Back of Right Knee",     cx: 120, cy: 344 },

  // ── Calves ───────────────────────────────────────────────────────────────
  { id: "left_calf",             d: rr(69, 357, 22, 80, 11),                                 label: "Left Calf",              cx: 80,  cy: 397 },
  { id: "right_calf",            d: rr(109, 357, 22, 80, 11),                                label: "Right Calf",             cx: 120, cy: 397 },

  // ── Heels ────────────────────────────────────────────────────────────────
  { id: "left_heel",             d: el(74, 460, 23, 13),                                     label: "Left Heel",              cx: 74,  cy: 460 },
  { id: "right_heel",            d: el(126, 460, 23, 13),                                    label: "Right Heel",             cx: 126, cy: 460 },
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

// ── Hand silhouette (palm + 4 fingers + thumb) ────────────────────────────────
// spread=1 for left hand (thumb on right/outer side), spread=-1 for right hand

function HandShape({ cx, cy, spread = 1 }: { cx: number; cy: number; spread?: number }) {
  const pw = 13;   // palm half-width
  const ph = 13;   // palm half-height
  const fw = 3.6;  // finger half-width
  const fg = 1.6;  // gap between fingers
  const fl = 8;    // finger length (stub)
  const unit = fw * 2 + fg;
  const totalFW = 4 * unit - fg;
  const f0 = cx - (totalFW / 2) * spread;

  return (
    <g fill={SKIN} stroke={LINE} strokeWidth="0.8">
      {/* Palm */}
      <rect x={cx - pw} y={cy - ph} width={pw * 2} height={ph * 2} rx={pw * 0.55} />
      {/* Four finger stubs below palm */}
      {[0, 1, 2, 3].map((i) => {
        const fx = f0 + i * unit * spread;
        return <rect key={i} x={fx - fw} y={cy + ph - 4} width={fw * 2} height={fl} rx={fw} />;
      })}
      {/* Thumb on outer side */}
      <rect
        x={cx + (pw - 1) * spread - fw}
        y={cy - ph + 4}
        width={fw * 2}
        height={fl - 1}
        rx={fw}
        transform={`rotate(${spread * -35},${cx + (pw - 1) * spread},${cy - ph + 4})`}
      />
    </g>
  );
}

// ── Front Silhouette ──────────────────────────────────────────────────────────
//
// Arm angles (SVG y-down: rotate(+θ)=clockwise visually):
//   Left  upper arm: pivot(54,136)  rotate(+18) → bottom ≈ (35,195)
//   Right upper arm: pivot(146,136) rotate(-18) → bottom ≈ (165,195)
//   Left  forearm:   pivot(35,213)  rotate(-8)  → bottom ≈ (42,263) [slight inward]
//   Right forearm:   pivot(165,213) rotate(+8)  → bottom ≈ (158,263)

function FrontSilhouette() {
  return (
    <g stroke={LINE} strokeWidth="0.8" style={{ pointerEvents: "none" }}>
      {/* ── Head + ears ── */}
      <ellipse fill={SKIN} cx="100" cy="42" rx="30" ry="33" />
      <ellipse fill={SKIN} cx="66"  cy="55" rx="6"  ry="10" />
      <ellipse fill={SKIN} cx="134" cy="55" rx="6"  ry="10" />

      {/* ── Nose hint ── */}
      <path
        d="M 97,53 Q 100,65 97,67 Q 100,70 103,67 Q 100,65 103,53"
        fill="none"
        stroke={LINE}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.65"
      />

      {/* ── Neck collar ── */}
      <rect   fill={SKIN}  x="88" y="77" width="24" height="22" rx="11" />
      <rect   fill={JOINT} x="85" y="96" width="30" height="7"  rx="3.5" />

      {/* ── Shoulder ball joints (large circles) ── */}
      <circle fill={JOINT} cx="54"  cy="118" r="18" />
      <circle fill={JOINT} cx="146" cy="118" r="18" />

      {/* ── Chest (wider) ── */}
      <rect fill={SKIN} x="70" y="104" width="60" height="54" rx="16" />

      {/* ── Belly ── */}
      <rect fill={SKIN} x="78" y="161" width="44" height="40" rx="13" />

      {/* ── Pelvis "shorts" shape ── */}
      <path
        fill={SKIN}
        d="M 72,204 H 128 Q 134,230 124,250 Q 114,266 100,264 Q 86,266 76,250 Q 66,230 72,204 Z"
      />

      {/* ── Left arm ── */}
      {/* Upper arm: pivot (54,136) rotate(+18) */}
      <g transform="translate(54,136)">
        <rect fill={SKIN} x="-11" y="0" width="22" height="62" rx="11" transform="rotate(18,0,0)" />
      </g>
      {/* Left elbow ball ≈ (35,199) */}
      <circle fill={JOINT} cx="35" cy="199" r="13" />
      {/* Left forearm: pivot (35,213) rotate(-8) */}
      <g transform="translate(35,213)">
        <rect fill={SKIN} x="-10" y="0" width="20" height="50" rx="10" transform="rotate(-8,0,0)" />
      </g>
      {/* Left wrist oval ≈ (42,265) */}
      <ellipse fill={JOINT} cx="42" cy="265" rx="12" ry="7" />
      {/* Left hand ≈ (42,283) */}
      <HandShape cx={42} cy={283} spread={1} />

      {/* ── Right arm ── */}
      {/* Upper arm: pivot (146,136) rotate(-18) */}
      <g transform="translate(146,136)">
        <rect fill={SKIN} x="-11" y="0" width="22" height="62" rx="11" transform="rotate(-18,0,0)" />
      </g>
      {/* Right elbow ball ≈ (165,199) */}
      <circle fill={JOINT} cx="165" cy="199" r="13" />
      {/* Right forearm: pivot (165,213) rotate(+8) */}
      <g transform="translate(165,213)">
        <rect fill={SKIN} x="-10" y="0" width="20" height="50" rx="10" transform="rotate(8,0,0)" />
      </g>
      {/* Right wrist oval ≈ (158,265) */}
      <ellipse fill={JOINT} cx="158" cy="265" rx="12" ry="7" />
      {/* Right hand ≈ (158,283) */}
      <HandShape cx={158} cy={283} spread={-1} />

      {/* ── Left leg ── */}
      <rect    fill={SKIN}  x="68"  y="262" width="24" height="76" rx="12" />
      <circle  fill={JOINT} cx="80"  cy="344" r="15" />
      <rect    fill={SKIN}  x="69"  y="357" width="22" height="80" rx="11" />
      <ellipse fill={JOINT} cx="80"  cy="444" rx="13" ry="8" />
      <ellipse fill={SKIN}  cx="74"  cy="460" rx="22" ry="12" />

      {/* ── Right leg ── */}
      <rect    fill={SKIN}  x="108" y="262" width="24" height="76" rx="12" />
      <circle  fill={JOINT} cx="120" cy="344" r="15" />
      <rect    fill={SKIN}  x="109" y="357" width="22" height="80" rx="11" />
      <ellipse fill={JOINT} cx="120" cy="444" rx="13" ry="8" />
      <ellipse fill={SKIN}  cx="126" cy="460" rx="22" ry="12" />
    </g>
  );
}

// ── Back Silhouette ───────────────────────────────────────────────────────────

function BackSilhouette() {
  return (
    <g stroke={LINE} strokeWidth="0.8" style={{ pointerEvents: "none" }}>
      {/* ── Head (back) ── */}
      <ellipse fill={SKIN} cx="100" cy="42" rx="30" ry="33" />

      {/* ── Nape ── */}
      <rect   fill={SKIN}  x="88" y="77" width="24" height="22" rx="11" />
      <rect   fill={JOINT} x="85" y="96" width="30" height="7"  rx="3.5" />

      {/* ── Shoulder ball joints ── */}
      <circle fill={JOINT} cx="54"  cy="118" r="18" />
      <circle fill={JOINT} cx="146" cy="118" r="18" />

      {/* ── Upper back ── */}
      <rect fill={SKIN} x="70" y="104" width="60" height="54" rx="16" />

      {/* ── Lower back ── */}
      <rect fill={SKIN} x="78" y="161" width="44" height="40" rx="13" />

      {/* ── Left arm (back — same angles) ── */}
      <g transform="translate(54,136)">
        <rect fill={SKIN} x="-11" y="0" width="22" height="62" rx="11" transform="rotate(18,0,0)" />
      </g>
      <circle fill={JOINT} cx="35" cy="199" r="13" />
      <g transform="translate(35,213)">
        <rect fill={SKIN} x="-10" y="0" width="20" height="50" rx="10" transform="rotate(-8,0,0)" />
      </g>
      <ellipse fill={JOINT} cx="42" cy="265" rx="12" ry="7" />
      <HandShape cx={42} cy={283} spread={1} />

      {/* ── Right arm (back) ── */}
      <g transform="translate(146,136)">
        <rect fill={SKIN} x="-11" y="0" width="22" height="62" rx="11" transform="rotate(-18,0,0)" />
      </g>
      <circle fill={JOINT} cx="165" cy="199" r="13" />
      <g transform="translate(165,213)">
        <rect fill={SKIN} x="-10" y="0" width="20" height="50" rx="10" transform="rotate(8,0,0)" />
      </g>
      <ellipse fill={JOINT} cx="158" cy="265" rx="12" ry="7" />
      <HandShape cx={158} cy={283} spread={-1} />

      {/* ── Buttocks ── */}
      <rect fill={SKIN} x="68"  y="204" width="24" height="54" rx="12" />
      <rect fill={SKIN} x="108" y="204" width="24" height="54" rx="12" />

      {/* ── Left leg (back) ── */}
      <rect    fill={SKIN}  x="68"  y="262" width="24" height="74" rx="12" />
      <circle  fill={JOINT} cx="80"  cy="344" r="15" />
      <rect    fill={SKIN}  x="69"  y="357" width="22" height="80" rx="11" />
      <ellipse fill={JOINT} cx="80"  cy="444" rx="13" ry="8" />
      <ellipse fill={SKIN}  cx="74"  cy="460" rx="22" ry="12" />

      {/* ── Right leg (back) ── */}
      <rect    fill={SKIN}  x="108" y="262" width="24" height="74" rx="12" />
      <circle  fill={JOINT} cx="120" cy="344" r="15" />
      <rect    fill={SKIN}  x="109" y="357" width="22" height="80" rx="11" />
      <ellipse fill={JOINT} cx="120" cy="444" rx="13" ry="8" />
      <ellipse fill={SKIN}  cx="126" cy="460" rx="22" ry="12" />
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
    <div className="relative w-full max-w-[220px] mx-auto" style={{ aspectRatio: "200/490" }}>
      <svg
        viewBox="0 0 200 490"
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
