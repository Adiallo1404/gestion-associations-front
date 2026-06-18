import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate } from "react-router-dom";
import { getAssociations } from "../api/associationService";
import {
  deactivateDocument,
  getDocumentsByAssociation,
} from "../api/documentService";
import type { DocumentDto, FormatFichier } from "../types/document";
import { useWindowSize } from "../hooks/useWindowSize";

interface AssociationOption {
  id: number;
  name: string;
}

const PAGE_SIZE = 10;

export default function DocumentListPage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();

  const [associations, setAssociations] = useState<AssociationOption[]>([]);
  const [associationId, setAssociationId] = useState("");
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssociations = useCallback(async () => {
    try {
      const response = await getAssociations({}, 0, 1000);
      setAssociations(response.content ?? []);
    } catch (err) {
      console.error("Failed to load associations", err);
      setError("Erreur lors du chargement des associations.");
    }
  }, []);

  useEffect(() => {
    loadAssociations();
  }, [loadAssociations]);

  /**
   * Loads documents for the selected association.
   * Backend requires associationId as a mandatory filter.
   */
  const fetchDocuments = useCallback(
    async (currentPage = 0, currentAssociationId = associationId) => {
      if (!currentAssociationId) {
        setError("Veuillez choisir une association.");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await getDocumentsByAssociation(
          Number(currentAssociationId),
          currentPage,
          PAGE_SIZE,
          "dateUpload,desc"
        );

        setDocuments(response.content ?? []);
        setTotalPages(response.totalPages ?? 0);
        setHasSearched(true);
      } catch (err) {
        console.error("Failed to load documents", err);
        setDocuments([]);
        setTotalPages(0);
        setError("Erreur lors du chargement des documents.");
      } finally {
        setIsLoading(false);
      }
    },
    [associationId]
  );

  const handleSearch = () => {
    setPage(0);
    fetchDocuments(0, associationId);
  };

  /**
   * Backend returns HTTP 204 No Content.
   * Refresh the list after successful deactivation.
   */
  const handleDeactivate = async (id: number) => {
    const confirmed = window.confirm("Désactiver ce document ?");
    if (!confirmed) return;

    try {
      await deactivateDocument(id);
      await fetchDocuments(page, associationId);
    } catch (err) {
      console.error("Failed to deactivate document", err);
      setError("Erreur lors de la désactivation.");
    }
  };

  const handlePreviousPage = () => {
    const previousPage = page - 1;
    setPage(previousPage);
    fetchDocuments(previousPage, associationId);
  };

  const handleNextPage = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchDocuments(nextPage, associationId);
  };

  const formatFileSize = (bytes?: number | null): string => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  };

  const renderFormatBadge = (format?: FormatFichier | null) => {
    const colors: Record<FormatFichier, { bg: string; color: string }> = {
      PDF: { bg: "#fef2f2", color: "#dc2626" },
      WORD: { bg: "#eff6ff", color: "#1d4ed8" },
      EXCEL: { bg: "#f0fdf4", color: "#16a34a" },
      PNG: { bg: "#fdf4ff", color: "#9333ea" },
      JPG: { bg: "#fff7ed", color: "#ea580c" },
      AUTRE: { bg: "#f9fafb", color: "#6b7280" },
    };

    const safeFormat = format ?? "AUTRE";
    const badgeColor = colors[safeFormat];

    return (
      <span
        style={{
          padding: "2px 8px",
          background: badgeColor.bg,
          color: badgeColor.color,
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {format ?? "—"}
      </span>
    );
  };

  return (
    <div style={pageStyle(isMobile)}>
      <nav style={breadcrumbStyle}>
        <span style={breadcrumbHomeStyle} onClick={() => navigate("/")}>
          🏠 Accueil
        </span>
        <span style={breadcrumbSeparatorStyle}>›</span>
        <span style={breadcrumbCurrentStyle}>Documents</span>
      </nav>

      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle(isMobile)}>📄 Documents</h2>
          {!isMobile && (
            <p style={subtitleStyle}>Gestion des documents par association</p>
          )}
        </div>

        <button onClick={() => navigate("/documents/new")} style={addButtonStyle}>
          {isMobile ? "➕" : "+ Nouveau document"}
        </button>
      </div>

      <div style={filterCardStyle(isMobile)}>
        <div style={filterRowStyle(isMobile)}>
          <select
            value={associationId}
            onChange={(event) => setAssociationId(event.target.value)}
            style={selectStyle}
          >
            <option value="">-- Choisir une association --</option>

            {associations.map((association) => (
              <option key={association.id} value={association.id}>
                {association.name}
              </option>
            ))}
          </select>

          <button onClick={handleSearch} style={searchButtonStyle}>
            Rechercher
          </button>
        </div>
      </div>

      {error && <div style={errorBoxStyle}>{error}</div>}

      {isLoading && <div style={loadingStyle}>Chargement...</div>}

      {!isLoading && hasSearched && (
        <>
          {isMobile ? (
            <div style={mobileListStyle}>
              {documents.length === 0 ? (
                <p style={emptyStateStyle}>Aucun document trouvé</p>
              ) : (
                documents.map((document) => (
                  <div key={document.id} style={mobileCardStyle}>
                    <div style={mobileTitleStyle}>
                      {document.nomOriginal ?? document.nomFichier}
                    </div>

                    <div style={mobileMetaStyle}>
                      #{document.id} ·{" "}
                      {document.typeDocument?.replace(/_/g, " ") ?? "—"}
                    </div>

                    <div style={mobileBadgesStyle}>
                      {renderFormatBadge(document.formatFichier)}

                      <span style={fileSizeTextStyle}>
                        {formatFileSize(document.tailleOctets)}
                      </span>

                      <span style={statusBadgeStyle(document.actif)}>
                        {document.actif ? "Actif" : "Inactif"}
                      </span>
                    </div>

                    <div style={mobileActionsStyle}>
                      <button
                        onClick={() => navigate(`/documents/${document.id}`)}
                        style={{ ...detailButtonStyle, flex: 1 }}
                      >
                        👁️ Détail
                      </button>

                      {document.actif && (
                        <button
                          onClick={() => handleDeactivate(document.id)}
                          style={{ ...deactivateButtonStyle, flex: 1 }}
                        >
                          🚫 Désactiver
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    {!isTablet && <th style={thStyle}>#</th>}
                    <th style={thStyle}>Nom du fichier</th>
                    {!isTablet && <th style={thStyle}>Type</th>}
                    <th style={thStyle}>Format</th>
                    {!isTablet && <th style={thStyle}>Taille</th>}
                    <th style={thStyle}>Date upload</th>
                    <th style={thStyle}>Statut</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={isTablet ? 5 : 8} style={emptyTableCellStyle}>
                        Aucun document trouvé
                      </td>
                    </tr>
                  ) : (
                    documents.map((document) => (
                      <tr key={document.id} style={tableRowStyle}>
                        {!isTablet && (
                          <td style={idCellStyle}>#{document.id}</td>
                        )}

                        <td style={fileNameCellStyle}>
                          {document.nomOriginal ?? document.nomFichier}
                        </td>

                        {!isTablet && (
                          <td style={typeCellStyle}>
                            {document.typeDocument?.replace(/_/g, " ") ?? "—"}
                          </td>
                        )}

                        <td style={tdStyle}>
                          {renderFormatBadge(document.formatFichier)}
                        </td>

                        {!isTablet && (
                          <td style={mutedCellStyle}>
                            {formatFileSize(document.tailleOctets)}
                          </td>
                        )}

                        <td style={dateCellStyle}>
                          {document.dateUpload
                            ? new Date(document.dateUpload).toLocaleDateString(
                                "fr-FR"
                              )
                            : "—"}
                        </td>

                        <td style={tdStyle}>
                          <span style={statusBadgeStyle(document.actif)}>
                            {document.actif ? "Actif" : "Inactif"}
                          </span>
                        </td>

                        <td style={tdStyle}>
                          <div style={actionGroupStyle}>
                            <button
                              onClick={() =>
                                navigate(`/documents/${document.id}`)
                              }
                              style={detailButtonStyle}
                            >
                              {isTablet ? "👁️" : "Détail"}
                            </button>

                            {document.actif && (
                              <button
                                onClick={() => handleDeactivate(document.id)}
                                style={deactivateButtonStyle}
                              >
                                {isTablet ? "🚫" : "Désactiver"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div style={paginationStyle}>
              <button
                onClick={handlePreviousPage}
                disabled={page === 0}
                style={{
                  ...pageButtonStyle,
                  opacity: page === 0 ? 0.5 : 1,
                }}
              >
                ←
              </button>

              <span style={pageIndicatorStyle}>
                Page {page + 1} sur {totalPages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={page >= totalPages - 1}
                style={{
                  ...pageButtonStyle,
                  opacity: page >= totalPages - 1 ? 0.5 : 1,
                }}
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const pageStyle = (isMobile: boolean): CSSProperties => ({
  padding: isMobile ? "12px" : "32px 40px",
  background: "#f8fafc",
  minHeight: "100vh",
});

const breadcrumbStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
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
  color: "#94a3b8",
  fontSize: 16,
};

const breadcrumbCurrentStyle: CSSProperties = {
  color: "#0f172a",
  fontWeight: 600,
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 24,
};

const titleStyle = (isMobile: boolean): CSSProperties => ({
  margin: 0,
  fontSize: isMobile ? 18 : 32,
  fontWeight: 700,
  color: "#0f172a",
});

const subtitleStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#64748b",
  fontSize: 14,
};

const addButtonStyle: CSSProperties = {
  padding: "10px 16px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
};

const filterCardStyle = (isMobile: boolean): CSSProperties => ({
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: isMobile ? 12 : 20,
  marginBottom: 24,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
});

const filterRowStyle = (isMobile: boolean): CSSProperties => ({
  display: "flex",
  gap: 12,
  flexDirection: isMobile ? "column" : "row",
});

const selectStyle: CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 14,
  background: "#fff",
  cursor: "pointer",
};

const searchButtonStyle: CSSProperties = {
  padding: "10px 20px",
  background: "#fff",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
  color: "#334155",
};

const errorBoxStyle: CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#dc2626",
  borderRadius: 8,
  padding: "12px 16px",
  marginBottom: 16,
};

const loadingStyle: CSSProperties = {
  textAlign: "center",
  padding: 32,
  color: "#64748b",
};

const mobileListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const emptyStateStyle: CSSProperties = {
  textAlign: "center",
  color: "#94a3b8",
};

const mobileCardStyle: CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: 14,
  border: "1px solid #e2e8f0",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
};

const mobileTitleStyle: CSSProperties = {
  fontWeight: 600,
  fontSize: 15,
  marginBottom: 4,
  color: "#1e293b",
};

const mobileMetaStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  marginBottom: 6,
};

const mobileBadgesStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 12,
};

const fileSizeTextStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
};

const mobileActionsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
};

const tableContainerStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
};

const tableHeaderRowStyle: CSSProperties = {
  background: "#E6F1FB",
  color: "#0C447C",
};

const thStyle: CSSProperties = {
  padding: "14px 16px",
  textAlign: "left",
  fontWeight: 600,
  fontSize: 13,
  borderBottom: "1px solid #B5D4F4",
};

const tableRowStyle: CSSProperties = {
  borderBottom: "1px solid #f1f5f9",
  background: "white",
};

const tdStyle: CSSProperties = {
  padding: "12px 16px",
};

const idCellStyle: CSSProperties = {
  ...tdStyle,
  color: "#94a3b8",
  fontWeight: 600,
};

const fileNameCellStyle: CSSProperties = {
  ...tdStyle,
  fontWeight: 500,
  color: "#1e293b",
  maxWidth: 200,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const typeCellStyle: CSSProperties = {
  ...tdStyle,
  color: "#64748b",
  fontSize: 13,
};

const mutedCellStyle: CSSProperties = {
  ...tdStyle,
  color: "#64748b",
};

const dateCellStyle: CSSProperties = {
  ...tdStyle,
  color: "#64748b",
  fontSize: 13,
};

const emptyTableCellStyle: CSSProperties = {
  textAlign: "center",
  padding: 40,
  color: "#94a3b8",
};

const actionGroupStyle: CSSProperties = {
  display: "flex",
  gap: 8,
};

const detailButtonStyle: CSSProperties = {
  padding: "6px 12px",
  background: "#f1f5f9",
  color: "#334155",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
};

const deactivateButtonStyle: CSSProperties = {
  padding: "6px 12px",
  background: "#fef2f2",
  color: "#ef4444",
  border: "1px solid #fecaca",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
};

const statusBadgeStyle = (active: boolean): CSSProperties => ({
  padding: "4px 12px",
  background: active ? "#f0fdf4" : "#fef2f2",
  color: active ? "#16a34a" : "#dc2626",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 700,
});

const paginationStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 8,
  marginTop: 24,
};

const pageButtonStyle: CSSProperties = {
  padding: "8px 16px",
  background: "white",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  cursor: "pointer",
};

const pageIndicatorStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  fontSize: 14,
  fontWeight: 600,
  color: "#0f172a",
};