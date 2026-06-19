import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { roleService } from "../api/roleService";
import type { RoleDto } from "../types/role";
import { PERMISSION_LABELS } from "../types/role";

interface DetailRow {
  label: string;
  value: string;
}

export default function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [role, setRole] = useState<RoleDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleId = Number(id);

  const loadRole = useCallback(async () => {
    if (!id || Number.isNaN(roleId)) {
      setError("Identifiant rôle invalide.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await roleService.getRoleById(roleId);
      setRole(data);
    } catch (loadError) {
      console.error("Failed to load role details", loadError);
      setError("Rôle introuvable.");
    } finally {
      setIsLoading(false);
    }
  }, [id, roleId]);

  useEffect(() => {
    loadRole();
  }, [loadRole]);

  const handleDelete = async () => {
    if (!role?.id) return;

    const confirmed = window.confirm("Supprimer ce rôle ?");
    if (!confirmed) return;

    try {
      setIsDeleting(true);

      await roleService.deleteRole(role.id);
      navigate("/roles");
    } catch (deleteError) {
      console.error("Failed to delete role", deleteError);
      setError("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date?: string | null): string => {
    return date ? new Date(date).toLocaleString("fr-FR") : "—";
  };

  const rows = useMemo<DetailRow[]>(() => {
    if (!role) return [];

    return [
      {
        label: "Nom",
        value: role.name,
      },
      {
        label: "Description",
        value: role.description || "—",
      },
      {
        label: "Référence externe",
        value: role.externalReference || "—",
      },
      {
        label: "Date création",
        value: formatDate(role.creationDate),
      },
      {
        label: "Date modification",
        value: formatDate(role.modificationDate),
      },
    ];
  }, [role]);

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
            onClick={() => navigate("/roles")}
            style={backButtonStyle}
          >
            ← Retour aux rôles
          </button>
        </div>
      </div>
    );
  }

  if (!role) {
    return null;
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>🔐 {role.name}</h2>

        <button
          type="button"
          onClick={() => navigate("/roles")}
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

          <div style={permissionSectionStyle}>
            <span style={permissionTitleStyle}>
              permissions ({(role.permissions ?? []).length}
            </span>

            <div style={permissionListStyle}>

              {(role.permissions ?? []).length > 0 ? (
  (role.permissions ?? []).map((permission) => (
                  <span key={permission} style={permissionBadgeStyle}>
                    {PERMISSION_LABELS[permission] || permission}
                  </span>
                ))
              ) : (
                <span style={emptyValueStyle}>Aucune permission</span>
              )}
            </div>
          </div>
        </div>

        <div style={footerStyle}>
          <button
            type="button"
            onClick={() => navigate(`/roles/${role.id}/edit`)}
            disabled={isDeleting}
            style={editButtonStyle}
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
  width: 180,
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

const permissionSectionStyle: CSSProperties = {
  paddingTop: 16,
};

const permissionTitleStyle: CSSProperties = {
  color: "#6b7280",
  fontSize: 14,
  fontWeight: 500,
  display: "block",
  marginBottom: 12,
};

const permissionListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const permissionBadgeStyle: CSSProperties = {
  background: "#ede9fe",
  color: "#5b21b6",
  padding: "5px 14px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
};

const emptyValueStyle: CSSProperties = {
  color: "#9ca3af",
  fontSize: 13,
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