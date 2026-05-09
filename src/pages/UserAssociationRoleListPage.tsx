import { useEffect, useState } from "react";
import { getRoles, deleteRole } from "../api/userAssociationRoleService";
import type { UserAssociationRole } from "../types/userAssociationRole";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize";

const UserAssociationRoleListPage = () => {
  const [roles, setRoles] = useState<UserAssociationRole[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { isMobile, isTablet } = useWindowSize();
  const navigate = useNavigate();

  const [modal, setModal] = useState<{ isOpen: boolean; id: number | null; label: string }>
    ({ isOpen: false, id: null, label: '' });

  const loadData = async () => {
    try {
      const data = await getRoles(page, 10);
      setRoles(data.content || []);
      setTotalPages(data.totalPages ?? 0);
    } catch (err) {
      console.error("Erreur chargement rôles:", err);
    }
  };

  useEffect(() => { loadData(); }, [page]);

  const handleDeleteClick = (id: number, userName?: string, roleName?: string) => {
    setModal({
      isOpen: true,
      id,
      label: userName ? `${userName} — ${roleName || ''}` : `#${id}`,
    });
  };

  const handleConfirmDelete = async () => {
    if (!modal.id) return;
    try {
      await deleteRole(modal.id);
      setModal({ isOpen: false, id: null, label: '' });
      loadData();
    } catch {
      setModal({ isOpen: false, id: null, label: '' });
    }
  };

  const handleCancelDelete = () => setModal({ isOpen: false, id: null, label: '' });

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
    <div style={{
      padding: isMobile ? "12px" : "32px 40px",
      background: "#f1f5f9",
      minHeight: "100vh",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer l'affectation"
        message={`Êtes-vous sûr de vouloir supprimer l'affectation de "${modal.label}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* ✅ FIL D'ARIANE (BREADCRUMB) AJOUTÉ ICI */}
      <nav style={breadcrumbStyle}>
        <span style={breadcrumbHome} onClick={() => navigate("/")}>
          🏠 Accueil
        </span>
        <span style={breadcrumbSeparator}>›</span>
        <span style={breadcrumbCurrent}>Associations de Rôles</span>
      </nav>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 32, fontWeight: 700, color: "#0f172a" }}>
            👥 Rôles & Associations
          </h1>
          {!isMobile && <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            Gestion des accès utilisateurs par association
          </p>}
        </div>
        <button style={s.btnPrimary} onClick={() => navigate("/user-association-roles/new")}>
          {isMobile ? "➕" : "+ Assigner un rôle"}
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: "flex", gap: isMobile ? 8 : 16, marginBottom: 24 }}>
        <div style={{ ...s.statCard, flex: 1 }}>
          <div style={s.statLabel}>Total affectations</div>
          <div style={{ ...s.statVal, color: "#1d4ed8", fontSize: isMobile ? 22 : 28 }}>{roles.length}</div>
        </div>
        <div style={{ ...s.statCard, flex: 1 }}>
          <div style={s.statLabel}>Page</div>
          <div style={{ ...s.statVal, color: "#7c3aed", fontSize: isMobile ? 22 : 28 }}>{page + 1}</div>
        </div>
      </div>

      {/* CONTENU */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {roles.length === 0 ? (
            <p style={s.empty}>Aucun rôle assigné</p>
          ) : roles.map((r, i) => {
            const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const currentUserName = (r as any).userName || (r as any).username || `Utilisateur #${r.userId}`;
            return (
              <div key={r.id} style={{ background: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ ...s.avatar, background: av.bg, color: av.color }}>
                    {initials(currentUserName)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{currentUserName}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{r.associationName || "—"}</div>
                  </div>
                  <span style={{ ...s.badge, background: av.bg, color: av.color }}>
                    {r.roleName || "—"}
                  </span>
                </div>
                <button
                  style={{ ...s.btnDelete, width: "100%", justifyContent: "center", display: "flex" }}
                  onClick={() => handleDeleteClick(r.id!, currentUserName, r.roleName)}
                >
                  🗑️ Supprimer l'accès
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>Utilisateur</th>
                {!isTablet && <th style={s.th}>Association</th>}
                <th style={s.th}>Rôle</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr><td colSpan={4} style={s.empty}>Aucun rôle assigné</td></tr>
              ) : roles.map((r, i) => {
                const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const currentUserName = (r as any).userName || (r as any).username || `Utilisateur #${r.userId}`;
                return (
                  <tr key={r.id} style={s.row}>
                    <td style={s.td}>
                      <div style={s.userCell}>
                        <div style={{ ...s.avatar, background: av.bg, color: av.color }}>
                          {initials(currentUserName)}
                        </div>
                        <span style={s.userName}>{currentUserName}</span>
                      </div>
                    </td>
                    {!isTablet && <td style={{ ...s.td, color: "#475569" }}>{r.associationName || "—"}</td>}
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: av.bg, color: av.color }}>
                        {r.roleName || "—"}
                      </span>
                    </td>
                    <td style={s.td}>
                      <button
                        style={s.btnDelete}
                        onClick={() => handleDeleteClick(r.id!, currentUserName, r.roleName)}
                      >
                        {isTablet ? "🗑️" : "🗑️ Supprimer"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
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
          style={{ ...s.pageBtn, opacity: (totalPages > 0 && page >= totalPages - 1) ? 0.4 : 1 }}
        >
          Suivant →
        </button>
      </div>
    </div>
  );
};

export default UserAssociationRoleListPage;

// --- STYLES BREADCRUMB ---
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

// --- AUTRES STYLES ---
const s: Record<string, React.CSSProperties> = {
  btnPrimary:  { background: "#2563eb", color: "white", border: "none", padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 },
  statCard:    { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" },
  statLabel:   { fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 500 },
  statVal:     { fontWeight: 700 },
  card:        { background: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  table:       { width: "100%", borderCollapse: "collapse" as const, fontSize: 14 },
  thead:       { background: "#f8fafc" },
  th:          { padding: "13px 18px", textAlign: "left" as const, color: "#64748b", fontWeight: 600, fontSize: 12, textTransform: "uppercase" as const, borderBottom: "1px solid #e2e8f0" },
  row:         { borderBottom: "1px solid #f1f5f9", background: "white" },
  td:          { padding: "14px 18px", color: "#1e293b", verticalAlign: "middle" as const },
  userCell:    { display: "flex", alignItems: "center", gap: 10 },
  avatar:      { width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  userName:    { fontWeight: 600, color: "#0f172a" },
  badge:       { display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btnDelete:   { background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 },
  empty:       { textAlign: "center" as const, padding: 40, color: "#94a3b8", fontSize: 15 },
  pageBtn:     { padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", cursor: "pointer", background: "white", fontSize: 14, color: "#374151", fontWeight: 500 },
  pageInfo:    { fontWeight: 600, color: "#0f172a", fontSize: 14 },
};