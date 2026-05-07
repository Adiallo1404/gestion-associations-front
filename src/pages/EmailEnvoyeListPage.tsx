import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmailsByFilters, deleteEmail } from "../api/emailEnvoyeService";
import type { EmailEnvoyeDto, EmailEnvoyeFilter } from "../types/emailEnvoye";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize"; // ✅

const EmailEnvoyeListPage = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize(); // ✅
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
    <div style={{ padding: isMobile ? "12px" : "32px 16px" }}>

      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer l'email"
        message={`Êtes-vous sûr de vouloir supprimer l'email "${modal.label}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <button onClick={() => navigate("/")} style={btnBack}>← Tableau de bord</button>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 24, fontWeight: 700 }}>✉️ Emails envoyés</h2>
          {!isMobile && <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Suivi des communications envoyées</p>}
        </div>
        <button onClick={() => navigate("/emails-envoyes/new")} style={btnAdd}>
          {isMobile ? "➕" : "+ Nouvel email"}
        </button>
      </div>

      {/* FILTRES */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: isMobile ? 12 : 20, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, flexDirection: isMobile ? "column" : "row", flexWrap: "wrap" }}>
          <input
            style={{ flex: 1, minWidth: 140, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
            placeholder="Destinataire"
            value={filters.destinataire || ""}
            onChange={(e) => setFilters({ ...filters, destinataire: e.target.value })}
          />
          <input
            style={{ flex: 1, minWidth: 140, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
            placeholder="Sujet"
            value={filters.sujet || ""}
            onChange={(e) => setFilters({ ...filters, sujet: e.target.value })}
          />
          {!isMobile && (
            <input
              type="number"
              style={{ width: 160, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
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

      {loading && <div style={{ textAlign: "center", padding: 32, color: "#6b7280" }}>Chargement...</div>}

      {/* CONTENU */}
      {!loading && (
        isMobile ? (
          // ✅ CARDS sur mobile
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(emails ?? []).length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af" }}>Aucun email trouvé</p>
            ) : (emails ?? []).map((email) => (
              <div key={email.id} style={{ background: "#fff", borderRadius: 10, padding: 14, border: "1px solid #eee" }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{email.sujet}</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
                  📧 {email.destinataire}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
                  #{email.id} · {email.dateEnvoi ? new Date(email.dateEnvoi).toLocaleString("fr-FR") : "—"}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => navigate(`/emails-envoyes/${email.id}`)}
                    style={{ ...btnDetail, flex: 1 }}
                  >
                    👁️ Détail
                  </button>
                  <button
                    onClick={() => handleDeleteClick(email.id!, email.sujet)}
                    style={{ ...btnDelete, flex: 1 }}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // ✅ TABLE sur tablette/desktop
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#4f46e5", color: "white" }}>
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
                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                      Aucun email trouvé
                    </td>
                  </tr>
                ) : (
                  (emails ?? []).map((email, i) => (
                    <tr key={email.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      {!isTablet && <td style={{ ...tdStyle, color: "#9ca3af", fontWeight: 600 }}>#{email.id}</td>}
                      <td style={tdStyle}>{email.destinataire}</td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{email.sujet}</td>
                      {!isTablet && <td style={{ ...tdStyle, color: "#6b7280" }}>{email.associationId ?? "—"}</td>}
                      <td style={{ ...tdStyle, color: "#6b7280", fontSize: 13 }}>
                        {email.dateEnvoi ? new Date(email.dateEnvoi).toLocaleString("fr-FR") : "—"}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => navigate(`/emails-envoyes/${email.id}`)}
                            style={btnDetail}
                          >
                            {isTablet ? "👁️" : "Détail"}
                          </button>
                          <button
                            onClick={() => handleDeleteClick(email.id!, email.sujet)}
                            style={btnDelete}
                          >
                            {isTablet ? "🗑️" : "Supprimer"}
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
        <div style={{ display: "flex", justifyContent: "center", gap: isMobile ? 4 : 8, marginTop: 24, flexWrap: "wrap" }}>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            style={{ padding: isMobile ? "6px 10px" : "8px 16px", border: "1px solid #d1d5db", borderRadius: 6, background: page === 0 ? "#f9fafb" : "#fff", color: page === 0 ? "#9ca3af" : "#374151", cursor: page === 0 ? "default" : "pointer", fontSize: isMobile ? 12 : 14 }}
          >
            ← {!isMobile && "Précédent"}
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{ padding: isMobile ? "6px 10px" : "8px 14px", border: "1px solid #d1d5db", borderRadius: 6, background: page === i ? "#4f46e5" : "#fff", color: page === i ? "#fff" : "#374151", cursor: "pointer", fontWeight: page === i ? 700 : 400, fontSize: isMobile ? 12 : 14 }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages - 1}
            style={{ padding: isMobile ? "6px 10px" : "8px 16px", border: "1px solid #d1d5db", borderRadius: 6, background: page === totalPages - 1 ? "#f9fafb" : "#fff", color: page === totalPages - 1 ? "#9ca3af" : "#374151", cursor: page === totalPages - 1 ? "default" : "pointer", fontSize: isMobile ? 12 : 14 }}
          >
            {!isMobile && "Suivant"} →
          </button>
        </div>
      )}
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const btnBack   = { display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, padding: 0 } as React.CSSProperties;
const btnAdd    = { padding: "10px 16px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 } as React.CSSProperties;
const btnSearch = { padding: "8px 20px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 500 } as React.CSSProperties;
const btnDetail = { padding: "6px 12px", background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 } as React.CSSProperties;
const btnDelete = { padding: "6px 12px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 } as React.CSSProperties;
const thStyle   = { padding: "12px 16px", textAlign: "left" as const, fontWeight: 600, fontSize: 13 };
const tdStyle   = { padding: "10px 16px" } as React.CSSProperties;

export default EmailEnvoyeListPage;