export type TypeDocument =
  | "PROCES_VERBAL"
  | "STATUTS"
  | "COMPTABILITE"
  | "PHOTO_EVENEMENT"
  | "JUSTIFICATIF_COTISATION"
  | "AUTRE";

export type FormatFichier =
  | "PDF"
  | "WORD"
  | "EXCEL"
  | "PNG"
  | "JPG"
  | "AUTRE";

/**
 * Document returned by the API.
 */
export interface DocumentDto {
  id: number;

  nomFichier: string;
  nomOriginal?: string | null;

  urlStockage?: string | null;
  cheminFichier?: string | null;

  typeDocument: TypeDocument;
  formatFichier: FormatFichier;

  tailleOctets?: number | null;

  dateUpload?: string | null;
  dateExpirationLien?: string | null;

  lienPartage?: string | null;
  nombreTelechargements?: number | null;

  actif: boolean;

  associationId: number;
  associationName?: string | null;

  uploadeParId?: number | null;
  memberId?: number | null;
}

/**
 * POST /v1/documents
 */
export interface CreateDocumentMetadataRequest {
  nomFichier: string;
  nomOriginal?: string;

  typeDocument: TypeDocument;
  formatFichier: FormatFichier;

  tailleOctets?: number;
  dateExpirationLien?: string;

  associationId: number;
  memberId?: number;
}

/**
 * POST /v1/documents/upload-file
 */
export interface UploadDocumentMetadataRequest {
  associationId: number;

  typeDocument: TypeDocument;

  memberId?: number;
}

/**
 * Spring Page<DocumentDto>
 */
export interface DocumentPageResponse {
  content: DocumentDto[];

  totalElements: number;
  totalPages: number;

  size: number;
  number: number;

  first: boolean;
  last: boolean;
  empty: boolean;
}