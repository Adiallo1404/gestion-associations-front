export interface BureauDto {
  id?: number;
  poste: string;
  description?: string;
  dateDebut: string;
  dateFin?: string | null;
  actif: boolean;
  dateCreation?: string;
  associationId: number;
  associationName?: string;
  memberId: number;
  membrePrenom?: string;
  membreNom?: string;
  membreEmail?: string;
}