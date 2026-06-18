import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { emailEnvoyeService } from "../api/emailEnvoyeService";
import type { EmailEnvoyeDto, StatutEnvoi } from "../types/emailEnvoye";

interface DetailRow {
  label: string;
  value: string;
}

export default function EmailDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [email, setEmail] = useState<EmailEnvoyeDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailId = Number(id);

  const fetchEmail = useCallback(async () => {
    if (!id || Number.isNaN(emailId)) {
      setError("Identifiant email invalide.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await emailEnvoyeService.getEmailById(emailId);
      setEmail(data);
    } catch (fetchError) {
      console.error("Failed to load sent email", fetchError);
      setError("Email introuvable.");
    } finally {
      setIsLoading(false);
    }
  }, [id, emailId]);

  useEffect(() => {
    fetchEmail();
  }, [fetchEmail]);

  const handleDelete = async () => {
    if (!email?.id) return;

    const confirmed = window.confirm("Supprimer cet email ?");
    if (!confirmed) return;

    try {
      setIsDeleting(true);

      await emailEnvoyeService.deleteEmail(email.id);
      navigate("/emails-envoyes");
    } catch (deleteError) {
      console.error("Failed to delete sent email", deleteError);
      setError("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  const rows = useMemo<DetailRow[]>(() => {
    if (!email) return [];

    return [
      {
        label: "👤 Expéditeur",
        value: email.nomExpediteur || "—",
      },
      {
        label: "📧 Destinataire",
        value: email.destinataire,
      },
      {
        label: "📝 Sujet",
        value: email.sujet,
      },
      {
        label: "🏢 Association",
        value: email.associationId ? `#${email.associationId}` : "—",
      },
      {
        label: "📅 Date",
        value: email.dateEnvoi
          ? new Date(email.dateEnvoi).toLocaleString("fr-FR")
          : "—",
      },
    ];
  }, [email]);

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
          onClick={() => navigate("/emails-envoyes")}
        >
          ← Retour
        </button>
      </div>
    );
  }

  if (!email) {
    return null;
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>📧 Email #{email.id}</h2>

        <button
          type="button"
          onClick={() => navigate("/emails-envoyes")}
          style={backButtonStyle}
        >
          ← Retour
        </button>
      </div>

      <div style={cardStyle}>
        <div style={cardBodyStyle}>
          {rows.map(({ label, value }) => (
            <Row key={label} label={label} value={value} />
          ))}

          <div style={rowStyle}>
            <span style={rowLabelStyle}>📊 Statut</span>

            {email.statutEnvoi ? (
              <span style={statusBadgeStyle(email.statutEnvoi)}>
                {getStatusLabel(email.statutEnvoi)}
              </span>
            ) : (
              <span style={emptyValueStyle}>—</span>
            )}
          </div>

          <div style={contentWrapperStyle}>
            <span style={contentLabelStyle}>💬 Contenu</span>

            <div style={contentBoxStyle}>
              {email.contenu || (
                <span style={emptyValueStyle}>Aucun contenu</span>
              )}
            </div>
          </div>
        </div>

        <div style={footerStyle}>
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

function Row({ label, value }: DetailRow) {
  return (
    <div style={rowStyle}>
      <span style={rowLabelStyle}>{label}</span>
      <span style={rowValueStyle}>{value}</span>
    </div>
  );
}

function getStatusLabel(status: StatutEnvoi | string): string {
  if (status === "SUCCES") return "✅ Succès";
  if (status === "ECHEC") return "❌ Échec";
  return status;
}

function statusBadgeStyle(status: StatutEnvoi | string): CSSProperties {
  const isSuccess = status === "SUCCES";

  return {
    padding: "2px 12px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    background: isSuccess ? "#f0fdf4" : "#fef2f2",
    color: isSuccess ? "#16a34a" : "#dc2626",
    border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
  };
}

const pageStyle: CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "32px 16px",
};

const loadingStyle: CSSProperties = {
  padding: 32,
  color: "#64748b",
  textAlign: "center",
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
  marginBottom: 24,
  gap: 16,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
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

const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const cardBodyStyle: CSSProperties = {
  padding: 28,
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const rowStyle: CSSProperties = {
  display: "flex",
  gap: 16,
};

const rowLabelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#374151",
  minWidth: 140,
};

const rowValueStyle: CSSProperties = {
  fontSize: 14,
  color: "#1e293b",
  wordBreak: "break-word",
};

const emptyValueStyle: CSSProperties = {
  color: "#94a3b8",
};

const contentWrapperStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const contentLabelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#374151",
};

const contentBoxStyle: CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: "12px 16px",
  fontSize: 14,
  color: "#1e293b",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap",
};

const footerStyle: CSSProperties = {
  padding: "16px 28px",
  borderTop: "1px solid #f1f5f9",
  display: "flex",
  justifyContent: "flex-end",
};

const deleteButtonStyle: CSSProperties = {
  padding: "10px 20px",
  background: "#fef2f2",
  color: "#ef4444",
  border: "1px solid #fecaca",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 14,
};