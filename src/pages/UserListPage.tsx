import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate } from "react-router-dom";
import { deleteUser, getUsers } from "../api/userService";
import type { UserDto } from "../types/user";
import { GLOBAL_ROLE_LABELS } from "../types/user";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize";
import ExportPdfButton from "../components/ExportPdfButton";

interface DeleteModalState {
  isOpen: boolean;
  id: number | null;
  label: string;
}

export default function UserListPage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();

  const [users, setUsers] = useState<UserDto[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<DeleteModalState>({
    isOpen: false,
    id: null,
    label: "",
  });

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getUsers({}, 0, 100, "lastName,asc");

      const validUsers = (data.content ?? []).filter(
        (user): user is UserDto => user.id != null
      );

      setUsers(validUsers);
    } catch (fetchError) {
      console.error("Failed to load users", fetchError);
      setError("Erreur lors du chargement des utilisateurs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return users;

    return users.filter((user) => {
      return (
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    });
  }, [users, search]);

  const handleDeleteClick = (user: UserDto) => {
    setModal({
      isOpen: true,
      id: user.id,
      label: `${user.firstName} ${user.lastName}`,
    });
  };

  const handleConfirmDelete = async () => {
    if (modal.id === null) return;

    try {
      await deleteUser(modal.id);

      setModal({
        isOpen: false,
        id: null,
        label: "",
      });

      await fetchUsers();
    } catch (deleteError) {
      console.error("Failed to delete user", deleteError);
      setError("Erreur lors de la suppression.");

      setModal({
        isOpen: false,
        id: null,
        label: "",
      });
    }
  };

  const handleCancelDelete = () => {
    setModal({
      isOpen: false,
      id: null,
      label: "",
    });
  };

  const formatDate = (date?: string | null): string => {
    if (!date) return "—";

    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleLabel = (user: UserDto): string => {
    return user.globalRole ? GLOBAL_ROLE_LABELS[user.globalRole] : "—";
  };

  const pdfOptions = {
    title: "Liste des utilisateurs",
    subtitle: "Export complet des utilisateurs du système",
    filename: "utilisateurs",
    columns: [
      {
        header: "Prénom",
        accessor: (user: UserDto) => user.firstName,
        width: 1,
      },
      {
        header: "Nom",
        accessor: (user: UserDto) => user.lastName,
        width: 1,
      },
      {
        header: "Email",
        accessor: (user: UserDto) => user.email,
        width: 2,
      },
      {
        header: "Rôle",
        accessor: (user: UserDto) => getRoleLabel(user),
        width: 1,
      },
      {
        header: "Statut",
        accessor: (user: UserDto) => (user.active ? "Actif" : "Inactif"),
        width: 0.8,
      },
      {
        header: "Date création",
        accessor: (user: UserDto) =>
          user.dateCreation
            ? new Date(user.dateCreation).toLocaleDateString("fr-FR")
            : "—",
        width: 1.2,
      },
    ],
    data: filteredUsers,
  };

  if (isLoading) {
    return <p style={styles.message}>Chargement...</p>;
  }

  if (error) {
    return <p style={{ ...styles.message, color: "#A32D2D" }}>{error}</p>;
  }

  return (
    <div
      style={{
        ...styles.page,
        padding: isMobile ? "12px" : "2rem 1.5rem",
      }}
    >
      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer "${modal.label}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Breadcrumb navigation */}
      <nav style={breadcrumbStyle}>
        <span style={breadcrumbHomeStyle} onClick={() => navigate("/")}>
          🏠 Accueil
        </span>

        <span style={breadcrumbSeparatorStyle}>›</span>

        <span style={breadcrumbCurrentStyle}>Utilisateurs</span>
      </nav>

      <div style={headerStyle}>
        <h1
          style={{
            ...styles.title,
            fontSize: isMobile ? 18 : 32,
          }}
        >
          👤 Utilisateurs
        </h1>

        <div style={headerActionsStyle}>
          <ExportPdfButton isMobile={isMobile} options={pdfOptions} />

          <button
            type="button"
            style={styles.btnCreate}
            onClick={() => navigate("/users/new")}
          >
            <PlusIcon />
            {!isMobile && "Créer un utilisateur"}
          </button>
        </div>
      </div>

      <div style={searchRowStyle}>
        <input
          type="text"
          placeholder={
            isMobile
              ? "Rechercher..."
              : "Rechercher par nom, prénom ou email..."
          }
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{
            ...styles.searchInput,
            maxWidth: isMobile ? "100%" : 380,
            flex: 1,
          }}
        />

        <span style={styles.countLabel}>
          {filteredUsers.length}{" "}
          {!isMobile &&
            `utilisateur${filteredUsers.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {filteredUsers.length === 0 ? (
        <p style={styles.message}>Aucun utilisateur trouvé.</p>
      ) : isMobile ? (
        <div style={mobileListStyle}>
          {filteredUsers.map((user) => (
            <div key={user.id} style={mobileCardStyle}>
              <div style={mobileCardHeaderStyle}>
                <div>
                  <div style={mobileUserNameStyle}>
                    {user.firstName} {user.lastName}
                  </div>

                  <div style={styles.emailText}>{user.email}</div>
                </div>

                <span
                  style={user.active ? styles.badgeActive : styles.badgeInactive}
                >
                  {user.active ? "Actif" : "Inactif"}
                </span>
              </div>

              <div style={roleSectionStyle}>
                {user.globalRole ? (
                  <span style={styles.roleBadge}>{getRoleLabel(user)}</span>
                ) : (
                  <span style={styles.emptyText}>—</span>
                )}
              </div>

              <div style={mobileActionsStyle}>
                <button
                  type="button"
                  style={{
                    ...styles.btnVoir,
                    flex: 1,
                    justifyContent: "center",
                  }}
                  onClick={() => navigate(`/users/${user.id}`)}
                >
                  <ViewIcon />
                  Voir
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.btnEdit,
                    flex: 1,
                    justifyContent: "center",
                  }}
                  onClick={() => navigate(`/users/${user.id}/edit`)}
                >
                  <EditIcon />
                  Modifier
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.btnDel,
                    flex: 1,
                    justifyContent: "center",
                  }}
                  onClick={() => handleDeleteClick(user)}
                >
                  <TrashIcon />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                {!isTablet && <th style={{ ...styles.th, width: 52 }}>ID</th>}
                <th style={styles.th}>Prénom</th>
                <th style={styles.th}>Nom</th>
                {!isTablet && <th style={styles.th}>Email</th>}
                <th style={styles.th}>Rôle</th>
                <th style={styles.th}>Statut</th>
                {!isTablet && <th style={styles.th}>Date création</th>}
                <th
                  style={{
                    ...styles.th,
                    width: isTablet ? 100 : 210,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  style={styles.tr}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = "#F8F8F8";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = "transparent";
                  }}
                >
                  {!isTablet && (
                    <td style={styles.td}>
                      <span style={styles.idBadge}>{user.id}</span>
                    </td>
                  )}

                  <td style={{ ...styles.td, fontWeight: 500 }}>
                    {user.firstName}
                  </td>

                  <td style={{ ...styles.td, fontWeight: 500 }}>
                    {user.lastName}
                  </td>

                  {!isTablet && (
                    <td style={styles.td}>
                      <span style={styles.emailText}>{user.email}</span>
                    </td>
                  )}

                  <td style={styles.td}>
                    {user.globalRole ? (
                      <span style={styles.roleBadge}>{getRoleLabel(user)}</span>
                    ) : (
                      <span style={styles.emptyText}>—</span>
                    )}
                  </td>

                  <td style={styles.td}>
                    <span
                      style={
                        user.active ? styles.badgeActive : styles.badgeInactive
                      }
                    >
                      {user.active ? "Actif" : "Inactif"}
                    </span>
                  </td>

                  {!isTablet && (
                    <td style={styles.td}>
                      <span style={styles.dateText}>
                        {formatDate(user.dateCreation)}
                      </span>
                    </td>
                  )}

                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        type="button"
                        style={styles.btnVoir}
                        onClick={() => navigate(`/users/${user.id}`)}
                      >
                        <ViewIcon />
                        {!isTablet && "Voir"}
                      </button>

                      <button
                        type="button"
                        style={styles.btnEdit}
                        onClick={() => navigate(`/users/${user.id}/edit`)}
                      >
                        <EditIcon />
                        {!isTablet && "Modifier"}
                      </button>

                      <button
                        type="button"
                        style={styles.btnDel}
                        onClick={() => handleDeleteClick(user)}
                      >
                        <TrashIcon />
                        {!isTablet && "Supprimer"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <line
        x1="7"
        y1="2"
        x2="7"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="2"
        y1="7"
        x2="12"
        y2="7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ViewIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <ellipse
        cx="6.5"
        cy="6.5"
        rx="5.5"
        ry="3.5"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path
        d="M9 2l2 2-7 7H2v-2L9 2z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <polyline
        points="2,4 11,4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M5 4V3h3v1M4 4l1 7h4l1-7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const breadcrumbStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 16,
  fontSize: 14,
};

const breadcrumbHomeStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#6b7280",
  cursor: "pointer",
  fontWeight: 500,
};

const breadcrumbSeparatorStyle: CSSProperties = {
  color: "#9ca3af",
  fontSize: 16,
};

const breadcrumbCurrentStyle: CSSProperties = {
  color: "#111827",
  fontWeight: 600,
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "1.5rem",
};

const headerActionsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
};

const searchRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: "1rem",
};

const mobileListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const mobileCardStyle: CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  border: "0.5px solid #e0e0e0",
  padding: 14,
};

const mobileCardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 6,
};

const mobileUserNameStyle: CSSProperties = {
  fontWeight: 600,
  fontSize: 15,
  color: "#171717",
};

const roleSectionStyle: CSSProperties = {
  marginBottom: 10,
};

const mobileActionsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
};

const styles: Record<string, CSSProperties> = {
  page: {
    background: "#f3f5f3b4",
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
  },
  title: {
    fontWeight: 500,
    color: "#1a1a1a",
    margin: 0,
  },
  btnCreate: {
    background: "#116ecb",
    color: "#e6f1fbb9",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  searchInput: {
    padding: "9px 14px",
    borderRadius: 8,
    border: "0.5px solid #ccc",
    background: "#fff",
    fontSize: 14,
    color: "#1a1a1a",
    outline: "none",
  },
  countLabel: {
    marginLeft: "auto",
    fontSize: 13,
    color: "#888",
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    border: "0.5px solid #e0e0e0",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  theadRow: {
    background: "#E6F1FB",
  },
  th: {
    padding: "14px 16px",
    textAlign: "left",
    fontWeight: 500,
    fontSize: 13,
    color: "#0C447C",
    borderBottom: "0.5px solid #B5D4F4",
  },
  tr: {
    borderBottom: "0.5px solid #f0f0f0",
    transition: "background 0.1s",
  },
  td: {
    padding: "12px 16px",
    color: "#171717",
    verticalAlign: "middle",
  },
  idBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#f0f0f0",
    fontSize: 12,
    fontWeight: 500,
    color: "#555",
  },
  emailText: {
    fontSize: 13,
    color: "#444",
    fontFamily: "monospace",
    marginTop: 2,
  },
  roleBadge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 99,
    background: "#EAF3DE",
    color: "#3B6D11",
    fontSize: 12,
    fontWeight: 500,
  },
  badgeActive: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 99,
    background: "#E6F4EA",
    color: "#1E6B35",
    fontSize: 12,
    fontWeight: 500,
  },
  badgeInactive: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 99,
    background: "#F5F5F5",
    color: "#888",
    fontSize: 12,
    fontWeight: 500,
  },
  dateText: {
    fontSize: 12,
    color: "#222121",
    fontFamily: "monospace",
  },
  emptyText: {
    color: "#bbb",
    fontSize: 13,
  },
  actions: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  btnVoir: {
    background: "#f5f5f5",
    color: "#333",
    border: "0.5px solid #ccc",
    padding: "5px 10px",
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  btnEdit: {
    background: "#EAF3DE",
    color: "#3B6D11",
    border: "0.5px solid #C0DD97",
    padding: "5px 10px",
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  btnDel: {
    background: "#FCEBEB",
    color: "#ee1111",
    border: "0.5px solid #F7C1C1",
    padding: "5px 10px",
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  message: {
    textAlign: "center",
    marginTop: "2rem",
    color: "#202020",
    fontSize: 15,
  },
};