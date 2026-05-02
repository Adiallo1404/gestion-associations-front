import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { roleService } from "../api/roleService";
import type { RoleDto } from "../types/role";

export default function RoleListPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState({ total: 0, avecPermissions: 0, sansPermissions: 0 });

  const fetchData = async () => {
    try {
      const data = await roleService.getAll({ name: search || undefined, page, size: 10 });
      const all = data.content || data;
      setRoles(all);

      const allForStats = await roleService.getAll({ size: 1000 });
      const allRoles: RoleDto[] = allForStats.content || allForStats;
      setStats({
        total: allRoles.length,
        avecPermissions: allRoles.filter((r) => r.permissions && r.permissions.length > 0).length,
        sansPermissions: allRoles.filter((r) => !r.permissions || r.permissions.length === 0).length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer ce rôle ?")) return;
    try {
      await roleService.delete(id);
      fetchData();
    } catch {
      alert("Erreur lors de la suppression.");
    }
  };

  const statCards = [
    { label: "Total",            value: stats.total,           color: "#111827", bg: "#f9fafb" },
    { label: "Avec permissions", value: stats.avecPermissions, color: "#185FA5", bg: "#E6F1FB" },
    { label: "Sans permissions", value: stats.sansPermissions, color: "#b45309", bg: "#fefce8" },
  ];

  return (
    <div style={{ padding: "24px 20px" }}>

      {/* ✅ Bouton retour tableau de bord */}
      <button style={btnBack} onClick={() => navigate("/")}>
        ← Tableau de bord
      </button>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#2c3e50", margin: 0, fontSize: 22 }}>🔐 Rôles</h2>
        <button style={btnAdd} onClick={() => navigate("/roles/new")}>
          ➕ Créer un rôle
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12, marginBottom: 24 }}>
        {statCards.map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 600, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* RECHERCHE */}
      <div style={{ marginBottom: 16, display: "flex", gap: 10 }}>
        <input
          style={inputStyle}
          placeholder="Rechercher par nom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchData()}
        />
        <button style={btnPrimary} onClick={() => { setPage(0); fetchData(); }}>🔍 Rechercher</button>
      </div>

      {/* TABLE */}
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: "#8b5cf6", color: "white" }}>
            <th style={thStyle}>Nom</th>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Permissions</th>
            <th style={thStyle}>Référence externe</th>
            <th style={thStyle}>Date création</th>
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
              <td style={tdStyle}>{r.description || "—"}</td>
              <td style={tdStyle}>
                {r.permissions && r.permissions.length > 0 ? (
                  <span style={{ background: "#E6F1FB", color: "#185FA5", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    {r.permissions.length} permission{r.permissions.length > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span style={{ color: "#9ca3af", fontSize: 13 }}>Aucune</span>
                )}
              </td>
              <td style={tdStyle}>{r.externalReference || "—"}</td>
              <td style={tdStyle}>
                {r.creationDate ? new Date(r.creationDate).toLocaleDateString("fr-FR") : "—"}
              </td>
              <td style={tdStyle}>
                <button style={btnView} onClick={(e) => { e.stopPropagation(); navigate(`/roles/${r.id}`); }}>👁️</button>
                <button style={btnEdit} onClick={(e) => { e.stopPropagation(); navigate(`/roles/${r.id}/edit`); }}>✏️</button>
                <button style={btnDelete} onClick={(e) => handleDelete(r.id!, e)}>🗑️</button>
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

// ✅ Nouveau bouton retour
const btnBack    = { display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, padding: 0 } as React.CSSProperties;
const inputStyle = { padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", minWidth: 220 };
const btnPrimary = { padding: "8px 12px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" };
const btnAdd     = { padding: "10px 20px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 };
const btnView    = { marginRight: 4, background: "#3b82f6", color: "white", border: "none", padding: "6px 8px", borderRadius: 5, cursor: "pointer" };
const btnEdit    = { marginRight: 4, background: "#f59e0b", color: "white", border: "none", padding: "6px 8px", borderRadius: 5, cursor: "pointer" };
const btnDelete  = { background: "#e74c3c", color: "white", border: "none", padding: "6px 8px", borderRadius: 5, cursor: "pointer" };
const btnPage    = { padding: "6px 12px", borderRadius: "6px", border: "1px solid #ccc", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const, background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" };
const thStyle    = { padding: "12px 16px" };
const tdStyle    = { padding: "10px 16px" };