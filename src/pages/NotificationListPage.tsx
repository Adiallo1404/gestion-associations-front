import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../api/notificationService";
import type { NotificationDto } from "../types/notification";

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
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState({ total: 0, nonLues: 0, lues: 0, archivees: 0 });

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
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, [filters, page]);

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.markAsRead(id);
    fetchData();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer cette notification ?")) return;
    await notificationService.delete(id);
    fetchData();
  };

  const statCards = [
    { label: "Total",     value: stats.total,     color: "#111827", bg: "#f9fafb" },
    { label: "Non lues",  value: stats.nonLues,   color: "#185FA5", bg: "#E6F1FB" },
    { label: "Lues",      value: stats.lues,      color: "#3B6D11", bg: "#EAF3DE" },
    { label: "Archivées", value: stats.archivees, color: "#5F5E5A", bg: "#F1EFE8" },
  ];

  return (
    <div style={{ padding: "24px 20px" }}>

      {/* ✅ Bouton retour tableau de bord */}
      <button style={btnBack} onClick={() => navigate("/")}>
        ← Tableau de bord
      </button>

      {/* TITRE */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#2c3e50", margin: 0, fontSize: 22 }}>🔔 Notifications</h2>
        <button style={btnAdd} onClick={() => navigate("/notifications/new")}>
          ➕ Créer une notification
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 24 }}>
        {statCards.map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 600, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* FILTRES */}
      <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <select style={inputStyle} onChange={(e) => { setPage(0); setFilters({ ...filters, statut: e.target.value || undefined }); }}>
          <option value="">-- Tous les statuts --</option>
          <option value="NON_LUE">Non lue</option>
          <option value="LUE">Lue</option>
          <option value="ARCHIVEE">Archivée</option>
        </select>
        <select style={inputStyle} onChange={(e) => { setPage(0); setFilters({ ...filters, typeNotification: e.target.value || undefined }); }}>
          <option value="">-- Tous les types --</option>
          {Object.entries(TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <button style={btnPrimary} onClick={fetchData}>🔍 Filtrer</button>
      </div>

      {/* TABLE */}
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: "#8b5cf6", color: "white" }}>
            <th style={thStyle}>Titre</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Statut</th>
            <th style={thStyle}>Date création</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {notifications.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                Aucune notification
              </td>
            </tr>
          )}
          {notifications.map((n) => (
            <tr
              key={n.id}
              style={{ textAlign: "center", borderBottom: "1px solid #eee", background: n.statut === "NON_LUE" ? "#eff6ff" : "white", cursor: "pointer" }}
              onClick={() => navigate(`/notifications/${n.id}`)}
            >
              <td style={{ ...tdStyle, fontWeight: n.statut === "NON_LUE" ? 600 : 400 }}>
                {n.statut === "NON_LUE" && <span style={{ color: "#3b82f6", marginRight: 6 }}>●</span>}
                {n.titre}
              </td>
              <td style={tdStyle}>{TYPE_LABELS[n.typeNotification] || n.typeNotification}</td>
              <td style={tdStyle}>
                <span style={{ background: STATUT_COLORS[n.statut!] + "22", color: STATUT_COLORS[n.statut!], padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                  {STATUT_LABELS[n.statut!]}
                </span>
              </td>
              <td style={tdStyle}>
                {n.dateCreation ? new Date(n.dateCreation).toLocaleString("fr-FR") : "—"}
              </td>
              <td style={tdStyle}>
                <button style={btnView} onClick={(e) => { e.stopPropagation(); navigate(`/notifications/${n.id}`); }}>👁️</button>
                {n.statut === "NON_LUE" && (
                  <button style={btnRead} onClick={(e) => handleMarkAsRead(n.id!, e)}>✅</button>
                )}
                <button style={btnDelete} onClick={(e) => handleDelete(n.id!, e)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINATION */}
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button style={btnPage} onClick={() => setPage(page - 1)} disabled={page === 0}>⬅</button>
        <span style={{ margin: "0 12px", fontSize: 14, color: "#6b7280" }}>Page {page + 1}</span>
        <button style={btnPage} onClick={() => setPage(page + 1)}>➡</button>
      </div>
    </div>
  );
}

// ✅ Bouton retour
const btnBack    = { display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, padding: 0 } as React.CSSProperties;
const inputStyle = { padding: "8px", borderRadius: "6px", border: "1px solid #ccc" };
const btnPrimary = { padding: "8px 12px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" };
const btnAdd     = { padding: "10px 20px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 };
const btnView    = { marginRight: 4, background: "#3b82f6", color: "white", border: "none", padding: "6px 8px", borderRadius: 5, cursor: "pointer" };
const btnRead    = { marginRight: 4, background: "#22c55e", color: "white", border: "none", padding: "6px 8px", borderRadius: 5, cursor: "pointer" };
const btnDelete  = { background: "#e74c3c", color: "white", border: "none", padding: "6px 8px", borderRadius: 5, cursor: "pointer" };
const btnPage    = { padding: "6px 12px", borderRadius: "6px", border: "1px solid #ccc", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const, background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" };
const thStyle    = { padding: "12px 16px" };
const tdStyle    = { padding: "10px 16px" };