import { useEffect, useState } from "react";
import { getCotisations, deleteCotisation } from "../api/cotisationService";
import { useNavigate } from "react-router-dom";
import type { Cotisation } from "../types/cotisation";

const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: "#f39c12",
  PAYEE:      "#27ae60",
  EN_RETARD:  "#e74c3c",
  ANNULEE:    "#95a5a6",
};

export default function CotisationListPage() {
  const [cotisations, setCotisations] = useState<Cotisation[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const data = await getCotisations(filters, page);
      setCotisations(data.content);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, [filters, page]);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette cotisation ?")) return;
    await deleteCotisation(id);
    fetchData();
  };

  return (
    <div style={{ padding: "20px" }}>

      {/* ✅ Bouton retour tableau de bord */}
      <button style={btnBack} onClick={() => navigate("/")}>
        ← Tableau de bord
      </button>

      <h2 style={{ color: "#2c3e50", textAlign: "center" }}>💰 Cotisations</h2>

      {/* FILTRES */}
      <div style={{ marginBottom: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <select
          style={inputStyle}
          onChange={(e) => { setPage(0); setFilters({ ...filters, statut: e.target.value || undefined }); }}
        >
          <option value="">-- Statut --</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="PAYEE">Payée</option>
          <option value="EN_RETARD">En retard</option>
          <option value="ANNULEE">Annulée</option>
        </select>

        <input
          type="number"
          placeholder="Montant min"
          style={inputStyle}
          onChange={(e) => { setPage(0); setFilters({ ...filters, montantMin: e.target.value || undefined }); }}
        />
        <input
          type="number"
          placeholder="Montant max"
          style={inputStyle}
          onChange={(e) => { setPage(0); setFilters({ ...filters, montantMax: e.target.value || undefined }); }}
        />
        <button style={btnPrimary} onClick={fetchData}>🔍 Filtrer</button>
      </div>

      {/* ADD BUTTON */}
      <div style={{ textAlign: "center", marginBottom: "15px" }}>
        <button style={btnAdd} onClick={() => navigate("/cotisations/new")}>
          ➕ Ajouter une cotisation
        </button>
      </div>

      {/* TABLE */}
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: "#3498db", color: "white" }}>
            <th style={thStyle}>Membre ID</th>
            <th style={thStyle}>Montant</th>
            <th style={thStyle}>Statut</th>
            <th style={thStyle}>Période début</th>
            <th style={thStyle}>Période fin</th>
            <th style={thStyle}>Échéance</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cotisations.map((c) => (
            <tr key={c.id} style={{ textAlign: "center", borderBottom: "1px solid #eee" }}>
              <td style={tdStyle}>{c.memberId}</td>
              <td style={tdStyle}><strong>{c.montant} €</strong></td>
              <td style={tdStyle}>
                <span style={{
                  background: STATUT_COLORS[c.statut] || "#ccc",
                  color: "white",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}>
                  {c.statut}
                </span>
              </td>
              <td style={tdStyle}>{c.periodeDebut}</td>
              <td style={tdStyle}>{c.periodeFin}</td>
              <td style={tdStyle}>{c.dateEcheance || "-"}</td>
              <td style={tdStyle}>
                <button style={btnView} onClick={() => navigate(`/cotisations/${c.id}`)}>👁️</button>
                <button style={btnEdit} onClick={() => navigate(`/cotisations/${c.id}/edit`)}>✏️</button>
                <button style={btnDelete} onClick={() => handleDelete(c.id!)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINATION */}
      <div style={{ marginTop: "15px", textAlign: "center" }}>
        <button style={btnPage} onClick={() => setPage(page - 1)} disabled={page === 0}>⬅</button>
        <span style={{ margin: "0 10px" }}>Page {page + 1}</span>
        <button style={btnPage} onClick={() => setPage(page + 1)}>➡</button>
      </div>
    </div>
  );
}

// ✅ Nouveau style bouton retour
const btnBack    = { display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, padding: 0 } as React.CSSProperties;
const inputStyle = { padding: "8px", borderRadius: "6px", border: "1px solid #ccc" };
const btnPrimary = { padding: "8px 12px", background: "#3498db", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" };
const btnAdd     = { padding: "10px 20px", background: "#2ecc71", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" };
const btnView    = { marginRight: "5px", background: "#3498db", color: "white", border: "none", padding: "6px 8px", borderRadius: "5px", cursor: "pointer" };
const btnEdit    = { marginRight: "5px", background: "#27ae60", color: "white", border: "none", padding: "6px 8px", borderRadius: "5px", cursor: "pointer" };
const btnDelete  = { background: "#e74c3c", color: "white", border: "none", padding: "6px 8px", borderRadius: "5px", cursor: "pointer" };
const btnPage    = { padding: "6px 12px", borderRadius: "6px", border: "1px solid #ccc", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const, background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" };
const thStyle    = { padding: "12px 16px" };
const tdStyle    = { padding: "10px 16px" };