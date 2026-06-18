import type {
  FormEvent,
  CSSProperties,
} from "react";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getAssociations } from "../api/associationService";
import { memberService } from "../api/memberService";
import { notificationService } from "../api/notificationService";
import { getUsers } from "../api/userService";
import type {
  CreateNotificationRequest,
  TypeNotification,
} from "../types/notification";
import type { Member } from "../types/member";

interface AssociationOption {
  id: number;
  name: string;
}

interface UserOption {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  username?: string | null;
}

interface NotificationFormState {
  titre: string;
  message: string;
  typeNotification: TypeNotification;
  associationId: string;
  destinataireId: string;
  memberId: string;
  lienAction: string;
  dateExpiration: string;
}

const TYPE_OPTIONS: { value: TypeNotification; label: string }[] = [
  { value: "RELANCE_COTISATION", label: "Relance cotisation" },
  { value: "COTISATION_PAYEE", label: "Cotisation payée" },
  { value: "NOUVEAU_MEMBRE", label: "Nouveau membre" },
  { value: "CHANGEMENT_STATUT", label: "Changement statut" },
  { value: "DOCUMENT_PARTAGE", label: "Document partagé" },
  { value: "RAPPEL_ECHEANCE", label: "Rappel échéance" },
  { value: "INFORMATION_GENERALE", label: "Information générale" },
];

const initialFormState: NotificationFormState = {
  titre: "",
  message: "",
  typeNotification: "INFORMATION_GENERALE",
  associationId: "",
  destinataireId: "",
  memberId: "",
  lienAction: "",
  dateExpiration: "",
};

export default function NotificationFormPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<NotificationFormState>(initialFormState);
  const [associations, setAssociations] = useState<AssociationOption[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof NotificationFormState>(
    key: K,
    value: NotificationFormState[K]
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  };

  const loadAssociations = useCallback(async () => {
    try {
      const response = await getAssociations({}, 0, 1000);
      setAssociations(response.content ?? []);
    } catch (error) {
      console.error("Failed to load associations", error);
      toast.error("Impossible de charger les associations");
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const response = await getUsers({}, 0, 1000);
      setUsers(response.content ?? []);
    } catch (error) {
      console.error("Failed to load users", error);
      toast.error("Impossible de charger les utilisateurs");
    }
  }, []);

  const loadMembersByAssociation = useCallback(async (associationId: string) => {
    if (!associationId) {
      setMembers([]);
      return;
    }

    try {
      const response = await memberService.getAll({
        associationId: Number(associationId),
        page: 0,
        size: 1000,
        sort: "lastName,asc",
      });

      setMembers(response.content ?? []);
    } catch (error) {
      console.error("Failed to load members", error);
      setMembers([]);
      toast.error("Impossible de charger les membres");
    }
  }, []);

  useEffect(() => {
    loadAssociations();
    loadUsers();
  }, [loadAssociations, loadUsers]);

  useEffect(() => {
    loadMembersByAssociation(form.associationId);
  }, [form.associationId, loadMembersByAssociation]);

  const validateForm = (): boolean => {
    if (!form.titre.trim()) {
      toast.error("Titre obligatoire");
      return false;
    }

    if (!form.message.trim()) {
      toast.error("Message obligatoire");
      return false;
    }

    if (!form.associationId) {
      toast.error("Association obligatoire");
      return false;
    }

    if (!form.destinataireId) {
      toast.error("Destinataire obligatoire");
      return false;
    }

    return true;
  };

  const formatDateTimeForBackend = (value: string): string | null => {
    if (!value) return null;

    return value.length === 16 ? `${value}:00` : value;
  };

  const buildPayload = (): CreateNotificationRequest => ({
    titre: form.titre.trim(),
    message: form.message.trim(),
    typeNotification: form.typeNotification,
    associationId: Number(form.associationId),
    destinataireId: Number(form.destinataireId),
    memberId: form.memberId ? Number(form.memberId) : null,
    lienAction: form.lienAction.trim() || null,
    dateExpiration: formatDateTimeForBackend(form.dateExpiration),
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      await notificationService.createNotification(buildPayload());

      toast.success("Notification créée avec succès");
      navigate("/notifications");
    } catch (error) {
      console.error("Failed to create notification", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Erreur serveur"
        : "Erreur serveur";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatUserLabel = (user: UserOption): string => {
    const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

    return fullName || user.email || user.username || `Utilisateur #${user.id}`;
  };

  return (
    <div style={pageStyle}>
      <form onSubmit={handleSubmit} style={cardStyle}>
        <h2 style={titleStyle}>🔔 Créer une notification</h2>

        <label style={labelStyle}>Titre *</label>
        <input
          style={inputStyle}
          value={form.titre}
          onChange={(event) => updateField("titre", event.target.value)}
          placeholder="Titre de la notification"
        />

        <label style={labelStyle}>Type *</label>
        <select
          style={inputStyle}
          value={form.typeNotification}
          onChange={(event) =>
            updateField("typeNotification", event.target.value as TypeNotification)
          }
        >
          {TYPE_OPTIONS.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Association *</label>
        <select
          style={inputStyle}
          value={form.associationId}
          onChange={(event) => {
            updateField("associationId", event.target.value);
            updateField("memberId", "");
          }}
        >
          <option value="">-- Choisir --</option>

          {associations.map((association) => (
            <option key={association.id} value={association.id}>
              {association.name}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Destinataire *</label>
        <select
          style={inputStyle}
          value={form.destinataireId}
          onChange={(event) =>
            updateField("destinataireId", event.target.value)
          }
        >
          <option value="">-- Choisir --</option>

          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {formatUserLabel(user)}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Membre lié optionnel</label>
        <select
          style={inputStyle}
          disabled={!form.associationId}
          value={form.memberId}
          onChange={(event) => updateField("memberId", event.target.value)}
        >
          <option value="">-- Aucun --</option>

          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.firstName} {member.lastName}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Message *</label>
        <textarea
          style={textareaStyle}
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          placeholder="Message de la notification..."
        />

        <label style={labelStyle}>Lien action</label>
        <input
          style={inputStyle}
          value={form.lienAction}
          onChange={(event) => updateField("lienAction", event.target.value)}
          placeholder="https://..."
        />

        <label style={labelStyle}>Date expiration</label>
        <input
          type="datetime-local"
          style={inputStyle}
          value={form.dateExpiration}
          onChange={(event) =>
            updateField("dateExpiration", event.target.value)
          }
        />

        <div style={actionsStyle}>
          <button
            type="button"
            style={cancelButtonStyle}
            onClick={() => navigate("/notifications")}
          >
            Annuler
          </button>

          <button
            type="submit"
            style={{
              ...submitButtonStyle,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enregistrement..." : "Créer notification"}
          </button>
        </div>
      </form>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg,#eef2ff,#f8fafc)",
  padding: 20,
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 520,
  background: "#fff",
  padding: 28,
  borderRadius: 14,
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const titleStyle: CSSProperties = {
  textAlign: "center",
  marginBottom: 20,
  color: "#1e1b4b",
  fontSize: 20,
  fontWeight: 700,
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  marginTop: 10,
  marginBottom: 5,
  color: "#334155",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  height: 100,
  resize: "vertical",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 20,
  gap: 10,
};

const cancelButtonStyle: CSSProperties = {
  flex: 1,
  padding: 10,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
  cursor: "pointer",
};

const submitButtonStyle: CSSProperties = {
  flex: 2,
  padding: 10,
  borderRadius: 8,
  border: "none",
  background: "#4f46e5",
  color: "#fff",
  fontWeight: 600,
};