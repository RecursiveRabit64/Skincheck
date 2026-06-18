import type { SkinCondition } from "@/components/BodyDoll";

export const NATURAL_PROGRESSION: Record<SkinCondition, number> = {
  "Acne":               0.20,
  "Cystic Acne":        0.30,
  "Blackheads":         0.05,
  "Rash":               0.15,
  "Hives":             -0.40,
  "Contact Dermatitis": 0.10,
  "Eczema":             0.08,
  "Psoriasis":          0.05,
  "Infection":          0.45,
  "Fungal":             0.35,
  "Dryness":            0.10,
  "Sunburn":           -0.30,
};

export const MEDICATION_RATE: Record<string, number> = {
  "Benzoyl Peroxide":     -1.5,
  "Salicylic Acid":       -1.2,
  "Adapalene":            -1.3,
  "Clindamycin":          -1.6,
  "Retinol":              -1.0,
  "Niacinamide":          -0.7,
  "Hydrocortisone Cream": -2.0,
  "Antibiotic Cream":     -1.8,
  "Antifungal Cream":     -1.5,
  "Tea Tree Oil":         -0.8,
  "Moisturizer":          -0.5,
  "Sunscreen":            -0.3,
};

export interface AreaEntry {
  region: string;
  condition: string;
  severity: number;
  medication?: string | null;
}

export function simulateSeverity(area: AreaEntry, day: number): number {
  if (day === 0) return area.severity;
  const rate = area.medication
    ? (MEDICATION_RATE[area.medication] ?? -0.8)
    : (NATURAL_PROGRESSION[area.condition as SkinCondition] ?? 0.1);
  return Math.max(0, Math.min(10, area.severity + rate * day));
}
