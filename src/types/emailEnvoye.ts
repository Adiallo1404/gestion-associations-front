export interface EmailEnvoyeDto {
  id?: number;
  destinataire: string;
  sujet: string;
  contenu?: string;
  associationId?: number;
  dateEnvoi?: string;

}

export interface EmailEnvoyePageResponse {
  content: EmailEnvoyeDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface EmailEnvoyeFilter {
  destinataire?: string;
  sujet?: string;
  associationId?: number;
}