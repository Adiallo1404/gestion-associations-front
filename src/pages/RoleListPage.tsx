import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { roleService } from "../api/roleService";
import type { RoleDto } from "../types/role";
import { PERMISSION_LABELS } from "../types/role";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize";

const PAGE_SIZE = 10;

interface DeleteModalState {
  isOpen: boolean;
  id: number | null;
  label: string;
}

interface RoleStats {
  total: number;
  withPermissions: number;
  withoutPermissions: number;
}

/**
 * Displays roles with filtering, pagination,
 * detail navigation and deletion capabilities.
 */
export default function RoleListPage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();

  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchName, setSearchName] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [stats, setStats] = useState<RoleStats>({
    total: 0,
    withPermissions: 0,
    withoutPermissions: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<DeleteModalState>({
    isOpen: false,
    id: null,
    label: "",
  });

  const fetchRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await roleService.getRoles({
        name: searchName || undefined,
        page,
        size: PAGE_SIZE,
        sort: "name,asc",
      });

      setRoles(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
    } catch (fetchError) {
      console.error("Failed to load roles", fetchError);
      setRoles([]);
      setTotalPages(0);
      setError("Erreur lors du chargement des rôles.");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchName]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await roleService.getRoles({
        page: 0,
        size: 1000,
        sort: "name,asc",
      });

      const allRoles = data.content ?? [];

      setStats({
        total: allRoles.length,
        withPermissions: allRoles.filter(
          (role) => role.permissions.length > 0
        ).length,
        withoutPermissions: allRoles.filter(
          (role) => role.permissions.length === 0
        ).length,
      });
    } catch (statsError) {
      console.error("Failed to load role statistics", statsError);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearch = () => {
    setPage(0);
    setSearchName(searchInput.trim());
  };

  const handleReset = () => {
    setPage(0);
    setSearchInput("");
    setSearchName("");
  };

  const handleDeleteClick = (
    id: number,
    name: string,
    event: MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();

    setModal({
      isOpen: true,
      id,
      label: name,
    });
  };

  const handleConfirmDelete = async () => {
    if (modal.id === null) return;

    try {
      await roleService.deleteRole(modal.id);

      setModal({
        isOpen: false,
        id: null,
        label: "",
      });

      await Promise.all([fetchRoles(), fetchStats()]);
    } catch (deleteError) {
      console.error("Failed to delete role", deleteError);
      setError("Erreur lors de la suppression du rôle.");

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

  const formatDate = (date?: string | null): string => {
    return date ? new Date(date).toLocaleString("fr-FR") : "—";
  };

  const renderPermissionSummary = (role: RoleDto) => {
    const permissions = role.permissions ?? [];

    if (permissions.length === 0) {
      return <span style={emptyTextStyle}>Aucune</span>;
    }

    const preview = permissions
      .slice(0, 2)
      .map((permission) => PERMISSION_LABELS[permission] ?? permission)
      .join(", ");

    return (
      <div style={permissionSummaryStyle}>
        <span style={permissionBadgeStyle}>
          {permissions.length} permission{permissions.length > 1 ? "s" : ""}
        </span>

        <span style={permissionPreviewStyle}>
          {preview}
          {permissions.length > 2 ? "..." : ""}
        </span>
      </div>
    );
  };

  const statCards = useMemo(
    () => [
      {
        label: "Total",
        value: stats.total,
        color: "#111827",
        background: "#f9fafb",
      },
      {
        label: "Avec permissions",
        value: stats.withPermissions,
        color: "#185FA5",
        background: "#E6F1FB",
      },
      {
        label: "Sans permissions",
        value: stats.withoutPermissions,
        color: "#b45309",
        background: "#fefce8",
      },
    ],
    [stats]
  );

  return (
    <div style={pageStyle(isMobile)}>
      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer le rôle"
        message={`Êtes-vous sûr de vouloir supprimer le rôle "${modal.label}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Breadcrumb navigation */}
      <nav style={breadcrumbStyle}>
        <span style={breadcrumbHomeStyle} onClick={() => navigate("/")}>
          🏠 Accueil
        </span>

        <span style={breadcrumbSeparatorStyle}>›</span>

        <span style={breadcrumbCurrentStyle}>Rôles</span>
      </nav>

      {/* Header */}
      <div style={headerStyle}>
        <h2 style={titleStyle(isMobile)}>🔐 Rôles</h2>

        <button
          type="button"
          style={addButtonStyle}
          onClick={() => navigate("/roles/new")}
        >
          {isMobile ? "➕" : "➕ Créer un rôle"}
        </button>
      </div>

      {/* Summary metrics */}
      <div style={statsGridStyle(isMobile)}>
        {statCards.map(({ label, value, color, background }) => (
          <div
            key={label}
            style={{
              ...statCardStyle(isMobile),
              background,
            }}
          >
            <div style={statLabelStyle(isMobile)}>{label}</div>

            <div
              style={{
                ...statValueStyle(isMobile),
                color,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Search filters */}
      <div style={searchContainerStyle(isMobile)}>
        <input
          style={searchInputStyle}
          placeholder="Rechercher par nom..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSearch();
            }
          }}
        />

        <button type="button" style={primaryButtonStyle} onClick={handleSearch}>
          {isMobile ? "🔍" : "🔍 Rechercher"}
        </button>

        <button type="button" style={resetButtonStyle} onClick={handleReset}>
          Réinitialiser
        </button>
      </div>

      {error && <div style={errorBannerStyle}>{error}</div>}

      {isLoading ? (
        <div style={loadingStyle}>Chargement...</div>
      ) : isMobile ? (
        <div style={mobileListStyle}>
          {roles.length === 0 ? (
            <p style={emptyStateStyle}>Aucun rôle trouvé</p>
          ) : (
            roles.map((role) => (
              <div
                key={role.id}
                onClick={() => navigate(`/roles/${role.id}`)}
                style={mobileCardStyle}
              >
                <div style={mobileTitleStyle}>{role.name}</div>

                {role.description && (
                  <div style={mobileDescriptionStyle}>{role.description}</div>
                )}

                <div style={mobilePermissionStyle}>
                  {renderPermissionSummary(role)}
                </div>

                <div style={mobileActionsStyle}>
                  <button
                    type="button"
                    style={{ ...viewButtonStyle, flex: 1 }}
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/roles/${role.id}`);
                    }}
                  >
                    👁️
                  </button>

                  <button
                    type="button"
                    style={{ ...editButtonStyle, flex: 1 }}
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/roles/${role.id}/edit`);
                    }}
                  >
                    ✏️
                  </button>

                  <button
                    type="button"
                    style={{ ...deleteButtonStyle, flex: 1 }}
                    onClick={(event) =>
                      handleDeleteClick(role.id, role.name, event)
                    }
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={thStyle}>Nom</th>

                {!isTablet && <th style={thStyle}>Description</th>}

                <th style={thStyle}>Permissions</th>

                {!isTablet && <th style={thStyle}>Référence externe</th>}

                {!isTablet && <th style={thStyle}>Date création</th>}

                <th style={thStyle}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td
                    colSpan={isTablet ? 3 : 6}
                    style={emptyTableCellStyle}
                  >
                    Aucun rôle trouvé
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr
                    key={role.id}
                    style={tableRowStyle}
                    onClick={() => navigate(`/roles/${role.id}`)}
                  >
                    <td style={nameCellStyle}>{role.name}</td>

                    {!isTablet && (
                      <td style={tdStyle}>{role.description || "—"}</td>
                    )}

                    <td style={tdStyle}>{renderPermissionSummary(role)}</td>

                    {!isTablet && (
                      <td style={tdStyle}>{role.externalReference || "—"}</td>
                    )}

                    {!isTablet && (
                      <td style={tdStyle}>{formatDate(role.creationDate)}</td>
                    )}

                    <td style={tdStyle}>
                      <div style={actionsStyle}>
                        <button
                          type="button"
                          style={viewButtonStyle}
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/roles/${role.id}`);
                          }}
                        >
                          👁️
                        </button>

                        <button
                          type="button"
                          style={editButtonStyle}
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/roles/${role.id}/edit`);
                          }}
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          style={deleteButtonStyle}
                          onClick={(event) =>
                            handleDeleteClick(role.id, role.name, event)
                          }
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={paginationStyle}>
          <button
            type="button"
            style={{
              ...pageButtonStyle,
              opacity: page === 0 ? 0.5 : 1,
              cursor: page === 0 ? "not-allowed" : "pointer",
            }}
            disabled={page === 0}
            onClick={() => setPage((currentPage) => currentPage - 1)}
          >
            ⬅
          </button>

          <span style={pageIndicatorStyle(isMobile)}>
            Page {page + 1} / {totalPages}
          </span>

          <button
            type="button"
            style={{
              ...pageButtonStyle,
              opacity: page + 1 >= totalPages ? 0.5 : 1,
              cursor: page + 1 >= totalPages ? "not-allowed" : "pointer",
            }}
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((currentPage) => currentPage + 1)}
          >
            ➡
          </button>
        </div>
      )}
    </div>
  );
}

const pageStyle = (isMobile: boolean): CSSProperties => ({
  padding: isMobile ? "12px" : "24px 20px",
});

const breadcrumbStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 16,
  fontSize: 14,
};

const breadcrumbHomeStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#6b7280",
  cursor: "pointer",
  fontWeight: 500,
};

const breadcrumbSeparatorStyle: CSSProperties = {
  color: "#9ca3af",
  fontSize: 16,
};

const breadcrumbCurrentStyle: CSSProperties = {
  color: "#111827",
  fontWeight: 600,
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
};

const titleStyle = (isMobile: boolean): CSSProperties => ({
  color: "#2c3e50",
  margin: 0,
  fontSize: isMobile ? 18 : 32,
});

const addButtonStyle: CSSProperties = {
  padding: "10px 16px",
  background: "#8b5cf6",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};

const statsGridStyle = (isMobile: boolean): CSSProperties => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr 1fr 1fr" : "repeat(3, minmax(0,1fr))",
  gap: isMobile ? 8 : 12,
  marginBottom: 20,
});

const statCardStyle = (isMobile: boolean): CSSProperties => ({
  borderRadius: 10,
  padding: isMobile ? "10px 8px" : "16px 20px",
});

const statLabelStyle = (isMobile: boolean): CSSProperties => ({
  fontSize: isMobile ? 10 : 12,
  color: "#6b7280",
  marginBottom: 4,
});

const statValueStyle = (isMobile: boolean): CSSProperties => ({
  fontSize: isMobile ? 20 : 28,
  fontWeight: 600,
});

const searchContainerStyle = (isMobile: boolean): CSSProperties => ({
  marginBottom: 16,
  display: "flex",
  gap: 10,
  flexDirection: isMobile ? "column" : "row",
});

const searchInputStyle: CSSProperties = {
  flex: 1,
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #ccc",
};

const primaryButtonStyle: CSSProperties = {
  padding: "8px 12px",
  background: "#8b5cf6",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const resetButtonStyle: CSSProperties = {
  padding: "8px 12px",
  background: "#fff",
  color: "#64748b",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  cursor: "pointer",
};

const errorBannerStyle: CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#dc2626",
  borderRadius: 8,
  padding: "12px 16px",
  marginBottom: 16,
};

const loadingStyle: CSSProperties = {
  textAlign: "center",
  padding: 40,
  color: "#6b7280",
};

const mobileListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const emptyStateStyle: CSSProperties = {
  textAlign: "center",
  color: "#9ca3af",
  padding: 40,
};

const mobileCardStyle: CSSProperties = {
  background: "#fff",
  borderRadius: 10,
  padding: 14,
  border: "1px solid #eee",
  cursor: "pointer",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};

const mobileTitleStyle: CSSProperties = {
  fontWeight: 700,
  fontSize: 15,
  marginBottom: 4,
};

const mobileDescriptionStyle: CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 6,
};

const mobilePermissionStyle: CSSProperties = {
  marginBottom: 10,
};

const mobileActionsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
};

const tableWrapperStyle: CSSProperties = {
  background: "white",
  borderRadius: 8,
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const tableHeaderRowStyle: CSSProperties = {
  background: "#E6F1FB",
  color: "#0C447C",
};

const thStyle: CSSProperties = {
  padding: "14px 16px",
  textAlign: "center",
  fontWeight: 500,
  fontSize: 13,
  borderBottom: "1px solid #B5D4F4",
};

const tableRowStyle: CSSProperties = {
  textAlign: "center",
  borderBottom: "1px solid #eee",
  background: "white",
  cursor: "pointer",
};

const tdStyle: CSSProperties = {
  padding: "10px 16px",
};

const nameCellStyle: CSSProperties = {
  padding: "10px 16px",
  fontWeight: 600,
};

const permissionSummaryStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
};

const permissionBadgeStyle: CSSProperties = {
  background: "#E6F1FB",
  color: "#185FA5",
  padding: "3px 10px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
};

const permissionPreviewStyle: CSSProperties = {
  color: "#6b7280",
  fontSize: 11,
};

const emptyTextStyle: CSSProperties = {
  color: "#9ca3af",
  fontSize: 13,
};

const emptyTableCellStyle: CSSProperties = {
  textAlign: "center",
  padding: 40,
  color: "#9ca3af",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 4,
};

const viewButtonStyle: CSSProperties = {
  background: "#f5f5f5",
  color: "#333",
  border: "1px solid #ccc",
  padding: "6px 8px",
  borderRadius: 5,
  cursor: "pointer",
};

const editButtonStyle: CSSProperties = {
  background: "#EAF3DE",
  color: "#3B6D11",
  border: "1px solid #C0DD97",
  padding: "6px 8px",
  borderRadius: 5,
  cursor: "pointer",
};

const deleteButtonStyle: CSSProperties = {
  background: "#FCEBEB",
  color: "#ee1111",
  border: "1px solid #F7C1C1",
  padding: "6px 8px",
  borderRadius: 5,
  cursor: "pointer",
};

const paginationStyle: CSSProperties = {
  marginTop: 16,
  textAlign: "center",
};

const pageButtonStyle: CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #ccc",
};

const pageIndicatorStyle = (isMobile: boolean): CSSProperties => ({
  margin: "0 12px",
  fontSize: isMobile ? 12 : 14,
  color: "#6b7280",
});