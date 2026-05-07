import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLiensByFilters, deleteLien } from "../api/lienPartageService";
import type { LienPartage, LienPartageFilters } from "../types/lienPartage";
import { useWindowSize } from "../hooks/useWindowSize"; // ✅

const LienPartageListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize(); // ✅

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
    <div style={{ padding: isMobile ? "12px" : "32px 40px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16 }}>
          <button style={btnBack} onClick={() => navigate("/dashboard")}>← Retour</button>
          <h2 style={{ fontSize: isMobile ? 16 : 24, fontWeight: 500, margin: 0 }}>
            🔗 Liens de partage
          </h2>
        </div>
        <button style={btnPrimary} onClick={() => navigate("/liens-partage/new")}>
          {isMobile ? "➕" : "+ Nouveau lien"}
        </button>
      </div>

      {/* FILTRES */}
      <div style={{
        border: "1px solid var(--border)", borderRadius: 12,
        padding: isMobile ? 12 : "16px 20px",
        marginBottom: 24,
        display: "flex", gap: 12,
        flexDirection: isMobile ? "column" : "row",
        flexWrap: "wrap", alignItems: "flex-end",
      }}>
        {/* Document ID — masqué sur mobile */}
        {!isMobile && (
          <div style={filterGroup}>
            <span style={label}>Document ID</span>
            <input
              style={inputStyle} type="number" placeholder="Ex : 1"
              value={filterDocumentId}
              onChange={(e) => setFilterDocumentId(e.target.value)}
            />
          </div>
        )}
        {/* Créé par — masqué sur mobile */}
        {!isMobile && (
          <div style={filterGroup}>
            <span style={label}>Créé par (User ID)</span>
            <input
              style={inputStyle} type="number" placeholder="Ex : 3"
              value={filterCreeParId}
              onChange={(e) => setFilterCreeParId(e.target.value)}
            />
          </div>
        )}
        <div style={filterGroup}>
          <span style={label}>Statut</span>
          <select style={selectStyle} value={filterActif} onChange={(e) => setFilterActif(e.target.value)}>
            <option value="">Tous</option>
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <button style={btnPrimary} onClick={handleSearch}>
            {isMobile ? "🔍" : "Rechercher"}
          </button>
          <button style={btnOutline} onClick={handleReset}>
            {isMobile ? "↺" : "Réinitialiser"}
          </button>
        </div>
      </div>

      {/* ERREUR */}
      {error && (
        <div style={{ border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", borderRadius: 8, padding: "10px 16px", fontSize: 14, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* CONTENU */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text)", fontSize: 14 }}>Chargement...</div>
      ) : isMobile ? (
        // ✅ CARDS sur mobile
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {liens.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text)", padding: 40 }}>Aucun lien de partage trouvé.</p>
          ) : liens.map((lien) => (
            <div key={lien.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <code style={{ fontSize: 12, color: "var(--text-h)" }}>
                  {lien.token && lien.token.length > 20 ? lien.token.substring(0, 20) + "…" : lien.token}
                </code>
                <span style={lien.actif ? badgeSuccess : badgeSecondary}>
                  {lien.actif ? "Actif" : "Inactif"}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 4 }}>
                📅 {lien.dateExpiration ? new Date(lien.dateExpiration).toLocaleString("fr-FR") : "—"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 10 }}>
                👁 {lien.nombreAccesActuel ?? 0} / {lien.nombreAccesMax ?? "∞"} · Doc #{lien.documentId}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...btnInfo, flex: 1 }} onClick={() => navigate(`/liens-partage/${lien.id}`)}>
                  👁️ Détail
                </button>
                <button style={{ ...btnDanger, flex: 1 }} onClick={() => handleDelete(lien.id!)}>
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // ✅ TABLE sur tablette/desktop
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead style={{ background: "var(--code-bg)" }}>
              <tr>
                {!isTablet && <th style={th}>ID</th>}
                <th style={th}>Token</th>
                {!isTablet && <th style={th}>Expiration</th>}
                <th style={th}>Accès</th>
                <th style={th}>Statut</th>
                {!isTablet && <th style={th}>Doc. ID</th>}
                {!isTablet && <th style={th}>Créé par</th>}
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {liens.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "var(--text)", fontSize: 14 }}>
                    Aucun lien de partage trouvé.
                  </td>
                </tr>
              ) : (
                liens.map((lien) => (
                  <tr key={lien.id}>
                    {!isTablet && <td style={tdMuted}>{lien.id}</td>}
                    <td style={td}>
                      <code style={{ fontSize: 13 }}>
                        {lien.token && lien.token.length > 24 ? lien.token.substring(0, 24) + "…" : lien.token}
                      </code>
                    </td>
                    {!isTablet && (
                      <td style={tdMuted}>
                        {lien.dateExpiration ? new Date(lien.dateExpiration).toLocaleString("fr-FR") : "-"}
                      </td>
                    )}
                    <td style={td}>{lien.nombreAccesActuel ?? 0} / {lien.nombreAccesMax ?? "∞"}</td>
                    <td style={td}>
                      <span style={lien.actif ? badgeSuccess : badgeSecondary}>
                        {lien.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    {!isTablet && <td style={tdMuted}>{lien.documentId}</td>}
                    {!isTablet && <td style={tdMuted}>{lien.creeParId ?? "-"}</td>}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: isMobile ? 4 : 6, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
          <button
            style={pageBtn(false)} disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >‹</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} style={pageBtn(page === i)} onClick={() => setPage(i)}>
              {i + 1}
            </button>
          ))}
          <button
            style={pageBtn(false)} disabled={page === totalPages - 1}
            onClick={() => setPage(page + 1)}
          >›</button>
        </div>
      )}
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const btnBack    = { background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 } as React.CSSProperties;
const btnPrimary = { background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 14, cursor: "pointer" } as React.CSSProperties;
const btnOutline = { background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 18px", fontSize: 14, cursor: "pointer" } as React.CSSProperties;
const btnInfo    = { background: "var(--accent-bg)", color: "var(--accent)", border: "1px solid var(--accent-border)", borderRadius: 6, padding: "4px 12px", fontSize: 13, cursor: "pointer" } as React.CSSProperties;
const btnDanger  = { background: "transparent", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 6, padding: "4px 12px", fontSize: 13, cursor: "pointer" } as React.CSSProperties;
const filterGroup = { display: "flex", flexDirection: "column" as const, gap: 4, flex: 1, minWidth: 140 };
const label      = { fontSize: 12, color: "var(--text)", fontWeight: 500 } as React.CSSProperties;
const inputStyle = { border: "1px solid var(--border)", borderRadius: 8, padding: "7px 12px", fontSize: 14, color: "var(--text-h)", background: "var(--bg)", outline: "none" } as React.CSSProperties;
const selectStyle = { border: "1px solid var(--border)", borderRadius: 8, padding: "7px 12px", fontSize: 14, color: "var(--text-h)", background: "var(--bg)", outline: "none", cursor: "pointer" } as React.CSSProperties;
const th         = { padding: "10px 16px", textAlign: "left" as const, fontWeight: 600, fontSize: 12, color: "var(--text)", textTransform: "uppercase" as const, letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" };
const td         = { padding: "12px 16px", borderBottom: "1px solid var(--border)", color: "var(--text-h)", verticalAlign: "middle" as const } as React.CSSProperties;
const tdMuted    = { padding: "12px 16px", borderBottom: "1px solid var(--border)", color: "var(--text)", verticalAlign: "middle" as const } as React.CSSProperties;
const badgeSuccess   = { background: "rgba(34,197,94,0.12)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 500 } as React.CSSProperties;
const badgeSecondary = { background: "var(--code-bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 500 } as React.CSSProperties;
const pageBtn = (active: boolean): React.CSSProperties => ({
  border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
  background: active ? "var(--accent-bg)" : "transparent",
  color: active ? "var(--accent)" : "var(--text)",
  borderRadius: 6, padding: "5px 12px", fontSize: 13, cursor: "pointer",
});

export default LienPartageListPage;