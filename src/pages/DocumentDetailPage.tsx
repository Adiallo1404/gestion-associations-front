import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deactivateDocument,
  getDocumentById,
  getDownloadUrl,
} from "../api/documentService";
import type { DocumentDto } from "../types/document";

interface DetailRow {
  label: string;
  value: string | number;
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<DocumentDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const documentId = Number(id);

  const fetchDocument = useCallback(async () => {
    if (!id || Number.isNaN(documentId)) {
      setError("Identifiant document invalide.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await getDocumentById(documentId);
      setDocument(data);
    } catch (err) {
      console.error("Failed to load document details", err);
      setError("Document introuvable.");
    } finally {
      setIsLoading(false);
    }
  }, [id, documentId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const formatFileSize = (bytes?: number | null): string => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  };

  const handleDeactivate = async () => {
    if (!document?.id) return;

    const confirmed = window.confirm("Désactiver ce document ?");
    if (!confirmed) return;

    try {
      setIsDeactivating(true);

      await deactivateDocument(document.id);

      setDocument((currentDocument) =>
        currentDocument
          ? {
              ...currentDocument,
              actif: false,
            }
          : currentDocument
      );
    } catch (err) {
      console.error("Failed to deactivate document", err);
      setError("Erreur lors de la désactivation.");
    } finally {
      setIsDeactivating(false);
    }
  };

  const rows = useMemo<DetailRow[]>(() => {
    if (!document) return [];

    return [
      {
        label: "Nom original",
        value: document.nomOriginal || "—",
      },
      {
        label: "Type",
        value: document.typeDocument?.replace(/_/g, " ") || "—",
      },
      {
        label: "Format",
        value: document.formatFichier || "—",
      },
      {
        label: "Taille",
        value: formatFileSize(document.tailleOctets),
      },
      {
        label: "Association",
        value: document.associationName || `ID: ${document.associationId}`,
      },
      {
        label: "Uploadé par",
        value: document.uploadeParId ? `ID: ${document.uploadeParId}` : "—",
      },
      {
        label: "Membre",
        value: document.memberId ? `ID: ${document.memberId}` : "—",
      },
      {
        label: "Date upload",
        value: document.dateUpload
          ? new Date(document.dateUpload).toLocaleString("fr-FR")
          : "—",
      },
      {
        label: "Téléchargements",
        value: document.nombreTelechargements ?? 0,
      },
      {
        label: "Statut",
        value: document.actif ? "Actif" : "Inactif",
      },
    ];
  }, [document]);

  const downloadUrl = useMemo(() => {
    if (!document) return "";

    return document.urlStockage || getDownloadUrl(document.nomFichier);
  }, [document]);

  if (isLoading) {
    return <div style={loadingStyle}>Chargement...</div>;
  }

  if (error) {
    return (
      <div style={errorContainerStyle}>
        <div style={errorBoxStyle}>{error}</div>

        <button style={backButtonStyle} onClick={() => navigate("/documents")}>
          ← Retour
        </button>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Document #{document.id}</h2>

        <button style={backButtonStyle} onClick={() => navigate("/documents")}>
          ← Retour
        </button>
      </div>

      <div style={fileBannerStyle}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>

        <span style={fileNameStyle}>
          {document.nomOriginal || document.nomFichier}
        </span>
      </div>

      <div style={cardStyle}>
        <div style={cardBodyStyle}>
          {rows.map(({ label, value }) => (
            <div key={label} style={rowStyle}>
              <span style={rowLabelStyle}>{label}</span>

              <span
                style={{
                  ...rowValueStyle,
                  fontWeight: label === "Statut" ? 600 : 400,
                  color:
                    label === "Statut"
                      ? document.actif
                        ? "#16a34a"
                        : "#dc2626"
                      : "#111827",
                }}
              >
                {String(value)}
              </span>
            </div>
          ))}
        </div>

        <div style={footerStyle}>
          {downloadUrl && (
            <button
              onClick={() => window.open(downloadUrl, "_blank")}
              style={downloadButtonStyle}
            >
              Télécharger
            </button>
          )}

          {document.actif && (
            <button
              onClick={handleDeactivate}
              style={deactivateButtonStyle}
              disabled={isDeactivating}
            >
              {isDeactivating ? "Désactivation..." : "Désactiver"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: 700,
  margin: "0 auto",
  padding: "32px 16px",
};

const loadingStyle: React.CSSProperties = {
  textAlign: "center",
  padding: 64,
  color: "#6b7280",
};

const errorContainerStyle: React.CSSProperties = {
  maxWidth: 600,
  margin: "40px auto",
  padding: 16,
};

const errorBoxStyle: React.CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#dc2626",
  borderRadius: 8,
  padding: "12px 16px",
  marginBottom: 16,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
  gap: 16,
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

const fileBannerStyle: React.CSSProperties = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 10,
  padding: "16px 20px",
  marginBottom: 20,
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const fileNameStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 15,
  color: "#1d4ed8",
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  overflow: "hidden",
};

const cardBodyStyle: React.CSSProperties = {
  padding: 24,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  borderBottom: "1px solid #f3f4f6",
  padding: "11px 0",
};

const rowLabelStyle: React.CSSProperties = {
  width: 180,
  color: "#6b7280",
  fontSize: 14,
  fontWeight: 500,
  flexShrink: 0,
};

const rowValueStyle: React.CSSProperties = {
  fontSize: 14,
};

const footerStyle: React.CSSProperties = {
  padding: "16px 24px",
  background: "#f9fafb",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
};

const downloadButtonStyle: React.CSSProperties = {
  padding: "10px 20px",
  background: "#4f46e5",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
};

const deactivateButtonStyle: React.CSSProperties = {
  padding: "10px 20px",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
};