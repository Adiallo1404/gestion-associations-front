import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, deleteUser } from "../api/userService";
import type { User } from "../types/user";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize";
import ExportPdfButton from "../components/ExportPdfButton";

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { isMobile, isTablet } = useWindowSize();
  const navigate = useNavigate();

  const [modal, setModal] = useState<{ isOpen: boolean; id: number | null; label: string }>
    ({ isOpen: false, id: null, label: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getUsers({}, 0, 100);
      const validUsers = (data.content ?? []).filter((u: any) => u.id !== undefined && u.id !== null);
      setUsers(validUsers);
    } catch {
      setError("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteClick = (id: number, firstName: string, lastName: string) =>
    setModal({ isOpen: true, id, label: `${firstName} ${lastName}` });

  const handleConfirmDelete = async () => {
    if (!modal.id) return;
    try {
      await deleteUser(modal.id);
      setModal({ isOpen: false, id: null, label: '' });
      fetchData();
    } catch {
      setError("Erreur lors de la suppression");
      setModal({ isOpen: false, id: null, label: '' });
    }
  };

  const handleCancelDelete = () => setModal({ isOpen: false, id: null, label: '' });

  const filtered = (users ?? []).filter(
    (u) =>
      u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (raw?: string) => {
    if (!raw) return "—";
    const d = new Date(raw);
    return (
      d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const pdfOptions = {
    title: "Liste des utilisateurs",
    subtitle: "Export complet des utilisateurs du système",
    filename: "utilisateurs",
    columns: [
      { header: "Prénom",        accessor: (u: User) => u.firstName ?? "—",    width: 1   },
      { header: "Nom",           accessor: (u: User) => u.lastName ?? "—",     width: 1   },
      { header: "Email",         accessor: (u: User) => u.email ?? "—",        width: 2   },
      { header: "Rôle",          accessor: (u: User) => u.globalRole ?? "—",   width: 1   },
      { header: "Statut",        accessor: (u: User) => u.active ? "Actif" : "Inactif", width: 0.8 },
      { header: "Date création", accessor: (u: User) => u.dateCreation
          ? new Date(u.dateCreation).toLocaleDateString("fr-FR") : "—", width: 1.2 },
    ],
    data: filtered,
  };

  if (loading) return <p style={styles.message}>Chargement...</p>;
  if (error)   return <p style={{ ...styles.message, color: "#A32D2D" }}>{error}</p>;

  return (
    <div style={{ ...styles.page, padding: isMobile ? "12px" : "2rem 1.5rem" }}>

      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer "${modal.label}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* ✅ BREADCRUMB AJOUTÉ ICI */}
      <nav style={breadcrumbStyle}>
        <span
          style={breadcrumbHome}
          onClick={() => navigate("/")}
        >
          🏠 Accueil
        </span>
        <span style={breadcrumbSeparator}>›</span>
        <span style={breadcrumbCurrent}>
          Utilisateurs
        </span>
      </nav>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ ...styles.title, fontSize: isMobile ? 18 : 32 }}>👤 Utilisateurs</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <ExportPdfButton isMobile={isMobile} options={pdfOptions} />
          <button style={styles.btnCreate} onClick={() => navigate("/users/new")}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
              <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {!isMobile && "Créer un utilisateur"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder={isMobile ? "Rechercher..." : "Rechercher par nom, prénom ou email..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...styles.searchInput, maxWidth: isMobile ? "100%" : 380, flex: 1 }}
        />
        <span style={styles.countLabel}>
          {filtered.length} {!isMobile && `utilisateur${filtered.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p style={styles.message}>Aucun utilisateur trouvé.</p>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((user) => (
            <div key={user.id} style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e0e0e0", padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#171717" }}>
                    {user.firstName} {user.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: "#444", fontFamily: "monospace", marginTop: 2 }}>
                    {user.email}
                  </div>
                </div>
                <span style={user.active ? styles.badgeActive : styles.badgeInactive}>
                  {user.active ? "Actif" : "Inactif"}
                </span>
              </div>
              {user.globalRole && (
                <div style={{ marginBottom: 10 }}>
                  <span style={styles.roleBadge}>{user.globalRole}</span>
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...styles.btnVoir, flex: 1, justifyContent: "center" }} onClick={() => navigate(`/users/${user.id}`)}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <ellipse cx="6.5" cy="6.5" rx="5.5" ry="3.5" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" />
                  </svg>
                  Voir
                </button>
                <button style={{ ...styles.btnEdit, flex: 1, justifyContent: "center" }} onClick={() => navigate(`/users/${user.id}/edit`)}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M9 2l2 2-7 7H2v-2L9 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                  Modifier
                </button>
                <button style={{ ...styles.btnDel, flex: 1, justifyContent: "center" }} onClick={() => handleDeleteClick(user.id!, user.firstName!, user.lastName!)}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <polyline points="2,4 11,4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M5 4V3h3v1M4 4l1 7h4l1-7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
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
                {!isTablet && <th style={{ ...styles.th, width: "52px" }}>ID</th>}
                <th style={styles.th}>Prénom</th>
                <th style={styles.th}>Nom</th>
                {!isTablet && <th style={styles.th}>Email</th>}
                <th style={styles.th}>Rôle</th>
                <th style={styles.th}>Statut</th>
                {!isTablet && <th style={styles.th}>Date création</th>}
                <th style={{ ...styles.th, width: isTablet ? "100px" : "210px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  style={styles.tr}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F8F8F8")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {!isTablet && <td style={styles.td}><span style={styles.idBadge}>{user.id}</span></td>}
                  <td style={{ ...styles.td, fontWeight: 500 }}>{user.firstName}</td>
                  <td style={{ ...styles.td, fontWeight: 500 }}>{user.lastName}</td>
                  {!isTablet && <td style={styles.td}><span style={styles.emailText}>{user.email}</span></td>}
                  <td style={styles.td}>
                    {user.globalRole
                      ? <span style={styles.roleBadge}>{user.globalRole}</span>
                      : <span style={styles.emptyText}>—</span>}
                  </td>
                  <td style={styles.td}>
                    <span style={user.active ? styles.badgeActive : styles.badgeInactive}>
                      {user.active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  {!isTablet && <td style={styles.td}><span style={styles.dateText}>{formatDate(user.dateCreation)}</span></td>}
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button style={styles.btnVoir} onClick={() => navigate(`/users/${user.id}`)}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <ellipse cx="6.5" cy="6.5" rx="5.5" ry="3.5" stroke="currentColor" strokeWidth="1.2" />
                          <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" />
                        </svg>
                        {!isTablet && "Voir"}
                      </button>
                      <button style={styles.btnEdit} onClick={() => navigate(`/users/${user.id}/edit`)}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M9 2l2 2-7 7H2v-2L9 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                        </svg>
                        {!isTablet && "Modifier"}
                      </button>
                      <button style={styles.btnDel} onClick={() => handleDeleteClick(user.id!, user.firstName!, user.lastName!)}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <polyline points="2,4 11,4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                          <path d="M5 4V3h3v1M4 4l1 7h4l1-7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                        </svg>
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

// --- STYLES BREADCRUMB ---
const breadcrumbStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 16,
  fontSize: 14,
};

const breadcrumbHome: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#6b7280",
  cursor: "pointer",
  fontWeight: 500,
};

const breadcrumbSeparator: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: 16,
};

const breadcrumbCurrent: React.CSSProperties = {
  color: "#111827",
  fontWeight: 600,
};

// --- AUTRES STYLES ---
const styles: Record<string, React.CSSProperties> = {
  page:          { background: "#f3f5f3b4", minHeight: "100vh", fontFamily: "system-ui, sans-serif" },
  title:         { fontWeight: 500, color: "#1a1a1a", margin: 0 },
  btnCreate:     { background: "#116ecb", color: "#e6f1fbb9", border: "none", padding: "10px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
  searchInput:   { padding: "9px 14px", borderRadius: 8, border: "0.5px solid #ccc", background: "#fff", fontSize: 14, color: "#1a1a1a", outline: "none" },
  countLabel:    { marginLeft: "auto", fontSize: 13, color: "#888" },
  card:          { background: "#fff", borderRadius: 12, border: "0.5px solid #e0e0e0", overflow: "hidden" },
  table:         { width: "100%", borderCollapse: "collapse" as const, fontSize: 14 },
  theadRow:      { background: "#E6F1FB" },
  th:            { padding: "14px 16px", textAlign: "left" as const, fontWeight: 500, fontSize: 13, color: "#0C447C", borderBottom: "0.5px solid #B5D4F4" },
  tr:            { borderBottom: "0.5px solid #f0f0f0", transition: "background 0.1s" },
  td:            { padding: "12px 16px", color: "#171717", verticalAlign: "middle" as const },
  idBadge:       { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "#f0f0f0", fontSize: 12, fontWeight: 500, color: "#555" },
  emailText:     { fontSize: 13, color: "#444", fontFamily: "monospace" },
  roleBadge:     { display: "inline-block", padding: "3px 10px", borderRadius: 99, background: "#EAF3DE", color: "#5ec807", fontSize: 12, fontWeight: 500 },
  badgeActive:   { display: "inline-block", padding: "3px 10px", borderRadius: 99, background: "#E6F4EA", color: "#1E6B35", fontSize: 12, fontWeight: 500 },
  badgeInactive: { display: "inline-block", padding: "3px 10px", borderRadius: 99, background: "#F5F5F5", color: "#888", fontSize: 12, fontWeight: 500 },
  dateText:      { fontSize: 12, color: "#222121", fontFamily: "monospace" },
  emptyText:     { color: "#bbb", fontSize: 13 },
  actions:       { display: "flex", gap: 6, alignItems: "center" },
  btnVoir:       { background: "#f5f5f5", color: "#333", border: "0.5px solid #ccc", padding: "5px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 },
  btnEdit:       { background: "#EAF3DE", color: "#6de50b", border: "0.5px solid #C0DD97", padding: "5px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 },
  btnDel:        { background: "#FCEBEB", color: "#ee1111", border: "0.5px solid #F7C1C1", padding: "5px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 },
  message:       { textAlign: "center" as const, marginTop: "2rem", color: "#202020", fontSize: 15 },
};