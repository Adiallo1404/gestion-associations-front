import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmailsByFilters, deleteEmail } from "../api/emailEnvoyeService";
import type { EmailEnvoyeDto, EmailEnvoyeFilter } from "../types/emailEnvoye";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize";

const EmailEnvoyeListPage = () => {
  const navigate = useNavigate();
  const { isMobile } = useWindowSize();

  const [emails, setEmails]           = useState<EmailEnvoyeDto[]>([]);
  const [filters, setFilters]         = useState<EmailEnvoyeFilter>({});
  const [page, setPage]               = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

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

  const statutBadge = (statut?: string) => {
    if (!statut) return <span style={{ color: "#94a3b8" }}>—</span>;
    const isSucces = statut === "SUCCES";
    return (
      <span style={{
        padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
        background: isSucces ? "#f0fdf4" : "#fef2f2",
        color:      isSucces ? "#16a34a" : "#dc2626",
        border:     `1px solid ${isSucces ? "#bbf7d0" : "#fecaca"}`
      }}>
        {isSucces ? "✅ Succès" : "❌ Échec"}
      </span>
    );
  };

  return (
    <div style={{ padding: isMobile ? "16px" : "24px 40px", background: "#f8fafc", minHeight: "100vh", fontFamily: "sans-serif" }}>

      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer l'email"
        message={`Êtes-vous sûr de vouloir supprimer l'email "${modal.label}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={() => setModal({ isOpen: false, id: null, label: "" })}
      />

      {/* FIL D'ARIANE */}
      <nav style={breadcrumbStyle}>
        <span style={breadcrumbHome} onClick={() => navigate("/")}>
          🏠 Accueil
        </span>
        <span style={breadcrumbSeparator}>›</span>
        <span style={breadcrumbCurrentBadge}>Emails envoyés</span>
      </nav>

      {/* EN-TÊTE */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: isMobile ? 24 : 32 }}>✉️</span>
            <h1 style={{
              margin: 0,
              fontSize: isMobile ? 20 : 28,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em"
            }}>
              Emails envoyés
            </h1>
          </div>
          <p style={{
            margin: "4px 0 0",
            fontSize: 14,
            color: "#64748b",
            paddingLeft: isMobile ? 0 : 44
          }}>
            Suivi des communications envoyées
          </p>
        </div>

        <button onClick={() => navigate("/emails-envoyes/new")} style={btnAdd}>
          {isMobile ? "➕" : "+ Nouvel email"}
        </button>
      </div>

      {/* FILTRES */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", gap: 12, flexDirection: isMobile ? "column" : "row", flexWrap: "wrap" }}>
          <input
            style={inputStyle}
            placeholder="Expéditeur"
            value={filters.nomExpediteur || ""}
            onChange={(e) => setFilters({ ...filters, nomExpediteur: e.target.value })}
          />
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
          <button onClick={handleSearch} style={btnSearch}>🔍 Rechercher</button>
        </div>
      </div>

      {/* ERREUR / CHARGEMENT */}
      {error   && <div style={errorStyle}>{error}</div>}
      {loading && <div style={{ textAlign: "center", padding: 32, color: "#64748b" }}>Chargement...</div>}

      {/* TABLEAU */}
      {!loading && (
        <div style={tableContainerStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={thStyle}>Destinataire</th>
                {/* ✅ Colonne Expéditeur ajoutée */}
                {!isMobile && <th style={thStyle}>Expéditeur</th>}
                <th style={thStyle}>Sujet</th>
                {!isMobile && <th style={thStyle}>Statut</th>}
                {!isMobile && <th style={thStyle}>Date</th>}
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {emails.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                    Aucun email trouvé
                  </td>
                </tr>
              ) : (
                emails.map((email) => (
                  <tr key={email.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={tdStyle}>{email.destinataire}</td>
                    {/* ✅ Cellule Expéditeur ajoutée */}
                    {!isMobile && (
                      <td style={{ ...tdStyle, color: "#64748b" }}>
                        {email.nomExpediteur || "—"}
                      </td>
                    )}
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{email.sujet}</td>
                    {!isMobile && <td style={tdStyle}>{statutBadge(email.statutEnvoi)}</td>}
                    {!isMobile && (
                      <td style={{ ...tdStyle, color: "#64748b" }}>
                        {email.dateEnvoi
                          ? new Date(email.dateEnvoi).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                    )}
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => navigate(`/emails-envoyes/${email.id}`)}
                          style={btnDetail}
                          title="Voir le détail"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleDeleteClick(email.id!, email.sujet)}
                          style={btnDelete}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 24 }}>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            style={{ ...btnPage, opacity: page === 0 ? 0.4 : 1 }}
          >
            ← Précédent
          </button>
          <span style={{ fontWeight: 600, color: "#374151" }}>
            Page {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages - 1}
            style={{ ...btnPage, opacity: page === totalPages - 1 ? 0.4 : 1 }}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
};

// ── STYLES ──────────────────────────────────────────────────────────────────
const breadcrumbStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, marginBottom: 20, fontSize: 14,
};
const breadcrumbHome: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  color: "#64748b", cursor: "pointer", fontWeight: 500,
};
const breadcrumbSeparator: React.CSSProperties = { color: "#cbd5e1", fontSize: 14 };
const breadcrumbCurrentBadge: React.CSSProperties = {
  background: "#eff6ff", color: "#1e293b",
  padding: "4px 12px", borderRadius: 8,
  border: "1px solid #dbeafe", fontWeight: 600,
};
const inputStyle: React.CSSProperties = {
  flex: 1, minWidth: 140, padding: "8px 12px",
  border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14,
};
const btnAdd: React.CSSProperties = {
  padding: "10px 20px", background: "#2563eb", color: "white",
  border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600,
};
const btnSearch: React.CSSProperties = {
  padding: "8px 20px", background: "#f1f5f9",
  border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer", fontWeight: 500,
};
const btnDetail: React.CSSProperties = {
  padding: "6px 10px", background: "#f1f5f9",
  border: "1px solid #cbd5e1", borderRadius: 6, cursor: "pointer",
};
const btnDelete: React.CSSProperties = {
  padding: "6px 10px", background: "#fef2f2", color: "#ef4444",
  border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer",
};
const btnPage: React.CSSProperties = {
  padding: "8px 16px", background: "white",
  border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer", fontWeight: 500,
};
const thStyle: React.CSSProperties = {
  padding: "12px 16px", textAlign: "left",
  color: "#64748b", fontSize: 13, fontWeight: 600,
};
const tdStyle: React.CSSProperties = { padding: "12px 16px" };
const errorStyle: React.CSSProperties = {
  background: "#fef2f2", color: "#dc2626",
  padding: 12, borderRadius: 8, marginBottom: 16,
};
const tableContainerStyle: React.CSSProperties = {
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, overflow: "hidden",
};

export default EmailEnvoyeListPage;