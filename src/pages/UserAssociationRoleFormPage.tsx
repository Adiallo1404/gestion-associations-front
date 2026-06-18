import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { assignRole } from "../api/userAssociationRoleService";
import { getUsers } from "../api/userService";
import { getAssociations } from "../api/associationService";
import { roleService } from "../api/roleService";
import type { AssignUserAssociationRoleRequest } from "../types/userAssociationRole";
import type { UserDto } from "../types/user";
import type { Association } from "../types/association";
import type { RoleDto } from "../types/role";

interface FormState {
  userId: string;
  associationId: string;
  roleId: string;
}

const initialFormState: FormState = {
  userId: "",
  associationId: "",
  roleId: "",
};

export default function UserAssociationRoleFormPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(initialFormState);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const loadReferenceData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [usersResponse, associationsResponse, rolesResponse] =
        await Promise.all([
          getUsers({}, 0, 1000, "lastName,asc"),
          getAssociations({}, 0, 1000),
          roleService.getRoles({
            page: 0,
            size: 1000,
            sort: "name,asc",
          }),
        ]);

      setUsers(usersResponse.content ?? []);
      setAssociations(associationsResponse.content ?? []);
      setRoles(rolesResponse.content ?? []);
    } catch (loadError) {
      console.error("Failed to load role assignment references", loadError);
      setError("Erreur lors du chargement des utilisateurs, associations ou rôles.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  const selectedUser = useMemo(() => {
    if (!form.userId) return null;
    return users.find((user) => user.id === Number(form.userId)) ?? null;
  }, [form.userId, users]);

  const selectedAssociation = useMemo(() => {
    if (!form.associationId) return null;
    return (
      associations.find(
        (association) => association.id === Number(form.associationId)
      ) ?? null
    );
  }, [associations, form.associationId]);

  const selectedRole = useMemo(() => {
    if (!form.roleId) return null;
    return roles.find((role) => role.id === Number(form.roleId)) ?? null;
  }, [form.roleId, roles]);

  const isSubmitDisabled =
    isSubmitting || !form.userId || !form.associationId || !form.roleId;

  const validateForm = (): string | null => {
    if (!form.userId) return "Veuillez sélectionner un utilisateur.";
    if (!form.associationId) return "Veuillez sélectionner une association.";
    if (!form.roleId) return "Veuillez sélectionner un rôle.";

    return null;
  };

  const buildPayload = (): AssignUserAssociationRoleRequest => ({
    userId: Number(form.userId),
    associationId: Number(form.associationId),
    roleId: Number(form.roleId),
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await assignRole(buildPayload());

      navigate("/user-association-roles");
    } catch (submitError) {
      console.error("Failed to assign role", submitError);

      const message = axios.isAxiosError(submitError)
        ? submitError.response?.data?.message ??
          "Erreur lors de l'assignation du rôle."
        : "Erreur lors de l'assignation du rôle.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={styles.message}>Chargement...</div>;
  }

  return (
    <div style={styles.page}>
      <button
        type="button"
        style={styles.backButton}
        onClick={() => navigate("/user-association-roles")}
      >
        ← Retour aux affectations
      </button>

      <div style={styles.wrapper}>
        <h2 style={styles.title}>Assigner un rôle</h2>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.card}>
          <div style={styles.field}>
            <label style={styles.label}>Utilisateur *</label>

            <select
              style={styles.select}
              value={form.userId}
              onChange={(event) => updateField("userId", event.target.value)}
              disabled={isSubmitting}
            >
              <option value="">-- Sélectionner un utilisateur --</option>

              {users.length === 0 ? (
                <option disabled>Aucun utilisateur disponible</option>
              ) : (
                users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} — {user.email}
                  </option>
                ))
              )}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Association *</label>

            <select
              style={styles.select}
              value={form.associationId}
              onChange={(event) =>
                updateField("associationId", event.target.value)
              }
              disabled={isSubmitting}
            >
              <option value="">-- Sélectionner une association --</option>

              {associations.length === 0 ? (
                <option disabled>Aucune association disponible</option>
              ) : (
                associations.map((association) => (
                  <option key={association.id} value={association.id}>
                    {association.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Rôle *</label>

            <select
              style={styles.select}
              value={form.roleId}
              onChange={(event) => updateField("roleId", event.target.value)}
              disabled={isSubmitting}
            >
              <option value="">-- Sélectionner un rôle --</option>

              {roles.length === 0 ? (
                <option disabled>Aucun rôle disponible</option>
              ) : (
                roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedUser && selectedAssociation && selectedRole && (
            <div style={styles.summaryBox}>
              <strong>Résumé :</strong>
              <br />
              {selectedUser.firstName} {selectedUser.lastName} aura le rôle{" "}
              <strong>{selectedRole.name}</strong> dans{" "}
              <strong>{selectedAssociation.name}</strong>.
            </div>
          )}

          <div style={styles.actions}>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={() => navigate("/user-association-roles")}
              disabled={isSubmitting}
            >
              Annuler
            </button>

            <button
              type="submit"
              style={{
                ...styles.submitButton,
                opacity: isSubmitDisabled ? 0.6 : 1,
                cursor: isSubmitDisabled ? "not-allowed" : "pointer",
              }}
              disabled={isSubmitDisabled}
            >
              {isSubmitting ? "Assignation..." : "Assigner le rôle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f7fb",
    padding: "32px 20px",
    fontFamily: "system-ui, sans-serif",
  },
  message: {
    textAlign: "center",
    padding: 64,
    color: "#6b7280",
  },
  backButton: {
    background: "transparent",
    border: "1px solid #d1d5db",
    color: "#374151",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    marginBottom: 24,
  },
  wrapper: {
    width: "100%",
    maxWidth: 520,
    margin: "0 auto",
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 20,
    textAlign: "center",
    color: "#111827",
  },
  card: {
    background: "#fff",
    padding: 30,
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  field: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: 6,
    fontWeight: 600,
    color: "#374151",
    fontSize: 14,
  },
  select: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 14,
    background: "#fff",
    color: "#111827",
  },
  summaryBox: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1e3a8a",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 14,
    lineHeight: 1.6,
  },
  errorBox: {
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: 10,
    padding: "10px 14px",
    marginBottom: 16,
    fontSize: 14,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
  },
  cancelButton: {
    padding: "12px 18px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: 600,
  },
  submitButton: {
    padding: "12px 18px",
    borderRadius: 10,
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: 600,
  },
};