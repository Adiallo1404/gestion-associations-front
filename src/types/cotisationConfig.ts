/**
 * Payment frequency values.
 * Must stay synchronized with the backend Periodicite enum.
 */
export type Periodicite =
  | "MENSUELLE"
  | "TRIMESTRIELLE"
  | "SEMESTRIELLE"
  | "ANNUELLE";

export const PERIODICITE_OPTIONS: readonly Periodicite[] = [
  "MENSUELLE",
  "TRIMESTRIELLE",
  "SEMESTRIELLE",
  "ANNUELLE",
] as const;

/**
 * Human-readable labels used in forms and tables.
 */
export const PERIODICITE_LABELS: Record<Periodicite, string> = {
  MENSUELLE: "Mensuelle",
  TRIMESTRIELLE: "Trimestrielle",
  SEMESTRIELLE: "Semestrielle",
  ANNUELLE: "Annuelle",
};

/**
 * Cotisation configuration returned by the API.
 */
export interface CotisationConfigDto {
  id?: number;

  montantDefaut: number;

  periodicite: Periodicite;

  jourLimitePaiement?: number | null;

  penaliteRetard?: number | null;

  delaiRappelJours?: number | null;

  associationId: number;
}

/**
 * Request payload used when creating a configuration.
 */
export type CreateCotisationConfigRequest = Omit<
  CotisationConfigDto,
  "id"
>;

/**
 * Request payload used when updating a configuration.
 */
export type UpdateCotisationConfigRequest = Omit<
  CotisationConfigDto,
  "id"
>;