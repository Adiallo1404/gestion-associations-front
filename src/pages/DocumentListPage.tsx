import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDocumentsByAssociation, deactivateDocument } from "../api/documentService";
import api from "../api/axiosConfig";
import type { DocumentDto } from "../types/document";
import { useWindowSize } from "../hooks/useWindowSize"; // ✅

type Association = { id: number; name: string };

const DocumentListPage = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize(); // ✅
  const [associations, setAssociations] = useState<Association[]>([]);
  const [associationId, setAssociationId] = useState<string>("");
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    api.get("/v1/associations?page=0&size=100")
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data.content)) setAssociations(data.content);
        else if (Array.isArray(data)) setAssociations(data);
        else setAssociations([]);
      })
      .catch(() => setError("Erreur lors du chargement des associations."));
  }, []);

  const fetchDocuments = async (p = 0, assocId = associationId) => {
    if (!assocId) { setError("Veuillez choisir une association."); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await getDocumentsByAssociation(Number(assocId), p, 10);
      setDocuments(data.content || []);
      setTotalPages(data.totalPages || 0);
      setSearched(true);
    } catch {
      setError("Erreur lors du chargement des documents.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchDocuments(0, associationId);
  };

  const handleDeactivate = async (id: number) => {
    if (!window.confirm("Désactiver ce document ?")) return;
    try {
      await deactivateDocument(id);
      fetchDocuments(page, associationId);
    } catch {
      setError("Erreur lors de la désactivation.");
    }
  };

  const formatTaille = (octets?: number) => {
    if (!octets) return "—";
    if (octets < 1024) return `${octets} o`;
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
    return `${(octets / 1024 / 1024).toFixed(1)} Mo`;
  };

  const badgeFormat = (f?: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      PDF:   { bg: "#fef2f2", color: "#dc2626" },
      WORD:  { bg: "#eff6ff", color: "#1d4ed8" },
      EXCEL: { bg: "#f0fdf4", color: "#16a34a" },
      PNG:   { bg: "#fdf4ff", color: "#9333ea" },
      JPG:   { bg: "#fff7ed", color: "#ea580c" },
      AUTRE: { bg: "#f9fafb", color: "#6b7280" },
    };
    const c = colors[f ?? "AUTRE"] ?? colors["AUTRE"];
    return (
      <span style={{ padding: "2px 8px", background: c.bg, color: c.color, borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
        {f ?? "—"}
      </span>
    );
  };

  return (
    <div style={{ padding: isMobile ? "12px" : "32px 16px" }}>

      <button onClick={() => navigate("/")} style={btnBack}>
        ← Retour au tableau de bord
      </button>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 24, fontWeight: 700 }}>📄 Documents</h2>
          {!isMobile && <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Gestion des documents par association</p>}
        </div>
        <button onClick={() => navigate("/documents/new")} style={btnAdd}>
          {isMobile ? "➕" : "+ Nouveau document"}
        </button>
      </div>

      {/* Filtre association */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: isMobile ? 12 : 20, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
          <select
            value={associationId}
            onChange={(e) => setAssociationId(e.target.value)}
            style={{ flex: 1, padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, background: "#fff", cursor: "pointer" }}
          >
            <option value="">-- Choisir une association --</option>
            {associations.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <button onClick={handleSearch} style={btnSearch}>
            Rechercher
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading && <div style={{ textAlign: "center", padding: 32, color: "#6b7280" }}>Chargement...</div>}

      {!loading && searched && (
        isMobile ? (
          // ✅ CARDS sur mobile
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {documents.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af" }}>Aucun document trouvé</p>
            ) : documents.map((doc) => (
              <div key={doc.id} style={{ background: "#fff", borderRadius: 10, padding: 14, border: "1px solid #eee" }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  {doc.nomOriginal ?? doc.nomFichier}
                </div>
                <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 6 }}>
                  #{doc.id} · {doc.typeDocument?.replace(/_/g, " ") ?? "—"}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  {badgeFormat(doc.formatFichier)}
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{formatTaille(doc.tailleOctets)}</span>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    {doc.dateUpload ? new Date(doc.dateUpload).toLocaleDateString("fr-FR") : "—"}
                  </span>
                  <span style={{ padding: "2px 10px", background: doc.actif ? "#f0fdf4" : "#fef2f2", color: doc.actif ? "#16a34a" : "#dc2626", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    {doc.actif ? "Actif" : "Inactif"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    style={{ ...btnDetail, flex: 1 }}
                  >
                    👁️ Détail
                  </button>
                  {doc.actif && (
                    <button
                      onClick={() => handleDeactivate(doc.id!)}
                      style={{ ...btnDeactivate, flex: 1 }}
                    >
                      🚫 Désactiver
                    </button>
                  )}
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
                    <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                      Aucun document trouvé
                    </td>
                  </tr>
                ) : (
                  documents.map((doc, i) => (
                    <tr key={doc.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      {!isTablet && <td style={{ ...tdStyle, color: "#9ca3af", fontWeight: 600 }}>#{doc.id}</td>}
                      <td style={{ ...tdStyle, fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {doc.nomOriginal ?? doc.nomFichier}
                      </td>
                      {!isTablet && <td style={{ ...tdStyle, color: "#6b7280", fontSize: 13 }}>{doc.typeDocument?.replace(/_/g, " ") ?? "—"}</td>}
                      <td style={tdStyle}>{badgeFormat(doc.formatFichier)}</td>
                      {!isTablet && <td style={{ ...tdStyle, color: "#6b7280" }}>{formatTaille(doc.tailleOctets)}</td>}
                      <td style={{ ...tdStyle, color: "#6b7280", fontSize: 13 }}>
                        {doc.dateUpload ? new Date(doc.dateUpload).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ padding: "2px 10px", background: doc.actif ? "#f0fdf4" : "#fef2f2", color: doc.actif ? "#16a34a" : "#dc2626", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          {doc.actif ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => navigate(`/documents/${doc.id}`)} style={btnDetail}>
                            {isTablet ? "👁️" : "Détail"}
                          </button>
                          {doc.actif && (
                            <button onClick={() => handleDeactivate(doc.id!)} style={btnDeactivate}>
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
        )
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: isMobile ? 4 : 8, marginTop: 24, flexWrap: "wrap" }}>
          <button
            onClick={() => { const p = page - 1; setPage(p); fetchDocuments(p, associationId); }}
            disabled={page === 0}
            style={{ padding: isMobile ? "6px 10px" : "8px 16px", border: "1px solid #d1d5db", borderRadius: 6, background: page === 0 ? "#f9fafb" : "#fff", color: page === 0 ? "#9ca3af" : "#374151", cursor: page === 0 ? "default" : "pointer", fontSize: isMobile ? 12 : 14 }}
          >
            ← {!isMobile && "Précédent"}
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => { setPage(i); fetchDocuments(i, associationId); }}
              style={{ padding: isMobile ? "6px 10px" : "8px 14px", border: "1px solid #d1d5db", borderRadius: 6, background: page === i ? "#4f46e5" : "#fff", color: page === i ? "#fff" : "#374151", cursor: "pointer", fontWeight: page === i ? 700 : 400, fontSize: isMobile ? 12 : 14 }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => { const p = page + 1; setPage(p); fetchDocuments(p, associationId); }}
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
const btnBack      = { display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, padding: 0 } as React.CSSProperties;
const btnAdd       = { padding: "10px 16px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 } as React.CSSProperties;
const btnSearch    = { padding: "10px 20px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 } as React.CSSProperties;
const btnDetail    = { padding: "6px 12px", background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 } as React.CSSProperties;
const btnDeactivate = { padding: "6px 12px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 } as React.CSSProperties;
const thStyle      = { padding: "12px 16px", textAlign: "left" as const, fontWeight: 600, fontSize: 13 };
const tdStyle      = { padding: "10px 16px" } as React.CSSProperties;

export default DocumentListPage;