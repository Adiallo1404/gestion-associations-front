export type StatutCotisation = 'EN_ATTENTE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE'

/** Full contribution shape returned by the backend (mirrors CotisationDto). */
export interface Cotisation {
  id: number
  montant: number
  devise?: string | null
  statut: StatutCotisation
  periodeDebut: string
  periodeFin: string
  dateEcheance?: string
  datePaiement?: string 
  montantPenalite?: number
  referencePaiement?: string
  associationId: number
  memberId: number
  dateCreation?: string   
}

// Alias for backward compatibility
export type CotisationDto = Cotisation

/** Payload for create/update operations (server-managed fields excluded). */
export type CotisationInput = Omit<Cotisation, 'id' | 'dateCreation' | 'datePaiement'>

// Filter shape for cotisation list queries
export interface CotisationFilter {
  statut?: StatutCotisation
  associationId?: number
  memberId?: number
  periodeDebut?: string
  periodeFin?: string
  montantMin?: number
  montantMax?: number
}

// Individual contribution tracking per member
export interface MembreCotisationStatus {
  memberId: number
  firstName: string
  lastName: string
  email: string
  phone: string
  cotisationId: number | null
  montant: number | null
  devise: string | null
  statut: StatutCotisation | null 
  periodeDebut: string | null
  periodeFin: string | null
  dateEcheance: string | null
  datePaiement: string | null
  referencePaiement: string | null
  montantPenalite: number | null
  aCotise: boolean
  enRetard: boolean
}