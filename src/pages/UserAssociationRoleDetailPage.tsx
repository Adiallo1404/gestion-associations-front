import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deleteUserAssociationRole,
  getRoleByUserAndAssociation,
} from "../api/userAssociationRoleService";
import type { UserAssociationRoleDto } from "../types/userAssociationRole";

interface DetailRow {
  label: string;
  value: string;
}

export default function UserAssociationRoleDetailPage() {
  const { userId, associationId } = useParams<{
    userId: string;
    associationId: string;
  }>();

  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<UserAssociationRoleDto | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedUserId = Number(userId);
  const parsedAssociationId = Number(associationId);

  const loadAssignment = useCallback(async () => {
    if (
      !userId ||
      !associationId ||
      Number.isNaN(parsedUserId) ||
      Number.isNaN(parsedAssociationId)
    ) {
      setError("Paramètres d'affectation invalides.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await getRoleByUserAndAssociation(
        parsedUserId,
        parsedAssociationId
      );

      setAssignment(result);
    } catch (loadError) {
      console.error("Failed to load user association role", loadError);
      setError("Affectation introuvable.");
    } finally {
      setIsLoading(false);
    }
  }, [associationId, parsedAssociationId, parsedUserId, userId]);

  useEffect(() => {
    loadAssignment();
  }, [loadAssignment]);

  const handleDelete = async () => {
    if (!assignment?.id) return;

    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette affectation ?"
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);

      await deleteUserAssociationRole(assignment.id);
      navigate("/user-association-roles");
    } catch (deleteError) {
      console.error("Failed to delete user association role", deleteError);
      setError("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  const rows = useMemo<DetailRow[]>(() => {
    if (!assignment) return [];

    return [
      {
        label: "ID",
        value: String(assignment.id),
      },
      {
        label: "Utilisateur",
        value: `Utilisateur #${assignment.userId}`,
      },
      {
        label: "Association",
        value: assignment.associationName
          ? `${assignment.associationName} (#${assignment.associationId})`
          : `Association #${assignment.associationId}`,
      },
      {
        label: "Rôle",
        value: assignment.roleName
          ? `${assignment.roleName} (#${assignment.roleId})`
          : `Rôle #${assignment.roleId}`,
      },
    ];
  }, [assignment]);

  if (isLoading) {
    return <div style={styles.message}>Chargement...</div>;
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorBox}>{error}</div>

        <button
          type="button"
          style={styles.backButton}
          onClick={() => navigate("/user-association-roles")}
        >
          ← Retour aux affectations
        </button>
      </div>
    );
  }

  if (!assignment) {
    return <div style={styles.message}>Affectation introuvable.</div>;
  }

  return (
    <div style={styles.page}>
      <button
        type="button"
        style={styles.backButton}
        onClick={() => navigate("/user-association-roles")}
      >
        ← Retour aux affectations
      </button>

      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Affectation utilisateur</h1>
            <p style={styles.subtitle}>
              Rôle d'un utilisateur dans une association
            </p>
          </div>

          <span style={styles.badge}>{assignment.roleName || "Rôle assigné"}</span>
        </div>

        <div style={styles.divider} />

        <div style={styles.rows}>
          {rows.map((row) => (
            <div key={row.label} style={styles.row}>
              <span style={styles.label}>{row.label}</span>
              <span style={styles.value}>{row.value}</span>
            </div>
          ))}
        </div>

        <div style={styles.divider} />

        <div style={styles.actions}>
          <button
            type="button"
            style={styles.editButton}
            onClick={() =>
              navigate(`/user-association-roles/${assignment.id}/edit`)
            }
            disabled={isDeleting}
          >
            ✏️ Modifier
          </button>

          <button
            type="button"
            style={{
              ...styles.deleteButton,
              opacity: isDeleting ? 0.7 : 1,
              cursor: isDeleting ? "not-allowed" : "pointer",
            }}
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Suppression..." : "🗑️ Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "32px 16px",
    fontFamily: "system-ui, sans-serif",
  },
  message: {
    textAlign: "center",
    padding: 64,
    color: "#6b7280",
    fontFamily: "system-ui, sans-serif",
  },
  backButton: {
    background: "#fff",
    border: "1px solid #d1d5db",
    color: "#374151",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    marginBottom: 20,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 24,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#111827",
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: 14,
    color: "#6b7280",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 12px",
    borderRadius: 999,
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  divider: {
    height: 1,
    background: "#f3f4f6",
    margin: "22px 0",
  },
  rows: {
    display: "grid",
    gap: 0,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "180px 1fr",
    gap: 16,
    padding: "12px 0",
    borderBottom: "1px solid #f9fafb",
  },
  label: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  value: {
    color: "#111827",
    fontSize: 14,
    fontWeight: 500,
    wordBreak: "break-word",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },
  editButton: {
    padding: "10px 18px",
    background: "#f59e0b",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  deleteButton: {
    padding: "10px 18px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
  },
  errorBox: {
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 16,
    fontSize: 14,
  },
};