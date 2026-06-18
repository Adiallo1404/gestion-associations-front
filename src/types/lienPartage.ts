export interface LienPartageDto {
  id: number;

  token: string;

  dateExpiration: string;
  dateCreation?: string | null;
  dateUtilisation?: string | null;

  nombreAccesMax: number;
  nombreAccesActuel: number;

  actif: boolean;

  documentId: number;
  creeParId?: number | null;
}

export interface CreateLienPartageRequest {
  dateExpiration: string;
  nombreAccesMax: number;
  documentId: number;
}

export interface LienPartageFilter {
  documentId?: number;
  creeParId?: number;
  actif?: boolean;

  page?: number;
  size?: number;
  sort?: string | string[];
}

export interface LienPartagePageResponse {
  content: LienPartageDto[];

  totalElements: number;
  totalPages: number;

  size: number;
  number: number;

  first: boolean;
  last: boolean;
  empty: boolean;
}