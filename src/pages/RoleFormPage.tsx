import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { roleService } from "../api/roleService";
import type { CreateRoleRequest, Permission } from "../types/role";
import { PERMISSION_LABELS, PERMISSION_OPTIONS } from "../types/role";

interface RoleFormState {
  name: string;
  description: string;
  externalReference: string;
  permissions: Permission[];
}

const initialFormState: RoleFormState = {
  name: "",
  description: "",
  externalReference: "",
  permissions: [],
};

export default function RoleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEditMode = Boolean(id);
  const roleId = Number(id);

  const [form, setForm] = useState<RoleFormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof RoleFormState>(
    field: K,
    value: RoleFormState[K]
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const loadRole = useCallback(async () => {
    if (!isEditMode) return;

    if (!id || Number.isNaN(roleId)) {
      toast.error("Identifiant rôle invalide.");
      navigate("/roles");
      return;
    }

    try {
      setIsLoading(true);

      const role = await roleService.getRoleById(roleId);

      setForm({
        name: role.name,
        description: role.description ?? "",
        externalReference: role.externalReference ?? "",
        permissions: role.permissions ?? [],
      });
    } catch (error) {
      console.error("Failed to load role", error);
      toast.error("Rôle introuvable.");
      navigate("/roles");
    } finally {
      setIsLoading(false);
    }
  }, [id, isEditMode, navigate, roleId]);

  useEffect(() => {
    loadRole();
  }, [loadRole]);

  const togglePermission = (permission: Permission) => {
    setForm((currentForm) => {
      const alreadySelected = currentForm.permissions.includes(permission);

      return {
        ...currentForm,
        permissions: alreadySelected
          ? currentForm.permissions.filter((item) => item !== permission)
          : [...currentForm.permissions, permission],
      };
    });
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) {
      return "Le nom du rôle est obligatoire.";
    }

    if (form.name.trim().length > 50) {
      return "Le nom du rôle ne doit pas dépasser 50 caractères.";
    }

    if (form.description.trim().length > 255) {
      return "La description ne doit pas dépasser 255 caractères.";
    }

    if (form.externalReference.trim().length > 100) {
      return "La référence externe ne doit pas dépasser 100 caractères.";
    }

    return null;
  };

  const buildPayload = (): CreateRoleRequest => ({
    name: form.name.trim(),
    description: form.description.trim() || null,
    externalReference: form.externalReference.trim() || null,
    permissions: form.permissions,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = buildPayload();

      if (isEditMode) {
        if (Number.isNaN(roleId)) {
          toast.error("Identifiant rôle invalide.");
          return;
        }

        await roleService.updateRole(roleId, payload);
        toast.success("Rôle mis à jour avec succès.");
      } else {
        await roleService.createRole(payload);
        toast.success("Rôle créé avec succès.");
      }

      navigate("/roles");
    } catch (error) {
      console.error("Failed to save role", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? "Erreur lors de l'enregistrement."
        : "Erreur lors de l'enregistrement.";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={loadingStyle}>Chargement...</div>;
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>
          🔐 {isEditMode ? "Modifier le rôle" : "Créer un rôle"}
        </h2>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>
              Nom <span style={requiredStyle}>*</span>
            </label>

            <input
              style={inputStyle}
              placeholder="Ex: ADMIN"
              value={form.name}
              maxLength={50}
              disabled={isSubmitting}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Description</label>

            <input
              style={inputStyle}
              placeholder="Description du rôle"
              value={form.description}
              maxLength={255}
              disabled={isSubmitting}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Référence externe</label>

            <input
              style={inputStyle}
              placeholder="Ex: role-admin-ext"
              value={form.externalReference}
              maxLength={100}
              disabled={isSubmitting}
              onChange={(event) =>
                updateField("externalReference", event.target.value)
              }
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Permissions ({form.permissions.length})
            </label>

            <div style={permissionGridStyle}>
              {PERMISSION_OPTIONS.map((permission) => {
                const checked = form.permissions.includes(permission);

                return (
                  <label key={permission} style={permissionItemStyle}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isSubmitting}
                      onChange={() => togglePermission(permission)}
                    />

                    <span
                      style={{
                        color: checked ? "#7c3aed" : "#374151",
                        fontWeight: checked ? 600 : 400,
                      }}
                    >
                      {PERMISSION_LABELS[permission]}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={actionsStyle}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...submitButtonStyle,
                background: isSubmitting ? "#c4b5fd" : "#8b5cf6",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => navigate("/roles")}
              style={cancelButtonStyle}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  paddingTop: 35,
  background: "#f4f6f9",
  minHeight: "100vh",
};

const loadingStyle: CSSProperties = {
  textAlign: "center",
  padding: 64,
  color: "#6b7280",
};

const cardStyle: CSSProperties = {
  background: "white",
  padding: 30,
  borderRadius: 10,
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  width: 480,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  alignSelf: "flex-start",
};

const titleStyle: CSSProperties = {
  textAlign: "center",
  color: "#4c1d95",
  marginBottom: 10,
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const fieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#555",
};

const requiredStyle: CSSProperties = {
  color: "#ef4444",
};

const inputStyle: CSSProperties = {
  padding: 10,
  borderRadius: 6,
  border: "1px solid #ccc",
};

const permissionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 14,
};

const permissionItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  cursor: "pointer",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  marginTop: 10,
};

const submitButtonStyle: CSSProperties = {
  padding: 10,
  color: "white",
  border: "none",
  borderRadius: 6,
  fontWeight: 600,
  fontSize: 14,
};

const cancelButtonStyle: CSSProperties = {
  padding: 10,
  background: "#95a5a6",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
};