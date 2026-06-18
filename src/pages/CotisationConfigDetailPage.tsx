import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cotisationConfigService } from "../api/cotisationConfigService";
import { getAssociationById } from "../api/associationService";
import type { CotisationConfigDto } from "../types/cotisationConfig";
import { PERIODICITE_LABELS } from "../types/cotisationConfig";

interface DetailRow {
  label: string;
  value: string;
  highlight?: boolean;
}

export default function CotisationConfigDetailPage() {
  const { associationId } = useParams<{ associationId: string }>();
  const navigate = useNavigate();

  const [config, setConfig] = useState<CotisationConfigDto | null>(null);
  const [associationName, setAssociationName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedAssociationId = Number(associationId);

  const loadConfig = useCallback(async () => {
    if (!associationId || Number.isNaN(parsedAssociationId)) {
      setError("Identifiant association invalide.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data =
        await cotisationConfigService.getCotisationConfigByAssociation(
          parsedAssociationId
        );

      setConfig(data);

      const association = await getAssociationById(data.associationId);
      setAssociationName(association.name);
    } catch (loadError) {
      console.error("Failed to load cotisation configuration", loadError);
      setError("Configuration introuvable.");
    } finally {
      setIsLoading(false);
    }
  }, [associationId, parsedAssociationId]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const formatCurrency = (value?: number | null): string => {
    return `${Number(value ?? 0).toFixed(2)} €`;
  };

  const handleDelete = async () => {
    if (!config?.associationId) return;

    const confirmed = window.confirm("Supprimer cette configuration ?");
    if (!confirmed) return;

    try {
      setIsDeleting(true);

      await cotisationConfigService.deleteCotisationConfig(config.associationId);
      navigate("/cotisation-configs");
    } catch (deleteError) {
      console.error("Failed to delete cotisation configuration", deleteError);
      setError("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  const rows = useMemo<DetailRow[]>(() => {
    if (!config) return [];

    return [
      {
        label: "Association",
        value: associationName || `Association #${config.associationId}`,
      },
      {
        label: "Montant par défaut",
        value: formatCurrency(config.montantDefaut),
        highlight: true,
      },
      {
        label: "Périodicité",
        value: PERIODICITE_LABELS[config.periodicite],
      },
      {
        label: "Jour limite",
        value: config.jourLimitePaiement
          ? `Jour ${config.jourLimitePaiement} du mois`
          : "—",
      },
      {
        label: "Pénalité retard",
        value: formatCurrency(config.penaliteRetard),
      },
      {
        label: "Délai rappel",
        value: config.delaiRappelJours
          ? `${config.delaiRappelJours} jours avant échéance`
          : "—",
      },
    ];
  }, [config, associationName]);

  if (isLoading) {
    return <div style={loadingStyle}>Chargement...</div>;
  }

  if (error) {
    return (
      <div style={errorContainerStyle}>
        <div style={errorBoxStyle}>{error}</div>

        <div style={errorActionsStyle}>
          <button
            type="button"
            onClick={() => navigate("/cotisation-configs")}
            style={backButtonStyle}
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>⚙️ Config — {associationName}</h2>

        <button
          type="button"
          onClick={() => navigate("/cotisation-configs")}
          style={backButtonStyle}
        >
          ← Retour
        </button>
      </div>

      <div style={cardStyle}>
        <div style={cardBodyStyle}>
          {rows.map(({ label, value, highlight }) => (
            <div key={label} style={rowStyle}>
              <span style={rowLabelStyle}>{label}</span>

              <span
                style={{
                  ...rowValueStyle,
                  fontWeight: highlight ? 600 : 400,
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        <div style={footerStyle}>
          <button
            type="button"
            onClick={() =>
              navigate(
                `/cotisation-configs/association/${config.associationId}/edit`
              )
            }
            style={editButtonStyle}
            disabled={isDeleting}
          >
            ✏️ Modifier
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              ...deleteButtonStyle,
              opacity: isDeleting ? 0.7 : 1,
              cursor: isDeleting ? "not-allowed" : "pointer",
            }}
          >
            {isDeleting ? "Suppression..." : "🗑️ Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  maxWidth: 700,
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
};

const errorActionsStyle: CSSProperties = {
  textAlign: "center",
  marginTop: 16,
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
  gap: 16,
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
};

const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  overflow: "hidden",
};

const cardBodyStyle: CSSProperties = {
  padding: 24,
};

const rowStyle: CSSProperties = {
  display: "flex",
  borderBottom: "1px solid #f3f4f6",
  padding: "12px 0",
};

const rowLabelStyle: CSSProperties = {
  width: 200,
  color: "#6b7280",
  fontSize: 14,
  fontWeight: 500,
  flexShrink: 0,
};

const rowValueStyle: CSSProperties = {
  fontSize: 14,
  color: "#111827",
};

const footerStyle: CSSProperties = {
  padding: "16px 24px",
  background: "#f9fafb",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const editButtonStyle: CSSProperties = {
  padding: "10px 20px",
  background: "#f59e0b",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
};

const deleteButtonStyle: CSSProperties = {
  padding: "10px 20px",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 14,
};