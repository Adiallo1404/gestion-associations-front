import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteUserAssociationRole,
  getUserAssociationRoles,
} from "../api/userAssociationRoleService";
import type { UserAssociationRoleDto } from "../types/userAssociationRole";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize";

const PAGE_SIZE = 10;

interface DeleteModalState {
  isOpen: boolean;
  id: number | null;
  label: string;
}

const AVATAR_COLORS = [
  { bg: "#eff6ff", color: "#1d4ed8" },
  { bg: "#f0fdf4", color: "#16a34a" },
  { bg: "#fffbeb", color: "#d97706" },
  { bg: "#f5f3ff", color: "#7c3aed" },
  { bg: "#fef2f2", color: "#dc2626" },
];

export default function UserAssociationRoleListPage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();

  const [assignments, setAssignments] = useState<UserAssociationRoleDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<DeleteModalState>({
    isOpen: false,
    id: null,
    label: "",
  });

  const loadAssignments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getUserAssociationRoles({}, page, PAGE_SIZE);

      setAssignments(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
    } catch (loadError) {
      console.error("Failed to load user association roles", loadError);
      setError("Erreur lors du chargement des affectations.");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const getUserLabel = (assignment: UserAssociationRoleDto): string => {
    return `Utilisateur #${assignment.userId}`;
  };

  const getAvatarText = (assignment: UserAssociationRoleDto): string => {
    return `#${assignment.userId}`;
  };

  const handleDeleteClick = (assignment: UserAssociationRoleDto) => {
    setModal({
      isOpen: true,
      id: assignment.id,
      label: `${getUserLabel(assignment)} — ${
        assignment.associationName || `Association #${assignment.associationId}`
      } — ${assignment.roleName || `Rôle #${assignment.roleId}`}`,
    });
  };

  const handleConfirmDelete = async () => {
    if (modal.id === null) return;

    try {
      await deleteUserAssociationRole(modal.id);

      setModal({
        isOpen: false,
        id: null,
        label: "",
      });

      await loadAssignments();
    } catch (deleteError) {
      console.error("Failed to delete user association role", deleteError);
      setError("Erreur lors de la suppression de l'affectation.");

      setModal({
        isOpen: false,
        id: null,
        label: "",
      });
    }
  };

  const handleCancelDelete = () => {
    setModal({
      isOpen: false,
      id: null,
      label: "",
    });
  };

  const canGoPrevious = page > 0;
  const canGoNext = totalPages > 0 && page + 1 < totalPages;

  return (
    <div
      style={{
        ...styles.page,
        padding: isMobile ? "12px" : "32px 40px",
      }}
    >
      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer l'affectation"
        message={`Êtes-vous sûr de vouloir supprimer l'affectation "${modal.label}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <nav style={breadcrumbStyle}>
        <span style={breadcrumbHomeStyle} onClick={() => navigate("/")}>
          🏠 Accueil
        </span>

        <span style={breadcrumbSeparatorStyle}>›</span>

        <span style={breadcrumbCurrentStyle}>Affectations utilisateurs</span>
      </nav>

      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle(isMobile)}>👥 Rôles & Associations</h1>

          {!isMobile && (
            <p style={subtitleStyle}>
              Gestion des accès utilisateurs par association
            </p>
          )}
        </div>

        <button
          type="button"
          style={styles.btnPrimary}
          onClick={() => navigate("/user-association-roles/new")}
        >
          {isMobile ? "➕" : "+ Assigner un rôle"}
        </button>
      </div>

      <div style={statsContainerStyle(isMobile)}>
        <div style={{ ...styles.statCard, flex: 1 }}>
          <div style={styles.statLabel}>Total affectations</div>
          <div
            style={{
              ...styles.statVal,
              color: "#1d4ed8",
              fontSize: isMobile ? 22 : 28,
            }}
          >
            {totalElements}
          </div>
        </div>

        <div style={{ ...styles.statCard, flex: 1 }}>
          <div style={styles.statLabel}>Page</div>
          <div
            style={{
              ...styles.statVal,
              color: "#7c3aed",
              fontSize: isMobile ? 22 : 28,
            }}
          >
            {totalPages > 0 ? `${page + 1}/${totalPages}` : "0/0"}
          </div>
        </div>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {isLoading ? (
        <p style={styles.empty}>Chargement...</p>
      ) : isMobile ? (
        <div style={mobileListStyle}>
          {assignments.length === 0 ? (
            <p style={styles.empty}>Aucune affectation trouvée.</p>
          ) : (
            assignments.map((assignment, index) => {
              const avatar = AVATAR_COLORS[index % AVATAR_COLORS.length];
              const userLabel = getUserLabel(assignment);

              return (
                <div key={assignment.id} style={mobileCardStyle}>
                  <div style={mobileHeaderStyle}>
                    <div
                      style={{
                        ...styles.avatar,
                        background: avatar.bg,
                        color: avatar.color,
                      }}
                    >
                      {getAvatarText(assignment)}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={styles.userName}>{userLabel}</div>

                      <div style={mobileSubTextStyle}>
                        {assignment.associationName ||
                          `Association #${assignment.associationId}`}
                      </div>
                    </div>

                    <span
                      style={{
                        ...styles.badge,
                        background: avatar.bg,
                        color: avatar.color,
                      }}
                    >
                      {assignment.roleName || `Rôle #${assignment.roleId}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    style={{
                      ...styles.btnDelete,
                      width: "100%",
                      justifyContent: "center",
                      display: "flex",
                    }}
                    onClick={() => handleDeleteClick(assignment)}
                  >
                    🗑️ Supprimer l'accès
                  </button>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Utilisateur</th>
                {!isTablet && <th style={styles.th}>Association</th>}
                <th style={styles.th}>Rôle</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={isTablet ? 3 : 4} style={styles.empty}>
                    Aucune affectation trouvée.
                  </td>
                </tr>
              ) : (
                assignments.map((assignment, index) => {
                  const avatar = AVATAR_COLORS[index % AVATAR_COLORS.length];
                  const userLabel = getUserLabel(assignment);

                  return (
                    <tr key={assignment.id} style={styles.row}>
                      <td style={styles.td}>
                        <div style={styles.userCell}>
                          <div
                            style={{
                              ...styles.avatar,
                              background: avatar.bg,
                              color: avatar.color,
                            }}
                          >
                            {getAvatarText(assignment)}
                          </div>

                          <span style={styles.userName}>{userLabel}</span>
                        </div>
                      </td>

                      {!isTablet && (
                        <td style={{ ...styles.td, color: "#475569" }}>
                          {assignment.associationName ||
                            `Association #${assignment.associationId}`}
                        </td>
                      )}

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            background: avatar.bg,
                            color: avatar.color,
                          }}
                        >
                          {assignment.roleName || `Rôle #${assignment.roleId}`}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <button
                          type="button"
                          style={styles.btnDelete}
                          onClick={() => handleDeleteClick(assignment)}
                        >
                          {isTablet ? "🗑️" : "🗑️ Supprimer"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <div style={paginationStyle}>
        <button
          type="button"
          onClick={() => setPage((currentPage) => currentPage - 1)}
          disabled={!canGoPrevious}
          style={{
            ...styles.pageBtn,
            opacity: canGoPrevious ? 1 : 0.4,
            cursor: canGoPrevious ? "pointer" : "not-allowed",
          }}
        >
          ← Précédent
        </button>

        <span style={styles.pageInfo}>
          Page {totalPages > 0 ? page + 1 : 0} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => setPage((currentPage) => currentPage + 1)}
          disabled={!canGoNext}
          style={{
            ...styles.pageBtn,
            opacity: canGoNext ? 1 : 0.4,
            cursor: canGoNext ? "pointer" : "not-allowed",
          }}
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}

const breadcrumbStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 20,
  fontSize: 14,
};

const breadcrumbHomeStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#64748b",
  cursor: "pointer",
  fontWeight: 500,
};

const breadcrumbSeparatorStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: 16,
};

const breadcrumbCurrentStyle: CSSProperties = {
  color: "#0f172a",
  fontWeight: 600,
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
};

const titleStyle = (isMobile: boolean): CSSProperties => ({
  margin: 0,
  fontSize: isMobile ? 18 : 32,
  fontWeight: 700,
  color: "#0f172a",
});

const subtitleStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#64748b",
  fontSize: 14,
};

const statsContainerStyle = (isMobile: boolean): CSSProperties => ({
  display: "flex",
  gap: isMobile ? 8 : 16,
  marginBottom: 24,
});

const mobileListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const mobileCardStyle: CSSProperties = {
  background: "white",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  padding: 14,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};

const mobileHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 12,
};

const mobileSubTextStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
};

const paginationStyle: CSSProperties = {
  marginTop: 24,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 12,
};

const styles: Record<string, CSSProperties> = {
  page: {
    background: "#f1f5f9",
    minHeight: "100vh",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  btnPrimary: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  statCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "16px 20px",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 6,
    fontWeight: 500,
  },
  statVal: {
    fontWeight: 700,
  },
  card: {
    background: "white",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  thead: {
    background: "#f8fafc",
  },
  th: {
    padding: "13px 18px",
    textAlign: "left",
    color: "#64748b",
    fontWeight: 600,
    fontSize: 12,
    textTransform: "uppercase",
    borderBottom: "1px solid #e2e8f0",
  },
  row: {
    borderBottom: "1px solid #f1f5f9",
    background: "white",
  },
  td: {
    padding: "14px 18px",
    color: "#1e293b",
    verticalAlign: "middle",
  },
  userCell: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  userName: {
    fontWeight: 600,
    color: "#0f172a",
  },
  badge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  btnDelete: {
    background: "#fef2f2",
    color: "#ef4444",
    border: "1px solid #fecaca",
    padding: "6px 14px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
  },
  empty: {
    textAlign: "center",
    padding: 40,
    color: "#94a3b8",
    fontSize: 15,
  },
  pageBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "white",
    fontSize: 14,
    color: "#374151",
    fontWeight: 500,
  },
  pageInfo: {
    fontWeight: 600,
    color: "#0f172a",
    fontSize: 14,
  },
  errorBox: {
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "10px 14px",
    marginBottom: 16,
    fontSize: 14,
  },
};