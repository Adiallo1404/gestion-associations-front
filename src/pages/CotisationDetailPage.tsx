import { useEffect, useState } from "react";
import { getCotisationById, deleteCotisation } from "../api/cotisationService";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import type { Cotisation } from "../types/cotisation";
import ConfirmModal from "../components/ConfirmModal";

const STATUT_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  EN_ATTENTE: { label: "En attente", color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  PAYEE:      { label: "Payée",      color: "#065f46", bg: "#d1fae5", dot: "#10b981" },
  EN_RETARD:  { label: "En retard",  color: "#991b1b", bg: "#fee2e2", dot: "#ef4444" },
  ANNULEE:    { label: "Annulée",    color: "#374151", bg: "#f3f4f6", dot: "#9ca3af" },
};

// Returns the display symbol/code for a given currency.
const getDeviseSymbol = (devise?: string) => {
  switch (devise) {
    case "XAF": case "XOF": return "FCFA";
    case "USD": return "$";
    case "GBP": return "£";
    default: return "€";
  }
};

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}

function InfoRow({ label, value, highlight }: InfoRowProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: highlight ? 15 : 14, fontWeight: highlight ? 700 : 500, color: highlight ? "#0f172a" : "#374151" }}>{value}</span>
    </div>
  );
}

export default function CotisationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cotisation, setCotisation] = useState<Cotisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    getCotisationById(Number(id))
      .then(setCotisation)
      .catch(() => setError("Cotisation introuvable"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCotisation(Number(id));
      toast.success("Cotisation supprimée");
      navigate("/cotisations");
    } catch {
      toast.error("Erreur lors de la suppression");
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div style={st.centerScreen}>
        <p style={{ margin: 0, fontSize: 15, color: "#94a3b8" }}>Chargement…</p>
      </div>
    );
  }

  if (error || !cotisation) {
    return (
      <div style={st.centerScreen}>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 16px", fontSize: 15, color: "#dc2626" }}>{error ?? "Cotisation introuvable"}</p>
          <button onClick={() => navigate("/cotisations")} style={st.btnBack}>
            Retour aux cotisations
          </button>
        </div>
      </div>
    );
  }

  const stMeta = STATUT_META[cotisation.statut] ?? { label: cotisation.statut, color: "#374151", bg: "#f3f4f6", dot: "#9ca3af" };
  const sym = getDeviseSymbol(cotisation.devise);

  return (
    <div style={st.page}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        <button onClick={() => navigate("/cotisations")} style={st.btnBack}>
          ← Retour aux cotisations
        </button>

        <div style={st.card}>

          <div style={st.headerBand}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={st.idLabel}>Cotisation #{cotisation.id}</p>
                <div style={st.amount}>{cotisation.montant} {sym}</div>
                  {(cotisation.montantPenalite ?? 0) > 0 && (
                  <p style={st.penaltyLabel}>+ pénalité : {cotisation.montantPenalite} {sym}</p>
                )}
              </div>
              <span style={{ ...st.statusBadge, background: stMeta.bg, color: stMeta.color }}>
                <span style={{ ...st.statusDot, background: stMeta.dot }} />
                {stMeta.label}
              </span>
            </div>
          </div>

          <div style={{ padding: "8px 28px 20px" }}>
            <div style={st.sectionTitle}>Affectation</div>
            <InfoRow label="Association" value={`#${cotisation.associationId}`} />
            <InfoRow label="Membre" value={`#${cotisation.memberId}`} />

            <div style={st.sectionTitle}>Période & Échéances</div>
            <InfoRow label="Période début" value={cotisation.periodeDebut} />
            <InfoRow label="Période fin" value={cotisation.periodeFin} />
            <InfoRow label="Date d'échéance" value={cotisation.dateEcheance ?? "—"} />

            <div style={st.sectionTitle}>Paiement</div>
            <InfoRow label="Montant" value={`${cotisation.montant} ${sym}`} highlight />
            <InfoRow label="Pénalité" value={`${cotisation.montantPenalite} ${sym}`} />
            <InfoRow label="Devise" value={cotisation.devise} />
            <InfoRow label="Référence" value={cotisation.referencePaiement ?? "—"} />
          </div>

          <div style={st.actions}>
            <button onClick={() => navigate(`/cotisations/${id}/edit`)} style={st.btnEdit}>
              Modifier
            </button>
            <button onClick={() => setConfirmOpen(true)} style={st.btnDelete}>
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Supprimer la cotisation"
        message={`Cette action est irréversible. La cotisation #${cotisation.id} sera définitivement supprimée.`}
        confirmLabel={deleting ? "Suppression…" : "Oui, supprimer"}
        cancelLabel="Annuler"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  page:          { minHeight: "100vh", background: "#f8fafc", padding: "32px 16px 48px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" },
  centerScreen:  { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" },
  card:          { background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden" },
  headerBand:    { background: "#2563eb", padding: "24px 28px" },
  idLabel:       { margin: "0 0 4px", fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" },
  amount:        { fontSize: 32, fontWeight: 700, color: "#fff" },
  penaltyLabel:  { margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.7)" },
  statusBadge:   { padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 },
  statusDot:     { width: 7, height: 7, borderRadius: "50%", display: "inline-block" },
  sectionTitle:  { fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", padding: "16px 0 4px" },
  actions:       { padding: "16px 28px 24px", display: "flex", gap: 10, borderTop: "1px solid #f1f5f9" },
  btnBack:       { display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  btnEdit:       { flex: 1, padding: "11px", borderRadius: 10, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnDelete:     { flex: 1, padding: "11px", borderRadius: 10, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", fontSize: 14, fontWeight: 600, cursor: "pointer" },
};