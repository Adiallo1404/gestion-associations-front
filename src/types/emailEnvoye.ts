export interface EmailEnvoyeDto {
  id?:             number;
  nomExpediteur?:  string;
  destinataire:    string;
  sujet:           string;
  contenu?:        string;
  associationId?:  number;
  dateEnvoi?:      string;
  statutEnvoi?:    string;
}

export interface EmailEnvoyePageResponse {
  content:       EmailEnvoyeDto[];
  totalElements: number;
  totalPages:    number;
  size:          number;
  number:        number;
  first:         boolean;
  last:          boolean;
}

export interface EmailEnvoyeFilter {
  nomExpediteur?: string;
  destinataire?:  string;
  sujet?:         string;
  statutEnvoi?:   string;
  associationId?: number;
}export type StatutEnvoi = "SUCCES" | "ECHEC";

export interface EmailEnvoyeDto {
  id?: number;

  nomExpediteur?: string | null;

  destinataire: string;

  sujet: string;

  contenu?: string | null;

  associationId?: number | null;

  dateEnvoi?: string | null;

  statutEnvoi?: StatutEnvoi | null;
}

/**
 * Request used by the authenticated back-office endpoint.
 */
export interface SendEmailRequest {
  nomExpediteur?: string | null;

  destinataire: string;

  sujet: string;

  contenu?: string | null;

  associationId?: number | null;
}

/**
 * Request used by the public contact form endpoint.
 */
export interface SendContactEmailRequest {
  nomExpediteur: string;

  destinataire: string;

  sujet: string;

  contenu: string;
}

export interface EmailEnvoyeFilter {
  nomExpediteur?: string;

  destinataire?: string;

  sujet?: string;

  statutEnvoi?: StatutEnvoi;

  associationId?: number;

  page?: number;

  size?: number;

  sort?: string | string[];
}

export interface EmailEnvoyePageResponse {
  content: EmailEnvoyeDto[];

  totalElements: number;

  totalPages: number;

  size: number;

  number: number;

  first: boolean;

  last: boolean;

  empty: boolean;
}