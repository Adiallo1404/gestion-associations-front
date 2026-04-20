export type StatutMembre =
  | "ACTIF"
  | "INACTIF"
  | "ANCIEN"
  | "SUSPENDU";

export const StatutMembreOptions: StatutMembre[] = [
  "ACTIF",
  "INACTIF",
  "ANCIEN",
  "SUSPENDU",
];

export const StatutMembreLabels: Record<StatutMembre, string> = {
  ACTIF: "Actif",
  INACTIF: "Inactif",
  ANCIEN: "Ancien",
  SUSPENDU: "Suspendu",
};