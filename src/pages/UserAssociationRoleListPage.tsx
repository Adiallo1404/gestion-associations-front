import { useEffect, useState } from "react";
import { getRoles, deleteRole } from "../api/userAssociationRoleService";
import type { UserAssociationRole } from "../types/userAssociationRole";
import { useNavigate } from "react-router-dom";

const UserAssociationRoleListPage = () => {
  const [roles, setRoles] = useState<UserAssociationRole[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const navigate = useNavigate();

  const loadData = async () => {
    const data = await getRoles(page, 10);
    setRoles(data.content);
    setTotalPages(data.totalPages ?? 0);
  };

  useEffect(() => { loadData(); }, [page]);

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm("Supprimer ce rôle ?")) return;
    await deleteRole(id);
    loadData();
  };

  const AVATAR_COLORS = [
    { bg: "#eff6ff", color: "#1d4ed8" },
    { bg: "#f0fdf4", color: "#16a34a" },
    { bg: "#fffbeb", color: "#d97706" },
    { bg: "#f5f3ff", color: "#7c3aed" },
    { bg: "#fef2f2", color: "#dc2626" },
  ];

  const initials = (name?: string | number) => {
    if (!name) return "?";
    if (typeof name === "number") return `#${name}`;
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div style={s.page}>

      {/* ✅ Bouton retour */}
      <button style={s.btnBack} onClick={() => navigate("/")}>
        ← Tableau de bord
      </button>

      {/* HEADER */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>User Association Roles</h1>
          <p style={s.subtitle}>Gestion des rôles des utilisateurs dans les associations</p>
        </div>
        <button style={s.btnPrimary} onClick={() => navigate("/user-association-roles/new")}>
          + Assigner un rôle
        </button>
      </div>

      {/* STATS */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statLabel}>Total affectations</div>
          <div style={{ ...s.statVal, color: "#1d4ed8" }}>{roles.length}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Page actuelle</div>
          <div style={{ ...s.statVal, color: "#7c3aed" }}>{page + 1}</div>
        </div>
      </div>

      {/* TABLE */}
      <div style={s.card}>
        <table style={s.table}>
          <thead>
            <tr style={s.thead}>
              <th style={s.th}>Utilisateur</th>
              <th style={s.th}>Association</th>
              <th style={s.th}>Rôle</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr>
                <td colSpan={4} style={s.empty}>Aucun rôle assigné</td>
              </tr>
            ) : (
              roles.map((r, i) => {
                const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
                return (
                  <tr key={r.id} style={s.row}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                  >
                    <td style={s.td}>
                      <div style={s.userCell}>
                        <div style={{ ...s.avatar, background: av.bg, color: av.color }}>
                          {initials(r.userName || r.userId)}
                        </div>
                        <span style={s.userName}>{r.userName || `Utilisateur #${r.userId}`}</span>
                      </div>
                    </td>
                    <td style={{ ...s.td, color: "#475569" }}>{r.associationName || "—"}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: av.bg, color: av.color }}>
                        {r.roleName || "—"}
                      </span>
                    </td>
                    <td style={s.td}>
                      <button
                        style={s.btnDelete}
                        onClick={() => handleDelete(r.id)}
                      >
                        🗑️ Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div style={s.pagination}>
        <button
          onClick={() => setPage((p) => p - 1)}
          disabled={page === 0}
          style={{ ...s.pageBtn, opacity: page === 0 ? 0.4 : 1 }}
        >
          ← Précédent
        </button>
        <span style={s.pageInfo}>Page {page + 1}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={totalPages > 0 && page >= totalPages - 1}
          style={{ ...s.pageBtn, opacity: totalPages > 0 && page >= totalPages - 1 ? 0.4 : 1 }}
        >
          Suivant →
        </button>
      </div>
    </div>
  );
};

export default UserAssociationRoleListPage;

const s: Record<string, React.CSSProperties> = {
  page:      { padding: "32px 40px", background: "#f1f5f9", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" },
  btnBack:   { display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20, background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, padding: 0 },
  header:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title:     { margin: 0, fontSize: 26, fontWeight: 700, color: "#0f172a" },
  subtitle:  { margin: "4px 0 0", color: "#64748b", fontSize: 14 },
  btnPrimary:{ background: "#2563eb", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: 14 },

  statsRow:  { display: "flex", gap: 16, marginBottom: 24 },
  statCard:  { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 24px", minWidth: 140 },
  statLabel: { fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 500 },
  statVal:   { fontSize: 28, fontWeight: 700 },

  card:      { background: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  table:     { width: "100%", borderCollapse: "collapse" as const, fontSize: 14 },
  thead:     { background: "#0f172a" },
  th:        { padding: "13px 18px", textAlign: "left" as const, color: "#94a3b8", fontWeight: 600, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  row:       { borderBottom: "1px solid #f1f5f9", background: "white", transition: "background 0.1s" },
  td:        { padding: "14px 18px", color: "#1e293b", verticalAlign: "middle" as const },

  userCell:  { display: "flex", alignItems: "center", gap: 10 },
  avatar:    { width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  userName:  { fontWeight: 600, color: "#0f172a" },
  badge:     { display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 },

  btnDelete: { background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 },

  empty:     { textAlign: "center" as const, padding: 40, color: "#94a3b8", fontSize: 15 },
  pagination:{ marginTop: 24, display: "flex", justifyContent: "center", alignItems: "center", gap: 12 },
  pageBtn:   { padding: "8px 18px", borderRadius: 8, border: "1px solid #e2e8f0", cursor: "pointer", background: "white", fontSize: 14, color: "#374151", fontWeight: 500 },
  pageInfo:  { fontWeight: 600, color: "#0f172a", fontSize: 14 },
};