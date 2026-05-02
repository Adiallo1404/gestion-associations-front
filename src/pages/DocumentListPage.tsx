import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDocumentsByAssociation, deactivateDocument } from "../api/documentService";
import api from "../api/axiosConfig";
import type { DocumentDto } from "../types/document";

type Association = { id: number; name: string };

const DocumentListPage = () => {
  const navigate = useNavigate();
  const [associations, setAssociations] = useState<Association[]>([]);
  const [associationId, setAssociationId] = useState<string>("");
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // ✅ CORRECTION : bonne URL /v1/associations
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
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 16px" }}>

      {/* ✅ Bouton retour tableau de bord */}
      <button
        onClick={() => navigate("/")}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20, background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, padding: 0 }}
      >
        <span style={{ fontSize: 18 }}>←</span> Retour au tableau de bord
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Documents</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Gestion des documents par association</p>
        </div>
        <button
          onClick={() => navigate("/documents/new")}
          style={{ padding: "10px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
        >
          + Nouveau document
        </button>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12 }}>
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
          <button
            onClick={handleSearch}
            style={{ padding: "10px 20px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 }}
          >
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
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["#", "Nom du fichier", "Type", "Format", "Taille", "Date upload", "Statut", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 13 }}>{h}</th>
                ))}
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
                    <td style={{ padding: "12px 16px", color: "#9ca3af", fontWeight: 600 }}>#{doc.id}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.nomOriginal ?? doc.nomFichier}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: 13 }}>{doc.typeDocument?.replace(/_/g, " ") ?? "—"}</td>
                    <td style={{ padding: "12px 16px" }}>{badgeFormat(doc.formatFichier)}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>{formatTaille(doc.tailleOctets)}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: 13 }}>
                      {doc.dateUpload ? new Date(doc.dateUpload).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "2px 10px", background: doc.actif ? "#f0fdf4" : "#fef2f2", color: doc.actif ? "#16a34a" : "#dc2626", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        {doc.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => navigate(`/documents/${doc.id}`)}
                          style={{ padding: "6px 12px", background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}
                        >
                          Détail
                        </button>
                        {doc.actif && (
                          <button
                            onClick={() => handleDeactivate(doc.id!)}
                            style={{ padding: "6px 12px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}
                          >
                            Désactiver
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
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
          <button
            onClick={() => { const p = page - 1; setPage(p); fetchDocuments(p, associationId); }}
            disabled={page === 0}
            style={{ padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: 6, background: page === 0 ? "#f9fafb" : "#fff", color: page === 0 ? "#9ca3af" : "#374151", cursor: page === 0 ? "default" : "pointer" }}
          >
            Précédent
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => { setPage(i); fetchDocuments(i, associationId); }}
              style={{ padding: "8px 14px", border: "1px solid #d1d5db", borderRadius: 6, background: page === i ? "#4f46e5" : "#fff", color: page === i ? "#fff" : "#374151", cursor: "pointer", fontWeight: page === i ? 700 : 400 }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => { const p = page + 1; setPage(p); fetchDocuments(p, associationId); }}
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

export default DocumentListPage;