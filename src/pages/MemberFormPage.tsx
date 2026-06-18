import { FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getAssociations } from "../api/associationService";
import { memberService } from "../api/memberService";
import type {
  CreateMemberRequest,
  Member,
  UpdateMemberRequest,
} from "../types/member";

interface AssociationOption {
  id: number;
  name: string;
}

interface MemberFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalAddress: string;
  associationId: string;
  active: boolean;
}

const initialFormState: MemberFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  postalAddress: "",
  associationId: "",
  active: true,
};

export default function MemberFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEditMode = Boolean(id);
  const memberId = Number(id);

  const [form, setForm] = useState<MemberFormState>(initialFormState);
  const [associations, setAssociations] = useState<AssociationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof MemberFormState>(
    key: K,
    value: MemberFormState[K]
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
      toast.error("Erreur lors du chargement des associations");
    }
  }, []);

  const mapMemberToForm = (member: Member): MemberFormState => ({
    firstName: member.firstName ?? "",
    lastName: member.lastName ?? "",
    email: member.email ?? "",
    phone: member.phone ?? "",
    address: member.address ?? "",
    postalAddress: member.postalAddress ?? "",
    associationId: String(member.associationId ?? ""),
    active: member.active,
  });

  const loadMember = useCallback(async () => {
    if (!id || Number.isNaN(memberId)) return;

    try {
      setIsLoading(true);

      const member = await memberService.getById(memberId);
      setForm(mapMemberToForm(member));
    } catch (error) {
      console.error("Failed to load member", error);
      toast.error("Membre introuvable");
      navigate("/members");
    } finally {
      setIsLoading(false);
    }
  }, [id, memberId, navigate]);

  useEffect(() => {
    loadAssociations();

    if (isEditMode) {
      loadMember();
    }
  }, [isEditMode, loadAssociations, loadMember]);

  const validateForm = (): boolean => {
    if (!form.firstName.trim()) {
      toast.error("Le prénom est obligatoire");
      return false;
    }

    if (!form.lastName.trim()) {
      toast.error("Le nom est obligatoire");
      return false;
    }

    if (!form.email.trim()) {
      toast.error("L'email est obligatoire");
      return false;
    }

    if (!form.phone.trim()) {
      toast.error("Le téléphone est obligatoire");
      return false;
    }

    if (!form.address.trim()) {
      toast.error("L'adresse est obligatoire");
      return false;
    }

    if (!form.associationId) {
      toast.error("Veuillez choisir une association");
      return false;
    }

    return true;
  };

  const buildCreatePayload = (): CreateMemberRequest => ({
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    postalAddress: form.postalAddress.trim() || null,
    associationId: Number(form.associationId),
  });

  const buildUpdatePayload = (): UpdateMemberRequest => ({
    ...buildCreatePayload(),
    active: form.active,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      if (isEditMode) {
        if (Number.isNaN(memberId)) {
          toast.error("Identifiant membre invalide");
          return;
        }

        await memberService.update(memberId, buildUpdatePayload());
        toast.success("Membre modifié avec succès");
      } else {
        await memberService.create(buildCreatePayload());
        toast.success("Membre créé avec succès");
      }

      navigate("/members");
    } catch (error: any) {
      console.error("Failed to save member", error);

      const message =
        error?.response?.data?.message ||
        "Erreur lors de l'enregistrement du membre";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={loadingStyle}>Chargement...</div>;
  }

  return (
    <div style={containerStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <button
          type="button"
          style={backButtonStyle}
          onClick={() => navigate("/members")}
        >
          ← Retour
        </button>

        <h2 style={titleStyle}>
          {isEditMode ? "✏️ Modifier un membre" : "➕ Créer un membre"}
        </h2>

        <input
          style={inputStyle}
          placeholder="Prénom"
          value={form.firstName}
          onChange={(event) => updateField("firstName", event.target.value)}
        />

        <input
          style={inputStyle}
          placeholder="Nom"
          value={form.lastName}
          onChange={(event) => updateField("lastName", event.target.value)}
        />

        <input
          style={inputStyle}
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
        />

        <input
          style={inputStyle}
          placeholder="Téléphone"
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
        />

        <input
          style={inputStyle}
          placeholder="Adresse"
          value={form.address}
          autoComplete="off"
          onChange={(event) => updateField("address", event.target.value)}
        />

        <input
          style={inputStyle}
          placeholder="Adresse postale"
          value={form.postalAddress}
          autoComplete="off"
          onChange={(event) => updateField("postalAddress", event.target.value)}
        />

        <select
          style={inputStyle}
          value={form.associationId}
          onChange={(event) => updateField("associationId", event.target.value)}
        >
          <option value="">-- Choisir une association --</option>

          {associations.map((association) => (
            <option key={association.id} value={association.id}>
              {association.name}
            </option>
          ))}
        </select>

        {isEditMode && (
          <select
            style={inputStyle}
            value={String(form.active)}
            onChange={(event) =>
              updateField("active", event.target.value === "true")
            }
          >
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
        )}

        <button type="submit" style={saveButtonStyle} disabled={isSubmitting}>
          💾{" "}
          {isSubmitting
            ? "Enregistrement..."
            : isEditMode
              ? "Mettre à jour"
              : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginTop: "40px",
  background: "#f4f6f9",
  minHeight: "100vh",
};

const formStyle: React.CSSProperties = {
  background: "white",
  padding: "30px",
  borderRadius: "12px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  width: "400px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const titleStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#2c3e50",
};

const inputStyle: React.CSSProperties = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

const saveButtonStyle: React.CSSProperties = {
  padding: "12px",
  background: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const backButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "transparent",
  color: "#555",
  border: "1px solid #ccc",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  alignSelf: "flex-start",
};

const loadingStyle: React.CSSProperties = {
  textAlign: "center",
  padding: 64,
  color: "#6b7280",
};