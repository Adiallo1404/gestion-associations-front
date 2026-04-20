export interface LienPartage {
  id?: number;
  token?: string;
  dateExpiration: string;
  dateCreation?: string;
  dateUtilisation?: string;
  nombreAccesMax?: number;
  nombreAccesActuel?: number;
  actif?: boolean;
  documentId: number;
  creeParId?: number;
}

export interface LienPartageFilters {
  documentId?: number;
  creeParId?: number;
  actif?: boolean;
}