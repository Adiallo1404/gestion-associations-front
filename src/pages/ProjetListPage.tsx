import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { deleteProjet, getProjetsByFilters } from "../api/projetService";
import type { ProjetDto, StatutProjet } from "../types/projet";
import {
  STATUT_PROJET_LABELS,
  STATUT_PROJET_OPTIONS,
} from "../types/projet";

const getDeviseSign = (code?: string | null): string => {
  switch ((code || "EUR").toUpperCase()) {
    case "EUR":
      return "€";
    case "USD":
      return "$";
    case "XOF":
    case "XAF":
      return "FCFA";
    case "GNF":
      return "GNF";
    case "MAD":
      return "MAD";
    case "DZD":
      return "DZD";
    case "TND":
      return "TND";
    case "GBP":
      return "£";
    case "CHF":
      return "CHF";
    default:
      return code || "€";
  }
};

const getStatutStyle = (
  statut: StatutProjet
): { background: string; color: string } => {
  switch (statut) {
    case "EN_COURS":
      return { background: "#e6f4ea", color: "#137333" };
    case "TERMINE":
      return { background: "#e8f0fe", color: "#1a73e8" };
    case "EN_ATTENTE":
      return { background: "#fef3c7", color: "#b45309" };
    case "ANNULE":
      return { background: "#fee2e2", color: "#dc2626" };
    default:
      return { background: "#f3f4f6", color: "#6b7280" };
  }
};

interface PaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

function Pagination({
  page,
  totalPages,
  totalElements,
  size,
  onPageChange,
  onSizeChange,
}: PaginationProps) {
  const start = totalElements === 0 ? 0 : page * size + 1;
  const end = Math.min((page + 1) * size, totalElements);

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index);
    }

    const pages: (number | "...")[] = [];

    if (page <= 3) {
      for (let index = 0; index < 5; index += 1) pages.push(index);
      pages.push("...");
      pages.push(totalPages - 1);
    } else if (page >= totalPages - 4) {
      pages.push(0);
      pages.push("...");
      for (
        let index = Math.max(totalPages - 5, 1);
        index < totalPages;
        index += 1
      ) {
        pages.push(index);
      }
    } else {
      pages.push(0);
      pages.push("...");
      for (let index = page - 1; index <= page + 1; index += 1) {
        pages.push(index);
      }
      pages.push("...");
      pages.push(totalPages - 1);
    }

    return pages;
  };

  const canGoPrevious = page > 0;
  const canGoNext = totalPages > 0 && page < totalPages - 1;

  return (
    <div style={styles.pagination}>
      <span style={styles.paginationInfo}>
        {totalElements > 0
          ? `${start}–${end} sur ${totalElements} projet${
              totalElements > 1 ? "s" : ""
            }`
          : "0 projet"}
      </span>

      <div style={styles.paginationButtons}>
        <button
          type="button"
          style={canGoPrevious ? styles.pageButton : styles.pageButtonDisabled}
          disabled={!canGoPrevious}
          onClick={() => onPageChange(0)}
        >
          «
        </button>

        <button
          type="button"
          style={canGoPrevious ? styles.pageButton : styles.pageButtonDisabled}
          disabled={!canGoPrevious}
          onClick={() => onPageChange(page - 1)}
        >
          ‹
        </button>

        {getPageNumbers().map((pageItem, index) =>
          pageItem === "..." ? (
            <span key={`ellipsis-${index}`} style={styles.ellipsis}>
              …
            </span>
          ) : (
            <button
              key={pageItem}
              type="button"
              style={
                pageItem === page ? styles.pageButtonActive : styles.pageButton
              }
              onClick={() => onPageChange(pageItem)}
            >
              {pageItem + 1}
            </button>
          )
        )}

        <button
          type="button"
          style={canGoNext ? styles.pageButton : styles.pageButtonDisabled}
          disabled={!canGoNext}
          onClick={() => onPageChange(page + 1)}
        >
          ›
        </button>

        <button
          type="button"
          style={canGoNext ? styles.pageButton : styles.pageButtonDisabled}
          disabled={!canGoNext}
          onClick={() => onPageChange(totalPages - 1)}
        >
          »
        </button>
      </div>

      <select
        value={size}
        onChange={(event) => onSizeChange(Number(event.target.value))}
        style={styles.pageSizeSelect}
      >
        <option value={10}>10 / page</option>
        <option value={20}>20 / page</option>
        <option value={50}>50 / page</option>
      </select>
    </div>
  );
}

interface BreadcrumbItem {
  label: string;
  icon?: string;
  href?: string;
  active?: boolean;
}

function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const navigate = useNavigate();

  return (
    <nav style={styles.breadcrumb}>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} style={styles.breadcrumbItem}>
          {index > 0 && <span style={styles.breadcrumbSeparator}>/</span>}

          {item.active ? (
            <span style={styles.breadcrumbActive}>
              {item.icon && <span style={styles.breadcrumbIcon}>{item.icon}</span>}
              {item.label}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => item.href && navigate(item.href)}
              style={styles.breadcrumbButton}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </button>
          )}
        </span>
      ))}
    </nav>
  );
}

export default function ProjetListPage() {
  const navigate = useNavigate();

  const [projets, setProjets] = useState<ProjetDto[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [searchNom, setSearchNom] = useState("");
  const [submittedSearchNom, setSubmittedSearchNom] = useState("");
  const [selectStatut, setSelectStatut] = useState<StatutProjet | "">("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filter = useMemo(
    () => ({
      nom: submittedSearchNom.trim() || undefined,
      statut: selectStatut || undefined,
    }),
    [submittedSearchNom, selectStatut]
  );

  const fetchProjets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getProjetsByFilters(filter, page, size, "nom,asc");

      setProjets(data.content ?? []);
      setTotalElements(data.totalElements ?? 0);
      setTotalPages(data.totalPages ?? 0);
    } catch (loadError) {
      console.error("Failed to load projects", loadError);
      setError("Erreur lors du chargement des projets.");
    } finally {
      setIsLoading(false);
    }
  }, [filter, page, size]);

  useEffect(() => {
    fetchProjets();
  }, [fetchProjets]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(0);
    setSubmittedSearchNom(searchNom);
  };

  const handleStatusChange = (value: StatutProjet | "") => {
    setSelectStatut(value);
    setPage(0);
  };

  const handleDelete = async (
    projectId: number | undefined,
    event: MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();

    if (!projectId) return;

    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer ce projet ?"
    );

    if (!confirmed) return;

    try {
      await deleteProjet(projectId);
      await fetchProjets();
    } catch (deleteError) {
      console.error("Failed to delete project", deleteError);
      window.alert("Erreur lors de la suppression du projet.");
    }
  };

  const handleResetFilters = () => {
    setSearchNom("");
    setSubmittedSearchNom("");
    setSelectStatut("");
    setPage(0);
  };

  return (
    <div style={styles.page}>
      <Breadcrumb
        items={[
          { label: "Accueil", icon: "🏠", href: "/" },
          { label: "Projets", active: true },
        ]}
      />

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Vos projets</h1>
          <p style={styles.subtitle}>
            Suivi des projets, budgets, dépenses et partenaires.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/projets/new")}
          style={styles.createButton}
        >
          + Créer un projet
        </button>
      </div>

      <div style={styles.filters}>
        <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
          <span style={styles.searchIcon}>🔍</span>

          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={searchNom}
            onChange={(event) => setSearchNom(event.target.value)}
            style={styles.searchInput}
          />
        </form>

        <select
          value={selectStatut}
          onChange={(event) =>
            handleStatusChange(event.target.value as StatutProjet | "")
          }
          style={styles.statusSelect}
        >
          <option value="">Tous les statuts</option>

          {STATUT_PROJET_OPTIONS.map((statut) => (
            <option key={statut} value={statut}>
              {STATUT_PROJET_LABELS[statut]}
            </option>
          ))}
        </select>

        {(submittedSearchNom || selectStatut) && (
          <button
            type="button"
            onClick={handleResetFilters}
            style={styles.resetButton}
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div style={styles.card}>
        {isLoading ? (
          <div style={styles.stateBox}>Chargement des projets...</div>
        ) : error ? (
          <div style={{ ...styles.stateBox, color: "#dc2626" }}>{error}</div>
        ) : projets.length === 0 ? (
          <div style={styles.stateBox}>Aucun projet trouvé.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={styles.th}>Nom du projet</th>
                <th style={styles.th}>Association</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Budget</th>
                <th style={styles.th}>Dépenses</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {projets.map((projet) => {
                const deviseSign = getDeviseSign(projet.devise);
                const statutStyle = getStatutStyle(projet.statut);
                const budget = projet.budget ?? 0;
                const totalDepenses = projet.totalDepenses ?? 0;

                return (
                  <tr
                    key={projet.id}
                    onClick={() => projet.id && navigate(`/projets/${projet.id}`)}
                    style={styles.tableRow}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td style={styles.td}>
                      <div style={styles.projectName}>{projet.nom}</div>
                      {projet.chefDeProjetPrenom || projet.chefDeProjetNom ? (
                        <div style={styles.projectMeta}>
                          Chef : {projet.chefDeProjetPrenom ?? ""}{" "}
                          {projet.chefDeProjetNom ?? ""}
                        </div>
                      ) : (
                        <div style={styles.projectMeta}>Chef : —</div>
                      )}
                    </td>

                    <td style={styles.td}>
                      {projet.associationName || `Association #${projet.associationId}`}
                    </td>

                    <td style={styles.td}>
                      <span style={{ ...styles.statusBadge, ...statutStyle }}>
                        {STATUT_PROJET_LABELS[projet.statut]}
                      </span>
                    </td>

                    <td style={styles.td}>
                      {budget > 0
                        ? `${budget.toLocaleString("fr-FR")} ${deviseSign}`
                        : "—"}
                    </td>

                    <td style={{ ...styles.td, color: "#dc2626", fontWeight: 600 }}>
                      {`${totalDepenses.toLocaleString("fr-FR")} ${deviseSign}`}
                    </td>

                    <td
                      style={{ ...styles.td, textAlign: "right" }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => projet.id && navigate(`/projets/edit/${projet.id}`)}
                        style={styles.editButton}
                      >
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={(event) => handleDelete(projet.id, event)}
                        style={styles.deleteButton}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          size={size}
          onPageChange={setPage}
          onSizeChange={(nextSize) => {
            setSize(nextSize);
            setPage(0);
          }}
        />
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    padding: 24,
    background: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  breadcrumbItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  breadcrumbSeparator: {
    color: "#d1d5db",
    fontSize: 14,
  },
  breadcrumbIcon: {
    marginRight: 5,
  },
  breadcrumbActive: {
    padding: "5px 12px",
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
  },
  breadcrumbButton: {
    padding: "5px 12px",
    background: "transparent",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    color: "#6b7280",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 20,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: "#111827",
  },
  subtitle: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: 14,
  },
  createButton: {
    padding: "10px 16px",
    background: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  filters: {
    display: "flex",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
    flexWrap: "wrap",
  },
  searchForm: {
    position: "relative",
    width: 320,
    maxWidth: "100%",
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
  },
  searchInput: {
    width: "100%",
    padding: "10px 12px 10px 36px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  statusSelect: {
    padding: "10px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#fff",
    fontSize: 14,
    outline: "none",
    color: "#374151",
  },
  resetButton: {
    padding: "10px 14px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    background: "#fff",
    color: "#6b7280",
    cursor: "pointer",
    fontWeight: 500,
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05)",
  },
  stateBox: {
    padding: 48,
    textAlign: "center",
    color: "#6b7280",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  tableHeadRow: {
    borderBottom: "1px solid #edf2f7",
    background: "#fafafa",
  },
  th: {
    padding: "16px 24px",
    fontSize: 13,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  tableRow: {
    borderBottom: "1px solid #edf2f7",
    cursor: "pointer",
  },
  td: {
    padding: "16px 24px",
    fontSize: 14,
    color: "#4a5568",
    verticalAlign: "middle",
  },
  projectName: {
    fontWeight: 600,
    color: "#111827",
  },
  projectMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#9ca3af",
  },
  statusBadge: {
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  editButton: {
    background: "none",
    border: "none",
    color: "#3b82f6",
    cursor: "pointer",
    fontWeight: 500,
    marginRight: 16,
  },
  deleteButton: {
    background: "none",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    fontWeight: 500,
  },
  pagination: {
    padding: "14px 24px",
    borderTop: "1px solid #edf2f7",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
    flexWrap: "wrap",
    gap: 12,
  },
  paginationInfo: {
    fontSize: 14,
    color: "#6b7280",
  },
  paginationButtons: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  pageButton: {
    width: 36,
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
    color: "#374151",
    fontWeight: 500,
  },
  pageButtonDisabled: {
    width: 36,
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#fff",
    cursor: "not-allowed",
    fontSize: 14,
    color: "#374151",
    fontWeight: 500,
    opacity: 0.4,
  },
  pageButtonActive: {
    width: 36,
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #4f46e5",
    borderRadius: 8,
    background: "#4f46e5",
    cursor: "pointer",
    fontSize: 14,
    color: "#fff",
    fontWeight: 500,
  },
  ellipsis: {
    width: 36,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 14,
  },
  pageSizeSelect: {
    padding: "6px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    color: "#374151",
    background: "#fff",
    outline: "none",
    cursor: "pointer",
  },
};