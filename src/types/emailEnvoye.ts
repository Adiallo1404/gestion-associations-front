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
}