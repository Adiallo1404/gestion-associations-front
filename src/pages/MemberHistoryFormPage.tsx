import {
  FormEvent,
  useEffect,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { memberHistoryService } from "../api/memberHistoryService";
import { getAssociations } from "../api/associationService";
import { memberService } from "../api/memberService";
import type { Association } from "../types/association";
import type { Member } from "../api/memberService";
import type {
  CreateMemberHistoryRequest,
  StatutMembre,
} from "../types/memberHistory";
import {
  STATUT_MEMBRE_LABELS,
  STATUT_MEMBRE_OPTIONS,
} from "../types/memberHistory";

interface MemberHistoryFormState {
  associationId: string;
  memberId: string;
  ancienStatut: "" | StatutMembre;
  nouveauStatut: StatutMembre;
  motif: string;
}

const initialFormState: MemberHistoryFormState = {
  associationId: "",
  memberId: "",
  ancienStatut: "",
  nouveauStatut: "ACTIF",
  motif: "",
};

export default function MemberHistoryFormPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<MemberHistoryFormState>(initialFormState);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [isLoadingAssociations, setIsLoadingAssociations] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /**
   * Loads associations available to the current user.
   */
  useEffect(() => {
    const loadAssociations = async () => {
      try {
        setIsLoadingAssociations(true);

        const response = await getAssociations({}, 0, 1000);
        setAssociations(response.content ?? []);
      } catch (loadError) {
        console.error("Failed to load associations", loadError);
        setError("Erreur lors du chargement des associations.");
      } finally {
        setIsLoadingAssociations(false);
      }
    };

    loadAssociations();
  }, []);

  /**
   * Loads members scoped to the selected association.
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
      } catch (loadError) {
        console.error("Failed to load members", loadError);
        setMembers([]);
        setError("Erreur lors du chargement des membres.");
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadMembers();
  }, [form.associationId]);

  const updateField = <K extends keyof MemberHistoryFormState>(
    key: K,
    value: MemberHistoryFormState[K]
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));

    setError(null);
  };

  const handleAssociationChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setForm((currentForm) => ({
      ...currentForm,
      associationId: event.target.value,
      memberId: "",
    }));

    setError(null);
  };

  const validateForm = (): boolean => {
    if (!form.associationId) {
      setError("Veuillez sélectionner une association.");
      return false;
    }

    if (!form.memberId) {
      setError("Veuillez sélectionner un membre.");
      return false;
    }

    if (!form.nouveauStatut) {
      setError("Veuillez sélectionner le nouveau statut.");
      return false;
    }

    if (form.motif.length > 255) {
      setError("Le motif ne doit pas dépasser 255 caractères.");
      return false;
    }

    return true;
  };

  const buildPayload = (): CreateMemberHistoryRequest => ({
    associationId: Number(form.associationId),
    memberId: Number(form.memberId),
    ancienStatut: form.ancienStatut || null,
    nouveauStatut: form.nouveauStatut,
    motif: form.motif.trim() || null,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await memberHistoryService.createMemberHistory(buildPayload());

      navigate("/member-histories");
    } catch (submitError) {
      console.error("Failed to create member history", submitError);

      const message = axios.isAxiosError(submitError)
        ? submitError.response?.data?.message ||
          "Erreur lors de la création de l'historique."
        : "Erreur lors de la création de l'historique.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={topActionsStyle}>
          <button
            type="button"
            style={backButtonStyle}
            onClick={() => navigate(-1)}
          >
            ← Retour
          </button>

          <button
            type="button"
            style={dashboardButtonStyle}
            onClick={() => navigate("/")}
          >
            🏠 Tableau de bord
          </button>
        </div>

        <h1 style={titleStyle}>➕ Créer un historique</h1>

        {error && <p style={errorStyle}>{error}</p>}

        <form onSubmit={handleSubmit} style={formStyle}>
          <div>
            <label style={labelStyle}>
              Association <span style={requiredStyle}>*</span>
            </label>

            <select
              value={form.associationId}
              onChange={handleAssociationChange}
              required
              style={inputStyle}
              disabled={isLoadingAssociations || isSubmitting}
            >
              <option value="">
                {isLoadingAssociations ? "Chargement..." : "-- Choisir --"}
              </option>

              {associations.map((association) => (
                <option key={association.id} value={association.id}>
                  {association.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>
              Membre <span style={requiredStyle}>*</span>
            </label>

            <select
              value={form.memberId}
              onChange={(event) => updateField("memberId", event.target.value)}
              required
              style={inputStyle}
              disabled={!form.associationId || isLoadingMembers || isSubmitting}
            >
              <option value="">
                {!form.associationId
                  ? "Choisissez d'abord une association"
                  : isLoadingMembers
                  ? "Chargement..."
                  : "-- Choisir --"}
              </option>

              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Ancien statut</label>

            <select
              value={form.ancienStatut}
              onChange={(event) =>
                updateField(
                  "ancienStatut",
                  event.target.value as "" | StatutMembre
                )
              }
              style={inputStyle}
              disabled={isSubmitting}
            >
              <option value="">-- Aucun --</option>

              {STATUT_MEMBRE_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUT_MEMBRE_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>
              Nouveau statut <span style={requiredStyle}>*</span>
            </label>

            <select
              value={form.nouveauStatut}
              onChange={(event) =>
                updateField("nouveauStatut", event.target.value as StatutMembre)
              }
              style={inputStyle}
              disabled={isSubmitting}
            >
              {STATUT_MEMBRE_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUT_MEMBRE_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Motif</label>

            <input
              type="text"
              value={form.motif}
              onChange={(event) => updateField("motif", event.target.value)}
              maxLength={255}
              style={inputStyle}
              disabled={isSubmitting}
              placeholder="Motif du changement de statut"
            />

            <div style={counterStyle}>{form.motif.length} / 255</div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...saveButtonStyle,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Création..." : "Créer"}
          </button>
        </form>
      </div>
    </div>
  );
}

const containerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  background: "#f4f6f9",
  padding: 20,
};

const cardStyle: CSSProperties = {
  background: "white",
  padding: 30,
  borderRadius: 12,
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  width: "100%",
  maxWidth: 440,
};

const topActionsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  marginBottom: 16,
};

const titleStyle: CSSProperties = {
  textAlign: "center",
  fontSize: 26,
  fontWeight: "bold",
  color: "#2c3e50",
  borderBottom: "2px solid #27ae60",
  paddingBottom: 10,
  marginBottom: 20,
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 15,
};

const labelStyle: CSSProperties = {
  fontWeight: "bold",
  marginBottom: 5,
  display: "block",
};

const requiredStyle: CSSProperties = {
  color: "#ef4444",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 6,
  border: "1px solid #ccc",
};

const counterStyle: CSSProperties = {
  textAlign: "right",
  fontSize: 12,
  color: "#9ca3af",
  marginTop: 4,
};

const saveButtonStyle: CSSProperties = {
  padding: 12,
  background: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: 6,
  fontSize: 16,
};

const backButtonStyle: CSSProperties = {
  background: "#bdc3c7",
  border: "none",
  padding: "6px 12px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
};

const dashboardButtonStyle: CSSProperties = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
};

const errorStyle: CSSProperties = {
  color: "#dc2626",
  textAlign: "center",
};