// ─── Enums ───────────────────────────────────────────────────────────────────

export type StatutProjet =
  | "EN_ATTENTE"
  | "EN_COURS"
  | "TERMINE"
  | "ANNULE";

export const STATUT_PROJET_OPTIONS: readonly StatutProjet[] = [
  "EN_ATTENTE",
  "EN_COURS",
  "TERMINE",
  "ANNULE",
] as const;

export const STATUT_PROJET_LABELS: Record<StatutProjet, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
  ANNULE: "Annulé",
};

export type TypePartenaire =
  | "FINANCIER"
  | "TECHNIQUE"
  | "INSTITUTIONNEL"
  | "AUTRE";

export const TYPE_PARTENAIRE_OPTIONS: readonly TypePartenaire[] = [
  "FINANCIER",
  "TECHNIQUE",
  "INSTITUTIONNEL",
  "AUTRE",
] as const;

export const TYPE_PARTENAIRE_LABELS: Record<TypePartenaire, string> = {
  FINANCIER: "Financier",
  TECHNIQUE: "Technique",
  INSTITUTIONNEL: "Institutionnel",
  AUTRE: "Autre",
};

// ─── Depense Projet ──────────────────────────────────────────────────────────

export interface DepenseProjetDto {
  id?: number;

  libelle: string;

  montant: number;

  dateDepense?: string | null;

  description?: string | null;

  dateCreation?: string | null;

  projetId: number;

  projetNom?: string | null;
}

export interface CreateDepenseProjetRequest {
  libelle: string;

  montant: number;

  dateDepense?: string | null;

  description?: string | null;

  projetId: number;
}

export interface UpdateDepenseProjetRequest {
  libelle: string;

  montant: number;

  dateDepense?: string | null;

  description?: string | null;

  projetId: number;
}

// ─── Partenaire Projet ───────────────────────────────────────────────────────

export interface PartenaireProjetDto {
  id?: number;

  nom: string;

  type?: TypePartenaire | null;

  description?: string | null;

  contact?: string | null;

  dateCreation?: string | null;

  projetId: number;

  projetNom?: string | null;
}

export interface CreatePartenaireProjetRequest {
  nom: string;

  type?: TypePartenaire | null;

  description?: string | null;

  contact?: string | null;

  projetId: number;
}

export interface UpdatePartenaireProjetRequest {
  nom: string;

  type?: TypePartenaire | null;

  description?: string | null;

  contact?: string | null;

  projetId: number;
}

// ─── Projet ──────────────────────────────────────────────────────────────────

export interface ProjetDto {
  id?: number;

  nom: string;

  description?: string | null;

  statut: StatutProjet;

  dateDebut?: string | null;

  dateFin?: string | null;

  budget?: number | null;

  devise?: string | null;

  dateCreation?: string | null;

  associationId: number;

  associationName?: string | null;

  chefDeProjetId?: number | null;

  chefDeProjetPrenom?: string | null;

  chefDeProjetNom?: string | null;

  chefDeProjetEmail?: string | null;

  totalDepenses?: number | null;

  depenses?: DepenseProjetDto[] | null;

  partenaires?: PartenaireProjetDto[] | null;
}

export interface CreateProjetRequest {
  nom: string;

  description?: string | null;

  statut: StatutProjet;

  dateDebut?: string | null;

  dateFin?: string | null;

  budget?: number | null;

  devise?: string | null;

  associationId: number;

  chefDeProjetId?: number | null;
}

export interface UpdateProjetRequest {
  nom: string;

  description?: string | null;

  statut: StatutProjet;

  dateDebut?: string | null;

  dateFin?: string | null;

  budget?: number | null;

  devise?: string | null;

  associationId: number;

  chefDeProjetId?: number | null;
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface ProjetFilter {
  nom?: string;

  statut?: StatutProjet;

  associationId?: number;

  chefDeProjetId?: number;

  page?: number;

  size?: number;

  sort?: string | string[];
}

// ─── Spring Page ──────────────────────────────────────────────────────────────

export interface ProjetPageResponse {
  content: ProjetDto[];

  totalElements: number;

  totalPages: number;

  size: number;

  number: number;

  first: boolean;

  last: boolean;

  empty: boolean;
}