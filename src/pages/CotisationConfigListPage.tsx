import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cotisationConfigService } from "../api/cotisationConfigService";
import { getAssociations } from "../api/associationService";
import type { CotisationConfigDto } from "../types/cotisationConfig";
import { PERIODICITE_LABELS } from "../types/cotisationConfig";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize"; // ✅

export default function CotisationConfigListPage() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<CotisationConfigDto[]>([]);
  const [associations, setAssociations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isMobile, isTablet } = useWindowSize(); // ✅

  const [modal, setModal] = useState<{ isOpen: boolean; associationId: number | null; label: string }>
    ({ isOpen: false, associationId: null, label: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const assocData = await getAssociations(0, 1000);
      const assocList = assocData.content || [];
      setAssociations(assocList);
      const results: CotisationConfigDto[] = [];
      await Promise.all(assocList.map(async (a: any) => {
        try {
          const config = await cotisationConfigService.getByAssociation(a.id);
          results.push(config);
        } catch {}
      }));
      setConfigs(results);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getAssociationName = (id: number) =>
    associations.find((a) => a.id === id)?.name || `Association #${id}`;

  const handleDeleteClick = (associationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setModal({ isOpen: true, associationId, label: getAssociationName(associationId) });
  };
  const handleConfirmDelete = async () => {
    if (!modal.associationId) return;
    try {
      await cotisationConfigService.delete(modal.associationId);
      setModal({ isOpen: false, associationId: null, label: '' });
      fetchData();
    } catch { setModal({ isOpen: false, associationId: null, label: '' }); }
  };
  const handleCancelDelete = () => setModal({ isOpen: false, associationId: null, label: '' });

  const statCards = [
    { label: "Total",         value: configs.length,                                                  color: "#111827", bg: "#f9fafb" },
    { label: "Mensuelle",     value: configs.filter(c => c.periodicite === "MENSUELLE").length,        color: "#185FA5", bg: "#E6F1FB" },
    { label: "Trimestrielle", value: configs.filter(c => c.periodicite === "TRIMESTRIELLE").length,    color: "#3B6D11", bg: "#EAF3DE" },
    { label: "Annuelle",      value: configs.filter(c => c.periodicite === "ANNUELLE").length,         color: "#b45309", bg: "#fefce8" },
  ];

  return (
    <div style={{ padding: isMobile ? '12px' : '24px 20px' }}>

      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer la configuration"
        message={`Êtes-vous sûr de vouloir supprimer la configuration de "${modal.label}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <button style={btnBack} onClick={() => navigate("/")}>← Tableau de bord</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: "#2c3e50", margin: 0, fontSize: isMobile ? 16 : 22 }}>⚙️ Configs cotisation</h2>
        <button style={btnAdd} onClick={() => navigate("/cotisation-configs/new")}>
          {isMobile ? '➕' : '➕ Créer'}
        </button>
      </div>

      {/* ✅ STATS — 2 colonnes mobile, 4 desktop */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0,1fr))",
        gap: isMobile ? 8 : 12,
        marginBottom: 20,
      }}>
        {statCards.map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 10, padding: isMobile ? "12px" : "16px 20px" }}>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 600, color }}>{value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Chargement...</div>
      ) : isMobile ? (
        // ✅ CARDS sur mobile
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {configs.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af' }}>Aucune configuration trouvée</p>
          ) : configs.map((c) => (
            <div key={c.id}
              style={{ background: '#fff', borderRadius: 10, padding: 14, border: '1px solid #eee', cursor: 'pointer' }}
              onClick={() => navigate(`/cotisation-configs/association/${c.associationId}`)}
            >
              <div style={{ fontWeight: 600, fontSize: 15 }}>{getAssociationName(c.associationId)}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: "#059669", fontSize: 13 }}>{Number(c.montantDefaut).toFixed(2)} €</span>
                <span style={{ background: "#ede9fe", color: "#5b21b6", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                  {PERIODICITE_LABELS[c.periodicite]}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button style={{ ...btnView, flex: 1 }} onClick={(e) => { e.stopPropagation(); navigate(`/cotisation-configs/association/${c.associationId}`); }}>👁️</button>
                <button style={{ ...btnEdit, flex: 1 }} onClick={(e) => { e.stopPropagation(); navigate(`/cotisation-configs/association/${c.associationId}/edit`); }}>✏️</button>
                <button style={{ ...btnDelete, flex: 1 }} onClick={(e) => handleDeleteClick(c.associationId, e)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // ✅ TABLE sur tablette/desktop
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: "#8b5cf6", color: "white" }}>
              <th style={thStyle}>Association</th>
              <th style={thStyle}>Montant</th>
              <th style={thStyle}>Périodicité</th>
              {!isTablet && <th style={thStyle}>Jour limite</th>}
              {!isTablet && <th style={thStyle}>Pénalité</th>}
              {!isTablet && <th style={thStyle}>Délai rappel</th>}
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {configs.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Aucune configuration</td></tr>
            )}
            {configs.map((c) => (
              <tr key={c.id}
                style={{ textAlign: "center", borderBottom: "1px solid #eee", background: "white", cursor: "pointer" }}
                onClick={() => navigate(`/cotisation-configs/association/${c.associationId}`)}
              >
                <td style={{ ...tdStyle, fontWeight: 600 }}>{getAssociationName(c.associationId)}</td>
                <td style={tdStyle}><span style={{ fontWeight: 600, color: "#059669" }}>{Number(c.montantDefaut).toFixed(2)} €</span></td>
                <td style={tdStyle}>
                  <span style={{ background: "#ede9fe", color: "#5b21b6", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    {PERIODICITE_LABELS[c.periodicite]}
                  </span>
                </td>
                {!isTablet && <td style={tdStyle}>{c.jourLimitePaiement ? `Jour ${c.jourLimitePaiement}` : "—"}</td>}
                {!isTablet && <td style={tdStyle}>{c.penaliteRetard ? `${Number(c.penaliteRetard).toFixed(2)} €` : "0.00 €"}</td>}
                {!isTablet && <td style={tdStyle}>{c.delaiRappelJours ? `${c.delaiRappelJours} j` : "—"}</td>}
                <td style={tdStyle}>
                  <button style={btnView} onClick={(e) => { e.stopPropagation(); navigate(`/cotisation-configs/association/${c.associationId}`); }}>👁️</button>
                  <button style={btnEdit} onClick={(e) => { e.stopPropagation(); navigate(`/cotisation-configs/association/${c.associationId}/edit`); }}>✏️</button>
                  <button style={btnDelete} onClick={(e) => handleDeleteClick(c.associationId, e)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const btnBack    = { display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, padding: 0 } as React.CSSProperties;
const btnAdd     = { padding: "10px 16px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 };
const btnView    = { marginRight: 4, background: "#3b82f6", color: "white", border: "none", padding: "6px 8px", borderRadius: 5, cursor: "pointer" };
const btnEdit    = { marginRight: 4, background: "#f59e0b", color: "white", border: "none", padding: "6px 8px", borderRadius: 5, cursor: "pointer" };
const btnDelete  = { background: "#e74c3c", color: "white", border: "none", padding: "6px 8px", borderRadius: 5, cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const, background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" };
const thStyle    = { padding: "12px 16px" };
const tdStyle    = { padding: "10px 16px" };