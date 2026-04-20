import { useEffect, useState } from "react";
import { assignRole } from "../api/userAssociationRoleService";
import { getUsers } from "../api/userService";
import { getAssociations } from "../api/associationService";
import { roleService } from "../api/roleService";

const UserAssociationRoleFormPage = () => {
  const [form, setForm] = useState({
    userId: "",
    associationId: "",
    roleId: "",
  });

  const [users, setUsers] = useState<any[]>([]);
  const [associations, setAssociations] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const usersData = await getUsers({}, 0, 100);
        const assocData = await getAssociations(0, 100);
        const rolesData = await roleService.getAll({ page: 0, size: 100 });

        console.log("USERS:", usersData);

        setUsers(usersData?.content || usersData || []);
        setAssociations(assocData?.content || assocData || []);
        setRoles(rolesData?.content || rolesData || []);
      } catch (error) {
        console.error("❌ Erreur chargement données", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!form.userId || !form.associationId || !form.roleId) {
      alert("⚠️ Veuillez remplir tous les champs");
      return;
    }

    try {
      await assignRole({
        userId: Number(form.userId),
        associationId: Number(form.associationId),
        roleId: Number(form.roleId),
      });

      alert("✅ Rôle assigné avec succès !");

      setForm({
        userId: "",
        associationId: "",
        roleId: "",
      });
    } catch (error) {
      console.error(error);
      alert("❌ Erreur lors de l’assignation");
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Chargement...</p>;

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <h2 style={styles.title}>Assign Role</h2>

        <form onSubmit={handleSubmit} style={styles.card}>

          {/* USER */}
          <div style={styles.field}>
            <label style={styles.label}>User</label>

            <select
              style={styles.select}
              value={form.userId}
              onChange={(e) =>
                setForm({ ...form, userId: e.target.value })
              }
            >
              <option value="">-- Select User --</option>

              {users.length === 0 ? (
                <option disabled>⚠️ Aucun utilisateur</option>
              ) : (
                users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {(u.firstName || "") + " " + (u.lastName || u.nom || "")}
                    {" - "}
                    {u.email || ""}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* ASSOCIATION */}
          <div style={styles.field}>
            <label style={styles.label}>Association</label>

            <select
              style={styles.select}
              value={form.associationId}
              onChange={(e) =>
                setForm({ ...form, associationId: e.target.value })
              }
            >
              <option value="">-- Select Association --</option>

              {associations.length === 0 && (
                <option disabled>⚠️ Aucune association</option>
              )}

              {associations.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* ROLE */}
          <div style={styles.field}>
            <label style={styles.label}>Role</label>

            <select
              style={styles.select}
              value={form.roleId}
              onChange={(e) =>
                setForm({ ...form, roleId: e.target.value })
              }
            >
              <option value="">-- Select Role --</option>

              {roles.length === 0 && (
                <option disabled>⚠️ Aucun rôle</option>
              )}

              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity:
                !form.userId || !form.associationId || !form.roleId ? 0.6 : 1,
              cursor:
                !form.userId || !form.associationId || !form.roleId
                  ? "not-allowed"
                  : "pointer",
            }}
            disabled={!form.userId || !form.associationId || !form.roleId}
          >
            Assign Role
          </button>

        </form>
      </div>
    </div>
  );
};

export default UserAssociationRoleFormPage;

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f5f7fb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  wrapper: {
    width: "100%",
    maxWidth: "500px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "20px",
    textAlign: "center" as const,
  },
  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "18px",
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
  },
  label: {
    marginBottom: "6px",
    fontWeight: 600,
    color: "#374151",
  },
  select: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
  },
  button: {
    marginTop: "10px",
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: 600,
  },
};