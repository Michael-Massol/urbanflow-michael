import type { CarbonMode, EmissionFactor } from "./models.ts";

export const EMISSION_FACTOR_VERSION = "urbanflow-ademe-2025.1";
const common = {
  unit: "gCO2e/passenger-km" as const,
  version: EMISSION_FACTOR_VERSION,
  effectiveDate: "2025-01-01",
};

export const emissionFactors: Readonly<Record<CarbonMode, EmissionFactor>> = {
  walking: { mode: "walking", gramsCo2ePerPassengerKm: 0, source: "https://impactco2.fr/outils/transport/marche", comment: "Émissions directes retenues nulles ; alimentation et cycle de vie hors périmètre.", ...common },
  bike: { mode: "bike", gramsCo2ePerPassengerKm: 0.17, source: "https://impactco2.fr/outils/transport/velo", comment: "Vélo mécanique ; valeur de fabrication amortie publiée par Impact CO₂.", ...common },
  metro: { mode: "metro", gramsCo2ePerPassengerKm: 4.44, source: "https://impactco2.fr/outils/transport/metro", comment: "Moyenne nationale par passager-kilomètre.", ...common },
  tram: { mode: "tram", gramsCo2ePerPassengerKm: 4.28, source: "https://impactco2.fr/outils/transport/tramway", comment: "Moyenne nationale par passager-kilomètre.", ...common },
  bus: { mode: "bus", gramsCo2ePerPassengerKm: 122, source: "https://impactco2.fr/outils/transport/busthermique", comment: "Bus thermique moyen par passager-kilomètre.", ...common },
  train: { mode: "train", gramsCo2ePerPassengerKm: 27.7, source: "https://impactco2.fr/outils/transport/ter", comment: "TER retenu comme référence prudente du mode train régional.", ...common },
  car_thermal_reference: { mode: "car_thermal_reference", gramsCo2ePerPassengerKm: 142, source: "https://impactco2.fr/outils/transport/voiturethermique", comment: "Voiture thermique moyenne diesel, une personne ; fabrication et usage inclus selon Impact CO₂ 2025.", ...common },
};
