import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate } from "react-router-dom";
import { emailEnvoyeService } from "../api/emailEnvoyeService";
import type {
  EmailEnvoyeDto,
  EmailEnvoyeFilter,
  StatutEnvoi,
} from "../types/emailEnvoye";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize";

const PAGE_SIZE = 10;
const STATUS_SUCCESS: StatutEnvoi = "SUCCES";

interface DeleteModalState {
  isOpen: boolean;
  id: number | null;
  label: string;
}

/**
 * Displays sent emails with filtering, pagination,
 * detail navigation and deletion capabilities.
 */
export default function EmailEnvoyeListPage() {
  const navigate = useNavigate();
  const { isMobile } = useWindowSize();

  const [emails, setEmails] = useState<EmailEnvoyeDto[]>([]);
  const [filters, setFilters] = useState<EmailEnvoyeFilter>({});
  const [draftFilters, setDraftFilters] = useState<EmailEnvoyeFilter>({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<DeleteModalState>({
    isOpen: false,
    id: null,
    label: "",
  });

  const fetchEmails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await emailEnvoyeService.getEmailsByFilters({
        ...filters,
        page,
        size: PAGE_SIZE,
        sort: "dateEnvoi,desc",
      });

      setEmails(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
    } catch (fetchError) {
      console.error("Failed to load sent emails", fetchError);
      setEmails([]);
      setTotalPages(0);
      setError("Erreur lors du chargement des emails.");
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const updateDraftFilter = <K extends keyof EmailEnvoyeFilter>(
    key: K,
    value: EmailEnvoyeFilter[K] | undefined
  ) => {
    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value || undefined,
    }));
  };

  const handleSearch = () => {
    setPage(0);
    setFilters(draftFilters);
  };

  const handleReset = () => {
    setPage(0);
    setDraftFilters({});
    setFilters({});
  };

  const handleDeleteClick = (id: number, subject: string) => {
    setModal({
      isOpen: true,
      id,
      label: subject,
    });
  };

  const handleConfirmDelete = async () => {
    if (modal.id === null) return;

    try {
      await emailEnvoyeService.deleteEmail(modal.id);
      setModal({ isOpen: false, id: null, label: "" });
      await fetchEmails();
    } catch (deleteError) {
      console.error("Failed to delete sent email", deleteError);
      setError("Erreur lors de la suppression.");
      setModal({ isOpen: false, id: null, label: "" });
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
    return date ? new Date(date).toLocaleString("fr-FR") : "—";
  };

  const renderStatusBadge = (status?: StatutEnvoi | string | null) => {
    if (!status) {
      return <span style={emptyValueStyle}>—</span>;
    }

    const isSuccess = status === STATUS_SUCCESS;

    return (
      <span style={statusBadgeStyle(isSuccess)}>
        {isSuccess ? "✅ Succès" : "❌ Échec"}
      </span>
    );
  };

  return (
    <div style={pageStyle(isMobile)}>
      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer l'email"
        message={`Êtes-vous sûr de vouloir supprimer l'email "${modal.label}" ? Cette action est irréversible.`}
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

        <span style={breadcrumbCurrentBadgeStyle}>Emails envoyés</span>
      </nav>

      {/* Header */}
      <div style={headerStyle}>
        <div>
          <div style={titleWrapperStyle}>
            <span style={{ fontSize: isMobile ? 24 : 32 }}>✉️</span>

            <h1 style={titleStyle(isMobile)}>Emails envoyés</h1>
          </div>

          <p style={subtitleStyle(isMobile)}>
            Suivi des communications envoyées
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/emails-envoyes/new")}
          style={addButtonStyle}
        >
          {isMobile ? "➕" : "+ Nouvel email"}
        </button>
      </div>

      {/* Search filters */}
      <div style={filtersContainerStyle}>
        <div style={filtersInnerStyle(isMobile)}>
          <input
            style={inputStyle}
            placeholder="Expéditeur"
            value={draftFilters.nomExpediteur ?? ""}
            onChange={(event) =>
              updateDraftFilter("nomExpediteur", event.target.value)
            }
          />

          <input
            style={inputStyle}
            placeholder="Destinataire"
            value={draftFilters.destinataire ?? ""}
            onChange={(event) =>
              updateDraftFilter("destinataire", event.target.value)
            }
          />

          <input
            style={inputStyle}
            placeholder="Sujet"
            value={draftFilters.sujet ?? ""}
            onChange={(event) =>
              updateDraftFilter("sujet", event.target.value)
            }
          />

          <select
            style={inputStyle}
            value={draftFilters.statutEnvoi ?? ""}
            onChange={(event) =>
              updateDraftFilter(
                "statutEnvoi",
                event.target.value
                  ? (event.target.value as StatutEnvoi)
                  : undefined
              )
            }
          >
            <option value="">Tous les statuts</option>
            <option value="SUCCES">Succès</option>
            <option value="ECHEC">Échec</option>
          </select>

          <button type="button" onClick={handleSearch} style={searchButtonStyle}>
            🔍 Rechercher
          </button>

          <button type="button" onClick={handleReset} style={resetButtonStyle}>
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Error and loading state */}
      {error && <div style={errorStyle}>{error}</div>}

      {isLoading && <div style={loadingStyle}>Chargement...</div>}

      {/* Emails table */}
      {!isLoading && (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={thStyle}>Destinataire</th>
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
                  <td
                    colSpan={isMobile ? 3 : 6}
                    style={emptyTableCellStyle}
                  >
                    Aucun email trouvé
                  </td>
                </tr>
              ) : (
                emails.map((email) => (
                  <tr key={email.id} style={tableRowStyle}>
                    <td style={tdStyle}>{email.destinataire}</td>

                    {!isMobile && (
                      <td style={mutedTdStyle}>
                        {email.nomExpediteur || "—"}
                      </td>
                    )}

                    <td style={subjectTdStyle}>{email.sujet}</td>

                    {!isMobile && (
                      <td style={tdStyle}>
                        {renderStatusBadge(email.statutEnvoi)}
                      </td>
                    )}

                    {!isMobile && (
                      <td style={mutedTdStyle}>{formatDate(email.dateEnvoi)}</td>
                    )}

                    <td style={tdStyle}>
                      <div style={actionsStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            email.id &&
                            navigate(`/emails-envoyes/${email.id}`)
                          }
                          style={detailButtonStyle}
                          title="Voir le détail"
                        >
                          👁️
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!email.id) return;
                            handleDeleteClick(email.id, email.sujet);
                          }}
                          style={deleteButtonStyle}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={paginationStyle}>
          <button
            type="button"
            onClick={() => setPage((currentPage) => currentPage - 1)}
            disabled={page === 0}
            style={{
              ...pageButtonStyle,
              opacity: page === 0 ? 0.4 : 1,
              cursor: page === 0 ? "not-allowed" : "pointer",
            }}
          >
            ← Précédent
          </button>

          <span style={pageIndicatorStyle}>
            Page {page + 1} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((currentPage) => currentPage + 1)}
            disabled={page >= totalPages - 1}
            style={{
              ...pageButtonStyle,
              opacity: page >= totalPages - 1 ? 0.4 : 1,
              cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
            }}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}

const pageStyle = (isMobile: boolean): CSSProperties => ({
  padding: isMobile ? "16px" : "24px 40px",
  background: "#f8fafc",
  minHeight: "100vh",
  fontFamily: "sans-serif",
});

const breadcrumbStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 20,
  fontSize: 14,
};

const breadcrumbHomeStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#64748b",
  cursor: "pointer",
  fontWeight: 500,
};

const breadcrumbSeparatorStyle: CSSProperties = {
  color: "#cbd5e1",
  fontSize: 14,
};

const breadcrumbCurrentBadgeStyle: CSSProperties = {
  background: "#eff6ff",
  color: "#1e293b",
  padding: "4px 12px",
  borderRadius: 8,
  border: "1px solid #dbeafe",
  fontWeight: 600,
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 24,
  gap: 16,
};

const titleWrapperStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const titleStyle = (isMobile: boolean): CSSProperties => ({
  margin: 0,
  fontSize: isMobile ? 20 : 28,
  fontWeight: 800,
  color: "#0f172a",
  letterSpacing: "-0.02em",
});

const subtitleStyle = (isMobile: boolean): CSSProperties => ({
  margin: "4px 0 0",
  fontSize: 14,
  color: "#64748b",
  paddingLeft: isMobile ? 0 : 44,
});

const addButtonStyle: CSSProperties = {
  padding: "10px 20px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
};

const filtersContainerStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 20,
  marginBottom: 24,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const filtersInnerStyle = (isMobile: boolean): CSSProperties => ({
  display: "flex",
  gap: 12,
  flexDirection: isMobile ? "column" : "row",
  flexWrap: "wrap",
});

const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: 140,
  padding: "8px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 14,
};

const searchButtonStyle: CSSProperties = {
  padding: "8px 20px",
  background: "#f1f5f9",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 500,
};

const resetButtonStyle: CSSProperties = {
  padding: "8px 20px",
  background: "#fff",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 500,
  color: "#64748b",
};

const errorStyle: CSSProperties = {
  background: "#fef2f2",
  color: "#dc2626",
  padding: 12,
  borderRadius: 8,
  marginBottom: 16,
};

const loadingStyle: CSSProperties = {
  textAlign: "center",
  padding: 32,
  color: "#64748b",
};

const tableContainerStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  overflow: "hidden",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
};

const tableHeaderRowStyle: CSSProperties = {
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
};

const thStyle: CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  color: "#64748b",
  fontSize: 13,
  fontWeight: 600,
};

const tableRowStyle: CSSProperties = {
  borderBottom: "1px solid #f1f5f9",
};

const tdStyle: CSSProperties = {
  padding: "12px 16px",
};

const mutedTdStyle: CSSProperties = {
  padding: "12px 16px",
  color: "#64748b",
};

const subjectTdStyle: CSSProperties = {
  padding: "12px 16px",
  fontWeight: 500,
};

const emptyTableCellStyle: CSSProperties = {
  textAlign: "center",
  padding: 40,
  color: "#94a3b8",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
};

const detailButtonStyle: CSSProperties = {
  padding: "6px 10px",
  background: "#f1f5f9",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  cursor: "pointer",
};

const deleteButtonStyle: CSSProperties = {
  padding: "6px 10px",
  background: "#fef2f2",
  color: "#ef4444",
  border: "1px solid #fecaca",
  borderRadius: 6,
  cursor: "pointer",
};

const paginationStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 12,
  marginTop: 24,
};

const pageButtonStyle: CSSProperties = {
  padding: "8px 16px",
  background: "white",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontWeight: 500,
};

const pageIndicatorStyle: CSSProperties = {
  fontWeight: 600,
  color: "#374151",
};

const emptyValueStyle: CSSProperties = {
  color: "#94a3b8",
};

const statusBadgeStyle = (isSuccess: boolean): CSSProperties => ({
  padding: "2px 10px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  background: isSuccess ? "#f0fdf4" : "#fef2f2",
  color: isSuccess ? "#16a34a" : "#dc2626",
  border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
});