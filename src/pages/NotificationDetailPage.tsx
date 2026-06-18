import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { notificationService } from "../api/notificationService";
import type {
  NotificationDto,
  StatutNotification,
  TypeNotification,
} from "../types/notification";

const TYPE_LABELS: Record<TypeNotification, string> = {
  RELANCE_COTISATION: "Relance cotisation",
  COTISATION_PAYEE: "Cotisation payée",
  NOUVEAU_MEMBRE: "Nouveau membre",
  CHANGEMENT_STATUT: "Changement statut",
  DOCUMENT_PARTAGE: "Document partagé",
  RAPPEL_ECHEANCE: "Rappel échéance",
  INFORMATION_GENERALE: "Information générale",
};

interface DetailRow {
  label: string;
  value: string | number;
}

export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [notification, setNotification] = useState<NotificationDto | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notificationId = Number(id);

  const fetchNotification = useCallback(async () => {
    if (!id || Number.isNaN(notificationId)) {
      setError("Identifiant notification invalide.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await notificationService.getNotificationById(
        notificationId
      );

      if (data.statut === "NON_LUE") {
        try {
          const updated = await notificationService.markNotificationAsRead(
            notificationId
          );

          setNotification(updated);
          return;
        } catch (readError) {
          console.warn("Failed to mark notification as read", readError);
        }
      }

      setNotification(data);
    } catch (fetchError) {
      console.error("Failed to load notification", fetchError);
      setError("Notification introuvable.");
    } finally {
      setIsLoading(false);
    }
  }, [id, notificationId]);

  useEffect(() => {
    fetchNotification();
  }, [fetchNotification]);

  const handleDelete = async () => {
    if (!notification?.id) return;

    const confirmed = window.confirm("Supprimer cette notification ?");
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await notificationService.deleteNotification(notification.id);
      navigate("/notifications");
    } catch (deleteError) {
      console.error("Failed to delete notification", deleteError);
      setError("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  const rows = useMemo<DetailRow[]>(() => {
    if (!notification) return [];

    return [
      {
        label: "Type",
        value:
          TYPE_LABELS[notification.typeNotification] ||
          notification.typeNotification,
      },
      {
        label: "Statut",
        value: notification.statut,
      },
      {
        label: "Association",
        value: notification.associationId,
      },
      {
        label: "Destinataire",
        value: notification.destinataireId,
      },
      {
        label: "Membre",
        value: notification.memberId ?? "—",
      },
      {
        label: "Lien action",
        value: notification.lienAction || "—",
      },
      {
        label: "Email envoyé",
        value: notification.envoyeeParEmail ? "Oui" : "Non",
      },
      {
        label: "Date lecture",
        value: notification.dateLecture
          ? new Date(notification.dateLecture).toLocaleString("fr-FR")
          : "—",
      },
      {
        label: "Expiration",
        value: notification.dateExpiration
          ? new Date(notification.dateExpiration).toLocaleString("fr-FR")
          : "—",
      },
      {
        label: "Date création",
        value: notification.dateCreation
          ? new Date(notification.dateCreation).toLocaleString("fr-FR")
          : "—",
      },
    ];
  }, [notification]);

  if (isLoading) {
    return <div style={loadingStyle}>Chargement...</div>;
  }

  if (error) {
    return (
      <div style={errorContainerStyle}>
        <div style={errorBoxStyle}>{error}</div>

        <div style={centerStyle}>
          <button
            onClick={() => navigate("/notifications")}
            style={backButtonStyle}
          >
            ← Retour aux notifications
          </button>
        </div>
      </div>
    );
  }

  if (!notification) {
    return null;
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>🔔 {notification.titre}</h2>

        <button
          onClick={() => navigate("/notifications")}
          style={backButtonStyle}
        >
          ← Retour
        </button>
      </div>

      <div style={cardStyle}>
        <div style={cardBodyStyle}>
          <div style={statusWrapperStyle}>
            <span style={statusBadgeStyle(notification.statut)}>
              {getStatusLabel(notification.statut)}
            </span>
          </div>

          {rows.map(({ label, value }) => (
            <div key={label} style={rowStyle}>
              <span style={rowLabelStyle}>{label}</span>
              <span style={rowValueStyle}>{String(value)}</span>
            </div>
          ))}

          <div style={messageRowStyle}>
            <span style={rowLabelStyle}>Message</span>

            <div style={messageBoxStyle}>
              {notification.message || "Aucun message"}
            </div>
          </div>
        </div>

        <div style={footerStyle}>
          <button
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

function getStatusLabel(statut: StatutNotification): string {
  switch (statut) {
    case "NON_LUE":
      return "● Non lue";
    case "LUE":
      return "✓ Lue";
    case "ARCHIVEE":
      return "Archivée";
    default:
      return statut;
  }
}

function statusBadgeStyle(statut: StatutNotification): CSSProperties {
  if (statut === "NON_LUE") {
    return {
      background: "#eff6ff",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
      padding: "4px 14px",
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 600,
    };
  }

  if (statut === "LUE") {
    return {
      background: "#f0fdf4",
      color: "#15803d",
      border: "1px solid #bbf7d0",
      padding: "4px 14px",
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 600,
    };
  }

  return {
    background: "#f9fafb",
    color: "#6b7280",
    border: "1px solid #e5e7eb",
    padding: "4px 14px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
  };
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

const centerStyle: CSSProperties = {
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
  fontSize: 14,
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

const statusWrapperStyle: CSSProperties = {
  marginBottom: 16,
};

const rowStyle: CSSProperties = {
  display: "flex",
  borderBottom: "1px solid #f3f4f6",
  padding: "12px 0",
};

const rowLabelStyle: CSSProperties = {
  width: 160,
  color: "#6b7280",
  fontSize: 14,
  fontWeight: 500,
  flexShrink: 0,
};

const rowValueStyle: CSSProperties = {
  fontSize: 14,
  color: "#111827",
};

const messageRowStyle: CSSProperties = {
  display: "flex",
  paddingTop: 12,
};

const messageBoxStyle: CSSProperties = {
  flex: 1,
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "12px 16px",
  fontSize: 14,
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
  minHeight: 80,
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
  fontSize: 14,
};