import { useEffect, useState } from "react";
import { getCotisationById, deleteCotisation } from "../api/cotisationService";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const STATUT_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  EN_ATTENTE: { label: "En attente", color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  PAYEE:      { label: "Payée",      color: "#065f46", bg: "#d1fae5", dot: "#10b981" },
  EN_RETARD:  { label: "En retard",  color: "#991b1b", bg: "#fee2e2", dot: "#ef4444" },
  ANNULEE:    { label: "Annulée",    color: "#374151", bg: "#f3f4f6", dot: "#9ca3af" },
};

const getDeviseSymbol = (devise?: string) => {
  switch (devise) {
    case "XAF": case "XOF": return "FCFA";
    case "USD": return "$";
    case "GBP": return "£";
    default: return "€";
  }
};

export default function CotisationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cotisation, setCotisation] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    getCotisationById(Number(id))
      .then(setCotisation)
      .catch(() => toast.error("❌ Erreur chargement"));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCotisation(Number(id));
      toast.success("🗑️ Cotisation supprimée !");
      navigate("/cotisations");
    } catch {
      toast.error("❌ Erreur lors de la suppression");
      setDeleting(false);
    }
  };

  if (!cotisation) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", color: "#94a3b8" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <p style={{ margin: 0, fontSize: 15 }}>Chargement…</p>
      </div>
    </div>
  );

  const st = STATUT_META[cotisation.statut] || { label: cotisation.statut, color: "#374151", bg: "#f3f4f6", dot: "#9ca3af" };
  const sym = getDeviseSymbol(cotisation.devise);

  const InfoRow = ({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: highlight ? 15 : 14, fontWeight: highlight ? 700 : 500, color: highlight ? "#0f172a" : "#374151" }}>{value}</span>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f4ff 0%, #fafafa 100%)",
      padding: "32px 16px 48px",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* RETOUR */}
        <button
          onClick={() => navigate("/cotisations")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: 10, padding: "8px 16px", cursor: "pointer",
            fontSize: 14, fontWeight: 500, color: "#374151",
            marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
          onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
        >
          ← Retour aux cotisations
        </button>

        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden" }}>

          {/* EN-TÊTE COLORÉE selon statut */}
          <div style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
            padding: "24px 28px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Cotisation #{cotisation.id}
                </p>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>
                  {cotisation.montant} {sym}
                </div>
                {cotisation.montantPenalite > 0 && (
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                    + pénalité : {cotisation.montantPenalite} {sym}
                  </p>
                )}
              </div>
              <span style={{
                background: st.bg, color: st.color,
                padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: st.dot, display: "inline-block" }} />
                {st.label}
              </span>
            </div>
          </div>

          {/* DÉTAILS */}
          <div style={{ padding: "8px 28px 20px" }}>

            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", padding: "16px 0 4px" }}>
              Affectation
            </div>
            <InfoRow label="Association" value={`#${cotisation.associationId}`} />
            <InfoRow label="Membre" value={`#${cotisation.memberId}`} />

            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", padding: "16px 0 4px" }}>
              Période & Échéances
            </div>
            <InfoRow label="Période début" value={cotisation.periodeDebut || "—"} />
            <InfoRow label="Période fin" value={cotisation.periodeFin || "—"} />
            <InfoRow label="Date d'échéance" value={cotisation.dateEcheance || "—"} />

            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", padding: "16px 0 4px" }}>
              Paiement
            </div>
            <InfoRow label="Montant" value={`${cotisation.montant} ${sym}`} highlight />
            <InfoRow label="Pénalité" value={`${cotisation.montantPenalite ?? 0} ${sym}`} />
            <InfoRow label="Devise" value={cotisation.devise || "EUR"} />
            <InfoRow label="Référence" value={cotisation.referencePaiement || "—"} />
          </div>

          {/* ACTIONS */}
          <div style={{ padding: "16px 28px 24px", display: "flex", gap: 10, borderTop: "1px solid #f1f5f9" }}>
            <button
              onClick={() => navigate(`/cotisations/${id}/edit`)}
              style={{
                flex: 1, padding: "11px", borderRadius: 10,
                background: "#f0fdf4", color: "#16a34a",
                border: "1px solid #bbf7d0", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#dcfce7")}
              onMouseLeave={e => (e.currentTarget.style.background = "#f0fdf4")}
            >
              ✏️ Modifier
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              style={{
                flex: 1, padding: "11px", borderRadius: 10,
                background: "#fef2f2", color: "#dc2626",
                border: "1px solid #fecaca", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#fee2e2")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fef2f2")}
            >
              🗑️ Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* MODAL CONFIRMATION SUPPRESSION */}
      {confirmOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "28px", maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0f172a", textAlign: "center" }}>Supprimer la cotisation ?</h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 1.6 }}>
              Cette action est irréversible. La cotisation #{cotisation.id} sera définitivement supprimée.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmOpen(false)}
                style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: deleting ? "#fca5a5" : "#dc2626", color: "#fff", fontSize: 14, fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer" }}
              >
                {deleting ? "Suppression…" : "Oui, supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}