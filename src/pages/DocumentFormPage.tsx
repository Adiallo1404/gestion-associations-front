import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import type { TypeDocument } from "../types/document";

type Association = { id: number; name: string };

const TYPE_OPTIONS: { value: TypeDocument; label: string }[] = [
  { value: "PROCES_VERBAL", label: "Procès verbal" },
  { value: "STATUTS", label: "Statuts" },
  { value: "COMPTABILITE", label: "Comptabilité" },
  { value: "PHOTO_EVENEMENT", label: "Photo événement" },
  { value: "JUSTIFICATIF_COTISATION", label: "Justificatif cotisation" },
  { value: "AUTRE", label: "Autre" },
];

const DocumentFormPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [associationId, setAssociationId] = useState<string>("");
  const [typeDocument, setTypeDocument] = useState<TypeDocument>("AUTRE");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ file?: string; associationId?: string }>({});

  useEffect(() => {
    api.get("/associations?page=0&size=100")
      .then((res) => setAssociations(res.data.content || []))
      .catch(() => setServerError("Erreur lors du chargement des associations."));
  }, []);

  const validate = (): boolean => {
    const newErrors: { file?: string; associationId?: string } = {};
    if (!file) newErrors.file = "Veuillez sélectionner un fichier.";
    if (!associationId) newErrors.associationId = "Veuillez choisir une association.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const formData = new FormData();
      formData.append("file", file!);
      formData.append("associationId", associationId);
      formData.append("typeDocument", typeDocument);
      const res = await api.post("/documents/upload-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/documents/${res.data.id}`);
    } catch (err: any) {
      setServerError(err?.response?.data?.message || "Erreur lors de l'upload.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    background: "#fff",
    cursor: "pointer",
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 16px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Nouveau document</h2>
        <button
          onClick={() => navigate("/documents")}
          style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 }}
        >
          ← Retour
        </button>
      </div>

      {serverError && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
          {serverError}
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 28 }}>
        <form onSubmit={handleSubmit}>

          {/* ZONE UPLOAD */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#374151" }}>
              Fichier <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div
              onClick={() => document.getElementById("fileInput")?.click()}
              style={{
                border: `2px dashed ${errors.file ? "#f87171" : "#d1d5db"}`,
                borderRadius: 10,
                padding: "32px 16px",
                textAlign: "center",
                background: errors.file ? "#fff7f7" : "#fafafa",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
            >
              <input
                id="fileInput"
                type="file"
                style={{ display: "none" }}
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setErrors((prev) => ({ ...prev, file: undefined }));
                }}
              />
              {file ? (
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: "#111827", fontSize: 15 }}>{file.name}</p>
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6b7280" }}>
                    {(file.size / 1024).toFixed(1)} Ko
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "#4f46e5" }}>Cliquer pour changer</p>
                </div>
              ) : (
                <div>
                  <div style={{ width: 48, height: 48, background: "#eff6ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p style={{ margin: 0, fontWeight: 500, color: "#374151", fontSize: 14 }}>Cliquer pour sélectionner un fichier</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>PDF, Word, Excel, PNG, JPG</p>
                </div>
              )}
            </div>
            {errors.file && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#ef4444" }}>{errors.file}</p>}
          </div>

          {/* ASSOCIATION */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#374151" }}>
              Association <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select
              value={associationId}
              onChange={(e) => {
                setAssociationId(e.target.value);
                setErrors((prev) => ({ ...prev, associationId: undefined }));
              }}
              style={{ ...selectStyle, border: `1px solid ${errors.associationId ? "#f87171" : "#d1d5db"}` }}
            >
              <option value="">-- Choisir une association --</option>
              {associations.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {errors.associationId && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#ef4444" }}>{errors.associationId}</p>}
          </div>

          {/* TYPE */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#374151" }}>
              Type de document
            </label>
            <select
              value={typeDocument}
              onChange={(e) => setTypeDocument(e.target.value as TypeDocument)}
              style={selectStyle}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* BOUTONS */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: "12px 0",
                background: submitting ? "#a5b4fc" : "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: submitting ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              {submitting ? "Upload en cours..." : "Envoyer le fichier"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/documents")}
              disabled={submitting}
              style={{ padding: "12px 24px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontWeight: 500, fontSize: 15, color: "#374151" }}
            >
              Annuler
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default DocumentFormPage;