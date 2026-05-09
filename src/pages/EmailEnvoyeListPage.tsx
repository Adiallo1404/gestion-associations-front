import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmailsByFilters, deleteEmail } from "../api/emailEnvoyeService";
import type { EmailEnvoyeDto, EmailEnvoyeFilter } from "../types/emailEnvoye";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize";

const EmailEnvoyeListPage = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();
  const [emails, setEmails] = useState<EmailEnvoyeDto[]>([]);
  const [filters, setFilters] = useState<EmailEnvoyeFilter>({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<{ isOpen: boolean; id: number | null; label: string }>
    ({ isOpen: false, id: null, label: "" });

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmailsByFilters({ ...filters, page, size: 10 });
      setEmails(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
    } catch {
      setError("Erreur lors du chargement des emails.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmails(); }, [page]);

  const handleSearch = () => { setPage(0); fetchEmails(); };

  const handleDeleteClick = (id: number, sujet: string) => {
    setModal({ isOpen: true, id, label: sujet });
  };

  const handleConfirmDelete = async () => {
    if (!modal.id) return;
    try {
      await deleteEmail(modal.id);
      setModal({ isOpen: false, id: null, label: "" });
      fetchEmails();
    } catch {
      setError("Erreur lors de la suppression.");
      setModal({ isOpen: false, id: null, label: "" });
    }
  };

  const handleCancelDelete = () => setModal({ isOpen: false, id: null, label: "" });

  return (
    <div style={{ padding: isMobile ? "12px" : "32px 40px", background: "#f8fafc", minHeight: "100vh" }}>

      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer l'email"
        message={`Êtes-vous sûr de vouloir supprimer l'email "${modal.label}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* ✅ FIL D'ARIANE (BREADCRUMB) */}
      <nav style={breadcrumbStyle}>
        <span style={breadcrumbHome} onClick={() => navigate("/")}>
          🏠 Accueil
        </span>
        <span style={breadcrumbSeparator}>›</span>
        <span style={breadcrumbCurrent}>Emails envoyés</span>
      </nav>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 32, fontWeight: 700, color: "#0f172a" }}>
            ✉️ Emails envoyés
          </h2>
          {!isMobile && <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Suivi des communications envoyées</p>}
        </div>
        <button onClick={() => navigate("/emails-envoyes/new")} style={btnAdd}>
          {isMobile ? "➕" : "+ Nouvel email"}
        </button>
      </div>

      {/* FILTRES */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: isMobile ? 12 : 20, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", gap: 12, flexDirection: isMobile ? "column" : "row", flexWrap: "wrap" }}>
          <input
            style={inputStyle}
            placeholder="Destinataire"
            value={filters.destinataire || ""}
            onChange={(e) => setFilters({ ...filters, destinataire: e.target.value })}
          />
          <input
            style={inputStyle}
            placeholder="Sujet"
            value={filters.sujet || ""}
            onChange={(e) => setFilters({ ...filters, sujet: e.target.value })}
          />
          {!isMobile && (
            <input
              type="number"
              style={{ ...inputStyle, width: 160 }}
              placeholder="ID Association"
              value={filters.associationId || ""}
              onChange={(e) => setFilters({ ...filters, associationId: e.target.value ? Number(e.target.value) : undefined })}
            />
          )}
          <button onClick={handleSearch} style={btnSearch}>
            {isMobile ? "🔍" : "Rechercher"}
          </button>
        </div>
      </div>

      {/* ERREUR */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading && <div style={{ textAlign: "center", padding: 32, color: "#64748b" }}>Chargement...</div>}

      {/* CONTENU */}
      {!loading && (
        isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(emails ?? []).length === 0 ? (
              <p style={{ textAlign: "center", color: "#94a3b8" }}>Aucun email trouvé</p>
            ) : (emails ?? []).map((email) => (
              <div key={email.id} style={{ background: "#fff", borderRadius: 12, padding: 14, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: "#1e293b" }}>{email.sujet}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>
                  📧 {email.destinataire}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
                  #{email.id} · {email.dateEnvoi ? new Date(email.dateEnvoi).toLocaleString("fr-FR") : "—"}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => navigate(`/emails-envoyes/${email.id}`)} style={{ ...btnDetail, flex: 1 }}>👁️ Détail</button>
                  <button onClick={() => handleDeleteClick(email.id!, email.sujet)} style={{ ...btnDelete, flex: 1 }}>🗑️ Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#E6F1FB", color: "#0C447C" }}>
                  {!isTablet && <th style={thStyle}>#</th>}
                  <th style={thStyle}>Destinataire</th>
                  <th style={thStyle}>Sujet</th>
                  {!isTablet && <th style={thStyle}>Association</th>}
                  <th style={thStyle}>Date d'envoi</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(emails ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Aucun email trouvé</td>
                  </tr>
                ) : (
                  (emails ?? []).map((email, i) => (
                    <tr key={email.id} style={{ borderBottom: "1px solid #f1f5f9", background: "white" }}>
                      {!isTablet && <td style={{ ...tdStyle, color: "#94a3b8", fontWeight: 600 }}>#{email.id}</td>}
                      <td style={tdStyle}>{email.destinataire}</td>
                      <td style={{ ...tdStyle, fontWeight: 500, color: "#1e293b" }}>{email.sujet}</td>
                      {!isTablet && <td style={{ ...tdStyle, color: "#64748b" }}>{email.associationId ?? "—"}</td>}
                      <td style={{ ...tdStyle, color: "#64748b", fontSize: 13 }}>
                        {email.dateEnvoi ? new Date(email.dateEnvoi).toLocaleString("fr-FR") : "—"}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => navigate(`/emails-envoyes/${email.id}`)} style={btnDetail}>
                            {isTablet ? "👁️" : "👁️ Détail"}
                          </button>
                          <button onClick={() => handleDeleteClick(email.id!, email.sujet)} style={btnDelete}>
                            {isTablet ? "🗑️" : "🗑️ Supprimer"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            style={{ ...btnPage, opacity: page === 0 ? 0.5 : 1 }}
          >
            ←
          </button>
          <span style={{ display: "flex", alignItems: "center", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
            Page {page + 1} sur {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages - 1}
            style={{ ...btnPage, opacity: page === totalPages - 1 ? 0.5 : 1 }}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
};

// ── Styles Breadcrumb ──────────────────────────────────────────────────────────
const breadcrumbStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 20,
  fontSize: 14,
};

const breadcrumbHome: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#64748b",
  cursor: "pointer",
  fontWeight: 500,
};

const breadcrumbSeparator: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 16,
};

const breadcrumbCurrent: React.CSSProperties = {
  color: "#0f172a",
  fontWeight: 600,
};

// ── Autres Styles ──────────────────────────────────────────────────────────────
const inputStyle = { flex: 1, minWidth: 140, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 } as React.CSSProperties;
const btnAdd     = { padding: "10px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 } as React.CSSProperties;
const btnSearch  = { padding: "8px 20px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 } as React.CSSProperties;
const btnDetail  = { padding: "6px 12px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 } as React.CSSProperties;
const btnDelete  = { padding: "6px 12px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 } as React.CSSProperties;
const btnPage    = { padding: "8px 16px", background: "white", border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer" } as React.CSSProperties;
const thStyle    = { padding: "14px 16px", textAlign: "left" as const, fontWeight: 600, fontSize: 13, borderBottom: "1px solid #B5D4F4" };
const tdStyle    = { padding: "12px 16px" } as React.CSSProperties;

export default EmailEnvoyeListPage;