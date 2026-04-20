import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { roleService } from "../api/roleService";
import type { RoleDto, Permission } from "../types/role";

// ✅ Labels français
const PERMISSION_LABELS: Record<Permission, string> = {
  CREATE_USER:         "Créer un utilisateur",
  READ_USER:           "Voir les utilisateurs",
  UPDATE_USER:         "Modifier un utilisateur",
  DELETE_USER:         "Supprimer un utilisateur",
  CREATE_ASSOCIATION:  "Créer une association",
  READ_ASSOCIATION:    "Voir les associations",
  UPDATE_ASSOCIATION:  "Modifier une association",
  DELETE_ASSOCIATION:  "Supprimer une association",
};

export default function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<RoleDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    roleService.getById(Number(id))
      .then((data) => setRole(data))
      .catch(() => setError("Rôle introuvable."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Supprimer ce rôle ?")) return;
    try {
      await roleService.delete(Number(id));
      window.location.href = "/roles";
    } catch {
      setError("Erreur lors de la suppression.");
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 64, color: "#6b7280" }}>Chargement...</div>
  );

  if (error) return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 16 }}>
      <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "12px 16px" }}>
        {error}
      </div>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button onClick={() => window.location.href = "/roles"}
          style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer" }}>
          ← Retour aux rôles
        </button>
      </div>
    </div>
  );

  if (!role) return null;

  const rows = [
    { label: "Nom",               value: role.name },
    { label: "Description",       value: role.description || "—" },
    { label: "Référence externe", value: role.externalReference || "—" },
    { label: "Date création",     value: role.creationDate ? new Date(role.creationDate).toLocaleString("fr-FR") : "—" },
    { label: "Date modification", value: role.modificationDate ? new Date(role.modificationDate).toLocaleString("fr-FR") : "—" },
  ];

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 16px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>🔐 {role.name}</h2>
        <button onClick={() => window.location.href = "/roles"}
          style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
          ← Retour
        </button>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: 24 }}>

          {/* LIGNES */}
          {rows.map(({ label, value }) => (
            <div key={label} style={{ display: "flex", borderBottom: "1px solid #f3f4f6", padding: "12px 0" }}>
              <span style={{ width: 180, color: "#6b7280", fontSize: 14, fontWeight: 500, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 14, color: "#111827" }}>{String(value)}</span>
            </div>
          ))}

          {/* PERMISSIONS EN FRANÇAIS */}
          <div style={{ paddingTop: 16 }}>
            <span style={{ color: "#6b7280", fontSize: 14, fontWeight: 500, display: "block", marginBottom: 12 }}>
              Permissions ({role.permissions?.length || 0})
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {role.permissions && role.permissions.length > 0 ? (
                role.permissions.map((perm) => (
                  <span key={perm} style={{
                    background: "#ede9fe", color: "#5b21b6",
                    padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  }}>
                    {/* ✅ Label français */}
                    {PERMISSION_LABELS[perm as Permission] || perm}
                  </span>
                ))
              ) : (
                <span style={{ color: "#9ca3af", fontSize: 13 }}>Aucune permission</span>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ padding: "16px 24px", background: "#f9fafb", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={() => window.location.href = `/roles/${id}/edit`}
            style={{ padding: "10px 20px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            ✏️ Modifier
          </button>
          <button onClick={handleDelete}
            style={{ padding: "10px 20px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}