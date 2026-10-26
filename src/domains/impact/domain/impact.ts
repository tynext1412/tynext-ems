import type { KWh, Ton } from "@/shared/domain/units";

// Faktor emisi adalah konfigurasi (bisa datang dari backend), bukan konstanta
// yang tersebar di komponen.
export interface EmissionFactors {
  co2TonPerKWh: number; // CO₂ reduction (ton) per kWh
  co2KgPerKWh: number; // CO₂ (kg) per kWh, untuk rumus pohon
  co2KgPerTreePerYear: number; // serapan CO₂ satu pohon per tahun (kg)
  coalTonPerKWh: number; // batubara tersubstitusi (ton) per kWh
}

// Rumus dari spesifikasi dashboard:
//   CO₂ reduction (t)  = 0,0008 × E
//   Equivalent trees   = E × 0,80 / 21,77
//   Coal saved (t)     = 0,00004 × E
// E = total energy generation (kWh).
export const DEFAULT_EMISSION_FACTORS: EmissionFactors = {
  co2TonPerKWh: 0.0008,
  co2KgPerKWh: 0.8,
  co2KgPerTreePerYear: 21.77,
  coalTonPerKWh: 0.00004,
};

export interface EnvironmentalImpact {
  equivalentTrees: number;
  co2ReductionTon: Ton;
  coalSavedTon: Ton;
}

export function calculateImpact(generationKWh: KWh, factors: EmissionFactors = DEFAULT_EMISSION_FACTORS): EnvironmentalImpact {
  return {
    equivalentTrees: (generationKWh * factors.co2KgPerKWh) / factors.co2KgPerTreePerYear,
    co2ReductionTon: generationKWh * factors.co2TonPerKWh,
    coalSavedTon: generationKWh * factors.coalTonPerKWh,
  };
}
