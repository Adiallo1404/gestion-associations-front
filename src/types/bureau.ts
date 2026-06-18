/**
 * Bureau entry as returned by the backend (BureauDto).
 *
 * Note on dates:
 * - `dateDebut` / `dateFin` map to LocalDate on the backend → "YYYY-MM-DD"
 * - `dateCreation` maps to LocalDateTime (@CreatedDate) → full ISO 8601 timestamp
 *
 * `dateFin` and `description` are `string | null` (not `undefined`) because
 * Jackson always includes these keys in the JSON response, with an explicit
 * `null` when empty — it never omits them.
 */
export interface Bureau {
  id: number;
  poste: string;
  description: string | null;
  dateDebut: string;       // "YYYY-MM-DD"
  dateFin: string | null;  // "YYYY-MM-DD", set automatically by closeBureau
  actif: boolean;
  dateCreation: string;    // ISO 8601 date-time, read-only (set via @CreatedDate)

  // Association details (read-only, populated by BureauMapper)
  associationId: number;
  associationName: string;

  // Member details (read-only, populated by BureauMapper)
  memberId: number;
  membrePrenom: string;
  membreNom: string;
  membreEmail: string;
}

/**
 * Payload for create/update operations.
 *
 * Excludes:
 * - `id`, `dateCreation`: server-managed
 * - `associationName`, `membrePrenom`, `membreNom`, `membreEmail`:
 *   read-only fields populated by BureauMapper from the related
 *   Association/Member entities, ignored on toEntity/updateEntity.
 *
 * `description` and `dateFin` are redefined as optional `string` (key
 * omitted when empty) instead of `string | null`, which is the more
 * idiomatic way to send "no value" from the frontend.
 *
 * `associationId` and `memberId` remain required: the backend resolves
 * the actual entities from these IDs.
 */
export type BureauInput = Omit
  Bureau,
  | 'id'
  | 'dateCreation'
  | 'associationName'
  | 'membrePrenom'
  | 'membreNom'
  | 'membreEmail'
  | 'description'
  | 'dateFin'
> & {
  description?: string;
  dateFin?: string;
};