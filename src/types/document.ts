export type TypeDocument =
  | "PROCES_VERBAL"
  | "STATUTS"
  | "COMPTABILITE"
  | "PHOTO_EVENEMENT"
  | "JUSTIFICATIF_COTISATION"
  | "AUTRE";

export type FormatFichier = "PDF" | "WORD" | "EXCEL" | "PNG" | "JPG" | "AUTRE";

export interface DocumentDto {
  id?: number;
  nomFichier?: string;
  urlStockage?: string;
  cheminFichier?: string;
  nomOriginal?: string;
  typeDocument?: TypeDocument;
  formatFichier?: FormatFichier;
  tailleOctets?: number;
  dateUpload?: string;
  dateExpirationLien?: string;
  lienPartage?: string;
  nombreTelechargements?: number;
  actif?: boolean;
  associationId: number;
  uploadeParId?: number;
  memberId?: number;
}

export interface DocumentPageResponse {
  content: DocumentDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}