import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAssociations } from "../api/associationService";
import { uploadDocumentFile } from "../api/documentService";
import type {
  TypeDocument,
  UploadDocumentMetadataRequest,
} from "../types/document";

interface AssociationOption {
  id: number;
  name: string;
}

interface DocumentFormState {
  file: File | null;
  associationId: string;
  typeDocument: TypeDocument;
  memberId: string;
}

interface FormErrors {
  file?: string;
  associationId?: string;
}

const TYPE_OPTIONS: { value: TypeDocument; label: string }[] = [
  { value: "PROCES_VERBAL", label: "Procès verbal" },
  { value: "STATUTS", label: "Statuts" },
  { value: "COMPTABILITE", label: "Comptabilité" },
  { value: "PHOTO_EVENEMENT", label: "Photo événement" },
  { value: "JUSTIFICATIF_COTISATION", label: "Justificatif cotisation" },
  { value: "AUTRE", label: "Autre" },
];

const initialFormState: DocumentFormState = {
  file: null,
  associationId: "",
  typeDocument: "AUTRE",
  memberId: "",
};

export default function DocumentFormPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<DocumentFormState>(initialFormState);
  const [associations, setAssociations] = useState<AssociationOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const loadAssociations = useCallback(async () => {
    try {
      const response = await getAssociations({}, 0, 1000);
      setAssociations(response.content ?? []);
    } catch (error) {
      console.error("Failed to load associations", error);
      setServerError("Erreur lors du chargement des associations.");
    }
  }, []);

  useEffect(() => {
    loadAssociations();
  }, [loadAssociations]);

  const updateForm = <K extends keyof DocumentFormState>(
    key: K,
    value: DocumentFormState[K]
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!form.file) {
      nextErrors.file = "Veuillez sélectionner un fichier.";
    }

    if (!form.associationId) {
      nextErrors.associationId = "Veuillez choisir une association.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const buildMetadata = (): UploadDocumentMetadataRequest => {
    const metadata: UploadDocumentMetadataRequest = {
      associationId: Number(form.associationId),
      typeDocument: form.typeDocument,
    };

    if (form.memberId) {
      metadata.memberId = Number(form.memberId);
    }

    return metadata;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm() || !form.file) return;

    try {
      setIsSubmitting(true);
      setServerError(null);

      const document = await uploadDocumentFile(form.file, buildMetadata());

      navigate(`/documents/${document.id}`);
    } catch (error: any) {
      console.error("Failed to upload document", error);

      const message =
        error?.response?.data?.message || "Erreur lors de l'upload.";

      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (file: File | null) => {
    updateForm("file", file);
    setErrors((currentErrors) => ({
      ...currentErrors,
      file: undefined,
    }));
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Nouveau document</h2>

        <button
          type="button"
          onClick={() => navigate("/documents")}
          style={backButtonStyle}
        >
          ← Retour
        </button>
      </div>

      {serverError && <div style={errorBoxStyle}>{serverError}</div>}

      <div style={cardStyle}>
        <form onSubmit={handleSubmit}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              Fichier <span style={requiredStyle}>*</span>
            </label>

            <div
              onClick={() => document.getElementById("fileInput")?.click()}
              style={{
                ...uploadBoxStyle,
                border: `2px dashed ${errors.file ? "#f87171" : "#d1d5db"}`,
                background: errors.file ? "#fff7f7" : "#fafafa",
              }}
            >
              <input
                id="fileInput"
                type="file"
                style={{ display: "none" }}
                onChange={(event) =>
                  handleFileChange(event.target.files?.[0] ?? null)
                }
              />

              {form.file ? (
                <div>
                  <p style={fileNameStyle}>{form.file.name}</p>

                  <p style={fileSizeStyle}>
                    {(form.file.size / 1024).toFixed(1)} Ko
                  </p>

                  <p style={changeFileStyle}>Cliquer pour changer</p>
                </div>
              ) : (
                <div>
                  <div style={uploadIconStyle}>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>

                  <p style={uploadTitleStyle}>
                    Cliquer pour sélectionner un fichier
                  </p>

                  <p style={uploadHintStyle}>PDF, Word, Excel, PNG, JPG</p>
                </div>
              )}
            </div>

            {errors.file && <p style={fieldErrorStyle}>{errors.file}</p>}
          </div>

          <div style={fieldGroupSmallStyle}>
            <label style={labelStyle}>
              Association <span style={requiredStyle}>*</span>
            </label>

            <select
              value={form.associationId}
              onChange={(event) => {
                updateForm("associationId", event.target.value);
                setErrors((currentErrors) => ({
                  ...currentErrors,
                  associationId: undefined,
                }));
              }}
              style={{
                ...selectStyle,
                border: `1px solid ${
                  errors.associationId ? "#f87171" : "#d1d5db"
                }`,
              }}
            >
              <option value="">-- Choisir une association --</option>

              {associations.map((association) => (
                <option key={association.id} value={association.id}>
                  {association.name}
                </option>
              ))}
            </select>

            {errors.associationId && (
              <p style={fieldErrorStyle}>{errors.associationId}</p>
            )}
          </div>

          <div style={fieldGroupSmallStyle}>
            <label style={labelStyle}>Type de document</label>

            <select
              value={form.typeDocument}
              onChange={(event) =>
                updateForm("typeDocument", event.target.value as TypeDocument)
              }
              style={selectStyle}
            >
              {TYPE_OPTIONS.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldGroupSmallStyle}>
            <label style={labelStyle}>Membre lié optionnel</label>

            <input
              type="number"
              min={1}
              placeholder="ID du membre"
              value={form.memberId}
              onChange={(event) => updateForm("memberId", event.target.value)}
              style={selectStyle}
            />
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
              {isSubmitting ? "Upload en cours..." : "Envoyer le fichier"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/documents")}
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

const pageStyle: React.CSSProperties = {
  maxWidth: 600,
  margin: "0 auto",
  padding: "32px 16px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
};

const backButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#f3f4f6",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};

const errorBoxStyle: React.CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#dc2626",
  borderRadius: 8,
  padding: "12px 16px",
  marginBottom: 20,
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 28,
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: 24,
};

const fieldGroupSmallStyle: React.CSSProperties = {
  marginBottom: 20,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 8,
  color: "#374151",
};

const requiredStyle: React.CSSProperties = {
  color: "#ef4444",
};

const uploadBoxStyle: React.CSSProperties = {
  borderRadius: 10,
  padding: "32px 16px",
  textAlign: "center",
  cursor: "pointer",
  transition: "border-color 0.2s",
};

const fileNameStyle: React.CSSProperties = {
  margin: 0,
  fontWeight: 600,
  color: "#111827",
  fontSize: 15,
};

const fileSizeStyle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: 13,
  color: "#6b7280",
};

const changeFileStyle: React.CSSProperties = {
  margin: "8px 0 0",
  fontSize: 12,
  color: "#4f46e5",
};

const uploadIconStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  background: "#eff6ff",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 12px",
};

const uploadTitleStyle: React.CSSProperties = {
  margin: 0,
  fontWeight: 500,
  color: "#374151",
  fontSize: 14,
};

const uploadHintStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: 12,
  color: "#9ca3af",
};

const fieldErrorStyle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: 12,
  color: "#ef4444",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  background: "#fff",
  cursor: "pointer",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
};

const submitButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: "12px 0",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 15,
};

const cancelButtonStyle: React.CSSProperties = {
  padding: "12px 24px",
  background: "#f3f4f6",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 500,
  fontSize: 15,
  color: "#374151",
};