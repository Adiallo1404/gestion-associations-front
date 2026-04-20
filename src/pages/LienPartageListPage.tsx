import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLiensByFilters, deleteLien } from "../api/lienPartageService";
import type { LienPartage, LienPartageFilters } from "../types/lienPartage";

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "32px 40px",
    textAlign: "left",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 500,
    color: "var(--text-h)",
    margin: 0,
  },
  btnPrimary: {
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 18px",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "var(--sans)",
  },
  btnOutline: {
    background: "transparent",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "8px 18px",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "var(--sans)",
  },
  btnDanger: {
    background: "transparent",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    padding: "4px 12px",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "var(--sans)",
  },
  btnInfo: {
    background: "var(--accent-bg)",
    color: "var(--accent)",
    border: "1px solid var(--accent-border)",
    borderRadius: "6px",
    padding: "4px 12px",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "var(--sans)",
  },
  filterCard: {
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "16px 20px",
    marginBottom: "24px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap" as const,
    alignItems: "flex-end",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    flex: 1,
    minWidth: "140px",
  },
  label: {
    fontSize: "12px",
    color: "var(--text)",
    fontWeight: 500,
  },
  input: {
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "7px 12px",
    fontSize: "14px",
    color: "var(--text-h)",
    background: "var(--bg)",
    fontFamily: "var(--sans)",
    outline: "none",
  },
  select: {
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "7px 12px",
    fontSize: "14px",
    color: "var(--text-h)",
    background: "var(--bg)",
    fontFamily: "var(--sans)",
    outline: "none",
    cursor: "pointer",
  },
  filterActions: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
  },
  alert: {
    border: "1px solid #fca5a5",
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: "8px",
    padding: "10px 16px",
    fontSize: "14px",
    marginBottom: "16px",
  },
  tableWrapper: {
    border: "1px solid var(--border)",
    borderRadius: "12px",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "14px",
  },
  thead: {
    background: "var(--code-bg)",
  },
  th: {
    padding: "10px 16px",
    textAlign: "left" as const,
    fontWeight: 600,
    fontSize: "12px",
    color: "var(--text)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    borderBottom: "1px solid var(--border)",
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid var(--border)",
    color: "var(--text-h)",
    verticalAlign: "middle" as const,
  },
  tdMuted: {
    padding: "12px 16px",
    borderBottom: "1px solid var(--border)",
    color: "var(--text)",
    verticalAlign: "middle" as const,
  },
  badgeSuccess: {
    background: "rgba(34,197,94,0.12)",
    color: "#16a34a",
    border: "1px solid rgba(34,197,94,0.3)",
    borderRadius: "20px",
    padding: "2px 10px",
    fontSize: "12px",
    fontWeight: 500,
  },
  badgeSecondary: {
    background: "var(--code-bg)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    padding: "2px 10px",
    fontSize: "12px",
    fontWeight: 500,
  },
  actions: {
    display: "flex",
    gap: "6px",
  },
  emptyRow: {
    padding: "40px",
    textAlign: "center" as const,
    color: "var(--text)",
    fontSize: "14px",
  },
  pagination: {
    display: "flex",
    gap: "4px",
    justifyContent: "center",
    marginTop: "20px",
  },
  pageBtn: (active: boolean): React.CSSProperties => ({
    border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
    background: active ? "var(--accent-bg)" : "transparent",
    color: active ? "var(--accent)" : "var(--text)",
    borderRadius: "6px",
    padding: "5px 12px",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "var(--sans)",
  }),
  loading: {
    textAlign: "center" as const,
    padding: "40px",
    color: "var(--text)",
    fontSize: "14px",
  },
};

const LienPartageListPage: React.FC = () => {
  const navigate = useNavigate();

  const [liens, setLiens] = useState<LienPartage[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const [filters, setFilters] = useState<LienPartageFilters>({});
  const [filterDocumentId, setFilterDocumentId] = useState("");
  const [filterCreeParId, setFilterCreeParId] = useState("");
  const [filterActif, setFilterActif] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiens = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLiensByFilters(filters, page, size);
      setLiens(Array.isArray(data.content) ? data.content : []);
      setTotalPages(data.totalPages);
    } catch {
      setError("Erreur lors du chargement des liens de partage.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const handleSearch = () => {
    const newFilters: LienPartageFilters = {};
    if (filterDocumentId) newFilters.documentId = Number(filterDocumentId);
    if (filterCreeParId) newFilters.creeParId = Number(filterCreeParId);
    if (filterActif !== "") newFilters.actif = filterActif === "true";
    setPage(0);
    setFilters(newFilters);
  };

  const handleReset = () => {
    setFilterDocumentId("");
    setFilterCreeParId("");
    setFilterActif("");
    setPage(0);
    setFilters({});
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer ce lien de partage ?")) return;
    try {
      await deleteLien(id);
      fetchLiens();
    } catch {
      setError("Erreur lors de la suppression.");
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Liens de partage</h2>
        <button style={styles.btnPrimary} onClick={() => navigate("/liens-partage/new")}>
          + Nouveau lien
        </button>
      </div>

      {/* Filtres */}
      <div style={styles.filterCard}>
        <div style={styles.filterGroup}>
          <span style={styles.label}>Document ID</span>
          <input
            style={styles.input}
            type="number"
            placeholder="Ex : 1"
            value={filterDocumentId}
            onChange={(e) => setFilterDocumentId(e.target.value)}
          />
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.label}>Créé par (User ID)</span>
          <input
            style={styles.input}
            type="number"
            placeholder="Ex : 3"
            value={filterCreeParId}
            onChange={(e) => setFilterCreeParId(e.target.value)}
          />
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.label}>Statut</span>
          <select
            style={styles.select}
            value={filterActif}
            onChange={(e) => setFilterActif(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
        </div>
        <div style={styles.filterActions}>
          <button style={styles.btnPrimary} onClick={handleSearch}>Rechercher</button>
          <button style={styles.btnOutline} onClick={handleReset}>Réinitialiser</button>
        </div>
      </div>

      {/* Erreur */}
      {error && <div style={styles.alert}>{error}</div>}

      {/* Tableau */}
      <div style={styles.tableWrapper}>
        {loading ? (
          <div style={styles.loading}>Chargement...</div>
        ) : (
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Token</th>
                <th style={styles.th}>Expiration</th>
                <th style={styles.th}>Accès</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Doc. ID</th>
                <th style={styles.th}>Créé par</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {liens.length === 0 ? (
                <tr>
                  <td colSpan={8} style={styles.emptyRow}>
                    Aucun lien de partage trouvé.
                  </td>
                </tr>
              ) : (
                liens.map((lien) => (
                  <tr key={lien.id}>
                    <td style={styles.tdMuted}>{lien.id}</td>
                    <td style={styles.td}>
                      <code style={{ fontSize: "13px" }}>
                        {lien.token && lien.token.length > 24
                          ? lien.token.substring(0, 24) + "…"
                          : lien.token}
                      </code>
                    </td>
                    <td style={styles.tdMuted}>
                      {lien.dateExpiration
                        ? new Date(lien.dateExpiration).toLocaleString("fr-FR")
                        : "-"}
                    </td>
                    <td style={styles.td}>
                      {lien.nombreAccesActuel ?? 0} / {lien.nombreAccesMax ?? "∞"}
                    </td>
                    <td style={styles.td}>
                      <span style={lien.actif ? styles.badgeSuccess : styles.badgeSecondary}>
                        {lien.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td style={styles.tdMuted}>{lien.documentId}</td>
                    <td style={styles.tdMuted}>{lien.creeParId ?? "-"}</td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button
                          style={styles.btnInfo}
                          onClick={() => navigate(`/liens-partage/${lien.id}`)}
                        >
                          Détail
                        </button>
                        <button
                          style={styles.btnDanger}
                          onClick={() => handleDelete(lien.id!)}
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
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={styles.pageBtn(false)}
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              style={styles.pageBtn(page === i)}
              onClick={() => setPage(i)}
            >
              {i + 1}
            </button>
          ))}
          <button
            style={styles.pageBtn(false)}
            disabled={page === totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};

export default LienPartageListPage;