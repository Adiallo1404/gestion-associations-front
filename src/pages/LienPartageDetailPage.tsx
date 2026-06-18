import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteLien, getLienById } from "../api/lienPartageService";
import type { LienPartageDto } from "../types/lienPartage";

export default function LienPartageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lien, setLien] = useState<LienPartageDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lienId = Number(id);

  const fetchLien = useCallback(async () => {
    if (!id || Number.isNaN(lienId)) {
      setError("Identifiant du lien invalide.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await getLienById(lienId);
      setLien(data);
    } catch (fetchError) {
      console.error("Failed to load shared link", fetchError);
      setError("Lien de partage introuvable.");
    } finally {
      setIsLoading(false);
    }
  }, [id, lienId]);

  useEffect(() => {
    fetchLien();
  }, [fetchLien]);

  const handleDelete = async () => {
    if (!lien?.id) return;

    const confirmed = window.confirm("Supprimer ce lien de partage ?");
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await deleteLien(lien.id);
      navigate("/liens-partage");
    } catch (deleteError) {
      console.error("Failed to delete shared link", deleteError);
      setError("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date?: string | null): string => {
    return date ? new Date(date).toLocaleString("fr-FR") : "—";
  };

  const isValid = useMemo(() => {
    if (!lien) return false;

    const notExpired = new Date() < new Date(lien.dateExpiration);
    const hasRemainingAccess =
      lien.nombreAccesMax == null ||
      lien.nombreAccesActuel < lien.nombreAccesMax;

    return lien.actif && notExpired && hasRemainingAccess;
  }, [lien]);

  const publicLink = useMemo(() => {
    if (!lien?.token) return "";

    return `${window.location.origin}/liens-partage/public/${encodeURIComponent(
      lien.token
    )}`;
  }, [lien]);

  const handleCopyPublicLink = async () => {
    if (!publicLink) return;

    try {
      await navigator.clipboard.writeText(publicLink);
      alert("Lien copié dans le presse-papiers.");
    } catch {
      alert("Impossible de copier le lien.");
    }
  };

  if (isLoading) {
    return <div style={loadingStyle}>Chargement...</div>;
  }

  if (error) {
    return (
      <div style={errorContainerStyle}>
        <div style={errorBoxStyle}>{error}</div>

        <button
          type="button"
          style={backButtonStyle}
          onClick={() => navigate("/liens-partage")}
        >
          ← Retour à la liste
        </button>
      </div>
    );
  }

  if (!lien) {
    return null;
  }

  const rows = [
    { label: "ID", value: lien.id },
    { label: "Token", value: lien.token },
    { label: "Date de création", value: formatDate(lien.dateCreation) },
    { label: "Date d'expiration", value: formatDate(lien.dateExpiration) },
    { label: "Date d'utilisation", value: formatDate(lien.dateUtilisation) },
    { label: "Accès actuel", value: lien.nombreAccesActuel },
    { label: "Accès maximum", value: lien.nombreAccesMax },
    { label: "Document ID", value: lien.documentId },
    { label: "Créé par", value: lien.creeParId ?? "—" },
  ];

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>🔗 Détail du lien de partage</h2>

        <button
          type="button"
          style={backButtonStyle}
          onClick={() => navigate("/liens-partage")}
        >
          ← Retour
        </button>
      </div>

      <div style={statusBoxStyle}>
        <span style={statusBadgeStyle(lien.actif)}>
          {lien.actif ? "Actif" : "Inactif"}
        </span>

        <span style={validityBadgeStyle(isValid)}>
          {isValid ? "Valide" : "Expiré / Épuisé"}
        </span>
      </div>

      {publicLink && (
        <div style={publicLinkBoxStyle}>
          <span style={publicLinkTextStyle}>{publicLink}</span>

          <button
            type="button"
            style={copyButtonStyle}
            onClick={handleCopyPublicLink}
          >
            Copier
          </button>
        </div>
      )}

      <div style={cardStyle}>
        {rows.map(({ label, value }) => (
          <div key={label} style={rowStyle}>
            <span style={rowLabelStyle}>{label}</span>

            <span
              style={{
                ...rowValueStyle,
                fontFamily: label === "Token" ? "monospace" : undefined,
                wordBreak: label === "Token" ? "break-all" : undefined,
              }}
            >
              {String(value)}
            </span>
          </div>
        ))}
      </div>

      <div style={actionsStyle}>
        <button
          type="button"
          style={deleteButtonStyle}
          disabled={isDeleting}
          onClick={handleDelete}
        >
          {isDeleting ? "Suppression..." : "Supprimer"}
        </button>

        <button
          type="button"
          style={secondaryButtonStyle}
          onClick={() => navigate("/liens-partage")}
        >
          Retour à la liste
        </button>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  maxWidth: 760,
  margin: "0 auto",
  padding: "32px 16px",
};

const loadingStyle: CSSProperties = {
  textAlign: "center",
  padding: 64,
  color: "#6b7280",
};

const errorContainerStyle: CSSProperties = {
  maxWidth: 600,
  margin: "40px auto",
  padding: 16,
};

const errorBoxStyle: CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#dc2626",
  borderRadius: 8,
  padding: "12px 16px",
  marginBottom: 16,
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  marginBottom: 24,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
};

const backButtonStyle: CSSProperties = {
  padding: "8px 16px",
  background: "#f3f4f6",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
};

const statusBoxStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  marginBottom: 16,
};

const statusBadgeStyle = (active: boolean): CSSProperties => ({
  padding: "4px 12px",
  borderRadius: 20,
  fontSize: 13,
  fontWeight: 600,
  background: active ? "#f0fdf4" : "#f3f4f6",
  color: active ? "#15803d" : "#6b7280",
  border: `1px solid ${active ? "#bbf7d0" : "#d1d5db"}`,
});

const validityBadgeStyle = (valid: boolean): CSSProperties => ({
  padding: "4px 12px",
  borderRadius: 20,
  fontSize: 13,
  fontWeight: 600,
  background: valid ? "#eff6ff" : "#fff7ed",
  color: valid ? "#1d4ed8" : "#c2410c",
  border: `1px solid ${valid ? "#bfdbfe" : "#fed7aa"}`,
});

const publicLinkBoxStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "12px 14px",
  marginBottom: 18,
};

const publicLinkTextStyle: CSSProperties = {
  flex: 1,
  fontSize: 13,
  color: "#334155",
  wordBreak: "break-all",
};

const copyButtonStyle: CSSProperties = {
  padding: "8px 12px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};

const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  overflow: "hidden",
};

const rowStyle: CSSProperties = {
  display: "flex",
  borderBottom: "1px solid #f3f4f6",
  padding: "13px 18px",
};

const rowLabelStyle: CSSProperties = {
  width: 180,
  color: "#6b7280",
  fontSize: 14,
  fontWeight: 500,
  flexShrink: 0,
};

const rowValueStyle: CSSProperties = {
  fontSize: 14,
  color: "#111827",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 20,
};

const deleteButtonStyle: CSSProperties = {
  padding: "10px 18px",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
};

const secondaryButtonStyle: CSSProperties = {
  padding: "10px 18px",
  background: "#f3f4f6",
  color: "#374151",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 500,
};