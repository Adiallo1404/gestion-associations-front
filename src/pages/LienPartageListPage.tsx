import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate } from "react-router-dom";
import { lienPartageService } from "../api/lienPartageService";
import type {
  LienPartageDto,
  LienPartageFilter,
} from "../types/lienPartage";
import { useWindowSize } from "../hooks/useWindowSize";

const PAGE_SIZE = 10;

export default function LienPartageListPage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();

  const [liens, setLiens] = useState<LienPartageDto[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);

  const [filters, setFilters] = useState<LienPartageFilter>({});
  const [filterDocumentId, setFilterDocumentId] = useState("");
  const [filterCreeParId, setFilterCreeParId] = useState("");
  const [filterActif, setFilterActif] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiens = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await lienPartageService.getLiensByFilters(
        filters,
        page,
        PAGE_SIZE,
        "id,desc"
      );

      setLiens(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
    } catch (fetchError) {
      console.error("Failed to load shared links", fetchError);
      setLiens([]);
      setTotalPages(0);
      setError("Erreur lors du chargement des liens de partage.");
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchLiens();
  }, [fetchLiens]);

  const handleSearch = () => {
    const nextFilters: LienPartageFilter = {};

    if (filterDocumentId) {
      nextFilters.documentId = Number(filterDocumentId);
    }

    if (filterCreeParId) {
      nextFilters.creeParId = Number(filterCreeParId);
    }

    if (filterActif !== "") {
      nextFilters.actif = filterActif === "true";
    }

    setPage(0);
    setFilters(nextFilters);
  };

  const handleReset = () => {
    setFilterDocumentId("");
    setFilterCreeParId("");
    setFilterActif("");
    setPage(0);
    setFilters({});
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Supprimer ce lien de partage ?");
    if (!confirmed) return;

    try {
      await lienPartageService.deleteLien(id);
      await fetchLiens();
    } catch (deleteError) {
      console.error("Failed to delete shared link", deleteError);
      setError("Erreur lors de la suppression.");
    }
  };

  const isLienValid = (lien: LienPartageDto): boolean => {
    const notExpired = new Date() < new Date(lien.dateExpiration);
    const hasRemainingAccess =
      lien.nombreAccesMax == null ||
      lien.nombreAccesActuel < lien.nombreAccesMax;

    return lien.actif && notExpired && hasRemainingAccess;
  };

  const formatDate = (value?: string | null): string => {
    return value ? new Date(value).toLocaleString("fr-FR") : "—";
  };

  const formatToken = (token: string, maxLength: number): string => {
    return token.length > maxLength
      ? `${token.substring(0, maxLength)}…`
      : token;
  };

  const handlePreviousPage = () => {
    setPage((currentPage) => Math.max(currentPage - 1, 0));
  };

  const handleNextPage = () => {
    setPage((currentPage) =>
      totalPages > 0 ? Math.min(currentPage + 1, totalPages - 1) : currentPage
    );
  };

  return (
    <div style={pageStyle(isMobile)}>
      <nav style={breadcrumbStyle}>
        <span style={breadcrumbHomeStyle} onClick={() => navigate("/")}>
          <span style={{ fontSize: 16 }}>🏠</span> Accueil
        </span>

        <span style={breadcrumbSeparatorStyle}>›</span>

        <span style={breadcrumbCurrentStyle}>🔗 Liens de partage</span>
      </nav>

      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle(isMobile)}>🔗 Liens de partage</h2>

          {!isMobile && (
            <p style={subtitleStyle}>
              Gérez les accès externes à vos documents
            </p>
          )}
        </div>

        <button
          type="button"
          style={primaryButtonStyle}
          onClick={() => navigate("/liens-partage/new")}
        >
          {isMobile ? "➕" : "+ Nouveau lien"}
        </button>
      </div>

      <div style={filterContainerStyle(isMobile)}>
        {!isMobile && (
          <div style={filterGroupStyle}>
            <span style={labelStyle}>Document ID</span>

            <input
              style={inputStyle}
              type="number"
              placeholder="Ex : 1"
              value={filterDocumentId}
              onChange={(event) => setFilterDocumentId(event.target.value)}
            />
          </div>
        )}

        {!isMobile && (
          <div style={filterGroupStyle}>
            <span style={labelStyle}>Créé par</span>

            <input
              style={inputStyle}
              type="number"
              placeholder="User ID"
              value={filterCreeParId}
              onChange={(event) => setFilterCreeParId(event.target.value)}
            />
          </div>
        )}

        <div style={filterGroupStyle}>
          <span style={labelStyle}>Statut</span>

          <select
            style={selectStyle}
            value={filterActif}
            onChange={(event) => setFilterActif(event.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
        </div>

        <div style={filterActionsStyle}>
          <button type="button" style={searchButtonStyle} onClick={handleSearch}>
            {isMobile ? "🔍" : "Rechercher"}
          </button>

          <button type="button" style={outlineButtonStyle} onClick={handleReset}>
            {isMobile ? "↺" : "Réinitialiser"}
          </button>
        </div>
      </div>

      {error && <div style={errorBannerStyle}>{error}</div>}

      {isLoading ? (
        <div style={loadingStyle}>Chargement...</div>
      ) : isMobile ? (
        <div style={mobileListStyle}>
          {liens.length === 0 ? (
            <p style={emptyStateStyle}>Aucun lien trouvé.</p>
          ) : (
            liens.map((lien) => {
              const valid = isLienValid(lien);

              return (
                <div key={lien.id} style={mobileCardStyle}>
                  <div style={mobileCardHeaderStyle}>
                    <code style={tokenBadgeStyle}>
                      {formatToken(lien.token, 20)}
                    </code>

                    <div style={mobileBadgesStyle}>
                      <span style={lien.actif ? activeBadgeStyle : inactiveBadgeStyle}>
                        {lien.actif ? "Actif" : "Inactif"}
                      </span>

                      <span style={valid ? validBadgeStyle : invalidBadgeStyle}>
                        {valid ? "Valide" : "Expiré"}
                      </span>
                    </div>
                  </div>

                  <div style={mobileMetaStyle}>
                    📅 Exp : {formatDate(lien.dateExpiration)}
                  </div>

                  <div style={mobileMetaStyle}>
                    👁 {lien.nombreAccesActuel} / {lien.nombreAccesMax} · Doc #
                    {lien.documentId}
                  </div>

                  <div style={mobileActionsStyle}>
                    <button
                      type="button"
                      style={{ ...infoButtonStyle, flex: 1 }}
                      onClick={() => navigate(`/liens-partage/${lien.id}`)}
                    >
                      👁️ Détail
                    </button>

                    <button
                      type="button"
                      style={{ ...dangerButtonStyle, flex: 1 }}
                      onClick={() => handleDelete(lien.id)}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead style={tableHeadStyle}>
              <tr>
                {!isTablet && <th style={thStyle}>ID</th>}
                <th style={thStyle}>Token</th>
                {!isTablet && <th style={thStyle}>Expiration</th>}
                <th style={thStyle}>Accès</th>
                <th style={thStyle}>Statut</th>
                <th style={thStyle}>Validité</th>
                {!isTablet && <th style={thStyle}>Doc. ID</th>}
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {liens.length === 0 ? (
                <tr>
                  <td
                    colSpan={isTablet ? 5 : 8}
                    style={emptyTableCellStyle}
                  >
                    Aucun lien trouvé.
                  </td>
                </tr>
              ) : (
                liens.map((lien) => {
                  const valid = isLienValid(lien);

                  return (
                    <tr key={lien.id} style={tableRowStyle}>
                      {!isTablet && <td style={mutedCellStyle}>#{lien.id}</td>}

                      <td style={tdStyle}>
                        <code style={tokenBadgeTableStyle}>
                          {formatToken(lien.token, 24)}
                        </code>
                      </td>

                      {!isTablet && (
                        <td style={mutedCellStyle}>
                          {formatDate(lien.dateExpiration)}
                        </td>
                      )}

                      <td style={tdStyle}>
                        {lien.nombreAccesActuel} / {lien.nombreAccesMax}
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={lien.actif ? activeBadgeStyle : inactiveBadgeStyle}
                        >
                          {lien.actif ? "Actif" : "Inactif"}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <span style={valid ? validBadgeStyle : invalidBadgeStyle}>
                          {valid ? "Valide" : "Expiré"}
                        </span>
                      </td>

                      {!isTablet && (
                        <td style={mutedCellStyle}>#{lien.documentId}</td>
                      )}

                      <td style={tdStyle}>
                        <div style={tableActionsStyle}>
                          <button
                            type="button"
                            style={infoButtonStyle}
                            onClick={() => navigate(`/liens-partage/${lien.id}`)}
                          >
                            {isTablet ? "👁️" : "Détail"}
                          </button>

                          <button
                            type="button"
                            style={dangerButtonStyle}
                            onClick={() => handleDelete(lien.id)}
                          >
                            {isTablet ? "🗑️" : "Supprimer"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={paginationStyle}>
          <button
            type="button"
            style={pageButtonStyle}
            disabled={page === 0}
            onClick={handlePreviousPage}
          >
            ‹
          </button>

          <span style={pageIndicatorStyle}>
            Page {page + 1} / {totalPages}
          </span>

          <button
            type="button"
            style={pageButtonStyle}
            disabled={page >= totalPages - 1}
            onClick={handleNextPage}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

const pageStyle = (isMobile: boolean): CSSProperties => ({
  padding: isMobile ? "12px" : "12px 40px",
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
  background: "#f1f5f9",
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid #e2e8f0",
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
  alignItems: "center",
  marginBottom: 24,
  marginTop: 10,
};

const titleStyle = (isMobile: boolean): CSSProperties => ({
  fontSize: isMobile ? 18 : 32,
  fontWeight: 700,
  margin: 0,
  color: "#0f172a",
});

const subtitleStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#64748b",
  fontSize: 14,
};

const filterContainerStyle = (isMobile: boolean): CSSProperties => ({
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: isMobile ? 12 : 20,
  marginBottom: 24,
  display: "flex",
  gap: 12,
  flexDirection: isMobile ? "column" : "row",
  flexWrap: "wrap",
  alignItems: "flex-end",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
});

const filterGroupStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  flex: 1,
  minWidth: 160,
};

const labelStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 600,
  textTransform: "uppercase",
};

const inputStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  background: "#fff",
  outline: "none",
};

const selectStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  background: "#fff",
  outline: "none",
  cursor: "pointer",
};

const filterActionsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
};

const primaryButtonStyle: CSSProperties = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 18px",
  fontSize: 14,
  cursor: "pointer",
  fontWeight: 600,
};

const searchButtonStyle: CSSProperties = {
  background: "#0f172a",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 20px",
  fontSize: 14,
  cursor: "pointer",
  fontWeight: 500,
};

const outlineButtonStyle: CSSProperties = {
  background: "#fff",
  color: "#64748b",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "10px 20px",
  fontSize: 14,
  cursor: "pointer",
};

const errorBannerStyle: CSSProperties = {
  border: "1px solid #fca5a5",
  background: "#fef2f2",
  color: "#dc2626",
  borderRadius: 8,
  padding: "12px 16px",
  fontSize: 14,
  marginBottom: 16,
};

const loadingStyle: CSSProperties = {
  textAlign: "center",
  padding: 40,
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
  padding: 40,
};

const mobileCardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 14,
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
};

const mobileCardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
  gap: 8,
};

const mobileBadgesStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const mobileMetaStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  marginBottom: 8,
};

const mobileActionsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
};

const tableWrapperStyle: CSSProperties = {
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

const tableHeadStyle: CSSProperties = {
  background: "#F1F5F9",
};

const tableRowStyle: CSSProperties = {
  borderBottom: "1px solid #f1f5f9",
};

const thStyle: CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontWeight: 600,
  fontSize: 12,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle: CSSProperties = {
  padding: "14px 16px",
  color: "#1e293b",
  verticalAlign: "middle",
};

const mutedCellStyle: CSSProperties = {
  padding: "14px 16px",
  color: "#64748b",
  verticalAlign: "middle",
};

const emptyTableCellStyle: CSSProperties = {
  padding: 40,
  textAlign: "center",
  color: "#94a3b8",
};

const tokenBadgeStyle: CSSProperties = {
  fontSize: 12,
  color: "#475569",
  background: "#f1f5f9",
  padding: "2px 6px",
  borderRadius: 4,
};

const tokenBadgeTableStyle: CSSProperties = {
  fontSize: 13,
  background: "#f8fafc",
  padding: "2px 4px",
  borderRadius: 4,
  color: "#334155",
};

const activeBadgeStyle: CSSProperties = {
  background: "#f0fdf4",
  color: "#16a34a",
  border: "1px solid #bbf7d0",
  borderRadius: 20,
  padding: "2px 10px",
  fontSize: 12,
  fontWeight: 700,
};

const inactiveBadgeStyle: CSSProperties = {
  background: "#f8fafc",
  color: "#64748b",
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  padding: "2px 10px",
  fontSize: 12,
  fontWeight: 700,
};

const validBadgeStyle: CSSProperties = {
  background: "#eff6ff",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
  borderRadius: 20,
  padding: "2px 10px",
  fontSize: 12,
  fontWeight: 700,
};

const invalidBadgeStyle: CSSProperties = {
  background: "#fff7ed",
  color: "#c2410c",
  border: "1px solid #fed7aa",
  borderRadius: 20,
  padding: "2px 10px",
  fontSize: 12,
  fontWeight: 700,
};

const tableActionsStyle: CSSProperties = {
  display: "flex",
  gap: 6,
};

const infoButtonStyle: CSSProperties = {
  background: "#f1f5f9",
  color: "#334155",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  padding: "6px 12px",
  fontSize: 13,
  cursor: "pointer",
  fontWeight: 500,
};

const dangerButtonStyle: CSSProperties = {
  background: "#fef2f2",
  color: "#ef4444",
  border: "1px solid #fecaca",
  borderRadius: 6,
  padding: "6px 12px",
  fontSize: 13,
  cursor: "pointer",
  fontWeight: 500,
};

const paginationStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "center",
  marginTop: 24,
  paddingBottom: 20,
};

const pageButtonStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  background: "#fff",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 14,
  cursor: "pointer",
  fontWeight: 600,
};

const pageIndicatorStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  fontSize: 14,
  fontWeight: 600,
  color: "#0f172a",
};