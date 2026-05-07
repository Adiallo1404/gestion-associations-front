export type StatutCotisation = 'EN_ATTENTE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';

export interface Cotisation {
  id?: number;
  montant: number;
    devise: string; 
  statut: StatutCotisation;
  periodeDebut: string;
  periodeFin: string;
  dateEcheance?: string;
  montantPenalite?: number;
  referencePaiement?: string;
  associationId: number;
  memberId: number;
}