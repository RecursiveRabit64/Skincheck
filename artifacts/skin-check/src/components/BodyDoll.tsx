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

// ── Zone definitions ──────────────────────────────────────────────────────────
//
// Layout (viewBox 0 0 200 490):
//   Head cy=42  ·  Neck y=77  ·  Shoulder balls cy=118
//   Chest y=104  ·  Belly y=161  ·  Pelvis shorts y=204
//   Left arm angled outward ~18°  ·  Elbow cy≈200  ·  Forearms angled ~8°
//   Wrists cy≈266  ·  Hands with finger stubs
//   Thighs y=262  ·  Knees cy=344  ·  Shins y=357
//   Ankles cy=444  ·  Feet with toe bumps cy=460

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
  { id: "chin",             d: "M84,88 Q100,102 116,88 Q112,107 100,110 Q88,107 84,88 Z",                            label: "Chin",          cx: 100, cy: 98 },

  // ── Neck ─────────────────────────────────────────────────────────────────
  { id: "neck",             d: rr(88, 77, 24, 24, 11),     label: "Neck",                cx: 100, cy: 89 },

  // ── Shoulders (large circles outside torso) ───────────────────────────────
  { id: "left_shoulder",    d: el(54, 118, 22, 18),         label: "Left Shoulder",       cx: 54,  cy: 118 },
  { id: "right_shoulder",   d: el(146, 118, 22, 18),        label: "Right Shoulder",      cx: 146, cy: 118 },

  // ── Torso ─────────────────────────────────────────────────────────────────
  { id: "chest",            d: rr(70, 104, 60, 54, 16),     label: "Chest",               cx: 100, cy: 131 },
  { id: "abdomen",          d: rr(78, 161, 44, 40, 13),     label: "Abdomen",             cx: 100, cy: 181 },

  // ── Arms — left (angled outward; ellipse zones cover visual area) ─────────
  { id: "left_upper_arm",   d: el(46, 167, 18, 38),         label: "Left Upper Arm",      cx: 46,  cy: 167 },
  { id: "left_forearm",     d: el(33, 238, 14, 28),         label: "Left Forearm",        cx: 33,  cy: 238 },
  { id: "left_wrist",       d: el(29, 266, 12, 7),          label: "Left Wrist",          cx: 29,  cy: 266 },
  { id: "left_hand",        d: el(27, 284, 14, 20),         label: "Left Hand",           cx: 27,  cy: 284 },

  // ── Arms — right ──────────────────────────────────────────────────────────
  { id: "right_upper_arm",  d: el(154, 167, 18, 38),        label: "Right Upper Arm",     cx: 154, cy: 167 },
  { id: "right_forearm",    d: el(167, 238, 14, 28),        label: "Right Forearm",       cx: 167, cy: 238 },
  { id: "right_wrist",      d: el(171, 266, 12, 7),         label: "Right Wrist",         cx: 171, cy: 266 },
  { id: "right_hand",       d: el(173, 284, 14, 20),        label: "Right Hand",          cx: 173, cy: 284 },

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
  { id: "left_foot",        d: el(74, 460, 23, 14),         label: "Left Foot",           cx: 74,  cy: 460 },
  { id: "right_foot",       d: el(126, 460, 23, 14),        label: "Right Foot",          cx: 126, cy: 460 },
];

export const backZonesDef: ZoneDef[] = [
  // ── Head / neck (back) ───────────────────────────────────────────────────
  { id: "occipital",             d: "M70,8 Q100,-2 130,8 Q134,28 100,36 Q66,28 70,8 Z",    label: "Back of Head",           cx: 100, cy: 18 },
  { id: "nape",                  d: rr(88, 77, 24, 24, 11),                                  label: "Nape of Neck",           cx: 100, cy: 89 },

  // ── Torso (back) ─────────────────────────────────────────────────────────
  { id: "left_shoulder_back",    d: el(54, 118, 22, 18),                                     label: "Left Shoulder (Back)",   cx: 54,  cy: 118 },
  { id: "right_shoulder_back",   d: el(146, 118, 22, 18),                                    label: "Right Shoulder (Back)",  cx: 146, cy: 118 },
  { id: "upper_back",            d: rr(70, 104, 60, 54, 16),                                 label: "Upper Back",             cx: 100, cy: 131 },
  { id: "lower_back",            d: rr(78, 161, 44, 40, 13),                                 label: "Lower Back",             cx: 100, cy: 181 },

  // ── Arms — back left ─────────────────────────────────────────────────────
  { id: "back_left_upper_arm",   d: el(46, 167, 18, 38),                                     label: "Back of Left Upper Arm", cx: 46,  cy: 167 },
  { id: "left_inner_elbow",      d: el(36, 201, 14, 12),                                     label: "Left Elbow",             cx: 36,  cy: 201 },
  { id: "back_left_forearm",     d: el(33, 238, 14, 28),                                     label: "Back of Left Forearm",   cx: 33,  cy: 238 },
  { id: "back_left_wrist",       d: el(29, 266, 12, 7),                                      label: "Left Wrist (Back)",      cx: 29,  cy: 266 },
  { id: "back_left_hand",        d: el(27, 284, 14, 20),                                     label: "Back of Left Hand",      cx: 27,  cy: 284 },

  // ── Arms — back right ────────────────────────────────────────────────────
  { id: "back_right_upper_arm",  d: el(154, 167, 18, 38),                                    label: "Back of Right Upper Arm",cx: 154, cy: 167 },
  { id: "right_inner_elbow",     d: el(164, 201, 14, 12),                                    label: "Right Elbow",            cx: 164, cy: 201 },
  { id: "back_right_forearm",    d: el(167, 238, 14, 28),                                    label: "Back of Right Forearm",  cx: 167, cy: 238 },
  { id: "back_right_wrist",      d: el(171, 266, 12, 7),                                     label: "Right Wrist (Back)",     cx: 171, cy: 266 },
  { id: "back_right_hand",       d: el(173, 284, 14, 20),                                    label: "Back of Right Hand",     cx: 173, cy: 284 },

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
  { id: "left_heel",             d: el(74, 460, 23, 14),                                     label: "Left Heel",              cx: 74,  cy: 460 },
  { id: "right_heel",            d: el(126, 460, 23, 14),                                    label: "Right Heel",             cx: 126, cy: 460 },
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

// ── Hand shape helper (fingers pointing downward) ─────────────────────────────
//
// cx/cy = center of palm. spread: 1=left hand, -1=right hand (mirrors finger order)

function HandShape({ cx, cy, spread = 1 }: { cx: number; cy: number; spread?: number }) {
  const pw = 14; const ph = 14; // palm half-width and half-height
  const fw = 3.8;               // finger half-width
  const fg = 1.8;               // gap between fingers
  const fl = 9;                 // finger length
  const fTotal = 4 * (fw * 2) + 3 * fg; // total finger row width
  const fStart = cx - (fTotal / 2) * spread;
  const fingers = [0, 1, 2, 3].map((i) => fStart + (i * (fw * 2 + fg)) * spread);

  return (
    <g fill={SKIN} stroke={LINE} strokeWidth="0.8">
      {/* Palm */}
      <rect x={cx - pw} y={cy - ph} width={pw * 2} height={ph * 2} rx={pw * 0.6} />
      {/* Four finger stubs below palm */}
      {fingers.map((fx, i) => (
        <rect key={i} x={fx - fw} y={cy + ph - 3} width={fw * 2} height={fl} rx={fw} />
      ))}
      {/* Thumb stub on the outer side */}
      <rect
        x={cx + (pw - 2) * spread - fw}
        y={cy - ph + 2}
        width={fw * 2}
        height={fl - 1}
        rx={fw}
        transform={`rotate(${spread * -32},${cx + (pw - 2) * spread},${cy - ph + 2})`}
      />
    </g>
  );
}

// ── Foot shape helper (toes pointing outward / slightly forward) ──────────────

function FootShape({ cx, cy, side }: { cx: number; cy: number; side: "left" | "right" }) {
  const dir = side === "left" ? -1 : 1; // toe direction: left foot toes go left
  const toeBase = cx + dir * 12;        // x-center of toe row
  const toeY = cy + 8;
  const toeOffsets = [-8, -4, 0, 4, 8]; // relative x offsets for 5 toes

  return (
    <g fill={SKIN} stroke={LINE} strokeWidth="0.8">
      <ellipse cx={cx} cy={cy} rx={22} ry={12} />
      {toeOffsets.map((offset, i) => (
        <circle key={i} cx={toeBase + offset * dir * 0.6} cy={toeY + Math.abs(offset) * 0.25} r={3.5} />
      ))}
    </g>
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

      {/* ── Neck collar ── */}
      <rect   fill={SKIN}  x="88" y="77" width="24" height="22" rx="11" />
      <rect   fill={JOINT} x="85" y="96" width="30" height="7"  rx="3.5" />

      {/* ── Shoulder ball joints (prominent circles) ── */}
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

      {/* ── Left arm (angled outward ~18°) ── */}
      <g transform="translate(54,136)">
        <rect fill={SKIN} x="-11" y="0" width="22" height="62" rx="11" transform="rotate(-18,0,0)" />
      </g>
      {/* Left elbow ball */}
      <circle fill={JOINT} cx="35" cy="200" r="13" />
      {/* Left forearm (slight inward angle ~8°) */}
      <g transform="translate(35,213)">
        <rect fill={SKIN} x="-10" y="0" width="20" height="50" rx="10" transform="rotate(-8,0,0)" />
      </g>
      {/* Left wrist oval */}
      <ellipse fill={JOINT} cx="29" cy="265" rx="12" ry="7" />
      {/* Left hand */}
      <HandShape cx={27} cy={284} spread={1} />

      {/* ── Right arm (angled outward ~18°) ── */}
      <g transform="translate(146,136)">
        <rect fill={SKIN} x="-11" y="0" width="22" height="62" rx="11" transform="rotate(18,0,0)" />
      </g>
      {/* Right elbow ball */}
      <circle fill={JOINT} cx="165" cy="200" r="13" />
      {/* Right forearm */}
      <g transform="translate(165,213)">
        <rect fill={SKIN} x="-10" y="0" width="20" height="50" rx="10" transform="rotate(8,0,0)" />
      </g>
      {/* Right wrist oval */}
      <ellipse fill={JOINT} cx="171" cy="265" rx="12" ry="7" />
      {/* Right hand */}
      <HandShape cx={173} cy={284} spread={-1} />

      {/* ── Left leg ── */}
      <rect    fill={SKIN}  x="68"  y="262" width="24" height="76" rx="12" />
      <circle  fill={JOINT} cx="80"  cy="344" r="15" />
      <rect    fill={SKIN}  x="69"  y="357" width="22" height="80" rx="11" />
      <ellipse fill={JOINT} cx="80"  cy="444" rx="13" ry="8" />
      <FootShape cx={74} cy={460} side="left" />

      {/* ── Right leg ── */}
      <rect    fill={SKIN}  x="108" y="262" width="24" height="76" rx="12" />
      <circle  fill={JOINT} cx="120" cy="344" r="15" />
      <rect    fill={SKIN}  x="109" y="357" width="22" height="80" rx="11" />
      <ellipse fill={JOINT} cx="120" cy="444" rx="13" ry="8" />
      <FootShape cx={126} cy={460} side="right" />
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

      {/* ── Upper back (wider) ── */}
      <rect fill={SKIN} x="70" y="104" width="60" height="54" rx="16" />

      {/* ── Lower back ── */}
      <rect fill={SKIN} x="78" y="161" width="44" height="40" rx="13" />

      {/* ── Left arm (back — same angles) ── */}
      <g transform="translate(54,136)">
        <rect fill={SKIN} x="-11" y="0" width="22" height="62" rx="11" transform="rotate(-18,0,0)" />
      </g>
      <circle fill={JOINT} cx="35" cy="200" r="13" />
      <g transform="translate(35,213)">
        <rect fill={SKIN} x="-10" y="0" width="20" height="50" rx="10" transform="rotate(-8,0,0)" />
      </g>
      <ellipse fill={JOINT} cx="29" cy="265" rx="12" ry="7" />
      <HandShape cx={27} cy={284} spread={1} />

      {/* ── Right arm (back) ── */}
      <g transform="translate(146,136)">
        <rect fill={SKIN} x="-11" y="0" width="22" height="62" rx="11" transform="rotate(18,0,0)" />
      </g>
      <circle fill={JOINT} cx="165" cy="200" r="13" />
      <g transform="translate(165,213)">
        <rect fill={SKIN} x="-10" y="0" width="20" height="50" rx="10" transform="rotate(8,0,0)" />
      </g>
      <ellipse fill={JOINT} cx="171" cy="265" rx="12" ry="7" />
      <HandShape cx={173} cy={284} spread={-1} />

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
