import type { FormEvent, ChangeEvent, CSSProperties } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { createLien } from "../api/lienPartageService";
import type { CreateLienPartageRequest } from "../types/lienPartage";

interface LienPartageFormState {
  dateExpiration: string;
  nombreAccesMax: string;
  documentId: string;
}

const initialFormState: LienPartageFormState = {
  dateExpiration: "",
  nombreAccesMax: "1",
  documentId: "",
};

export default function LienPartageFormPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<LienPartageFormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!form.documentId) {
      setError("Le Document ID est obligatoire.");
      return false;
    }

    if (!form.dateExpiration) {
      setError("La date d'expiration est obligatoire.");
      return false;
    }

    if (Number(form.nombreAccesMax) < 1) {
      setError("Le nombre d'accès maximum doit être au moins 1.");
      return false;
    }

    if (new Date(form.dateExpiration) <= new Date()) {
      setError("La date d'expiration doit être dans le futur.");
      return false;
    }

    setError(null);
    return true;
  };

  const formatDateTimeForBackend = (value: string): string => {
    return value.length === 16 ? `${value}:00` : value;
  };

  const buildPayload = (): CreateLienPartageRequest => ({
    documentId: Number(form.documentId),
    dateExpiration: formatDateTimeForBackend(form.dateExpiration),
    nombreAccesMax: Number(form.nombreAccesMax),
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      await createLien(buildPayload());

      navigate("/liens-partage");
    } catch (submitError) {
      console.error("Failed to create shared link", submitError);

      const message = axios.isAxiosError(submitError)
        ? submitError.response?.data?.message ||
          "Erreur lors de la création du lien de partage."
        : "Erreur lors de la création du lien de partage.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <button
        type="button"
        style={backButtonStyle}
        onClick={() => navigate("/liens-partage")}
      >
        ← Retour à la liste
      </button>

      <h2 style={titleStyle}>Nouveau lien de partage</h2>

      {error && <div style={alertStyle}>{error}</div>}

      <form onSubmit={handleSubmit} style={cardStyle}>
        <div style={fieldStyle}>
          <label style={labelStyle}>
            Date d'expiration <span style={requiredStyle}>*</span>
          </label>

          <input
            style={inputStyle}
            type="datetime-local"
            name="dateExpiration"
            value={form.dateExpiration}
            onChange={updateField}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Nombre d'accès maximum</label>

          <input
            style={inputStyle}
            type="number"
            name="nombreAccesMax"
            min={1}
            value={form.nombreAccesMax}
            onChange={updateField}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>
            Document ID <span style={requiredStyle}>*</span>
          </label>

          <input
            style={inputStyle}
            type="number"
            name="documentId"
            min={1}
            value={form.documentId}
            onChange={updateField}
          />

          <p style={hintStyle}>
            Le lien sera généré automatiquement pour ce document.
          </p>
        </div>

        <div style={actionsStyle}>
          <button
            type="submit"
            style={{
              ...primaryButtonStyle,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Création..." : "Créer"}
          </button>

          <button
            type="button"
            style={outlineButtonStyle}
            onClick={() => navigate("/liens-partage")}
            disabled={isSubmitting}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

const pageStyle: CSSProperties = {
  padding: "32px 40px",
  textAlign: "left",
  maxWidth: 560,
};

const backButtonStyle: CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--text)",
  fontSize: 14,
  cursor: "pointer",
  padding: "0 0 16px 0",
  fontFamily: "var(--sans)",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const titleStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 500,
  color: "var(--text-h)",
  margin: "0 0 24px 0",
};

const alertStyle: CSSProperties = {
  border: "1px solid #fca5a5",
  background: "#fef2f2",
  color: "#dc2626",
  borderRadius: 8,
  padding: "10px 16px",
  fontSize: 14,
  marginBottom: 20,
};

const cardStyle: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 24,
};

const fieldStyle: CSSProperties = {
  marginBottom: 20,
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-h)",
  marginBottom: 6,
};

const hintStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--text)",
  marginTop: 4,
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  color: "var(--text-h)",
  background: "var(--bg)",
  fontFamily: "var(--sans)",
  outline: "none",
  boxSizing: "border-box",
};

const requiredStyle: CSSProperties = {
  color: "#dc2626",
  marginLeft: 3,
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 4,
};

const primaryButtonStyle: CSSProperties = {
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "9px 24px",
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "var(--sans)",
  fontWeight: 500,
};

const outlineButtonStyle: CSSProperties = {
  background: "transparent",
  color: "var(--text)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "9px 24px",
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "var(--sans)",
};