// ─── Enums ───────────────────────────────────────────────────────────────────

export type StatutProjet = 'FUTUR' | 'EN_COURS' | 'TERMINE'

export type TypePartenaire = 'FINANCIER' | 'TECHNIQUE' | 'INSTITUTIONNEL' | 'AUTRE'

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface DepenseProjetDto {
  id?: number
  libelle: string
  montant: number
  dateDepense?: string
  description?: string
  dateCreation?: string
  projetId?: number
  projetNom?: string
}

export interface PartenaireProjetDto {
  id?: number
  nom: string
  type?: TypePartenaire
  description?: string
  contact?: string
  dateCreation?: string
  projetId?: number
  projetNom?: string
}

export interface ProjetDto {
  id?: number
  nom: string
  description?: string
  statut: StatutProjet
  dateDebut?: string
  dateFin?: string
  budget?: number
  devise?: string
  dateCreation?: string

  // Association
  associationId: number
  associationName?: string

  // Chef de projet
  chefDeProjetId?: number
  chefDeProjetPrenom?: string
  chefDeProjetNom?: string
  chefDeProjetEmail?: string

  // Calcul
  totalDepenses?: number

  // Relations
  depenses?: DepenseProjetDto[]
  partenaires?: PartenaireProjetDto[]
}

// ─── Filtre ──────────────────────────────────────────────────────────────────

export interface ProjetFilter {
  nom?: string
  statut?: StatutProjet
  associationId?: number
  chefDeProjetId?: number
}

// ─── Page Spring Data ────────────────────────────────────────────────────────

export interface ProjetPage {
  content: ProjetDto[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}