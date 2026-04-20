import { useEffect, useState } from "react";
import { getRoles, deleteRole } from "../api/userAssociationRoleService";
import type { UserAssociationRole } from "../types/userAssociationRole";
import { useNavigate } from "react-router-dom";

const UserAssociationRoleListPage = () => {
  const [roles, setRoles] = useState<UserAssociationRole[]>([]);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  const loadData = async () => {
    const data = await getRoles(page, 10);
    setRoles(data.content);
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm("Supprimer ce rôle ?")) return;

    await deleteRole(id);
    loadData();
  };

  return (
    <div style={styles.page}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>User Association Roles</h1>
          <p style={styles.subtitle}>
            Gestion des rôles des utilisateurs dans les associations
          </p>
        </div>

        <button
          style={styles.primaryButton}
          onClick={() => navigate("/user-association-roles/new")}
        >
          + Assign Role
        </button>
      </div>

      {/* TABLE CARD */}
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th>User</th>
              <th>Association</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {roles.length > 0 ? (
              roles.map((r) => (
                <tr key={r.id} style={styles.row}>
                  <td>{r.userName || r.userId}</td>

                  <td style={{ fontWeight: 500 }}>
                    {r.associationName}
                  </td>

                  <td>
                    <span style={styles.badge}>
                      {r.roleName}
                    </span>
                  </td>

                  <td>
                    <button
                      style={styles.deleteButton}
                      onClick={() => handleDelete(r.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={styles.empty}>
                  Aucun rôle assigné
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div style={styles.pagination}>
        <button
          onClick={() => setPage((p) => p - 1)}
          disabled={page === 0}
          style={styles.pageBtn}
        >
          ← Prev
        </button>

        <span style={styles.pageInfo}>Page {page + 1}</span>

        <button
          onClick={() => setPage((p) => p + 1)}
          style={styles.pageBtn}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default UserAssociationRoleListPage;

const styles: any = {
  page: {
    padding: "40px",
    background: "#f3f4f6",
    minHeight: "100vh",
    fontFamily: "Inter, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 600,
  },

  subtitle: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
  },

  primaryButton: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 500,
  },

  card: {
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  thead: {
    background: "#111827",
    color: "white",
    textAlign: "left",
  },

  row: {
    borderBottom: "1px solid #eee",
  },

  badge: {
    background: "#e0e7ff",
    color: "#3730a3",
    padding: "5px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 500,
  },

  deleteButton: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  empty: {
    textAlign: "center",
    padding: "30px",
    color: "#6b7280",
  },

  pagination: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
  },

  pageBtn: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    cursor: "pointer",
    background: "white",
  },

  pageInfo: {
    fontWeight: 500,
  },
};