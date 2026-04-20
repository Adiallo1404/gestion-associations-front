import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDocumentById, deactivateDocument } from "../api/documentService";
import type { DocumentDto } from "../types/document";

const DocumentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const data = await getDocumentById(Number(id));
        setDoc(data);
      } catch {
        setError("Document introuvable.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDoc();
  }, [id]);

  const handleDeactivate = async () => {
    if (!window.confirm("Désactiver ce document ?")) return;
    try {
      const updated = await deactivateDocument(Number(id));
      setDoc(updated);
    } catch {
      setError("Erreur lors de la désactivation.");
    }
  };

  const formatTaille = (octets?: number) => {
    if (!octets) return "—";
    if (octets < 1024) return `${octets} o`;
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
    return `${(octets / 1024 / 1024).toFixed(1)} Mo`;
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 64, color: "#6b7280" }}>
      Chargement...
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 16 }}>
      <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "12px 16px" }}>
        {error}
      </div>
    </div>
  );

  if (!doc) return null;

  const rows = [
    { label: "Nom original", value: doc.nomOriginal ?? "—" },
    { label: "Type", value: doc.typeDocument?.replace(/_/g, " ") ?? "—" },
    { label: "Format", value: doc.formatFichier ?? "—" },
    { label: "Taille", value: formatTaille(doc.tailleOctets) },
    { label: "Association", value: `ID: ${doc.associationId}` },
    { label: "Uploadé par", value: doc.uploadeParId ? `ID: ${doc.uploadeParId}` : "—" },
    { label: "Membre", value: doc.memberId ? `ID: ${doc.memberId}` : "—" },
    { label: "Date upload", value: doc.dateUpload ? new Date(doc.dateUpload).toLocaleString("fr-FR") : "—" },
    { label: "Téléchargements", value: String(doc.nombreTelechargements ?? 0) },
    { label: "Statut", value: doc.actif ? "Actif" : "Inactif" },
  ];

  const urlTelechargement = doc.urlStockage ?? "";

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 16px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          Document #{doc.id}
        </h2>
        <button
          onClick={() => navigate("/documents")}
          style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 }}
        >
          ← Retour
        </button>
      </div>

      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span style={{ fontWeight: 600, fontSize: 15, color: "#1d4ed8" }}>
          {doc.nomOriginal ?? doc.nomFichier}
        </span>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: 24 }}>
          {rows.map(({ label, value }) => (
            <div key={label} style={{ display: "flex", borderBottom: "1px solid #f3f4f6", padding: "11px 0" }}>
              <span style={{ width: 180, color: "#6b7280", fontSize: 14, fontWeight: 500, flexShrink: 0 }}>
                {label}
              </span>
              <span style={{
                fontSize: 14,
                fontWeight: label === "Statut" ? 600 : 400,
                color: label === "Statut" ? (doc.actif ? "#16a34a" : "#dc2626") : "#111827"
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 24px", background: "#f9fafb", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          {urlTelechargement && (
            <button
              onClick={() => window.open(urlTelechargement, "_blank")}
              style={{ padding: "10px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
            >
              Télécharger
            </button>
          )}
          {doc.actif && (
            <button
              onClick={handleDeactivate}
              style={{ padding: "10px 20px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
            >
              Désactiver
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default DocumentDetailPage;