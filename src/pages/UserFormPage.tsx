import type { CSSProperties, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { createUser, getUserById, updateUser } from "../api/userService";
import { getAssociations } from "../api/associationService";
import { roleService } from "../api/roleService";
import type {
  CreateUserDto,
  GlobalRole,
  UpdateUserRequest,
  UserDto,
} from "../types/user";
import { GLOBAL_ROLE_LABELS, GLOBAL_ROLE_OPTIONS } from "../types/user";
import type { Association } from "../types/association";
import type { RoleDto } from "../types/role";

interface UserFormState {
  email: string;
  firstName: string;
  lastName: string;
  globalRole: GlobalRole;
  password: string;
  associationId: string;
  roleId: string;
}

const initialFormState: UserFormState = {
  email: "",
  firstName: "",
  lastName: "",
  globalRole: "USER",
  password: "",
  associationId: "",
  roleId: "",
};

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEditMode = Boolean(id);
  const userId = Number(id);

  const [form, setForm] = useState<UserFormState>(initialFormState);
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = <K extends keyof UserFormState>(
    field: K,
    value: UserFormState[K]
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
      ...(field === "associationId" ? { roleId: "" } : {}),
    }));
  };

  const loadReferenceData = useCallback(async () => {
    try {
      setError(null);

      const [associationResponse, roleResponse] = await Promise.all([
        getAssociations({}, 0, 1000),
        roleService.getRoles({
          page: 0,
          size: 1000,
          sort: "name,asc",
        }),
      ]);

      setAssociations(associationResponse.content ?? []);
      setRoles(roleResponse.content ?? []);
    } catch (loadError) {
      console.error("Failed to load user form references", loadError);
      setError("Erreur lors du chargement des associations ou des rôles.");
    }
  }, []);

  const loadUser = useCallback(async () => {
    if (!isEditMode) return;

    if (!id || Number.isNaN(userId)) {
      setError("Identifiant utilisateur invalide.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const user = await getUserById(userId);
      setCurrentUser(user);

      setForm((currentForm) => ({
        ...currentForm,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        globalRole: user.globalRole ?? "USER",
      }));
    } catch (loadError) {
      console.error("Failed to load user", loadError);
      setError("Erreur lors du chargement de l'utilisateur.");
    } finally {
      setIsLoading(false);
    }
  }, [id, isEditMode, userId]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const validateForm = (): string | null => {
    if (!form.firstName.trim()) return "Le prénom est obligatoire.";
    if (!form.lastName.trim()) return "Le nom est obligatoire.";
    if (!form.email.trim()) return "L'email est obligatoire.";

    if (!isEditMode && form.password.length < 8) {
      return "Le mot de passe doit contenir au moins 8 caractères.";
    }

    if (!isEditMode && form.associationId && !form.roleId) {
      return "Veuillez sélectionner un rôle pour l'association.";
    }

    if (!isEditMode && form.roleId && !form.associationId) {
      return "Veuillez sélectionner une association.";
    }

    return null;
  };

  const buildCreatePayload = (): CreateUserDto => ({
    email: form.email.trim(),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    globalRole: form.globalRole,
    password: form.password,
    associationId: form.associationId ? Number(form.associationId) : null,
    roleId: form.roleId ? Number(form.roleId) : null,
  });

  const buildUpdatePayload = (): UpdateUserRequest => ({
    email: form.email.trim(),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    globalRole: form.globalRole,
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

      if (isEditMode) {
        await updateUser(userId, buildUpdatePayload());
        navigate(`/users/${userId}`);
      } else {
        await createUser(buildCreatePayload());
        navigate("/users");
      }
    } catch (submitError) {
      console.error("Failed to save user", submitError);

      const message = axios.isAxiosError(submitError)
        ? submitError.response?.data?.message ?? "Erreur lors de la sauvegarde."
        : "Erreur lors de la sauvegarde.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAssociationName = useMemo(() => {
    if (!form.associationId) return null;

    return (
      associations.find(
        (association) => association.id === Number(form.associationId)
      )?.name ?? null
    );
  }, [associations, form.associationId]);

  if (isLoading) {
    return <div style={styles.message}>Chargement...</div>;
  }

  return (
    <div style={styles.page}>
      <button type="button" style={styles.btnBack} onClick={() => navigate(-1)}>
        ← Retour
      </button>

      <div style={styles.card}>
        <h1 style={styles.title}>
          {isEditMode ? "Modifier un utilisateur" : "Créer un utilisateur"}
        </h1>

        {error && <p style={styles.errorMsg}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div style={styles.grid}>
            <div style={styles.field}>
              <label style={styles.label}>Prénom *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
                required
                placeholder="ex: Jean"
                style={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Nom *</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
                required
                placeholder="ex: Dupont"
                style={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
              <label style={styles.label}>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
                placeholder="ex: jean.dupont@email.com"
                style={styles.input}
                disabled={isSubmitting}
              />
            </div>

            {!isEditMode && (
              <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Mot de passe *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimum 8 caractères"
                  style={styles.input}
                  disabled={isSubmitting}
                />
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>Rôle global</label>
              <select
                value={form.globalRole}
                onChange={(event) =>
                  updateField("globalRole", event.target.value as GlobalRole)
                }
                style={styles.input}
                disabled={isSubmitting}
              >
                {GLOBAL_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {GLOBAL_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>

            {isEditMode && (
              <div style={styles.field}>
                <label style={styles.label}>Statut</label>
                <div style={styles.readOnlyStatus}>
                  <span
                    style={
                      currentUser?.active
                        ? styles.badgeActive
                        : styles.badgeInactive
                    }
                  >
                    {currentUser?.active ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>
            )}

            {!isEditMode && (
              <>
                <div style={styles.field}>
                  <label style={styles.label}>Association</label>
                  <select
                    value={form.associationId}
                    onChange={(event) =>
                      updateField("associationId", event.target.value)
                    }
                    style={styles.input}
                    disabled={isSubmitting}
                  >
                    <option value="">-- Aucun rattachement --</option>
                    {associations.map((association) => (
                      <option key={association.id} value={association.id}>
                        {association.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Rôle dans l'association</label>
                  <select
                    value={form.roleId}
                    onChange={(event) => updateField("roleId", event.target.value)}
                    style={styles.input}
                    disabled={!form.associationId || isSubmitting}
                  >
                    <option value="">
                      {form.associationId
                        ? "-- Sélectionner --"
                        : "Choisir d'abord une association"}
                    </option>

                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAssociationName && (
                  <div style={{ ...styles.hint, gridColumn: "1 / -1" }}>
                    L'utilisateur sera rattaché à :{" "}
                    <strong>{selectedAssociationName}</strong>
                  </div>
                )}
              </>
            )}
          </div>

          <div style={styles.divider} />

          <div style={styles.actions}>
            <button
              type="button"
              style={styles.btnCancel}
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Annuler
            </button>

            <button
              type="submit"
              style={{
                ...styles.btnSubmit,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Sauvegarde..."
                : isEditMode
                ? "Mettre à jour"
                : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    padding: "2rem 1.5rem",
    background: "#f5f5e5",
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
  },
  message: {
    textAlign: "center",
    padding: 64,
    color: "#6b7280",
  },
  btnBack: {
    background: "transparent",
    border: "0.5px solid #ccc",
    borderRadius: 8,
    padding: "7px 14px",
    fontSize: 13,
    cursor: "pointer",
    color: "#232222",
    marginBottom: "1.5rem",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    border: "0.5px solid #e0e0e0",
    padding: "2rem",
    maxWidth: 580,
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: "#0a0a0a",
    margin: "0 0 1.5rem 0",
  },
  errorMsg: {
    background: "#FCEBEB",
    color: "#d10f0f",
    border: "0.5px solid #F7C1C1",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: "1rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.2rem",
    marginBottom: "1.5rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: "#555",
  },
  input: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "0.5px solid #ccc",
    fontSize: 14,
    color: "#1a1a1a",
    background: "#fff",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  readOnlyStatus: {
    display: "flex",
    alignItems: "center",
    minHeight: 38,
  },
  badgeActive: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 99,
    background: "#E6F4EA",
    color: "#1E6B35",
    fontSize: 12,
    fontWeight: 600,
  },
  badgeInactive: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 99,
    background: "#F5F5F5",
    color: "#888",
    fontSize: 12,
    fontWeight: 600,
  },
  hint: {
    fontSize: 13,
    color: "#6b7280",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "10px 12px",
  },
  divider: {
    height: "0.5px",
    background: "#f0f0f0",
    marginBottom: "1.5rem",
  },
  actions: {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
  },
  btnCancel: {
    background: "transparent",
    border: "0.5px solid #b4a9a9",
    borderRadius: 8,
    padding: "9px 20px",
    fontSize: 14,
    cursor: "pointer",
    color: "#555",
  },
  btnSubmit: {
    background: "#156dc5",
    color: "#E6F1FB",
    border: "none",
    padding: "9px 24px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
  },
};