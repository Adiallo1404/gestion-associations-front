import { useEffect, useState } from "react";
import { getCotisationById, deleteCotisation } from "../api/cotisationService";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: "#f39c12",
  PAYEE:      "#27ae60",
  EN_RETARD:  "#e74c3c",
  ANNULEE:    "#95a5a6",
};

export default function CotisationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cotisation, setCotisation] = useState<any>(null);

  useEffect(() => {
    getCotisationById(Number(id))
      .then(setCotisation)
      .catch(() => toast.error("❌ Erreur chargement"));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Supprimer cette cotisation ?")) return;
    await deleteCotisation(Number(id));
    toast.success("🗑️ Supprimée !");
    navigate("/cotisations");
  };

  if (!cotisation) return <p>Chargement...</p>;

  return (
    <div style={container}>
      <div style={card}>
        <button style={btnBack} onClick={() => navigate("/cotisations")}>← Retour</button>

        <h2 style={title}>💰 Cotisation #{cotisation.id}</h2>

        <div style={badge(cotisation.statut)}>{cotisation.statut}</div>

        <div style={grid}>
          <div style={row}><span style={label}>Montant</span><span style={value}><strong>{cotisation.montant} €</strong></span></div>
          <div style={row}><span style={label}>Pénalité</span><span style={value}>{cotisation.montantPenalite ?? 0} €</span></div>
          <div style={row}><span style={label}>Période début</span><span style={value}>{cotisation.periodeDebut}</span></div>
          <div style={row}><span style={label}>Période fin</span><span style={value}>{cotisation.periodeFin}</span></div>
          <div style={row}><span style={label}>Échéance</span><span style={value}>{cotisation.dateEcheance || "-"}</span></div>
          <div style={row}><span style={label}>Référence</span><span style={value}>{cotisation.referencePaiement || "-"}</span></div>
          <div style={row}><span style={label}>Association ID</span><span style={value}>{cotisation.associationId}</span></div>
          <div style={row}><span style={label}>Membre ID</span><span style={value}>{cotisation.memberId}</span></div>
        </div>

        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <button style={btnEdit} onClick={() => navigate(`/cotisations/${id}/edit`)}>✏️ Modifier</button>
          <button style={btnDelete} onClick={handleDelete}>🗑️ Supprimer</button>
        </div>
      </div>
    </div>
  );
}

const badge = (statut: string) => ({
  display: "inline-block",
  background: STATUT_COLORS[statut] || "#ccc",
  color: "white",
  padding: "4px 14px",
  borderRadius: "12px",
  fontSize: "13px",
  fontWeight: "bold" as const,
  marginBottom: "16px",
});
const container = { display: "flex", justifyContent: "center", marginTop: "40px" };
const card = { background: "white", padding: "28px", borderRadius: "12px", minWidth: "380px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" };
const title = { textAlign: "center" as const, fontSize: "20px", color: "#2c3e50", marginBottom: "8px" };
const grid = { display: "flex", flexDirection: "column" as const, gap: "8px", marginTop: "10px" };
const row = { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" };
const label = { color: "#888", fontSize: "14px" };
const value = { color: "#2c3e50", fontSize: "14px" };
const btnBack = { marginBottom: "12px", background: "none", border: "1px solid #ccc", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" };
const btnEdit = { flex: 1, background: "#27ae60", color: "white", border: "none", padding: "10px", borderRadius: "6px", cursor: "pointer" };
const btnDelete = { flex: 1, background: "#e74c3c", color: "white", border: "none", padding: "10px", borderRadius: "6px", cursor: "pointer" };