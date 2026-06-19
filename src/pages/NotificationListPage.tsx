import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import { notificationService } from "../api/notificationService";
import type {
  NotificationDto,
  NotificationFilter,
  StatutNotification,
  TypeNotification,
} from "../types/notification";
import { useWindowSize } from "../hooks/useWindowSize";

const PAGE_SIZE = 10;

const TYPE_LABELS: Record<TypeNotification, string> = {
  RELANCE_COTISATION: "Relance cotisation",
  COTISATION_PAYEE: "Cotisation payée",
  NOUVEAU_MEMBRE: "Nouveau membre",
  CHANGEMENT_STATUT: "Changement statut",
  DOCUMENT_PARTAGE: "Document partagé",
  RAPPEL_ECHEANCE: "Rappel échéance",
  INFORMATION_GENERALE: "Information générale",
};

const STATUT_COLORS: Record<StatutNotification, string> = {
  NON_LUE: "#3b82f6",
  LUE: "#22c55e",
  ARCHIVEE: "#9ca3af",
};

const STATUT_LABELS: Record<StatutNotification, string> = {
  NON_LUE: "Non lue",
  LUE: "Lue",
  ARCHIVEE: "Archivée",
};

interface NotificationStats {
  total: number;
  nonLues: number;
  lues: number;
  archivees: number;
}

interface DeleteModalState {
  isOpen: boolean;
  id: number | null;
  label: string;
}

export default function NotificationListPage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();

  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [filters, setFilters] = useState<NotificationFilter>({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    nonLues: 0,
    lues: 0,
    archivees: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const [modal, setModal] = useState<DeleteModalState>({
    isOpen: false,
    id: null,
    label: "",
  });

  const fetchStats = useCallback(async () => {
    try {
      const response = await notificationService.getNotifications({ page: 0, size: 1000 });
      const allNotifications = response.content ?? [];
      setStats({
        total: allNotifications.length,
        nonLues: allNotifications.filter((item) => item.statut === "NON_LUE").length,
        lues: allNotifications.filter((item) => item.statut === "LUE").length,
        archivees: allNotifications.filter((item) => item.statut === "ARCHIVEE").length,
      });
    } catch (error) {
      console.error("Failed to load notification stats", error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await notificationService.getNotifications({
        ...filters,
        page,
        size: PAGE_SIZE,
        sort: "dateCreation,desc",
      });
      setNotifications(response.content ?? []);
      setTotalPages(response.totalPages ?? 0);
    } catch (error) {
      console.error("Failed to load notifications", error);
      setNotifications([]);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const updateFilter = <K extends keyof NotificationFilter>(
    key: K,
    value: NotificationFilter[K] | undefined
  ) => {
    setPage(0);
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value || undefined }));
  };

  const handleMarkAsRead = async (id: number, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    try {
      await notificationService.markNotificationAsRead(id);
      await Promise.all([fetchNotifications(), fetchStats()]);
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const handleDeleteClick = (id: number, title: string, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setModal({ isOpen: true, id, label: title });
  };

  const handleConfirmDelete = async () => {
    if (modal.id === null) return;
    try {
      await notificationService.deleteNotification(modal.id);
      setModal({ isOpen: false, id: null, label: "" });
      await Promise.all([fetchNotifications(), fetchStats()]);
    } catch (error) {
      console.error("Failed to delete notification", error);
      setModal({ isOpen: false, id: null, label: "" });
    }
  };

  const handleCancelDelete = () => {
    setModal({ isOpen: false, id: null, label: "" });
  };

  const handlePreviousPage = () => {
    setPage((currentPage) => Math.max(currentPage - 1, 0));
  };

  const handleNextPage = () => {
    setPage((currentPage) =>
      totalPages > 0 ? Math.min(currentPage + 1, totalPages - 1) : currentPage
    );
  };

  const statCards = useMemo(() => [
    { label: "Total", value: stats.total, color: "#111827", bg: "#f9fafb" },
    { label: "Non lues", value: stats.nonLues, color: "#185FA5", bg: "#E6F1FB" },
    { label: "Lues", value: stats.lues, color: "#3B6D11", bg: "#EAF3DE" },
    { label: "Archivées", value: stats.archivees, color: "#5F5E5A", bg: "#F1EFE8" },
  ], [stats]);

  const getStatut = (n: NotificationDto): StatutNotification => n.statut ?? "NON_LUE";

  return (
    <div style={pageStyle(isMobile)}>
      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer la notification"
        message={`Êtes-vous sûr de vouloir supprimer la notification "${modal.label}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <nav style={breadcrumbStyle}>
        <span style={breadcrumbHomeStyle} onClick={() => navigate("/")}>🏠 Accueil</span>
        <span style={breadcrumbSeparatorStyle}>›</span>
        <span style={breadcrumbCurrentStyle}>Notifications</span>
      </nav>

      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle(isMobile)}>🔔 Notifications</h2>
          {!isMobile && <p style={subtitleStyle}>Gérez vos alertes et communications système</p>}
        </div>
        <button style={addButtonStyle} onClick={() => navigate("/notifications/new")}>
          {isMobile ? "➕" : "➕ Créer une notification"}
        </button>
      </div>

      <div style={statsGridStyle(isMobile)}>
        {statCards.map(({ label, value, color, bg }) => (
          <div key={label} style={statCardStyle(bg, isMobile)}>
            <div style={statLabelStyle}>{label}</div>
            <div style={statValueStyle(color, isMobile)}>{value}</div>
          </div>
        ))}
      </div>

      <div style={filtersContainerStyle(isMobile)}>
        <select
          style={{ ...inputStyle, flex: 1 }}
          value={filters.statut ?? ""}
          onChange={(event) =>
            updateFilter("statut", event.target.value ? (event.target.value as StatutNotification) : undefined)
          }
        >
          <option value="">-- Tous les statuts --</option>
          <option value="NON_LUE">Non lue</option>
          <option value="LUE">Lue</option>
          <option value="ARCHIVEE">Archivée</option>
        </select>

        {!isMobile && (
          <select
            style={{ ...inputStyle, flex: 1 }}
            value={filters.typeNotification ?? ""}
            onChange={(event) =>
              updateFilter("typeNotification", event.target.value ? (event.target.value as TypeNotification) : undefined)
            }
          >
            <option value="">-- Tous les types --</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <p style={emptyStateStyle}>Chargement des notifications...</p>
      ) : isMobile ? (
        <div style={mobileListStyle}>
          {notifications.length === 0 ? (
            <p style={emptyStateStyle}>Aucune notification</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => navigate(`/notifications/${notification.id}`)}
                style={mobileCardStyle(getStatut(notification))}
              >
                <div style={mobileCardHeaderStyle}>
                  <div style={mobileCardTitleStyle(getStatut(notification))}>
                    {getStatut(notification) === "NON_LUE" && <span style={unreadDotStyle}>●</span>}
                    {notification.titre}
                  </div>
                  <span style={statusBadgeStyle(getStatut(notification))}>
                    {STATUT_LABELS[getStatut(notification)]}
                  </span>
                </div>

                <div style={mobileMetaStyle}>
                  {TYPE_LABELS[notification.typeNotification]} ·{" "}
                  {notification.dateCreation
                    ? new Date(notification.dateCreation).toLocaleDateString("fr-FR")
                    : "—"}
                </div>

                <div style={mobileActionsStyle}>
                  <button
                    style={{ ...viewButtonStyle, flex: 1 }}
                    onClick={(event) => { event.stopPropagation(); navigate(`/notifications/${notification.id}`); }}
                  >👁️</button>

                  {getStatut(notification) === "NON_LUE" && (
                    <button
                      style={{ ...readButtonStyle, flex: 1 }}
                      onClick={(event) => handleMarkAsRead(notification.id!, event)}
                    >✅</button>
                  )}

                  <button
                    style={{ ...deleteButtonStyle, flex: 1 }}
                    onClick={(event) => handleDeleteClick(notification.id!, notification.titre, event)}
                  >🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={thStyle}>Titre</th>
                {!isTablet && <th style={thStyle}>Type</th>}
                <th style={thStyle}>Statut</th>
                {!isTablet && <th style={thStyle}>Date création</th>}
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={isTablet ? 3 : 5} style={emptyTableCellStyle}>Aucune notification</td>
                </tr>
              ) : (
                notifications.map((notification) => (
                  <tr
                    key={notification.id}
                    style={tableRowStyle(getStatut(notification))}
                    onClick={() => navigate(`/notifications/${notification.id}`)}
                  >
                    <td style={titleCellStyle(getStatut(notification))}>
                      {getStatut(notification) === "NON_LUE" && <span style={unreadDotStyle}>●</span>}
                      {notification.titre}
                    </td>

                    {!isTablet && (
                      <td style={{ ...tdStyle, color: "#64748b" }}>
                        {TYPE_LABELS[notification.typeNotification]}
                      </td>
                    )}

                    <td style={tdStyle}>
                      <span style={statusBadgeStyle(getStatut(notification))}>
                        {STATUT_LABELS[getStatut(notification)]}
                      </span>
                    </td>

                    {!isTablet && (
                      <td style={dateCellStyle}>
                        {notification.dateCreation
                          ? new Date(notification.dateCreation).toLocaleString("fr-FR")
                          : "—"}
                      </td>
                    )}

                    <td style={tdStyle}>
                      <div style={actionsGroupStyle}>
                        <button
                          style={viewButtonStyle}
                          onClick={(event) => { event.stopPropagation(); navigate(`/notifications/${notification.id}`); }}
                        >👁️</button>

                        {getStatut(notification) === "NON_LUE" && (
                          <button
                            style={readButtonStyle}
                            onClick={(event) => handleMarkAsRead(notification.id!, event)}
                          >✅</button>
                        )}

                        <button
                          style={deleteButtonStyle}
                          onClick={(event) => handleDeleteClick(notification.id!, notification.titre, event)}
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div style={paginationStyle}>
        <button style={pageButtonStyle} onClick={handlePreviousPage} disabled={page === 0}>⬅</button>
        <span style={pageIndicatorStyle}>Page {page + 1} / {Math.max(totalPages, 1)}</span>
        <button style={pageButtonStyle} onClick={handleNextPage} disabled={totalPages === 0 || page >= totalPages - 1}>➡</button>
      </div>
    </div>
  );
}

const pageStyle = (isMobile: boolean): CSSProperties => ({
  padding: isMobile ? "12px" : "32px 40px",
  background: "#f8fafc",
  minHeight: "100vh",
});

const breadcrumbStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 14 };
const breadcrumbHomeStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 6, color: "#64748b", cursor: "pointer", fontWeight: 500 };
const breadcrumbSeparatorStyle: CSSProperties = { color: "#94a3b8", fontSize: 16 };
const breadcrumbCurrentStyle: CSSProperties = { color: "#0f172a", fontWeight: 600 };
const headerStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 };
const titleStyle = (isMobile: boolean): CSSProperties => ({ margin: 0, fontSize: isMobile ? 18 : 32, fontWeight: 700, color: "#0f172a" });
const subtitleStyle: CSSProperties = { margin: "4px 0 0", color: "#64748b", fontSize: 14 };
const addButtonStyle: CSSProperties = { padding: "10px 16px", background: "#7c3aed", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 };
const statsGridStyle = (isMobile: boolean): CSSProperties => ({ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0,1fr))", gap: isMobile ? 8 : 16, marginBottom: 24 });
const statCardStyle = (background: string, isMobile: boolean): CSSProperties => ({ background, borderRadius: 12, padding: isMobile ? "12px" : "16px 20px", border: "1px solid #e2e8f0" });
const statLabelStyle: CSSProperties = { fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, textTransform: "uppercase" };
const statValueStyle = (color: string, isMobile: boolean): CSSProperties => ({ fontSize: isMobile ? 22 : 28, fontWeight: 700, color });
const filtersContainerStyle = (isMobile: boolean): CSSProperties => ({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: isMobile ? 12 : 16, marginBottom: 24, display: "flex", gap: 10, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" });
const inputStyle: CSSProperties = { padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, background: "#fff" };
const mobileListStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };
const emptyStateStyle: CSSProperties = { textAlign: "center", color: "#9ca3af", padding: 40 };
const mobileCardStyle = (statut: StatutNotification): CSSProperties => ({ background: statut === "NON_LUE" ? "#eff6ff" : "#fff", border: `1px solid ${statut === "NON_LUE" ? "#bfdbfe" : "#e2e8f0"}`, borderRadius: 12, padding: 14, cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" });
const mobileCardHeaderStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 };
const mobileCardTitleStyle = (statut: StatutNotification): CSSProperties => ({ fontWeight: statut === "NON_LUE" ? 700 : 500, fontSize: 14, flex: 1, marginRight: 8, color: "#1e293b" });
const unreadDotStyle: CSSProperties = { color: "#3b82f6", marginRight: 6 };
const statusBadgeStyle = (statut: StatutNotification): CSSProperties => ({ background: `${STATUT_COLORS[statut]}22`, color: STATUT_COLORS[statut], padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" });
const mobileMetaStyle: CSSProperties = { fontSize: 12, color: "#64748b", marginBottom: 12 };
const mobileActionsStyle: CSSProperties = { display: "flex", gap: 8 };
const tableContainerStyle: CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" };
const tableStyle: CSSProperties = { width: "100%", borderCollapse: "collapse", background: "white" };
const tableHeaderRowStyle: CSSProperties = { background: "#F5F3FF", color: "#5B21B6" };
const thStyle: CSSProperties = { padding: "14px 16px", fontWeight: 600, fontSize: 13, borderBottom: "1px solid #DDD6FE" };
const tableRowStyle = (statut: StatutNotification): CSSProperties => ({ textAlign: "center", borderBottom: "1px solid #f1f5f9", background: statut === "NON_LUE" ? "#f5f8ff" : "white", cursor: "pointer" });
const tdStyle: CSSProperties = { padding: "12px 16px" };
const titleCellStyle = (statut: StatutNotification): CSSProperties => ({ ...tdStyle, textAlign: "left", fontWeight: statut === "NON_LUE" ? 600 : 400, color: "#1e293b" });
const dateCellStyle: CSSProperties = { ...tdStyle, color: "#64748b", fontSize: 13 };
const emptyTableCellStyle: CSSProperties = { textAlign: "center", padding: 40, color: "#94a3b8" };
const actionsGroupStyle: CSSProperties = { display: "flex", justifyContent: "center", gap: 6 };
const viewButtonStyle: CSSProperties = { background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", padding: "6px 10px", borderRadius: 6, cursor: "pointer" };
const readButtonStyle: CSSProperties = { background: "#f0fdf4", color: "#22c55e", border: "1px solid #bbf7d0", padding: "6px 10px", borderRadius: 6, cursor: "pointer" };
const deleteButtonStyle: CSSProperties = { background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", padding: "6px 10px", borderRadius: 6, cursor: "pointer" };
const paginationStyle: CSSProperties = { marginTop: 24, display: "flex", justifyContent: "center", alignItems: "center", gap: 12 };
const pageButtonStyle: CSSProperties = { padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" };
const pageIndicatorStyle: CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0f172a" };