import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
} from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  createProjet,
  getProjetById,
  updateProjet,
} from "../api/projetService";
import { getAssociations } from "../api/associationService";
import { getMembers } from "../api/memberService";
import type {
  CreateProjetRequest,
  StatutProjet,
  UpdateProjetRequest,
} from "../types/projet";
import {
  STATUT_PROJET_LABELS,
  STATUT_PROJET_OPTIONS,
} from "../types/projet";
import type { Association } from "../types/association";
import type { Member } from "../types/member";

const DEVISES = [
  { code: "EUR", label: "€ Euro" },
  { code: "USD", label: "$ Dollar américain" },
  { code: "XOF", label: "FCFA Franc CFA (UEMOA)" },
  { code: "XAF", label: "FCFA Franc CFA (CEMAC)" },
  { code: "GNF", label: "GNF Franc Guinéen" },
  { code: "MAD", label: "MAD Dirham marocain" },
  { code: "DZD", label: "DZD Dinar algérien" },
  { code: "TND", label: "TND Dinar tunisien" },
  { code: "GBP", label: "£ Livre sterling" },
  { code: "CHF", label: "CHF Franc suisse" },
];

interface ProjetFormState {
  nom: string;
  description: string;
  statut: StatutProjet;
  budget: string;
  devise: string;
  associationId: string;
  chefDeProjetId: string;
  dateDebut: string;
  dateFin: string;
}

const initialFormState: ProjetFormState = {
  nom: "",
  description: "",
  statut: "EN_ATTENTE",
  budget: "",
  devise: "EUR",
  associationId: "",
  chefDeProjetId: "",
  dateDebut: "",
  dateFin: "",
};

const getDeviseSign = (code?: string): string => {
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
    case "GBP":
      return "£";
    default:
      return code || "€";
  }
};

export default function ProjetFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEditMode = Boolean(id);
  const projetId = Number(id);

  const [formData, setFormData] = useState<ProjetFormState>(initialFormState);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = <K extends keyof ProjetFormState>(
    field: K,
    value: ProjetFormState[K]
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,

      // Keep project manager consistent with the selected association.
      ...(field === "associationId" ? { chefDeProjetId: "" } : {}),
    }));
  };

  const loadReferenceData = useCallback(async () => {
    try {
      const [associationsResponse, membersResponse] = await Promise.all([
        getAssociations({}, 0, 1000),
        getMembers({ page: 0, size: 1000 }),
      ]);

      setAssociations(associationsResponse.content ?? []);
      setMembers(membersResponse.content ?? []);
    } catch (loadError) {
      console.error("Failed to load project form references", loadError);
      setError("Erreur lors du chargement des associations ou membres.");
    }
  }, []);

  const loadProjet = useCallback(async () => {
    if (!isEditMode) return;

    if (!id || Number.isNaN(projetId)) {
      setError("Identifiant projet invalide.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const projet = await getProjetById(projetId);

      setFormData({
        nom: projet.nom,
        description: projet.description ?? "",
        statut: projet.statut,
        budget: projet.budget != null ? String(projet.budget) : "",
        devise: projet.devise ?? "EUR",
        associationId: String(projet.associationId),
        chefDeProjetId:
          projet.chefDeProjetId != null ? String(projet.chefDeProjetId) : "",
        dateDebut: projet.dateDebut ?? "",
        dateFin: projet.dateFin ?? "",
      });
    } catch (loadError) {
      console.error("Failed to load project", loadError);
      setError("Impossible de charger les données du projet.");
    } finally {
      setIsLoading(false);
    }
  }, [id, isEditMode, projetId]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    loadProjet();
  }, [loadProjet]);

  const filteredMembers = useMemo(() => {
    if (!formData.associationId) return [];

    return members.filter(
      (member) => member.associationId === Number(formData.associationId)
    );
  }, [formData.associationId, members]);

  const validateForm = (): string | null => {
    if (!formData.nom.trim()) return "Le nom du projet est obligatoire.";

    if (!formData.associationId) {
      return "L'association est obligatoire.";
    }

    if (formData.budget && Number(formData.budget) < 0) {
      return "Le budget ne peut pas être négatif.";
    }

    if (
      formData.dateDebut &&
      formData.dateFin &&
      formData.dateDebut > formData.dateFin
    ) {
      return "La date de fin doit être après la date de début.";
    }

    return null;
  };

  const buildPayload = (): CreateProjetRequest | UpdateProjetRequest => ({
    nom: formData.nom.trim(),
    description: formData.description.trim() || null,
    statut: formData.statut,
    dateDebut: formData.dateDebut || null,
    dateFin: formData.dateFin || null,
    budget: formData.budget ? Number(formData.budget) : null,
    devise: formData.devise || null,
    associationId: Number(formData.associationId),
    chefDeProjetId: formData.chefDeProjetId
      ? Number(formData.chefDeProjetId)
      : null,
  });

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    updateField(name as keyof ProjetFormState, value as never);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = buildPayload();

      if (isEditMode) {
        await updateProjet(projetId, payload);
        navigate(`/projets/${projetId}`);
      } else {
        const created = await createProjet(payload);
        navigate(`/projets/${created.id}`);
      }
    } catch (submitError) {
      console.error("Failed to save project", submitError);

      const message = axios.isAxiosError(submitError)
        ? submitError.response?.data?.message ??
          "Une erreur est survenue lors de l'enregistrement du projet."
        : "Une erreur est survenue lors de l'enregistrement du projet.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={styles.loading}>Chargement...</div>;
  }

  const deviseSign = getDeviseSign(formData.devise);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              {isEditMode ? `Modifier le projet #${id}` : "Créer un projet"}
            </h1>

            <p style={styles.subtitle}>
              {isEditMode
                ? "Update project information while keeping expenses and partners managed separately."
                : "Create a new project and attach it to an association."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(isEditMode ? `/projets/${id}` : "/projets")}
            style={styles.cancelTopButton}
          >
            ← Annuler
          </button>
        </div>

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <section style={styles.section}>
            <SectionHeader title="📋 Informations générales" />

            <div style={styles.sectionBody}>
              <div style={styles.field}>
                <label style={styles.label}>
                  Nom du projet <span style={styles.required}>*</span>
                </label>

                <input
                  type="text"
                  name="nom"
                  required
                  placeholder="Ex : Construction école primaire"
                  value={formData.nom}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={isSubmitting}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Description</label>

                <textarea
                  name="description"
                  rows={4}
                  placeholder="Décrivez les objectifs et le contexte du projet..."
                  value={formData.description}
                  onChange={handleChange}
                  style={styles.textarea}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader title="🏛️ Association & responsable" />

            <div style={styles.sectionBody}>
              <div style={styles.twoColumns}>
                <div style={styles.field}>
                  <label style={styles.label}>
                    Association <span style={styles.required}>*</span>
                  </label>

                  <select
                    name="associationId"
                    value={formData.associationId}
                    onChange={handleChange}
                    style={styles.select}
                    disabled={isSubmitting || isEditMode}
                  >
                    <option value="">-- Sélectionner --</option>

                    {associations.map((association) => (
                      <option key={association.id} value={association.id}>
                        {association.name}
                      </option>
                    ))}
                  </select>

                  {/* Backend note:
                      Non-super-admin users cannot force associationId.
                      The backend overrides associationId from the security context.
                      We still keep this field visible for clarity and super-admin usage. */}
                  {isEditMode && (
                    <small style={styles.hint}>
                      L'association d'un projet existant n'est pas modifiée ici.
                    </small>
                  )}
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Chef de projet</label>

                  <select
                    name="chefDeProjetId"
                    value={formData.chefDeProjetId}
                    onChange={handleChange}
                    style={styles.select}
                    disabled={!formData.associationId || isSubmitting}
                  >
                    <option value="">
                      {formData.associationId
                        ? "-- Aucun --"
                        : "Choisir d'abord une association"}
                    </option>

                    {filteredMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader title="💰 Budget & statut" />

            <div style={styles.sectionBody}>
              <div style={styles.threeColumns}>
                <div style={styles.field}>
                  <label style={styles.label}>
                    Statut <span style={styles.required}>*</span>
                  </label>

                  <select
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    style={styles.select}
                    disabled={isSubmitting}
                  >
                    {STATUT_PROJET_OPTIONS.map((statut) => (
                      <option key={statut} value={statut}>
                        {STATUT_PROJET_LABELS[statut]}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Devise</label>

                  <select
                    name="devise"
                    value={formData.devise}
                    onChange={handleChange}
                    style={styles.select}
                    disabled={isSubmitting}
                  >
                    {DEVISES.map((devise) => (
                      <option key={devise.code} value={devise.code}>
                        {devise.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Budget alloué</label>

                  <div style={styles.moneyInputWrapper}>
                    <input
                      type="number"
                      name="budget"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={formData.budget}
                      onChange={handleChange}
                      style={styles.moneyInput}
                      disabled={isSubmitting}
                    />

                    <span style={styles.moneySuffix}>{deviseSign}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader title="📅 Planning" />

            <div style={styles.sectionBody}>
              <div style={styles.twoColumns}>
                <div style={styles.field}>
                  <label style={styles.label}>Date de début</label>

                  <input
                    type="date"
                    name="dateDebut"
                    value={formData.dateDebut}
                    onChange={handleChange}
                    style={styles.input}
                    disabled={isSubmitting}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Date de fin estimée</label>

                  <input
                    type="date"
                    name="dateFin"
                    value={formData.dateFin}
                    onChange={handleChange}
                    style={styles.input}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </section>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={() => navigate(isEditMode ? `/projets/${id}` : "/projets")}
              style={styles.cancelButton}
              disabled={isSubmitting}
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...styles.submitButton,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting
                ? "Enregistrement..."
                : isEditMode
                ? "Enregistrer les modifications"
                : "Créer le projet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={styles.sectionHeader}>
      <h2 style={styles.sectionTitle}>{title}</h2>
    </div>
  );
}

const baseInput: CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1.5px solid #e5e7eb",
  borderRadius: 8,
  fontSize: 14,
  boxSizing: "border-box",
  outline: "none",
  color: "#111827",
  background: "#fff",
};

const styles: Record<string, CSSProperties> = {
  page: {
    padding: "32px 24px",
    background: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
  },
  container: {
    maxWidth: 760,
    margin: "0 auto",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    color: "#6b7280",
    fontSize: 15,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    gap: 16,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: "#111827",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "#9ca3af",
  },
  cancelTopButton: {
    padding: "9px 18px",
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    color: "#374151",
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    color: "#dc2626",
    borderRadius: 8,
    padding: "12px 16px",
    marginBottom: 20,
    fontSize: 14,
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
  },
  sectionTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
  },
  sectionBody: {
    padding: 20,
  },
  twoColumns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  threeColumns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#4b5563",
  },
  required: {
    color: "#ef4444",
  },
  input: baseInput,
  textarea: {
    ...baseInput,
    resize: "vertical",
    minHeight: 100,
    lineHeight: 1.5,
  },
  select: {
    ...baseInput,
    cursor: "pointer",
  },
  hint: {
    marginTop: 6,
    color: "#9ca3af",
    fontSize: 12,
  },
  moneyInputWrapper: {
    position: "relative",
  },
  moneyInput: {
    ...baseInput,
    paddingRight: 56,
  },
  moneySuffix: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: 600,
    pointerEvents: "none",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelButton: {
    padding: "10px 20px",
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    color: "#374151",
  },
  submitButton: {
    padding: "10px 24px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
  },
};