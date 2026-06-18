/**
 * Generic shape for Spring Data paginated responses.
 * Reusable across all paginated resources.
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty?: boolean;
  numberOfElements?: number;
}

export interface Association {
  id: number;
  name: string;
  description?: string | null;
  city?: string | null;
  dateCreation: string;
}

/**
 * Payload for create/update operations.
 * Server-managed fields are excluded.
 */
export type AssociationInput = Omit<Association, "id" | "dateCreation">;

/**
 * Query filters for GET /v1/associations.
 * Must stay in sync with the backend filter DTO.
 */
export interface AssociationFilter {
  name?: string;
  city?: string;
  dateCreationFrom?: string;
  dateCreationTo?: string;
}

export type AssociationPage = PageResponse<Association>;