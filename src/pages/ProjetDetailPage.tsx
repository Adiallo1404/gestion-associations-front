import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addDepense,
  addPartenaire,
  deleteDepense,
  deletePartenaire,
  getProjetById,
} from "../api/projetService";
import type {
  CreateDepenseProjetRequest,
  CreatePartenaireProjetRequest,
  DepenseProjetDto,
  PartenaireProjetDto,
  ProjetDto,
  StatutProjet,
  TypePartenaire,
} from "../types/projet";
import {
  STATUT_PROJET_LABELS,
  TYPE_PARTENAIRE_LABELS,
  TYPE_PARTENAIRE_OPTIONS,
} from "../types/projet";

interface DepenseFormState {
  libelle: string;
  montant: string;
  dateDepense: string;
  description: string;
}

interface PartenaireFormState {
  nom: string;
  type: TypePartenaire;
  contact: string;
  description: string;
}

const initialDepenseForm: DepenseFormState = {
  libelle: "",
  montant: "",
  dateDepense: "",
  description: "",
};

const initialPartenaireForm: PartenaireFormState = {
  nom: "",
  type: "AUTRE",
  contact: "",
  description: "",
};

const getDeviseSign = (code?: string | null): string => {
  switch ((code || "EUR").toUpperCase()) {
    case "EUR":
      return "€";
    case "USD":
      return "$";
    case "XOF":
    case "XAF":
      return "FCFA";
    case "GNF":
      return "GNF";
    case "MAD":
      return "MAD";
    case "DZD":
      return "DZD";
    case "TND":
      return "TND";
    case "GBP":
      return "£";
    case "CHF":
      return "CHF";
    default:
      return code || "€";
  }
};

const getStatutStyle = (
  statut: StatutProjet
): { background: string; color: string } => {
  switch (statut) {
    case "EN_ATTENTE":
      return { background: "#fef3c7", color: "#b45309" };
    case "EN_COURS":
      return { background: "#e6f4ea", color: "#137333" };
    case "TERMINE":
      return { background: "#e8f0fe", color: "#1a73e8" };
    case "ANNULE":
      return { background: "#fee2e2", color: "#dc2626" };
    default:
      return { background: "#f3f4f6", color: "#6b7280" };
  }
};

const formatDate = (date?: string | null): string => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatMoney = (amount: number, sign: string): string => {
  return `${amount.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${sign}`;
};

export default function ProjetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const projetId = Number(id);

  const [projet, setProjet] = useState<ProjetDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingDepense, setIsSubmittingDepense] = useState(false);
  const [isSubmittingPartenaire, setIsSubmittingPartenaire] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDepenseModal, setShowDepenseModal] = useState(false);
  const [showPartenaireModal, setShowPartenaireModal] = useState(false);

  const [depenseForm, setDepenseForm] =
    useState<DepenseFormState>(initialDepenseForm);

  const [partenaireForm, setPartenaireForm] =
    useState<PartenaireFormState>(initialPartenaireForm);

  const loadProjet = useCallback(async () => {
    if (!id || Number.isNaN(projetId)) {
      setError("Identifiant projet invalide.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await getProjetById(projetId);
      setProjet(data);
    } catch (loadError) {
      console.error("Failed to load project", loadError);
      setError("Projet introuvable ou accès refusé.");
    } finally {
      setIsLoading(false);
    }
  }, [id, projetId]);

  useEffect(() => {
    loadProjet();
  }, [loadProjet]);

  const deviseSign = getDeviseSign(projet?.devise);

  const financialSummary = useMemo(() => {
    const budget = projet?.budget ?? 0;
    const totalDepenses = projet?.totalDepenses ?? 0;
    const remaining = budget - totalDepenses;
    const progress =
      budget > 0 ? Math.min(Math.round((totalDepenses / budget) * 100), 100) : 0;

    return {
      budget,
      totalDepenses,
      remaining,
      progress,
    };
  }, [projet]);

  const handleAddDepense = async () => {
    if (!projet?.id) return;

    if (!depenseForm.libelle.trim()) {
      window.alert("Le libellé est obligatoire.");
      return;
    }

    if (!depenseForm.montant || Number(depenseForm.montant) <= 0) {
      window.alert("Le montant doit être positif.");
      return;
    }

    const payload: CreateDepenseProjetRequest = {
      libelle: depenseForm.libelle.trim(),
      montant: Number(depenseForm.montant),
      dateDepense: depenseForm.dateDepense || null,
      description: depenseForm.description.trim() || null,
      projetId: projet.id,
    };

    try {
      setIsSubmittingDepense(true);

      await addDepense(projet.id, payload);

      setDepenseForm(initialDepenseForm);
      setShowDepenseModal(false);
      await loadProjet();
    } catch (submitError) {
      console.error("Failed to add expense", submitError);
      window.alert("Erreur lors de l'ajout de la dépense.");
    } finally {
      setIsSubmittingDepense(false);
    }
  };

  const handleDeleteDepense = async (depense: DepenseProjetDto) => {
    if (!depense.id) return;

    const confirmed = window.confirm(
      `Supprimer la dépense "${depense.libelle}" ?`
    );

    if (!confirmed) return;

    try {
      await deleteDepense(depense.id);
      await loadProjet();
    } catch (deleteError) {
      console.error("Failed to delete expense", deleteError);
      window.alert("Erreur lors de la suppression de la dépense.");
    }
  };

  const handleAddPartenaire = async () => {
    if (!projet?.id) return;

    if (!partenaireForm.nom.trim()) {
      window.alert("Le nom du partenaire est obligatoire.");
      return;
    }

    const payload: CreatePartenaireProjetRequest = {
      nom: partenaireForm.nom.trim(),
      type: partenaireForm.type,
      contact: partenaireForm.contact.trim() || null,
      description: partenaireForm.description.trim() || null,
      projetId: projet.id,
    };

    try {
      setIsSubmittingPartenaire(true);

      await addPartenaire(projet.id, payload);

      setPartenaireForm(initialPartenaireForm);
      setShowPartenaireModal(false);
      await loadProjet();
    } catch (submitError) {
      console.error("Failed to add partner", submitError);
      window.alert("Erreur lors de l'ajout du partenaire.");
    } finally {
      setIsSubmittingPartenaire(false);
    }
  };

  const handleDeletePartenaire = async (partenaire: PartenaireProjetDto) => {
    if (!partenaire.id) return;

    const confirmed = window.confirm(
      `Détacher le partenaire "${partenaire.nom}" ?`
    );

    if (!confirmed) return;

    try {
      await deletePartenaire(partenaire.id);
      await loadProjet();
    } catch (deleteError) {
      console.error("Failed to delete partner", deleteError);
      window.alert("Erreur lors du retrait du partenaire.");
    }
  };

  if (isLoading) {
    return <div style={styles.loading}>Chargement du projet...</div>;
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.errorBox}>⚠️ {error}</div>

          <button
            type="button"
            onClick={() => navigate("/projets")}
            style={styles.secondaryButton}
          >
            ← Retour aux projets
          </button>
        </div>
      </div>
    );
  }

  if (!projet) {
    return null;
  }

  const statutStyle = getStatutStyle(projet.statut);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {showDepenseModal && (
          <Modal
            title="➕ Nouvelle dépense"
            onClose={() => setShowDepenseModal(false)}
          >
            <div style={styles.modalForm}>
              <Field label="Libellé" required>
                <input
                  style={styles.input}
                  value={depenseForm.libelle}
                  placeholder="Ex : Achat matériel"
                  onChange={(event) =>
                    setDepenseForm((current) => ({
                      ...current,
                      libelle: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label={`Montant (${deviseSign})`} required>
                <input
                  style={styles.input}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={depenseForm.montant}
                  placeholder="0.00"
                  onChange={(event) =>
                    setDepenseForm((current) => ({
                      ...current,
                      montant: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Date de dépense">
                <input
                  style={styles.input}
                  type="date"
                  value={depenseForm.dateDepense}
                  onChange={(event) =>
                    setDepenseForm((current) => ({
                      ...current,
                      dateDepense: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Description">
                <textarea
                  style={styles.textarea}
                  value={depenseForm.description}
                  placeholder="Détails optionnels..."
                  onChange={(event) =>
                    setDepenseForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </Field>

              <ModalActions
                onCancel={() => setShowDepenseModal(false)}
                onConfirm={handleAddDepense}
                confirmLabel={
                  isSubmittingDepense ? "Enregistrement..." : "Ajouter la dépense"
                }
                disabled={isSubmittingDepense}
              />
            </div>
          </Modal>
        )}

        {showPartenaireModal && (
          <Modal
            title="🤝 Associer un partenaire"
            onClose={() => setShowPartenaireModal(false)}
          >
            <div style={styles.modalForm}>
              <Field label="Nom du partenaire" required>
                <input
                  style={styles.input}
                  value={partenaireForm.nom}
                  placeholder="Ex : ONG Solidarité"
                  onChange={(event) =>
                    setPartenaireForm((current) => ({
                      ...current,
                      nom: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Type de partenaire">
                <select
                  style={styles.input}
                  value={partenaireForm.type}
                  onChange={(event) =>
                    setPartenaireForm((current) => ({
                      ...current,
                      type: event.target.value as TypePartenaire,
                    }))
                  }
                >
                  {TYPE_PARTENAIRE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_PARTENAIRE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Contact">
                <input
                  style={styles.input}
                  value={partenaireForm.contact}
                  placeholder="Email ou téléphone"
                  onChange={(event) =>
                    setPartenaireForm((current) => ({
                      ...current,
                      contact: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Description">
                <textarea
                  style={styles.textarea}
                  value={partenaireForm.description}
                  placeholder="Rôle du partenaire..."
                  onChange={(event) =>
                    setPartenaireForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </Field>

              <ModalActions
                onCancel={() => setShowPartenaireModal(false)}
                onConfirm={handleAddPartenaire}
                confirmLabel={
                  isSubmittingPartenaire
                    ? "Enregistrement..."
                    : "Associer le partenaire"
                }
                disabled={isSubmittingPartenaire}
              />
            </div>
          </Modal>
        )}

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>{projet.nom}</h1>

            <p style={styles.subtitle}>
              Projet #{projet.id} ·{" "}
              {projet.associationName || `Association #${projet.associationId}`}
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              type="button"
              onClick={() => navigate(`/projets/edit/${projet.id}`)}
              style={styles.secondaryButton}
            >
              ✏️ Modifier
            </button>

            <button
              type="button"
              onClick={() => navigate("/projets")}
              style={styles.secondaryButton}
            >
              ← Retour
            </button>
          </div>
        </div>

        <SectionCard title="📋 Description">
          <p
            style={{
              ...styles.description,
              color: projet.description ? "#4b5563" : "#9ca3af",
              fontStyle: projet.description ? "normal" : "italic",
            }}
          >
            {projet.description || "Aucune description enregistrée."}
          </p>
        </SectionCard>

        <SectionCard title="📊 Indicateurs financiers & planning">
          <div style={styles.indicatorGrid}>
            <InfoRow
              label="Statut"
              value={
                <span style={{ ...styles.statusBadge, ...statutStyle }}>
                  {STATUT_PROJET_LABELS[projet.statut]}
                </span>
              }
            />

            <InfoRow
              label="Budget"
              value={formatMoney(financialSummary.budget, deviseSign)}
              strong
            />

            <InfoRow
              label="Dépenses"
              value={formatMoney(financialSummary.totalDepenses, deviseSign)}
              danger={financialSummary.totalDepenses > 0}
            />

            <InfoRow
              label="Reste disponible"
              value={formatMoney(financialSummary.remaining, deviseSign)}
              success={financialSummary.remaining >= 0}
              danger={financialSummary.remaining < 0}
            />

            <InfoRow
              label="Chef de projet"
              value={
                projet.chefDeProjetPrenom || projet.chefDeProjetNom
                  ? `${projet.chefDeProjetPrenom ?? ""} ${
                      projet.chefDeProjetNom ?? ""
                    }`
                  : "Non assigné"
              }
            />

            <InfoRow label="Date début" value={formatDate(projet.dateDebut)} />

            <InfoRow label="Date fin" value={formatDate(projet.dateFin)} />
          </div>

          {financialSummary.budget > 0 && (
            <div style={styles.progressWrapper}>
              <div style={styles.progressHeader}>
                <span>Consommation du budget</span>
                <strong>{financialSummary.progress}%</strong>
              </div>

              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressBar,
                    width: `${financialSummary.progress}%`,
                    background:
                      financialSummary.progress >= 90
                        ? "#ef4444"
                        : financialSummary.progress >= 60
                        ? "#f59e0b"
                        : "#22c55e",
                  }}
                />
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="💸 Dépenses"
          action={
            <button
              type="button"
              onClick={() => setShowDepenseModal(true)}
              style={styles.primaryButton}
            >
              + Nouvelle dépense
            </button>
          }
        >
          {!projet.depenses || projet.depenses.length === 0 ? (
            <EmptyState text="Aucune dépense enregistrée." />
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeadRow}>
                  <th style={styles.th}>Libellé</th>
                  <th style={styles.th}>Date</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Montant</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {projet.depenses.map((depense) => (
                  <tr key={depense.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <div style={styles.itemTitle}>{depense.libelle}</div>

                      {depense.description && (
                        <div style={styles.itemDescription}>
                          {depense.description}
                        </div>
                      )}
                    </td>

                    <td style={styles.td}>{formatDate(depense.dateDepense)}</td>

                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <strong style={styles.dangerText}>
                        -{formatMoney(depense.montant, deviseSign)}
                      </strong>
                    </td>

                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteDepense(depense)}
                        style={styles.deleteButton}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>

        <SectionCard
          title="🤝 Partenaires"
          action={
            <button
              type="button"
              onClick={() => setShowPartenaireModal(true)}
              style={styles.primaryButton}
            >
              + Associer un partenaire
            </button>
          }
        >
          {!projet.partenaires || projet.partenaires.length === 0 ? (
            <EmptyState text="Aucun partenaire associé." />
          ) : (
            <div style={styles.partnerGrid}>
              {projet.partenaires.map((partenaire) => (
                <div key={partenaire.id} style={styles.partnerCard}>
                  <div>
                    <h3 style={styles.partnerName}>{partenaire.nom}</h3>

                    <p style={styles.partnerType}>
                      {partenaire.type
                        ? TYPE_PARTENAIRE_LABELS[partenaire.type]
                        : "—"}
                    </p>

                    {partenaire.contact && (
                      <p style={styles.partnerContact}>📞 {partenaire.contact}</p>
                    )}

                    {partenaire.description && (
                      <p style={styles.partnerDescription}>
                        {partenaire.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeletePartenaire(partenaire)}
                    style={styles.deleteButton}
                  >
                    Détacher
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{title}</h2>

          <button type="button" onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label} {required && <span style={styles.required}>*</span>}
      </label>

      {children}
    </div>
  );
}

function ModalActions({
  onCancel,
  onConfirm,
  confirmLabel,
  disabled,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  disabled?: boolean;
}) {
  return (
    <div style={styles.modalActions}>
      <button type="button" onClick={onCancel} style={styles.cancelButton}>
        Annuler
      </button>

      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        style={{
          ...styles.confirmButton,
          opacity: disabled ? 0.7 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {confirmLabel}
      </button>
    </div>
  );
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>{title}</h2>
        {action}
      </div>

      <div style={styles.sectionBody}>{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  strong,
  success,
  danger,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
  success?: boolean;
  danger?: boolean;
}) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>

      <span
        style={{
          ...styles.infoValue,
          fontWeight: strong ? 700 : 500,
          color: success ? "#16a34a" : danger ? "#dc2626" : "#111827",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div style={styles.emptyState}>{text}</div>;
}

const styles: Record<string, CSSProperties> = {
  page: {
    padding: "32px 24px",
    background: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
  },
  container: {
    maxWidth: 920,
    margin: "0 auto",
  },
  loading: {
    minHeight: "60vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontSize: 15,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 28,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#111827",
  },
  subtitle: {
    margin: "4px 0 0",
    color: "#9ca3af",
    fontSize: 13,
  },
  headerActions: {
    display: "flex",
    gap: 10,
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    color: "#dc2626",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 14,
    marginBottom: 16,
  },
  primaryButton: {
    padding: "8px 16px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  secondaryButton: {
    padding: "8px 16px",
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
  },
  description: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.6,
  },
  section: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  sectionHeader: {
    padding: "14px 20px",
    background: "#fafafa",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
    color: "#374151",
  },
  sectionBody: {
    padding: 20,
  },
  indicatorGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    columnGap: 24,
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  infoLabel: {
    width: 150,
    fontSize: 13,
    fontWeight: 600,
    color: "#6b7280",
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 14,
  },
  statusBadge: {
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  progressWrapper: {
    marginTop: 18,
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    background: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.3s ease",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  tableHeadRow: {
    borderBottom: "2px solid #f3f4f6",
  },
  th: {
    paddingBottom: 10,
    fontSize: 12,
    fontWeight: 700,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  tableRow: {
    borderBottom: "1px solid #f9fafb",
  },
  td: {
    padding: "13px 0",
    fontSize: 14,
    color: "#4b5563",
    verticalAlign: "top",
  },
  itemTitle: {
    fontWeight: 600,
    color: "#111827",
  },
  itemDescription: {
    marginTop: 4,
    fontSize: 12,
    color: "#6b7280",
  },
  dangerText: {
    color: "#dc2626",
  },
  deleteButton: {
    background: "none",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  partnerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  partnerCard: {
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    padding: 16,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    background: "#fafafa",
  },
  partnerName: {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
  },
  partnerType: {
    margin: "4px 0 0",
    fontSize: 12,
    color: "#6b7280",
  },
  partnerContact: {
    margin: "4px 0 0",
    fontSize: 12,
    color: "#4b5563",
  },
  partnerDescription: {
    margin: "6px 0 0",
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
  },
  emptyState: {
    textAlign: "center",
    padding: "24px 0",
    color: "#9ca3af",
    fontSize: 14,
    fontStyle: "italic",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    background: "#fff",
    borderRadius: 12,
    padding: 28,
    width: "100%",
    maxWidth: 500,
    boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: "#111827",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#9ca3af",
    lineHeight: 1,
  },
  modalForm: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#4b5563",
  },
  required: {
    color: "#ef4444",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1.5px solid #e5e7eb",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "inherit",
    color: "#111827",
    background: "#fff",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1.5px solid #e5e7eb",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "inherit",
    color: "#111827",
    background: "#fff",
    resize: "vertical",
    minHeight: 80,
  },
  modalActions: {
    display: "flex",
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "1.5px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    color: "#374151",
  },
  confirmButton: {
    flex: 2,
    padding: 10,
    borderRadius: 8,
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
  },
};