import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate } from "react-router-dom";
import { memberHistoryService } from "../api/memberHistoryService";
import type {
  MemberHistoryDto,
  MemberHistoryFilter,
  StatutMembre,
} from "../types/memberHistory";
import {
  STATUT_MEMBRE_LABELS,
  STATUT_MEMBRE_OPTIONS,
} from "../types/memberHistory";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize";

const PAGE_SIZE = 10;

interface DeleteModalState {
  isOpen: boolean;
  id: number | null;
  label: string;
}

/**
 * Displays immutable member status history records with filtering,
 * pagination, detail navigation and deletion capabilities.
 */
export default function MemberHistoryListPage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();

  const [histories, setHistories] = useState<MemberHistoryDto[]>([]);
  const [filters, setFilters] = useState<MemberHistoryFilter>({});
  const [draftFilters, setDraftFilters] = useState<MemberHistoryFilter>({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<DeleteModalState>({
    isOpen: false,
    id: null,
    label: "",
  });

  const fetchHistories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await memberHistoryService.getMemberHistories({
        ...filters,
        page,
        size: PAGE_SIZE,
        sort: "dateChangement,desc",
      });

      setHistories(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
    } catch (fetchError) {
      console.error("Failed to load member histories", fetchError);
      setHistories([]);
      setTotalPages(0);
      setError("Erreur lors du chargement des historiques.");
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchHistories();
  }, [fetchHistories]);

  const updateDraftFilter = <K extends keyof MemberHistoryFilter>(
    key: K,
    value: MemberHistoryFilter[K] | undefined
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

  const handleDeleteClick = (id: number, label: string) => {
    setModal({
      isOpen: true,
      id,
      label,
    });
  };

  const handleConfirmDelete = async () => {
    if (modal.id === null) return;

    try {
      await memberHistoryService.deleteMemberHistory(modal.id);

      setModal({
        isOpen: false,
        id: null,
        label: "",
      });

      await fetchHistories();
    } catch (deleteError) {
      console.error("Failed to delete member history", deleteError);
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
    return date ? new Date(date).toLocaleString("fr-FR") : "—";
  };

  const getHistoryLabel = (history: MemberHistoryDto): string => {
    return history.motif?.trim()
      ? `"${history.motif}"`
      : `#${history.id}`;
  };

  const resultLabel = useMemo(() => {
    const count = histories.length;
    return `${count} élément${count > 1 ? "s" : ""}`;
  }, [histories.length]);

  return (
    <div style={pageStyle(isMobile)}>
      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer l'historique"
        message={`Êtes-vous sûr de vouloir supprimer l'historique ${modal.label} ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Breadcrumb navigation */}
      <button
        type="button"
        style={backButtonStyle}
        onClick={() => navigate("/")}
      >
        ← Tableau de bord
      </button>

      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle(isMobile)}>📋 Historique des membres</h1>

        <button
          type="button"
          style={createButtonStyle}
          onClick={() => navigate("/member-histories/new")}
        >
          {isMobile ? "➕" : "➕ Créer"}
        </button>
      </div>

      {/* Search filters */}
      <div style={toolbarStyle(isMobile)}>
        <input
          type="number"
          placeholder="Member ID"
          value={draftFilters.memberId ?? ""}
          onChange={(event) =>
            updateDraftFilter(
              "memberId",
              event.target.value ? Number(event.target.value) : undefined
            )
          }
          style={searchInputStyle}
        />

        {!isMobile && (
          <input
            type="number"
            placeholder="Association ID"
            value={draftFilters.associationId ?? ""}
            onChange={(event) =>
              updateDraftFilter(
                "associationId",
                event.target.value ? Number(event.target.value) : undefined
              )
            }
            style={searchInputStyle}
          />
        )}

        <select
          value={draftFilters.nouveauStatut ?? ""}
          onChange={(event) =>
            updateDraftFilter(
              "nouveauStatut",
              event.target.value
                ? (event.target.value as StatutMembre)
                : undefined
            )
          }
          style={searchInputStyle}
        >
          <option value="">Tous les statuts</option>

          {STATUT_MEMBRE_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {STATUT_MEMBRE_LABELS[status]}
            </option>
          ))}
        </select>

        {!isMobile && (
          <input
            type="number"
            placeholder="Modifié par ID"
            value={draftFilters.modifieParId ?? ""}
            onChange={(event) =>
              updateDraftFilter(
                "modifieParId",
                event.target.value ? Number(event.target.value) : undefined
              )
            }
            style={searchInputStyle}
          />
        )}

        <button type="button" style={searchButtonStyle} onClick={handleSearch}>
          🔍 Rechercher
        </button>

        <button type="button" style={resetButtonStyle} onClick={handleReset}>
          Réinitialiser
        </button>
      </div>

      <div style={countRowStyle}>
        <span style={countTextStyle}>{resultLabel}</span>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      {isLoading ? (
        <div style={loadingStyle}>Chargement...</div>
      ) : histories.length === 0 ? (
        <p style={emptyStateStyle}>Aucun historique trouvé.</p>
      ) : isMobile ? (
        <div style={mobileListStyle}>
          {histories.map((history) => (
            <div key={history.id} style={mobileCardStyle}>
              <div style={mobileCardHeaderStyle}>
                <span style={mutedTextStyle}>#{history.id}</span>
                <span style={mutedTextStyle}>
                  {formatDate(history.dateChangement)}
                </span>
              </div>

              <div style={transitionStyle}>
                <span style={oldStatusStyle}>
                  {history.ancienStatut
                    ? STATUT_MEMBRE_LABELS[history.ancienStatut]
                    : "Création"}
                </span>

                <span> → </span>

                <span style={newStatusStyle}>
                  {STATUT_MEMBRE_LABELS[history.nouveauStatut]}
                </span>
              </div>

              <div style={mobileMetaStyle}>
                Membre #{history.memberId} · Association #{history.associationId}
              </div>

              <div style={mobileMetaStyle}>
                Modifié par : {history.modifieParNom || "Système"}
              </div>

              {history.motif && (
                <div style={motifStyle}>💬 {history.motif}</div>
              )}

              <div style={mobileActionsStyle}>
                <button
                  type="button"
                  style={{ ...viewButtonStyle, flex: 1 }}
                  onClick={() => navigate(`/member-histories/${history.id}`)}
                >
                  👁️ Voir
                </button>

                <button
                  type="button"
                  style={{ ...deleteButtonStyle, flex: 1 }}
                  onClick={() =>
                    handleDeleteClick(history.id, getHistoryLabel(history))
                  }
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                {!isTablet && <th style={thStyle}>ID</th>}
                <th style={thStyle}>Ancien statut</th>
                <th style={thStyle}>Nouveau statut</th>
                <th style={thStyle}>Motif</th>
                {!isTablet && <th style={thStyle}>Date</th>}
                {!isTablet && <th style={thStyle}>Modifié par</th>}
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {histories.map((history) => (
                <tr key={history.id} style={tableRowStyle}>
                  {!isTablet && <td style={tdStyle}>{history.id}</td>}

                  <td style={tdStyle}>
                    {history.ancienStatut
                      ? STATUT_MEMBRE_LABELS[history.ancienStatut]
                      : "Création"}
                  </td>

                  <td style={tdStyle}>
                    <span style={newStatusStyle}>
                      {STATUT_MEMBRE_LABELS[history.nouveauStatut]}
                    </span>
                  </td>

                  <td style={tdStyle}>{history.motif || "—"}</td>

                  {!isTablet && (
                    <td style={mutedTdStyle}>
                      {formatDate(history.dateChangement)}
                    </td>
                  )}

                  {!isTablet && (
                    <td style={mutedTdStyle}>
                      {history.modifieParNom || "Système"}
                    </td>
                  )}

                  <td style={tdStyle}>
                    <div style={tableActionsStyle}>
                      <button
                        type="button"
                        style={viewButtonStyle}
                        onClick={() =>
                          navigate(`/member-histories/${history.id}`)
                        }
                      >
                        {isTablet ? "👁️" : "Voir"}
                      </button>

                      <button
                        type="button"
                        style={deleteButtonStyle}
                        onClick={() =>
                          handleDeleteClick(history.id, getHistoryLabel(history))
                        }
                      >
                        {isTablet ? "🗑️" : "Supprimer"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={paginationStyle}>
          <button
            type="button"
            style={pageButtonStyle}
            disabled={page === 0}
            onClick={() => setPage((currentPage) => currentPage - 1)}
          >
            ← Précédent
          </button>

          <span style={pageIndicatorStyle}>
            Page {page + 1} / {totalPages}
          </span>

          <button
            type="button"
            style={pageButtonStyle}
            disabled={page >= totalPages - 1}
            onClick={() => setPage((currentPage) => currentPage + 1)}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}

const pageStyle = (isMobile: boolean): CSSProperties => ({
  padding: isMobile ? "12px" : "20px",
  maxWidth: 1100,
  margin: "0 auto",
});

const backButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  marginBottom: 16,
  background: "none",
  border: "none",
  color: "#6b7280",
  cursor: "pointer",
  fontSize: 14,
  padding: 0,
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
  gap: 16,
};

const titleStyle = (isMobile: boolean): CSSProperties => ({
  fontSize: isMobile ? 16 : 24,
  fontWeight: "bold",
  margin: 0,
});

const createButtonStyle: CSSProperties = {
  padding: "8px 16px",
  background: "#10b981",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
};

const toolbarStyle = (isMobile: boolean): CSSProperties => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
  gap: 10,
  flexDirection: isMobile ? "column" : "row",
});

const searchInputStyle: CSSProperties = {
  padding: 8,
  border: "1px solid #ccc",
  borderRadius: 6,
  fontSize: 14,
  flex: 1,
  width: "100%",
};

const searchButtonStyle: CSSProperties = {
  padding: "8px 14px",
  background: "#f1f5f9",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 500,
};

const resetButtonStyle: CSSProperties = {
  padding: "8px 14px",
  background: "#fff",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 500,
  color: "#64748b",
};

const countRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: 12,
};

const countTextStyle: CSSProperties = {
  color: "#6b7280",
  fontSize: 14,
  whiteSpace: "nowrap",
};

const errorStyle: CSSProperties = {
  textAlign: "center",
  marginTop: 20,
  color: "#A32D2D",
};

const loadingStyle: CSSProperties = {
  textAlign: "center",
  marginTop: 20,
};

const emptyStateStyle: CSSProperties = {
  textAlign: "center",
  marginTop: 20,
};

const mobileListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const mobileCardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 14,
};

const mobileCardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 6,
};

const mutedTextStyle: CSSProperties = {
  fontSize: 12,
  color: "#9ca3af",
};

const transitionStyle: CSSProperties = {
  fontSize: 13,
  marginBottom: 4,
};

const oldStatusStyle: CSSProperties = {
  color: "#6b7280",
};

const newStatusStyle: CSSProperties = {
  fontWeight: 600,
  color: "#10b981",
};

const mobileMetaStyle: CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  marginBottom: 4,
};

const motifStyle: CSSProperties = {
  fontSize: 13,
  color: "#374151",
  marginBottom: 10,
};

const mobileActionsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 10,
};

const tableContainerStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 10,
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const tableHeaderRowStyle: CSSProperties = {
  background: "#f9fafb",
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: 10,
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
  fontSize: 13,
};

const tableRowStyle: CSSProperties = {
  borderBottom: "1px solid #f3f4f6",
};

const tdStyle: CSSProperties = {
  padding: 10,
};

const mutedTdStyle: CSSProperties = {
  padding: 10,
  color: "#6b7280",
};

const tableActionsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
};

const viewButtonStyle: CSSProperties = {
  padding: "6px 10px",
  background: "#3b82f6",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const deleteButtonStyle: CSSProperties = {
  padding: "6px 10px",
  background: "#ef4444",
  color: "#fff",
  border: "none",
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
  background: "#fff",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 500,
};

const pageIndicatorStyle: CSSProperties = {
  fontWeight: 600,
  color: "#374151",
};