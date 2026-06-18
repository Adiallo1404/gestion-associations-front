import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createCotisation,
  getCotisationById,
  updateCotisation,
} from "../api/cotisationService";
import { getAssociations } from "../api/associationService";
import { memberService, type Member } from "../api/memberService";
import type { Association } from "../types/association";

type Devise =
  | "EUR"
  | "USD"
  | "XOF"
  | "XAF"
  | "GNF"
  | "MAD"
  | "DZD"
  | "TND"
  | "GBP"
  | "CHF";

type StatutCotisation = "EN_ATTENTE" | "PAYEE" | "EN_RETARD" | "ANNULEE";

interface CotisationFormData {
  montant: string;
  devise: Devise;
  statut: StatutCotisation;
  periodeDebut: string;
  periodeFin: string;
  dateEcheance: string;
  montantPenalite: string;
  referencePaiement: string;
  associationId: string;
  memberId: string;
}

interface CotisationPayload {
  montant: number;
  devise: Devise;
  statut: StatutCotisation;
  periodeDebut: string;
  periodeFin: string;
  dateEcheance: string | null;
  montantPenalite: number;
  referencePaiement: string | null;
  associationId: number;
  memberId: number;
}

const DEFAULT_CURRENCY: Devise = "EUR";
const DEFAULT_STATUS: StatutCotisation = "EN_ATTENTE";

const DEVISES: { code: Devise; label: string }[] = [
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

const initialFormState: CotisationFormData = {
  montant: "",
  devise: DEFAULT_CURRENCY,
  statut: DEFAULT_STATUS,
  periodeDebut: "",
  periodeFin: "",
  dateEcheance: "",
  montantPenalite: "0",
  referencePaiement: "",
  associationId: "",
  memberId: "",
};

export default function CotisationFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEditMode = Boolean(id);
  const cotisationId = Number(id);

  const [form, setForm] = useState<CotisationFormData>(initialFormState);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Loads associations and the existing cotisation when editing.
   */
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);

        const [associationResponse, cotisation] = await Promise.all([
          getAssociations({}, 0, 1000),
          isEditMode && !Number.isNaN(cotisationId)
            ? getCotisationById(cotisationId)
            : Promise.resolve(null),
        ]);

        setAssociations(associationResponse.content ?? []);

        if (cotisation) {
          setForm({
            montant: String(cotisation.montant ?? ""),
            devise: (cotisation.devise as Devise) || DEFAULT_CURRENCY,
            statut: (cotisation.statut as StatutCotisation) || DEFAULT_STATUS,
            periodeDebut: cotisation.periodeDebut || "",
            periodeFin: cotisation.periodeFin || "",
            dateEcheance: cotisation.dateEcheance || "",
            montantPenalite: String(cotisation.montantPenalite ?? "0"),
            referencePaiement: cotisation.referencePaiement || "",
            associationId: String(cotisation.associationId ?? ""),
            memberId: String(cotisation.memberId ?? ""),
          });
        }
      } catch (error) {
        console.error("Failed to load cotisation form data", error);
        toast.error("Erreur lors du chargement des données.");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [isEditMode, cotisationId]);

  /**
   * Loads members belonging to the selected association.
   */
  useEffect(() => {
    const loadMembers = async () => {
      if (!form.associationId) {
        setMembers([]);
        return;
      }

      try {
        setIsLoadingMembers(true);

        const response = await memberService.getAll({
          associationId: Number(form.associationId),
          page: 0,
          size: 1000,
          sort: "lastName,asc",
        });

        setMembers(response.content ?? []);
      } catch (error) {
        console.error("Failed to load members", error);
        setMembers([]);
        toast.error("Erreur lors du chargement des membres.");
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadMembers();
  }, [form.associationId]);

  const updateField = <K extends keyof CotisationFormData>(
    field: K,
    value: CotisationFormData[K]
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleAssociationChange = (associationId: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      associationId,
      memberId: "",
    }));
  };

  const validateForm = (): string | null => {
    if (!form.montant || Number(form.montant) <= 0) {
      return "Montant obligatoire et strictement positif.";
    }

    if (!form.devise) {
      return "Veuillez choisir une devise.";
    }

    if (!form.associationId) {
      return "Veuillez choisir une association.";
    }

    if (!form.memberId) {
      return "Veuillez choisir un membre.";
    }

    if (!form.periodeDebut || !form.periodeFin) {
      return "La période de début et la période de fin sont obligatoires.";
    }

    if (form.periodeFin < form.periodeDebut) {
      return "La période de fin doit être après la période de début.";
    }

    if (Number(form.montantPenalite) < 0) {
      return "La pénalité ne peut pas être négative.";
    }

    return null;
  };

  const buildPayload = (): CotisationPayload => ({
    montant: Number(form.montant),
    devise: form.devise,
    statut: form.statut,
    periodeDebut: form.periodeDebut,
    periodeFin: form.periodeFin,
    dateEcheance: form.dateEcheance || null,
    montantPenalite: Number(form.montantPenalite) || 0,
    referencePaiement: form.referencePaiement.trim() || null,
    associationId: Number(form.associationId),
    memberId: Number(form.memberId),
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = buildPayload();

      if (isEditMode) {
        if (Number.isNaN(cotisationId)) {
          toast.error("Identifiant cotisation invalide.");
          return;
        }

        await updateCotisation(cotisationId, payload);
        toast.success("Cotisation modifiée avec succès.");
      } else {
        await createCotisation(payload);
        toast.success("Cotisation créée avec succès.");
      }

      navigate("/cotisations");
    } catch (error) {
      console.error("Failed to save cotisation", error);
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencySymbol = useMemo(() => {
    return (
      DEVISES.find((currency) => currency.code === form.devise)?.label.split(
        " "
      )[0] ?? ""
    );
  }, [form.devise]);

  if (isLoading) {
    return <div style={loadingStyle}>Chargement...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button
          type="button"
          style={styles.backButton}
          onClick={() => navigate("/cotisations")}
        >
          ← Retour aux cotisations
        </button>

        <div>
          <h1 style={styles.headerTitle}>
            {isEditMode ? "✏️ Modifier la cotisation" : "💰 Nouvelle cotisation"}
          </h1>

          <p style={styles.headerSubtitle}>
            {isEditMode
              ? "Modifiez les informations de la cotisation"
              : "Remplissez les informations ci-dessous"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.formGrid}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>🏛️ Affectation</div>

          <div style={styles.field}>
            <label style={styles.label}>
              Association <span style={styles.required}>*</span>
            </label>

            <select
              style={styles.select}
              value={form.associationId}
              onChange={(event) => handleAssociationChange(event.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Choisir une association</option>

              {associations.map((association) => (
                <option key={association.id} value={association.id}>
                  {association.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Membre <span style={styles.required}>*</span>
            </label>

            <select
              style={{
                ...styles.select,
                background: !form.associationId ? "#f8fafc" : "white",
                color: !form.associationId ? "#94a3b8" : "#0f172a",
              }}
              value={form.memberId}
              disabled={!form.associationId || isLoadingMembers || isSubmitting}
              onChange={(event) => updateField("memberId", event.target.value)}
            >
              <option value="">
                {!form.associationId
                  ? "Choisir d'abord une association"
                  : isLoadingMembers
                  ? "Chargement..."
                  : members.length === 0
                  ? "Aucun membre"
                  : "Choisir un membre"}
              </option>

              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>💵 Montant & Devise</div>

          <div style={styles.field}>
            <label style={styles.label}>
              Devise <span style={styles.required}>*</span>
            </label>

            <select
              style={styles.select}
              value={form.devise}
              onChange={(event) =>
                updateField("devise", event.target.value as Devise)
              }
              disabled={isSubmitting}
            >
              {DEVISES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.rowTwoColumns}>
            <div style={styles.field}>
              <label style={styles.label}>
                Montant ({form.devise}) <span style={styles.required}>*</span>
              </label>

              <div style={styles.inputWrapper}>
                <span style={styles.inputPrefix}>{currencySymbol}</span>

                <input
                  style={styles.inputWithPrefix}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={form.montant}
                  disabled={isSubmitting}
                  onChange={(event) =>
                    updateField("montant", event.target.value)
                  }
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Pénalité ({form.devise})</label>

              <div style={styles.inputWrapper}>
                <span style={styles.inputPrefix}>{currencySymbol}</span>

                <input
                  style={styles.inputWithPrefix}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.montantPenalite}
                  disabled={isSubmitting}
                  onChange={(event) =>
                    updateField("montantPenalite", event.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Référence paiement</label>

            <input
              style={styles.input}
              placeholder="Ex: VIR-2024-001"
              value={form.referencePaiement}
              disabled={isSubmitting}
              onChange={(event) =>
                updateField("referencePaiement", event.target.value)
              }
            />

            <span style={styles.hint}>
              Optionnel — numéro de virement, chèque, etc.
            </span>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>📅 Statut & Dates</div>

          <div style={styles.field}>
            <label style={styles.label}>
              Statut <span style={styles.required}>*</span>
            </label>

            <select
              style={styles.select}
              value={form.statut}
              disabled={isSubmitting}
              onChange={(event) =>
                updateField("statut", event.target.value as StatutCotisation)
              }
            >
              <option value="EN_ATTENTE">⏳ En attente</option>
              <option value="PAYEE">✅ Payée</option>
              <option value="EN_RETARD">🔴 En retard</option>
              <option value="ANNULEE">⚫ Annulée</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Date d'échéance</label>

            <input
              style={styles.input}
              type="date"
              value={form.dateEcheance}
              disabled={isSubmitting}
              onChange={(event) =>
                updateField("dateEcheance", event.target.value)
              }
            />
          </div>

          <div style={styles.rowTwoColumns}>
            <div style={styles.field}>
              <label style={styles.label}>
                Période début <span style={styles.required}>*</span>
              </label>

              <input
                style={styles.input}
                type="date"
                value={form.periodeDebut}
                disabled={isSubmitting}
                onChange={(event) =>
                  updateField("periodeDebut", event.target.value)
                }
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Période fin <span style={styles.required}>*</span>
              </label>

              <input
                style={styles.input}
                type="date"
                value={form.periodeFin}
                disabled={isSubmitting}
                onChange={(event) =>
                  updateField("periodeFin", event.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            style={styles.cancelButton}
            onClick={() => navigate("/cotisations")}
            disabled={isSubmitting}
          >
            Annuler
          </button>

          <button
            type="submit"
            style={{
              ...styles.saveButton,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Enregistrement..."
              : isEditMode
              ? "Mettre à jour"
              : "Créer la cotisation"}
          </button>
        </div>
      </form>
    </div>
  );
}

const loadingStyle: CSSProperties = {
  textAlign: "center",
  padding: 64,
  color: "#64748b",
};

const styles: Record<string, CSSProperties> = {
  page: {
    background: "#f1f5f9",
    minHeight: "100vh",
    padding: "28px 32px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    marginBottom: 28,
  },
  backButton: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "9px 16px",
    fontSize: 14,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    margin: "4px 0 0",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    maxWidth: 900,
    margin: "0 auto",
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "22px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: ".05em",
    paddingBottom: 12,
    borderBottom: "1px solid #f1f5f9",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
  },
  required: {
    color: "#ef4444",
  },
  hint: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 14,
    color: "#0f172a",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  select: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 14,
    color: "#0f172a",
    background: "white",
    cursor: "pointer",
  },
  rowTwoColumns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  inputWrapper: {
    display: "flex",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
  },
  inputPrefix: {
    background: "#f8fafc",
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 600,
    color: "#475569",
    borderRight: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  inputWithPrefix: {
    flex: 1,
    padding: "10px 12px",
    border: "none",
    fontSize: 14,
    color: "#0f172a",
    outline: "none",
  },
  actions: {
    gridColumn: "1 / -1",
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    paddingTop: 4,
  },
  cancelButton: {
    padding: "11px 24px",
    background: "#fff",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  saveButton: {
    padding: "11px 28px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};