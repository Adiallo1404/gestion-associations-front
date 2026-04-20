import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { roleService } from "../api/roleService";
import { toast } from "react-toastify";
import type { Permission } from "../types/role";

const ALL_PERMISSIONS: Permission[] = [
  "CREATE_USER", "READ_USER", "UPDATE_USER", "DELETE_USER",
  "CREATE_ASSOCIATION", "READ_ASSOCIATION", "UPDATE_ASSOCIATION", "DELETE_ASSOCIATION",
];

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

export default function RoleFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: "",
    description: "",
    externalReference: "",
    permissions: [] as Permission[],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      roleService.getById(Number(id))
        .then((data) => setForm({
          name: data.name || "",
          description: data.description || "",
          externalReference: data.externalReference || "",
          permissions: data.permissions || [],
        }))
        .catch(() => toast.error("Rôle introuvable"));
    }
  }, [id]);

  const togglePermission = (perm: Permission) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("⚠️ Nom obligatoire"); return; }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      externalReference: form.externalReference.trim() || null,
      permissions: form.permissions,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await roleService.update(Number(id), payload);
        toast.success("✅ Rôle mis à jour !");
      } else {
        await roleService.create(payload);
        toast.success("✅ Rôle créé !");
      }
      window.location.href = "/roles";
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Erreur inconnue";
      toast.error(`❌ Erreur : ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 35, background: "#f4f6f9", minHeight: "100vh" }}>
      <div style={{
        background: "white", padding: 30, borderRadius: 10,
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)", width: 480,
        display: "flex", flexDirection: "column", gap: 10, alignSelf: "flex-start",
      }}>
        <h2 style={{ textAlign: "center", color: "#4c1d95", marginBottom: 10 }}>
          🔐 {isEdit ? "Modifier le rôle" : "Créer un rôle"}
        </h2>

        <label style={labelStyle}>Nom *</label>
        <input style={input} placeholder="Ex: ADMIN" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />

        <label style={labelStyle}>Description</label>
        <input style={input} placeholder="Description du rôle" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <label style={labelStyle}>Référence externe</label>
        <input style={input} placeholder="Ex: role-admin-ext" value={form.externalReference}
          onChange={(e) => setForm({ ...form, externalReference: e.target.value })} />

        <label style={labelStyle}>Permissions</label>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
          background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14,
        }}>
          {ALL_PERMISSIONS.map((perm) => {
            const checked = form.permissions.includes(perm);
            return (
              <label key={perm} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePermission(perm)}
                />
                {/* ✅ Label français */}
                <span style={{ color: checked ? "#7c3aed" : "#374151", fontWeight: checked ? 600 : 400 }}>
                  {PERMISSION_LABELS[perm]}
                </span>
              </label>
            );
          })}
        </div>

        <button onClick={handleSubmit} disabled={submitting}
          style={{
            marginTop: 10, padding: 10,
            background: submitting ? "#c4b5fd" : "#8b5cf6",
            color: "white", border: "none", borderRadius: 6,
            cursor: submitting ? "not-allowed" : "pointer",
            fontWeight: 600, fontSize: 14,
          }}>
          {submitting ? "⏳ Enregistrement..." : "💾 Enregistrer"}
        </button>

        <button onClick={() => window.location.href = "/roles"}
          style={{ padding: 10, background: "#95a5a6", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>
          ✖️ Annuler
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 590, color: "#555" };
const input: React.CSSProperties = { padding: 10, borderRadius: 6, border: "1px solid #ccc" };