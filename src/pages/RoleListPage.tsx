import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { roleService } from "../api/roleService";
import type { RoleDto } from "../types/role";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize"; // ✅

export default function RoleListPage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize(); // ✅
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState({ total: 0, avecPermissions: 0, sansPermissions: 0 });

  const [modal, setModal] = useState<{ isOpen: boolean; id: number | null; label: string }>
    ({ isOpen: false, id: null, label: '' });

  const fetchData = async () => {
    try {
      const data = await roleService.getAll({ name: search || undefined, page, size: 10 });
      setRoles(data.content || data);
      const allForStats = await roleService.getAll({ size: 1000 });
      const allRoles: RoleDto[] = allForStats.content || allForStats;
      setStats({
        total:           allRoles.length,
        avecPermissions: allRoles.filter((r) => r.permissions && r.permissions.length > 0).length,
        sansPermissions: allRoles.filter((r) => !r.permissions || r.permissions.length === 0).length,
      });
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleDeleteClick = (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setModal({ isOpen: true, id, label: name });
  };

  const handleConfirmDelete = async () => {
    if (!modal.id) return;
    try {
      await roleService.delete(modal.id);
      setModal({ isOpen: false, id: null, label: '' });
      fetchData();
    } catch {
      alert("Erreur lors de la suppression.");
      setModal({ isOpen: false, id: null, label: '' });
    }
  };

  const handleCancelDelete = () => setModal({ isOpen: false, id: null, label: '' });

  const statCards = [
    { label: "Total",            value: stats.total,           color: "#111827", bg: "#f9fafb" },
    { label: "Avec permissions", value: stats.avecPermissions, color: "#185FA5", bg: "#E6F1FB" },
    { label: "Sans permissions", value: stats.sansPermissions, color: "#b45309", bg: "#fefce8" },
  ];

  return (
    <div style={{ padding: isMobile ? "12px" : "24px 20px" }}>

      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer le rôle"
        message={`Êtes-vous sûr de vouloir supprimer le rôle "${modal.label}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <button style={btnBack} onClick={() => navigate("/")}>← Tableau de bord</button>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#2c3e50", margin: 0, fontSize: isMobile ? 16 : 22 }}>🔐 Rôles</h2>
        <button style={btnAdd} onClick={() => navigate("/roles/new")}>
          {isMobile ? "➕" : "➕ Créer un rôle"}
        </button>
      </div>

      {/* STATS — 3 colonnes desktop, 1 ligne scrollable mobile */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr 1fr" : "repeat(3, minmax(0,1fr))",
        gap: isMobile ? 8 : 12,
        marginBottom: 20,
      }}>
        {statCards.map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 10, padding: isMobile ? "10px 8px" : "16px 20px" }}>
            <div style={{ fontSize: isMobile ? 10 : 12, color: "#6b7280", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 600, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* RECHERCHE */}
      <div style={{ marginBottom: 16, display: "flex", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          placeholder="Rechercher par nom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchData()}
        />
        <button style={btnPrimary} onClick={() => { setPage(0); fetchData(); }}>
          {isMobile ? "🔍" : "🔍 Rechercher"}
        </button>
      </div>

      {/* CONTENU */}
      {isMobile ? (
        // ✅ CARDS sur mobile
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {roles.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>Aucun rôle trouvé</p>
          ) : roles.map((r) => (
            <div
              key={r.id}
              onClick={() => navigate(`/roles/${r.id}`)}
              style={{ background: "#fff", borderRadius: 10, padding: 14, border: "1px solid #eee", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{r.name}</div>
              {r.description && (
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>{r.description}</div>
              )}
              <div style={{ marginBottom: 10 }}>
                {r.permissions && r.permissions.length > 0 ? (
                  <span style={{ background: "#E6F1FB", color: "#185FA5", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    {r.permissions.length} permission{r.permissions.length > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>Aucune permission</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...btnView, flex: 1 }} onClick={(e) => { e.stopPropagation(); navigate(`/roles/${r.id}`); }}>👁️</button>
                <button style={{ ...btnEdit, flex: 1 }} onClick={(e) => { e.stopPropagation(); navigate(`/roles/${r.id}/edit`); }}>✏️</button>
                <button style={{ ...btnDelete, flex: 1 }} onClick={(e) => handleDeleteClick(r.id!, r.name, e)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // ✅ TABLE sur tablette/desktop
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: "#8b5cf6", color: "white" }}>
              <th style={thStyle}>Nom</th>
              {!isTablet && <th style={thStyle}>Description</th>}
              <th style={thStyle}>Permissions</th>
              {!isTablet && <th style={thStyle}>Référence externe</th>}
              {!isTablet && <th style={thStyle}>Date création</th>}
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                  Aucun rôle trouvé
                </td>
              </tr>
            )}
            {roles.map((r) => (
              <tr
                key={r.id}
                style={{ textAlign: "center", borderBottom: "1px solid #eee", background: "white", cursor: "pointer" }}
                onClick={() => navigate(`/roles/${r.id}`)}
              >
                <td style={{ ...tdStyle, fontWeight: 600 }}>{r.name}</td>
                {!isTablet && <td style={tdStyle}>{r.description || "—"}</td>}
                <td style={tdStyle}>
                  {r.permissions && r.permissions.length > 0 ? (
                    <span style={{ background: "#E6F1FB", color: "#185FA5", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {r.permissions.length} permission{r.permissions.length > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: 13 }}>Aucune</span>
                  )}
                </td>
                {!isTablet && <td style={tdStyle}>{r.externalReference || "—"}</td>}
                {!isTablet && (
                  <td style={tdStyle}>
                    {r.creationDate ? new Date(r.creationDate).toLocaleDateString("fr-FR") : "—"}
                  </td>
                )}
                <td style={tdStyle}>
                  <button style={btnView} onClick={(e) => { e.stopPropagation(); navigate(`/roles/${r.id}`); }}>👁️</button>
                  <button style={btnEdit} onClick={(e) => { e.stopPropagation(); navigate(`/roles/${r.id}/edit`); }}>✏️</button>
                  <button style={btnDelete} onClick={(e) => handleDeleteClick(r.id!, r.name, e)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* PAGINATION */}
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button style={btnPage} onClick={() => setPage(page - 1)} disabled={page === 0}>⬅</button>
        <span style={{ margin: "0 12px", fontSize: isMobile ? 12 : 14, color: "#6b7280" }}>Page {page + 1}</span>
        <button style={btnPage} onClick={() => setPage(page + 1)}>➡</button>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const btnBack    = { display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, padding: 0 } as React.CSSProperties;
const inputStyle = { padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" } as React.CSSProperties;
const btnPrimary = { padding: "8px 12px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" } as React.CSSProperties;
const btnAdd     = { padding: "10px 16px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 } as React.CSSProperties;
const btnView    = { marginRight: 4, background: "#3b82f6", color: "white", border: "none", padding: "6px 8px", borderRadius: 5, cursor: "pointer" } as React.CSSProperties;
const btnEdit    = { marginRight: 4, background: "#f59e0b", color: "white", border: "none", padding: "6px 8px", borderRadius: 5, cursor: "pointer" } as React.CSSProperties;
const btnDelete  = { background: "#e74c3c", color: "white", border: "none", padding: "6px 8px", borderRadius: 5, cursor: "pointer" } as React.CSSProperties;
const btnPage    = { padding: "6px 12px", borderRadius: "6px", border: "1px solid #ccc", cursor: "pointer" } as React.CSSProperties;
const tableStyle = { width: "100%", borderCollapse: "collapse" as const, background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" };
const thStyle    = { padding: "12px 16px" } as React.CSSProperties;
const tdStyle    = { padding: "10px 16px" } as React.CSSProperties;