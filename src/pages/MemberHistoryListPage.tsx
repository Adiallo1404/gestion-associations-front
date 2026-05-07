import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMemberHistories, deleteMemberHistory } from "../api/memberHistoryService";
import type { MemberHistory } from "../api/memberHistoryService";
import { StatutMembreLabels } from "../types/memberHistory";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize"; // ✅

export default function MemberHistoryListPage() {
  const [histories, setHistories] = useState<MemberHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { isMobile, isTablet } = useWindowSize(); // ✅
  const navigate = useNavigate();

  const [modal, setModal] = useState<{ isOpen: boolean; id: number | null; label: string }>
    ({ isOpen: false, id: null, label: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getMemberHistories({ page: 0, size: 100 });
      setHistories(data.content || []);
    } catch {
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteClick = (id: number, motif?: string) =>
    setModal({ isOpen: true, id, label: motif ? `"${motif}"` : `#${id}` });

  const handleConfirmDelete = async () => {
    if (!modal.id) return;
    try {
      await deleteMemberHistory(modal.id);
      setModal({ isOpen: false, id: null, label: '' });
      fetchData();
    } catch {
      setError("Erreur lors de la suppression");
      setModal({ isOpen: false, id: null, label: '' });
    }
  };

  const handleCancelDelete = () => setModal({ isOpen: false, id: null, label: '' });

  const filtered = histories.filter((h) =>
    (h.motif || "").toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (raw?: string) => {
    if (!raw) return "—";
    const d = new Date(raw);
    return d.toLocaleDateString("fr-FR") + " " +
      d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: 20 }}>Chargement...</p>;
  if (error)   return <p style={{ textAlign: "center", marginTop: 20, color: "#A32D2D" }}>{error}</p>;

  return (
    <div style={{ padding: isMobile ? "12px" : "20px", maxWidth: 1000, margin: "0 auto" }}>

      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer l'historique"
        message={`Êtes-vous sûr de vouloir supprimer l'historique ${modal.label} ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <button style={btnBack} onClick={() => navigate("/")}>← Tableau de bord</button>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 16 : 24, fontWeight: "bold", margin: 0 }}>
          📋 Historique des membres
        </h1>
        <button style={btnCreate} onClick={() => navigate("/member-histories/new")}>
          {isMobile ? "➕" : "➕ Créer"}
        </button>
      </div>

      {/* TOOLBAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15, gap: 10 }}>
        <input
          type="text"
          placeholder="Rechercher par motif..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...searchInput, flex: 1 }}
        />
        <span style={{ color: "#6b7280", fontSize: isMobile ? 12 : 14, whiteSpace: "nowrap" }}>
          {filtered.length} élément{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* CONTENU */}
      {filtered.length === 0 ? (
        <p style={{ textAlign: "center", marginTop: 20 }}>Aucun historique trouvé.</p>
      ) : isMobile ? (
        // ✅ CARDS sur mobile
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((h) => (
            <div key={h.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>#{h.id}</span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{formatDate(h.dateChangement)}</span>
              </div>
              <div style={{ fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: "#6b7280" }}>
                  {h.ancienStatut ? StatutMembreLabels[h.ancienStatut] : "Création"}
                </span>
                {" → "}
                <span style={{ fontWeight: 600, color: "#10b981" }}>
                  {StatutMembreLabels[h.nouveauStatut]}
                </span>
              </div>
              {h.motif && (
                <div style={{ fontSize: 13, color: "#374151", marginBottom: 10 }}>
                  💬 {h.motif}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...btnVoir, flex: 1 }} onClick={() => navigate(`/member-histories/${h.id}`)}>
                  👁️ Voir
                </button>
                <button style={{ ...btnDel, flex: 1 }} onClick={() => handleDeleteClick(h.id!, h.motif)}>
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // ✅ TABLE sur tablette/desktop
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {!isTablet && <th style={th}>ID</th>}
                <th style={th}>Ancien statut</th>
                <th style={th}>Nouveau statut</th>
                <th style={th}>Motif</th>
                {!isTablet && <th style={th}>Date</th>}
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => (
                <tr key={h.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {!isTablet && <td style={td}>{h.id}</td>}
                  <td style={td}>{h.ancienStatut ? StatutMembreLabels[h.ancienStatut] : "Création"}</td>
                  <td style={td}>{StatutMembreLabels[h.nouveauStatut]}</td>
                  <td style={td}>{h.motif || "—"}</td>
                  {!isTablet && <td style={td}>{formatDate(h.dateChangement)}</td>}
                  <td style={td}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={btnVoir} onClick={() => navigate(`/member-histories/${h.id}`)}>
                        {isTablet ? "👁️" : "Voir"}
                      </button>
                      <button style={btnDel} onClick={() => handleDeleteClick(h.id!, h.motif)}>
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
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const btnBack    = { display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, padding: 0 } as React.CSSProperties;
const btnCreate  = { padding: "8px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 } as React.CSSProperties;
const btnVoir    = { padding: "6px 10px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" } as React.CSSProperties;
const btnDel     = { padding: "6px 10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" } as React.CSSProperties;
const searchInput = { padding: 8, border: "1px solid #ccc", borderRadius: 6, fontSize: 14 } as React.CSSProperties;
const th         = { textAlign: "left" as const, padding: 10, borderBottom: "1px solid #e5e7eb", fontWeight: 600, fontSize: 13 };
const td         = { padding: 10 } as React.CSSProperties;