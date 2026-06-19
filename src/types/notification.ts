export type TypeNotification =
  | "RELANCE_COTISATION"
  | "COTISATION_PAYEE"
  | "NOUVEAU_MEMBRE"
  | "CHANGEMENT_STATUT"
  | "DOCUMENT_PARTAGE"
  | "RAPPEL_ECHEANCE"
  | "INFORMATION_GENERALE";

export type StatutNotification = "NON_LUE" | "LUE" | "ARCHIVEE";

export interface NotificationDto {
  id?: number;
  titre: string;
  message: string;
  typeNotification: TypeNotification;
  statut?: StatutNotification;
  dateCreation?: string;
  dateLecture?: string | null;
  dateExpiration?: string | null;
  lienAction?: string | null;
  envoyeeParEmail?: boolean;
  associationId: number;
  destinataireId: number;
  memberId?: number | null;
}

export interface CreateNotificationRequest {
  titre: string;
  message: string;
  typeNotification: TypeNotification;
  statut?: StatutNotification;
  dateCreation?: string;
  dateExpiration?: string | null;
  lienAction?: string | null;
  envoyeeParEmail?: boolean;
  associationId: number;
  destinataireId: number;
  memberId?: number | null;
}

export interface NotificationFilter {
  destinataireId?: number;
  associationId?: number;
  statut?: StatutNotification;
  typeNotification?: TypeNotification;
  page?: number;
  size?: number;
  sort?: string | string[];
}

export interface NotificationPageResponse {
  content: NotificationDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}