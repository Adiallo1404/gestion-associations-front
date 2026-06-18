import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { memberHistoryService } from "../api/memberHistoryService";
import { memberService } from "../api/memberService";
import { getAssociationById } from "../api/associationService";
import type { MemberHistoryDto } from "../types/memberHistory";
import { STATUT_MEMBRE_LABELS } from "../types/memberHistory";

interface DetailRow {
  label: string;
  value: string;
}

export default function MemberHistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [history, setHistory] = useState<MemberHistoryDto | null>(null);
  const [memberName, setMemberName] = useState("");
  const [associationName, setAssociationName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const historyId = Number(id);

  const loadHistory = useCallback(async () => {
    if (!id || Number.isNaN(historyId)) {
      setError("Identifiant historique invalide.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await memberHistoryService.getMemberHistoryById(historyId);
      setHistory(data);

      const [member, association] = await Promise.all([
        memberService.getById(data.memberId),
        getAssociationById(data.associationId),
      ]);

      setMemberName(`${member.firstName} ${member.lastName}`.trim());
      setAssociationName(association.name);
    } catch (loadError) {
      console.error("Failed to load member history details", loadError);
      setError("Historique introuvable.");
    } finally {
      setIsLoading(false);
    }
  }, [id, historyId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDelete = async () => {
    if (!history?.id) return;

    const confirmed = window.confirm("Supprimer cet historique ?");
    if (!confirmed) return;

    try {
      setIsDeleting(true);

      await memberHistoryService.deleteMemberHistory(history.id);
      navigate("/member-histories");
    } catch (deleteError) {
      console.error("Failed to delete member history", deleteError);
      setError("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date?: string | null): string => {
    return date ? new Date(date).toLocaleString("fr-FR") : "—";
  };

  const rows = useMemo<DetailRow[]>(() => {
    if (!history) return [];

    return [
      {
        label: "Membre",
        value: memberName || `Membre #${history.memberId}`,
      },
      {
        label: "Association",
        value: associationName || `Association #${history.associationId}`,
      },
      {
        label: "Ancien statut",
        value: history.ancienStatut
          ? STATUT_MEMBRE_LABELS[history.ancienStatut]
          : "Création",
      },
      {
        label: "Nouveau statut",
        value: STATUT_MEMBRE_LABELS[history.nouveauStatut],
      },
      {
        label: "Motif",
        value: history.motif || "—",
      },
      {
        label: "Date",
        value: formatDate(history.dateChangement),
      },
      {
        label: "Modifié par",
        value: history.modifieParNom || "Système",
      },
    ];
  }, [history, memberName, associationName]);

  if (isLoading) {
    return <div style={loadingStyle}>Chargement...</div>;
  }

  if (error || !history) {
    return (
      <div style={errorContainerStyle}>
        <div style={errorBoxStyle}>{error || "Données indisponibles"}</div>

        <div style={errorActionsStyle}>
          <button
            type="button"
            onClick={() => navigate("/member-histories")}
            style={backButtonStyle}
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>📜 Historique #{history.id}</h2>

        <button
          type="button"
          onClick={() => navigate("/member-histories")}
          style={backButtonStyle}
        >
          ← Retour
        </button>
      </div>

      <div style={cardStyle}>
        <div style={cardBodyStyle}>
          {rows.map(({ label, value }) => (
            <div key={label} style={rowStyle}>
              <span style={rowLabelStyle}>{label}</span>
              <span style={rowValueStyle}>{value}</span>
            </div>
          ))}
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
  wordBreak: "break-word",
};

const footerStyle: CSSProperties = {
  padding: "16px 24px",
  background: "#f9fafb",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "flex-end",
};

const deleteButtonStyle: CSSProperties = {
  padding: "10px 20px",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
};