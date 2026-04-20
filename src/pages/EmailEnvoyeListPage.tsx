import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmailsByFilters, deleteEmail } from "../api/emailEnvoyeService";
import type { EmailEnvoyeDto, EmailEnvoyeFilter } from "../types/emailEnvoye";

const EmailEnvoyeListPage = () => {
  const navigate = useNavigate();
  const [emails, setEmails] = useState<EmailEnvoyeDto[]>([]);
  const [filters, setFilters] = useState<EmailEnvoyeFilter>({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmailsByFilters({ ...filters, page, size: 10 });
      setEmails(data.content);
      setTotalPages(data.totalPages);
    } catch {
      setError("Erreur lors du chargement des emails.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmails(); }, [page]);

  const handleSearch = () => { setPage(0); fetchEmails(); };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer cet email ?")) return;
    try {
      await deleteEmail(id);
      fetchEmails();
    } catch {
      setError("Erreur lors de la suppression.");
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Emails envoyés</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Suivi des communications envoyées</p>
        </div>
        <button
          onClick={() => navigate("/emails-envoyes/new")}
          style={{ padding: "10px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
        >
          + Nouvel email
        </button>
      </div>

      {/* FILTRES */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            style={{ flex: 1, minWidth: 160, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
            placeholder="Destinataire"
            value={filters.destinataire || ""}
            onChange={(e) => setFilters({ ...filters, destinataire: e.target.value })}
          />
          <input
            style={{ flex: 1, minWidth: 160, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
            placeholder="Sujet"
            value={filters.sujet || ""}
            onChange={(e) => setFilters({ ...filters, sujet: e.target.value })}
          />
          <input
            type="number"
            style={{ width: 160, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
            placeholder="ID Association"
            value={filters.associationId || ""}
            onChange={(e) => setFilters({ ...filters, associationId: e.target.value ? Number(e.target.value) : undefined })}
          />
          <button
            onClick={handleSearch}
            style={{ padding: "8px 20px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 500 }}
          >
            Rechercher
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

      {/* TABLEAU */}
      {!loading && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["#", "Destinataire", "Sujet", "Association", "Date d'envoi", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {emails.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                    Aucun email trouvé
                  </td>
                </tr>
              ) : (
                emails.map((email, i) => (
                  <tr key={email.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "12px 16px", color: "#9ca3af", fontWeight: 600 }}>#{email.id}</td>
                    <td style={{ padding: "12px 16px" }}>{email.destinataire}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 500 }}>{email.sujet}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>{email.associationId ?? "—"}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>
                      {email.dateEnvoi ? new Date(email.dateEnvoi).toLocaleString("fr-FR") : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => navigate(`/emails-envoyes/${email.id}`)}
                          style={{ padding: "6px 12px", background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}
                        >
                          Détail
                        </button>
                        <button
                          onClick={() => handleDelete(email.id!)}
                          style={{ padding: "6px 12px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}
                        >
                          Supprimer
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
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            style={{ padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: 6, background: page === 0 ? "#f9fafb" : "#fff", color: page === 0 ? "#9ca3af" : "#374151", cursor: page === 0 ? "default" : "pointer" }}
          >
            Précédent
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{ padding: "8px 14px", border: "1px solid #d1d5db", borderRadius: 6, background: page === i ? "#4f46e5" : "#fff", color: page === i ? "#fff" : "#374151", cursor: "pointer", fontWeight: page === i ? 700 : 400 }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages - 1}
            style={{ padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: 6, background: page === totalPages - 1 ? "#f9fafb" : "#fff", color: page === totalPages - 1 ? "#9ca3af" : "#374151", cursor: page === totalPages - 1 ? "default" : "pointer" }}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailEnvoyeListPage;