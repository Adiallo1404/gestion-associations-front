import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLiensByFilters, deleteLien } from "../api/lienPartageService";
import type { LienPartage, LienPartageFilters } from "../types/lienPartage";
import { useWindowSize } from "../hooks/useWindowSize";

const LienPartageListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();

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

  useEffect(() => { fetchLiens(); }, [filters, page]);

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
    <div style={{ padding: isMobile ? "12px" : "12px 40px", background: "#f8fafc", minHeight: "100vh" }}>

      {/* BREADCRUMB */}
      <nav style={breadcrumbStyle}>
        <span style={breadcrumbHome} onClick={() => navigate("/")}>
          <span style={{ fontSize: 16 }}>🏠</span> Accueil
        </span>
        <span style={breadcrumbSeparator}>›</span>
        <span style={breadcrumbCurrent}>🔗 Liens de partage</span>
      </nav>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, marginTop: 10 }}>
        <div>
          <h2 style={{ fontSize: isMobile ? 18 : 32, fontWeight: 700, margin: 0, color: "#0f172a" }}>
            🔗 Liens de partage
          </h2>
          {!isMobile && <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Gérez les accès externes à vos documents</p>}
        </div>
        <button style={btnPrimary} onClick={() => navigate("/liens-partage/new")}>
          {isMobile ? "➕" : "+ Nouveau lien"}
        </button>
      </div>

      {/* FILTRES */}
      <div style={filterContainer(isMobile)}>
        {!isMobile && (
          <div style={filterGroup}>
            <span style={labelStyle}>Document ID</span>
            <input
              style={inputStyle} type="number" placeholder="Ex : 1"
              value={filterDocumentId}
              onChange={(e) => setFilterDocumentId(e.target.value)}
            />
          </div>
        )}
        {!isMobile && (
          <div style={filterGroup}>
            <span style={labelStyle}>Créé par (User ID)</span>
            <input
              style={inputStyle} type="number" placeholder="Ex : 3"
              value={filterCreeParId}
              onChange={(e) => setFilterCreeParId(e.target.value)}
            />
          </div>
        )}
        <div style={filterGroup}>
          <span style={labelStyle}>Statut</span>
          <select style={selectStyle} value={filterActif} onChange={(e) => setFilterActif(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btnSearch} onClick={handleSearch}>
            {isMobile ? "🔍" : "Rechercher"}
          </button>
          <button style={btnOutline} onClick={handleReset}>
            {isMobile ? "↺" : "Réinitialiser"}
          </button>
        </div>
      </div>

      {error && <div style={errorBanner}>{error}</div>}

      {/* CONTENU */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Chargement...</div>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {liens.length === 0 ? (
            <p style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>Aucun lien trouvé.</p>
          ) : liens.map((lien) => (
            <div key={lien.id} style={mobileCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <code style={tokenBadge}>
                  {lien.token && lien.token.length > 20 ? lien.token.substring(0, 20) + "…" : lien.token}
                </code>
                <span style={lien.actif ? badgeSuccess : badgeSecondary}>
                  {lien.actif ? "Actif" : "Inactif"}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                📅 Exp : {lien.dateExpiration ? new Date(lien.dateExpiration).toLocaleDateString("fr-FR") : "Jamais"}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
                👁 {lien.nombreAccesActuel ?? 0} / {lien.nombreAccesMax ?? "∞"} · Doc #{lien.documentId}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...btnInfo, flex: 1 }} onClick={() => navigate(`/liens-partage/${lien.id}`)}>👁️ Détail</button>
                <button style={{ ...btnDanger, flex: 1 }} onClick={() => handleDelete(lien.id!)}>🗑️ Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={tableWrapper}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead style={{ background: "#F1F5F9" }}>
              <tr>
                {!isTablet && <th style={th}>ID</th>}
                <th style={th}>Token</th>
                {!isTablet && <th style={th}>Expiration</th>}
                <th style={th}>Accès</th>
                <th style={th}>Statut</th>
                {!isTablet && <th style={th}>Doc. ID</th>}
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {liens.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Aucun lien trouvé.</td>
                </tr>
              ) : liens.map((lien) => (
                <tr key={lien.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {!isTablet && <td style={tdMuted}>#{lien.id}</td>}
                  <td style={td}>
                    <code style={tokenBadgeTable}>
                      {lien.token && lien.token.length > 24 ? lien.token.substring(0, 24) + "…" : lien.token}
                    </code>
                  </td>
                  {!isTablet && (
                    <td style={tdMuted}>
                      {lien.dateExpiration ? new Date(lien.dateExpiration).toLocaleString("fr-FR") : "∞"}
                    </td>
                  )}
                  <td style={td}>{lien.nombreAccesActuel ?? 0} / {lien.nombreAccesMax ?? "∞"}</td>
                  <td style={td}>
                    <span style={lien.actif ? badgeSuccess : badgeSecondary}>
                      {lien.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  {!isTablet && <td style={tdMuted}>#{lien.documentId}</td>}
                  <td style={td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={btnInfo} onClick={() => navigate(`/liens-partage/${lien.id}`)}>
                        {isTablet ? "👁️" : "Détail"}
                      </button>
                      <button style={btnDanger} onClick={() => handleDelete(lien.id!)}>
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

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 24, paddingBottom: 20 }}>
          <button style={pageBtnStyle} disabled={page === 0} onClick={() => setPage(page - 1)}>‹</button>
          <span style={{ display: "flex", alignItems: "center", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
            Page {page + 1}
          </span>
          <button style={pageBtnStyle} disabled={page === totalPages - 1} onClick={() => setPage(page + 1)}>›</button>
        </div>
      )}
    </div>
  );
};

// ── Styles Breadcrumb ─────────────────────────────────────────────────────────
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
  background: "#f1f5f9",
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid #e2e8f0",
};

const breadcrumbSeparator: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 16,
};

const breadcrumbCurrent: React.CSSProperties = {
  color: "#0f172a",
  fontWeight: 600,
};

// ── Autres Styles ─────────────────────────────────────────────────────────────
const filterContainer = (isMobile: boolean): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
  padding: isMobile ? 12 : "20px", marginBottom: 24,
  display: "flex", gap: 12, flexDirection: isMobile ? "column" : "row",
  flexWrap: "wrap", alignItems: "flex-end", boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
});

const btnPrimary    = { background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 14, cursor: "pointer", fontWeight: 600 } as React.CSSProperties;
const btnSearch     = { background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 500 } as React.CSSProperties;
const btnOutline    = { background: "#fff", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 20px", fontSize: 14, cursor: "pointer" } as React.CSSProperties;
const btnInfo       = { background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer", fontWeight: 500 } as React.CSSProperties;
const btnDanger     = { background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer", fontWeight: 500 } as React.CSSProperties;
const filterGroup   = { display: "flex", flexDirection: "column" as const, gap: 4, flex: 1, minWidth: 160 };
const labelStyle    = { fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase" as const } as React.CSSProperties;
const inputStyle    = { border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", fontSize: 14, background: "#fff", outline: "none" } as React.CSSProperties;
const selectStyle   = { border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", fontSize: 14, background: "#fff", outline: "none", cursor: "pointer" } as React.CSSProperties;
const th            = { padding: "12px 16px", textAlign: "left" as const, fontWeight: 600, fontSize: 12, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.05em" };
const td            = { padding: "14px 16px", color: "#1e293b", verticalAlign: "middle" as const } as React.CSSProperties;
const tdMuted       = { padding: "14px 16px", color: "#64748b", verticalAlign: "middle" as const } as React.CSSProperties;
const badgeSuccess  = { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 } as React.CSSProperties;
const badgeSecondary = { background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 } as React.CSSProperties;
const tokenBadge      = { fontSize: 12, color: "#475569", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 };
const tokenBadgeTable = { fontSize: 13, background: "#f8fafc", padding: "2px 4px", borderRadius: 4, color: "#334155" };
const mobileCard    = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };
const tableWrapper  = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" };
const errorBanner   = { border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", borderRadius: 8, padding: "12px 16px", fontSize: 14, marginBottom: 16 };
const pageBtnStyle: React.CSSProperties = { border: "1px solid #cbd5e1", background: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 14, cursor: "pointer", fontWeight: 600 };

export default LienPartageListPage;