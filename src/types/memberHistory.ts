/**
 * Member status values synchronized with the backend StatutMembre enum.
 */
export type StatutMembre =
  | "ACTIF"
  | "INACTIF"
  | "ANCIEN"
  | "SUSPENDU";

/**
 * Available status options for selects and filters.
 */
export const STATUT_MEMBRE_OPTIONS: readonly StatutMembre[] = [
  "ACTIF",
  "INACTIF",
  "ANCIEN",
  "SUSPENDU",
] as const;

/**
 * Human-readable labels displayed in the UI.
 */
export const STATUT_MEMBRE_LABELS: Record<StatutMembre, string> = {
  ACTIF: "Actif",
  INACTIF: "Inactif",
  ANCIEN: "Ancien",
  SUSPENDU: "Suspendu",
};

export interface MemberHistoryDto {
  id: number;

  ancienStatut?: StatutMembre | null;

  nouveauStatut: StatutMembre;

  motif?: string | null;

  dateChangement?: string | null;

  memberId: number;

  associationId: number;

  modifieParId?: number | null;

  modifieParNom?: string | null;
}

/**
 * Payload used to create a new history entry.
 * Audit fields are generated server-side.
 */
export interface CreateMemberHistoryRequest {
  ancienStatut?: StatutMembre | null;

  nouveauStatut: StatutMembre;

  motif?: string | null;

  memberId: number;

  associationId: number;
}

/**
 * Filters supported by GET /v1/member-histories.
 */
export interface MemberHistoryFilter {
  memberId?: number;

  associationId?: number;

  nouveauStatut?: StatutMembre;

  modifieParId?: number;

  page?: number;

  size?: number;

  sort?: string | string[];
}

export interface MemberHistoryPageResponse {
  content: MemberHistoryDto[];

  totalElements: number;

  totalPages: number;

  size: number;

  number: number;

  first: boolean;

  last: boolean;

  empty: boolean;
}