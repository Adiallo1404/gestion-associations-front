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

// ✅ NOUVEAU — Suivi individuel des cotisations par membre
export interface MembreCotisationStatus {
  memberId:          number;
  firstName:         string;
  lastName:          string;
  email:             string;
  phone:             string;
  cotisationId:      number | null;
  montant:           number | null;
  devise:            string | null;
  statut:            StatutCotisation | null; // null = aucune cotisation sur la période
  periodeDebut:      string | null;
  periodeFin:        string | null;
  dateEcheance:      string | null;
  datePaiement:      string | null;
  referencePaiement: string | null;
  montantPenalite:   number | null;
  aCotise:           boolean;
  enRetard:          boolean;
}