import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cotisationConfigService } from "../api/cotisationConfigService";
import { getAssociations } from "../api/associationService";
import type { CotisationConfigDto } from "../types/cotisationConfig";
import { PERIODICITE_LABELS } from "../types/cotisationConfig";

export default function CotisationConfigListPage() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<CotisationConfigDto[]>([]);
  const [associations, setAssociations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const assocData = await getAssociations(0, 1000);
      const assocList = assocData.content || [];
      setAssociations(assocList);

      const results: CotisationConfigDto[] = [];
      await Promise.all(
        assocList.map(async (a: any) => {
          try {
            const config = await cotisationConfigService.getByAssociation(a.id);
            results.push(config);
          } catch {
            // pas de config pour cette association
          }
        })
      );
      setConfigs(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getAssociationName = (id: number) =>
    associations.find((a) => a.id === id)?.name || `Association #${id}`;

  const handleDelete = async (associationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer cette configuration ?")) return;
    try {
      await cotisationConfigService.delete(associationId);
      fetchData();
    } catch {
      alert("Erreur lors de la suppression.");
    }
  };

  const statCards = [
    { label: "Total configs",   value: configs.length,                                                color: "#111827", bg: "#f9fafb" },
    { label: "Mensuelle",       value: configs.filter((c) => c.periodicite === "MENSUELLE").length,   color: "#185FA5", bg: "#E6F1FB" },
    { label: "Trimestrielle",   value: configs.filter((c) => c.periodicite === "TRIMESTRIELLE").length, color: "#3B6D11", bg: "#EAF3DE" },
    { label: "Annuelle",        value: configs.filter((c) => c.periodicite === "ANNUELLE").length,    color: "#b45309", bg: "#fefce8" },
  ];

  return (
    <div style={{ padding: "24px 20px" }}>

      {/* ✅ Bouton retour tableau de bord */}
      <button style={btnBack} onClick={() => navigate("/")}>
        ← Tableau de bord
      </button>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#2c3e50", margin: 0, fontSize: 22 }}>⚙️ Configurations de cotisation</h2>
        <button style={btnAdd} onClick={() => navigate("/cotisation-configs/new")}>
          ➕ Créer une configuration
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 24 }}>
        {statCards.map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 600, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* TABLE */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Chargement...</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: "#8b5cf6", color: "white" }}>
              <th style={thStyle}>Association</th>
              <th style={thStyle}>Montant défaut</th>
              <th style={thStyle}>Périodicité</th>
              <th style={thStyle}>Jour limite</th>
              <th style={thStyle}>Pénalité retard</th>
              <th style={thStyle}>Délai rappel</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {configs.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                  Aucune configuration trouvée
                </td>
              </tr>
            )}
            {configs.map((c) => (
              <tr
                key={c.id}
                style={{ textAlign: "center", borderBottom: "1px solid #eee", background: "white", cursor: "pointer" }}
                onClick={() => navigate(`/cotisation-configs/association/${c.associationId}`)}
              >
                <td style={{ ...tdStyle, fontWeight: 600 }}>{getAssociationName(c.associationId)}</td>
                <td style={tdStyle}>
                  <span style={{ fontWeight: 600, color: "#059669" }}>{Number(c.montantDefaut).toFixed(2)} €</span>
                </td>
                <td style={tdStyle}>
                  <span style={{ background: "#ede9fe", color: "#5b21b6", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    {PERIODICITE_LABELS[c.periodicite]}
                  </span>
                </td>
                <td style={tdStyle}>{c.jourLimitePaiement ? `Jour ${c.jourLimitePaiement}` : "—"}</td>
                <td style={tdStyle}>{c.penaliteRetard ? `${Number(c.penaliteRetard).toFixed(2)} €` : "0.00 €"}</td>
                <td style={tdStyle}>{c.delaiRappelJours ? `${c.delaiRappelJours} jours` : "—"}</td>
                <td style={tdStyle}>
                  <button style={btnView} onClick={(e) => { e.stopPropagation(); navigate(`/cotisation-configs/association/${c.associationId}`); }}>👁️</button>
                  <button style={btnEdit} onClick={(e) => { e.stopPropagation(); navigate(`/cotisation-configs/association/${c.associationId}/edit`); }}>✏️</button>
                  <button style={btnDelete} onClick={(e) => handleDelete(c.associationId, e)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const btnBack   = { display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, padding: 0 } as React.CSSProperties;
const btnAdd    = { padding: "10px 20px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 };
const btnView   = { marginRight: 4, background: "#3b82f6", color: "white", border: "none", padding: "6px 8px", borderRadius: 5, cursor: "pointer" };
const btnEdit   = { marginRight: 4, background: "#f59e0b", color: "white", border: "none", padding: "6px 8px", borderRadius: 5, cursor: "pointer" };
const btnDelete = { background: "#e74c3c", color: "white", border: "none", padding: "6px 8px", borderRadius: 5, cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const, background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" };
const thStyle = { padding: "12px 16px" };
const tdStyle = { padding: "10px 16px" };