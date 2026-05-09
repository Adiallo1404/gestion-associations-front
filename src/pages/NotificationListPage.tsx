import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../api/notificationService";
import type { NotificationDto } from "../types/notification";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize";

const TYPE_LABELS: Record<string, string> = {
  RELANCE_COTISATION:   "Relance cotisation",
  COTISATION_PAYEE:     "Cotisation payée",
  NOUVEAU_MEMBRE:       "Nouveau membre",
  CHANGEMENT_STATUT:    "Changement statut",
  DOCUMENT_PARTAGE:     "Document partagé",
  RAPPEL_ECHEANCE:      "Rappel échéance",
  INFORMATION_GENERALE: "Information générale",
};

const STATUT_COLORS: Record<string, string> = {
  NON_LUE:  "#3b82f6",
  LUE:      "#22c55e",
  ARCHIVEE: "#9ca3af",
};

const STATUT_LABELS: Record<string, string> = {
  NON_LUE:  "Non lue",
  LUE:      "Lue",
  ARCHIVEE: "Archivée",
};

export default function NotificationListPage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState({ total: 0, nonLues: 0, lues: 0, archivees: 0 });

  const [modal, setModal] = useState<{ isOpen: boolean; id: number | null; label: string }>
    ({ isOpen: false, id: null, label: "" });

  const fetchData = async () => {
    try {
      const allData = await notificationService.getAll({ size: 1000 });
      const all: NotificationDto[] = allData.content || allData;
      setStats({
        total:     all.length,
        nonLues:   all.filter((n) => n.statut === "NON_LUE").length,
        lues:      all.filter((n) => n.statut === "LUE").length,
        archivees: all.filter((n) => n.statut === "ARCHIVEE").length,
      });
      const pageData = await notificationService.getAll({ ...filters, page });
      setNotifications(pageData.content || pageData);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, [filters, page]);

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.markAsRead(id);
    fetchData();
  };

  const handleDeleteClick = (id: number, titre: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setModal({ isOpen: true, id, label: titre });
  };

  const handleConfirmDelete = async () => {
    if (!modal.id) return;
    try {
      await notificationService.delete(modal.id);
      setModal({ isOpen: false, id: null, label: "" });
      fetchData();
    } catch (err) {
      console.error(err);
      setModal({ isOpen: false, id: null, label: "" });
    }
  };

  const handleCancelDelete = () => setModal({ isOpen: false, id: null, label: "" });

  const statCards = [
    { label: "Total",     value: stats.total,     color: "#111827", bg: "#f9fafb" },
    { label: "Non lues",  value: stats.nonLues,   color: "#185FA5", bg: "#E6F1FB" },
    { label: "Lues",      value: stats.lues,       color: "#3B6D11", bg: "#EAF3DE" },
    { label: "Archivées", value: stats.archivees,  color: "#5F5E5A", bg: "#F1EFE8" },
  ];

  return (
    <div style={{ padding: isMobile ? "12px" : "32px 40px", background: "#f8fafc", minHeight: "100vh" }}>

      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer la notification"
        message={`Êtes-vous sûr de vouloir supprimer la notification "${modal.label}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* ✅ FIL D'ARIANE (BREADCRUMB) */}
      <nav style={breadcrumbStyle}>
        <span style={breadcrumbHome} onClick={() => navigate("/")}>
          🏠 Accueil
        </span>
        <span style={breadcrumbSeparator}>›</span>
        <span style={breadcrumbCurrent}>Notifications</span>
      </nav>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 32, fontWeight: 700, color: "#0f172a" }}>
            🔔 Notifications
          </h2>
          {!isMobile && <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Gérez vos alertes et communications système</p>}
        </div>
        <button style={btnAdd} onClick={() => navigate("/notifications/new")}>
          {isMobile ? "➕" : "➕ Créer une notification"}
        </button>
      </div>

      {/* STATS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0,1fr))",
        gap: isMobile ? 8 : 16,
        marginBottom: 24,
      }}>
        {statCards.map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 12, padding: isMobile ? "12px" : "16px 20px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* FILTRES */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: isMobile ? 12 : 16, marginBottom: 24, display: "flex", gap: 10, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
        <select
          style={{ ...inputStyle, flex: 1 }}
          onChange={(e) => { setPage(0); setFilters({ ...filters, statut: e.target.value || undefined }); }}
        >
          <option value="">-- Tous les statuts --</option>
          <option value="NON_LUE">Non lue</option>
          <option value="LUE">Lue</option>
          <option value="ARCHIVEE">Archivée</option>
        </select>
        {!isMobile && (
          <select
            style={{ ...inputStyle, flex: 1 }}
            onChange={(e) => { setPage(0); setFilters({ ...filters, typeNotification: e.target.value || undefined }); }}
          >
            <option value="">-- Tous les types --</option>
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        )}
        <button style={btnPrimary} onClick={fetchData}>
          {isMobile ? "🔍" : "🔍 Filtrer"}
        </button>
      </div>

      {/* CONTENU */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notifications.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>Aucune notification</p>
          ) : notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => navigate(`/notifications/${n.id}`)}
              style={{
                background: n.statut === "NON_LUE" ? "#eff6ff" : "#fff",
                border: `1px solid ${n.statut === "NON_LUE" ? "#bfdbfe" : "#e2e8f0"}`,
                borderRadius: 12, padding: 14, cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ fontWeight: n.statut === "NON_LUE" ? 700 : 500, fontSize: 14, flex: 1, marginRight: 8, color: "#1e293b" }}>
                  {n.statut === "NON_LUE" && <span style={{ color: "#3b82f6", marginRight: 6 }}>●</span>}
                  {n.titre}
                </div>
                <span style={{ background: STATUT_COLORS[n.statut!] + "22", color: STATUT_COLORS[n.statut!], padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {STATUT_LABELS[n.statut!]}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
                {TYPE_LABELS[n.typeNotification] || n.typeNotification} · {n.dateCreation ? new Date(n.dateCreation).toLocaleDateString("fr-FR") : "—"}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...btnView, flex: 1 }} onClick={(e) => { e.stopPropagation(); navigate(`/notifications/${n.id}`); }}>👁️</button>
                {n.statut === "NON_LUE" && (
                  <button style={{ ...btnRead, flex: 1 }} onClick={(e) => handleMarkAsRead(n.id!, e)}>✅</button>
                )}
                <button style={{ ...btnDelete, flex: 1 }} onClick={(e) => handleDeleteClick(n.id!, n.titre, e)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#F5F3FF", color: "#5B21B6" }}>
                <th style={thStyle}>Titre</th>
                {!isTablet && <th style={thStyle}>Type</th>}
                <th style={thStyle}>Statut</th>
                {!isTablet && <th style={thStyle}>Date création</th>}
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Aucune notification</td></tr>
              ) : notifications.map((n) => (
                <tr
                  key={n.id}
                  style={{ textAlign: "center", borderBottom: "1px solid #f1f5f9", background: n.statut === "NON_LUE" ? "#f5f8ff" : "white", cursor: "pointer" }}
                  onClick={() => navigate(`/notifications/${n.id}`)}
                >
                  <td style={{ ...tdStyle, textAlign: "left", fontWeight: n.statut === "NON_LUE" ? 600 : 400, color: "#1e293b" }}>
                    {n.statut === "NON_LUE" && <span style={{ color: "#3b82f6", marginRight: 8 }}>●</span>}
                    {n.titre}
                  </td>
                  {!isTablet && <td style={{ ...tdStyle, color: "#64748b" }}>{TYPE_LABELS[n.typeNotification] || n.typeNotification}</td>}
                  <td style={tdStyle}>
                    <span style={{ background: STATUT_COLORS[n.statut!] + "22", color: STATUT_COLORS[n.statut!], padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {STATUT_LABELS[n.statut!]}
                    </span>
                  </td>
                  {!isTablet && (
                    <td style={{ ...tdStyle, color: "#64748b", fontSize: 13 }}>
                      {n.dateCreation ? new Date(n.dateCreation).toLocaleString("fr-FR") : "—"}
                    </td>
                  )}
                  <td style={tdStyle}>
                    <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                      <button style={btnView} onClick={(e) => { e.stopPropagation(); navigate(`/notifications/${n.id}`); }}>👁️</button>
                      {n.statut === "NON_LUE" && (
                        <button style={btnRead} onClick={(e) => handleMarkAsRead(n.id!, e)}>✅</button>
                      )}
                      <button style={btnDelete} onClick={(e) => handleDeleteClick(n.id!, n.titre, e)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
        <button style={btnPage} onClick={() => setPage(page - 1)} disabled={page === 0}>⬅</button>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Page {page + 1}</span>
        <button style={btnPage} onClick={() => setPage(page + 1)}>➡</button>
      </div>
    </div>
  );
}

// ── Styles Breadcrumb ──────────────────────────────────────────────────────────
const breadcrumbStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 20,
  fontSize: 14,
};

const breadcrumbHome: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#64748b",
  cursor: "pointer",
  fontWeight: 500,
};

const breadcrumbSeparator: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 16,
};

const breadcrumbCurrent: React.CSSProperties = {
  color: "#0f172a",
  fontWeight: 600,
};

// ── Autres Styles ──────────────────────────────────────────────────────────────
const inputStyle = { padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: 14, background: "#fff" } as React.CSSProperties;
const btnPrimary = { padding: "10px 20px", background: "#7c3aed", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 } as React.CSSProperties;
const btnAdd     = { padding: "10px 16px", background: "#7c3aed", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: 14 } as React.CSSProperties;
const btnView    = { background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", padding: "6px 10px", borderRadius: 6, cursor: "pointer" } as React.CSSProperties;
const btnRead    = { background: "#f0fdf4", color: "#22c55e", border: "1px solid #bbf7d0", padding: "6px 10px", borderRadius: 6, cursor: "pointer" } as React.CSSProperties;
const btnDelete  = { background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", padding: "6px 10px", borderRadius: 6, cursor: "pointer" } as React.CSSProperties;
const btnPage    = { padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" } as React.CSSProperties;
const tableStyle = { width: "100%", borderCollapse: "collapse" as const, background: "white" };
const thStyle    = { padding: "14px 16px", fontWeight: 600, fontSize: 13, borderBottom: "1px solid #DDD6FE" };
const tdStyle    = { padding: "12px 16px" } as React.CSSProperties;