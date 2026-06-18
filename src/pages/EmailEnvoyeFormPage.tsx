import type {
  FormEvent,
  ChangeEvent,
  CSSProperties,
} from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { emailEnvoyeService } from "../api/emailEnvoyeService";
import { getMyProfile } from "../api/userService";
import { getAssociations } from "../api/associationService";
import { useRole } from "../hooks/useRole";
import type { SendEmailRequest } from "../types/emailEnvoye";
import type { Association } from "../types/association";

const REDIRECT_DELAY_MS = 2000;
const MAX_CONTENT_LENGTH = 5000;

export default function EmailEnvoyeFormPage() {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdminOrSuperAdmin } = useRole();

  const [form, setForm] = useState<SendEmailRequest>({
    nomExpediteur: "",
    destinataire: "",
    sujet: "",
    contenu: "",
    associationId: undefined,
  });

  const [associations, setAssociations] = useState<Association[]>([]);
  const [errors, setErrors] = useState
    Partial<Record<keyof SendEmailRequest, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getMyProfile();

        setForm((currentForm) => ({
          ...currentForm,
          nomExpediteur: `${profile.firstName ?? ""} ${
            profile.lastName ?? ""
          }`.trim(),
        }));
      } catch (error) {
        console.error("Failed to load authenticated profile", error);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;

    const loadAssociations = async () => {
      try {
        const response = await getAssociations({}, 0, 100);
        setAssociations(response.content ?? []);
      } catch (error) {
        console.error("Failed to load associations", error);
      }
    };

    loadAssociations();
  }, [isSuperAdmin]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: name === "associationId" ? (value ? Number(value) : undefined) : value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: undefined,
    }));
  };

  const validateForm = (): boolean => {
    const nextErrors: Partial<Record<keyof SendEmailRequest, string>> = {};

    if (!form.nomExpediteur?.trim()) {
      nextErrors.nomExpediteur = "Le nom de l'expéditeur est obligatoire.";
    }

    if (!form.destinataire.trim()) {
      nextErrors.destinataire = "Le destinataire est obligatoire.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.destinataire)) {
      nextErrors.destinataire = "Adresse email invalide.";
    }

    if (!form.sujet.trim()) {
      nextErrors.sujet = "Le sujet est obligatoire.";
    }

    if ((form.contenu?.length ?? 0) > MAX_CONTENT_LENGTH) {
      nextErrors.contenu = `Maximum ${MAX_CONTENT_LENGTH} caractères.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (): SendEmailRequest => ({
    nomExpediteur: form.nomExpediteur?.trim() || null,
    destinataire: form.destinataire.trim(),
    sujet: form.sujet.trim(),
    contenu: form.contenu?.trim() || null,
    associationId: form.associationId ?? null,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setServerError(null);
      setSuccessMessage(null);

      const createdEmail = await emailEnvoyeService.sendEmail(buildPayload());

      if (createdEmail.statutEnvoi === "SUCCES") {
        setSuccessMessage(
          `Email successfully sent to ${createdEmail.destinataire}.`
        );
      } else {
        setServerError(
          "The email was saved, but delivery failed. Please check the email provider configuration."
        );
      }

      window.setTimeout(() => {
        if (createdEmail.id) {
          navigate(`/emails-envoyes/${createdEmail.id}`);
        } else {
          navigate("/emails-envoyes");
        }
      }, REDIRECT_DELAY_MS);
    } catch (error) {
      console.error("Failed to send email", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Erreur lors de l'envoi."
        : "Erreur lors de l'envoi.";

      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = (hasError?: string): CSSProperties => ({
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${hasError ? "#f87171" : "#d1d5db"}`,
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: hasError ? "#fff7f7" : "#fff",
  });

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>📧 Nouvel email</h2>

        <button
          type="button"
          onClick={() => navigate("/emails-envoyes")}
          style={backButtonStyle}
        >
          ← Retour
        </button>
      </div>

      {successMessage && (
        <div style={successBannerStyle}>{successMessage}</div>
      )}

      {serverError && <div style={errorBannerStyle}>{serverError}</div>}

      <div style={cardStyle}>
        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>
              Nom de l'expéditeur <span style={requiredStyle}>*</span>
            </label>

            <input
              name="nomExpediteur"
              value={form.nomExpediteur ?? ""}
              onChange={handleChange}
              placeholder="Nom complet"
              style={inputStyle(errors.nomExpediteur)}
            />

            {errors.nomExpediteur && (
              <p style={fieldErrorStyle}>{errors.nomExpediteur}</p>
            )}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Destinataire <span style={requiredStyle}>*</span>
            </label>

            <input
              name="destinataire"
              type="email"
              value={form.destinataire}
              onChange={handleChange}
              placeholder="email@example.com"
              style={inputStyle(errors.destinataire)}
            />

            {errors.destinataire && (
              <p style={fieldErrorStyle}>{errors.destinataire}</p>
            )}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Sujet <span style={requiredStyle}>*</span>
            </label>

            <input
              name="sujet"
              value={form.sujet}
              onChange={handleChange}
              placeholder="Objet du message"
              style={inputStyle(errors.sujet)}
            />

            {errors.sujet && <p style={fieldErrorStyle}>{errors.sujet}</p>}
          </div>

          {isAdminOrSuperAdmin && (
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Association{" "}
                <span style={optionalStyle}>(optionnel)</span>
              </label>

              {isSuperAdmin ? (
                <select
                  name="associationId"
                  value={form.associationId ?? ""}
                  onChange={handleChange}
                  style={{ ...inputStyle(), cursor: "pointer" }}
                >
                  <option value="">— Aucune association —</option>

                  {associations.map((association) => (
                    <option key={association.id} value={association.id}>
                      {association.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={
                    form.associationId
                      ? `Association #${form.associationId}`
                      : "Aucune association"
                  }
                  disabled
                  style={{
                    ...inputStyle(),
                    background: "#f8fafc",
                    color: "#94a3b8",
                    cursor: "not-allowed",
                  }}
                />
              )}
            </div>
          )}

          <div style={fieldStyle}>
            <label style={labelStyle}>Contenu</label>

            <textarea
              name="contenu"
              value={form.contenu ?? ""}
              onChange={handleChange}
              rows={8}
              placeholder="Corps du message..."
              style={{
                ...inputStyle(errors.contenu),
                resize: "vertical",
              }}
            />

            <div style={contentFooterStyle}>
              {errors.contenu ? (
                <p style={fieldErrorStyle}>{errors.contenu}</p>
              ) : (
                <span />
              )}

              <span style={counterStyle}>
                {form.contenu?.length ?? 0} / {MAX_CONTENT_LENGTH}
              </span>
            </div>
          </div>

          <div style={actionsStyle}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...submitButtonStyle,
                background: isSubmitting ? "#a5b4fc" : "#4f46e5",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Envoi en cours..." : "📤 Envoyer"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/emails-envoyes")}
              disabled={isSubmitting}
              style={cancelButtonStyle}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  maxWidth: 680,
  margin: "0 auto",
  padding: "32px 16px",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
  color: "#0f172a",
};

const backButtonStyle: CSSProperties = {
  padding: "8px 16px",
  background: "#f3f4f6",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};

const successBannerStyle: CSSProperties = {
  background: "#f0fdf4",
  border: "1px solid #86efac",
  color: "#16a34a",
  borderRadius: 8,
  padding: "12px 16px",
  marginBottom: 20,
  fontWeight: 500,
};

const errorBannerStyle: CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#dc2626",
  borderRadius: 8,
  padding: "12px 16px",
  marginBottom: 20,
};

const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 28,
};

const fieldStyle: CSSProperties = {
  marginBottom: 20,
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 6,
  color: "#374151",
};

const requiredStyle: CSSProperties = {
  color: "#ef4444",
};

const optionalStyle: CSSProperties = {
  color: "#9ca3af",
  fontWeight: 400,
};

const fieldErrorStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: 12,
  color: "#ef4444",
};

const contentFooterStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 4,
};

const counterStyle: CSSProperties = {
  fontSize: 12,
  color: "#9ca3af",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: 12,
};

const submitButtonStyle: CSSProperties = {
  flex: 1,
  padding: "12px 0",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 15,
};

const cancelButtonStyle: CSSProperties = {
  padding: "12px 24px",
  background: "#f3f4f6",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 500,
  fontSize: 15,
  color: "#374151",
};