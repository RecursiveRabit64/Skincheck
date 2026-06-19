export const NATURAL_PROGRESSION: Record<string, number> = {
  // Acne family (worsen without treatment)
  "Acne Vulgaris":        0.20,
  "Cystic Acne":          0.30,
  "Blackheads":           0.05,
  "Whiteheads":           0.05,
  "Hormonal Acne":        0.25,
  "Milia":                0.02,
  // Eczema family
  "Atopic Dermatitis":    0.15,
  "Contact Dermatitis":   0.10,
  "Dyshidrotic Eczema":   0.12,
  "Neurodermatitis":      0.08,
  "Seborrheic Dermatitis":0.06,
  // Rash / Allergic
  "Hives":               -0.40,
  "Pityriasis Rosea":    -0.08,
  "Drug Rash":            0.15,
  "Heat Rash":           -0.25,
  // Inflammatory
  "Psoriasis":            0.05,
  "Rosacea":              0.08,
  "Perioral Dermatitis":  0.10,
  // Infection (worsen significantly without treatment)
  "Bacterial Infection":  0.45,
  "Impetigo":             0.50,
  "Folliculitis":         0.30,
  // Fungal
  "Ringworm":             0.35,
  "Tinea Versicolor":     0.20,
  "Athlete's Foot":       0.30,
  "Candidiasis":          0.35,
  // Other
  "Dry Skin":             0.10,
  "Sunburn":             -0.30,
  "Keratosis Pilaris":    0.02,
  "Warts":                0.04,
};

export const MEDICATION_RATE: Record<string, number> = {
  // Acne
  "Benzoyl Peroxide":         -1.5,
  "Salicylic Acid":           -1.2,
  "Adapalene (OTC)":          -1.3,
  "Tretinoin (Rx)":           -1.5,
  "Clindamycin (Rx)":         -1.6,
  "Dapsone (Rx)":             -1.4,
  "Isotretinoin (Rx)":        -2.5,
  "Doxycycline (Rx)":         -1.8,
  "Spironolactone (Rx)":      -1.6,
  "Niacinamide":              -0.7,
  "Sulfur Wash":              -0.9,
  "Tea Tree Oil":             -0.8,
  "Hydrocolloid Patches":     -1.0,
  // Eczema / Inflammatory
  "Hydrocortisone 1% (OTC)":  -2.0,
  "Triamcinolone (Rx)":       -2.5,
  "Clobetasol (Rx)":          -3.0,
  "Tacrolimus (Rx)":          -2.2,
  "Pimecrolimus (Rx)":        -2.0,
  "Crisaborole (Rx)":         -1.8,
  "Dupilumab (Rx)":           -2.8,
  "Colloidal Oatmeal":        -0.8,
  "Calamine Lotion":          -1.0,
  "Antihistamine (OTC)":      -1.5,
  // Psoriasis
  "Coal Tar":                 -1.5,
  "Calcipotriol (Rx)":        -2.0,
  // Infection
  "Mupirocin (Rx)":           -2.2,
  "Triple Antibiotic (OTC)":  -1.5,
  "Cephalexin (Rx)":          -2.0,
  // Fungal
  "Clotrimazole (OTC)":       -1.5,
  "Tolnaftate (OTC)":         -1.3,
  "Terbinafine (OTC)":        -1.8,
  "Ketoconazole (Rx/OTC)":    -1.6,
  "Fluconazole (Rx)":         -2.0,
  // Other
  "Moisturizer":              -0.5,
  "Ceramide Moisturizer":     -0.6,
  "Sunscreen":                -0.3,
  "Aloe Vera Gel":            -0.7,
  "Urea Cream":               -0.8,
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
    : (NATURAL_PROGRESSION[area.condition] ?? 0.1);
  return Math.max(0, Math.min(10, area.severity + rate * day));
}
