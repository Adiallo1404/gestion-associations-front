export type Periodicite = "MENSUELLE" | "TRIMESTRIELLE" | "SEMESTRIELLE" | "ANNUELLE";

export const PERIODICITE_LABELS: Record<Periodicite, string> = {
  MENSUELLE:      "Mensuelle",
  TRIMESTRIELLE:  "Trimestrielle",
  SEMESTRIELLE:   "Semestrielle",
  ANNUELLE:       "Annuelle",
};

export interface CotisationConfigDto {
  id?: number;
  montantDefaut: number;
  periodicite: Periodicite;
  jourLimitePaiement?: number;
  penaliteRetard?: number;
  delaiRappelJours?: number;
  associationId: number;
}