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
  dateLecture?: string;
  dateExpiration?: string;
  lienAction?: string;
  envoyeeParEmail?: boolean;
  associationId: number;
  destinataireId: number;
  memberId?: number | null;
}