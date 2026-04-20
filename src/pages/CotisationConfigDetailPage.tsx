import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { cotisationConfigService } from "../api/cotisationConfigService";
import { getAssociations } from "../api/associationService";
import type { CotisationConfigDto } from "../types/cotisationConfig";
import { PERIODICITE_LABELS } from "../types/cotisationConfig";

export default function CotisationConfigDetailPage() {
  const { associationId } = useParams<{ associationId: string }>();
  const [config, setConfig] = useState<CotisationConfigDto | null>(null);
  const [assocName, setAssocName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await cotisationConfigService.getByAssociation(Number(associationId));
        setConfig(data);
        // Récupère le nom de l'association
        const assocData = await getAssociations(0, 1000);
        const found = (assocData.content || []).find((a: any) => a.id === data.associationId);
        setAssocName(found?.name || `Association #${data.associationId}`);
      } catch {
        setError("Configuration introuvable.");
      } finally {
        setLoading(false);
      }
    };
    if (associationId) load();
  }, [associationId]);

  const handleDelete = async () => {
    if (!window.confirm("Supprimer cette configuration ?")) return;
    try {
      await cotisationConfigService.delete(Number(associationId));
      window.location.href = "/cotisation-configs";
    } catch {
      setError("Erreur lors de la suppression.");
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 64, color: "#6b7280" }}>Chargement...</div>;

  if (error) return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 16 }}>
      <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "12px 16px" }}>{error}</div>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button onClick={() => window.location.href = "/cotisation-configs"}
          style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer" }}>
          ← Retour
        </button>
      </div>
    </div>
  );

  if (!config) return null;

  const rows = [
    { label: "Association",       value: assocName },
    { label: "Montant par défaut", value: `${Number(config.montantDefaut).toFixed(2)} €` },
    { label: "Périodicité",       value: PERIODICITE_LABELS[config.periodicite] },
    { label: "Jour limite",       value: config.jourLimitePaiement ? `Jour ${config.jourLimitePaiement} du mois` : "—" },
    { label: "Pénalité retard",   value: config.penaliteRetard ? `${Number(config.penaliteRetard).toFixed(2)} €` : "0.00 €" },
    { label: "Délai rappel",      value: config.delaiRappelJours ? `${config.delaiRappelJours} jours avant échéance` : "—" },
  ];

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 16px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>⚙️ Config — {assocName}</h2>
        <button onClick={() => window.location.href = "/cotisation-configs"}
          style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
          ← Retour
        </button>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: 24 }}>
          {rows.map(({ label, value }) => (
            <div key={label} style={{ display: "flex", borderBottom: "1px solid #f3f4f6", padding: "12px 0" }}>
              <span style={{ width: 200, color: "#6b7280", fontSize: 14, fontWeight: 500, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 14, color: "#111827", fontWeight: label === "Montant par défaut" ? 600 : 400 }}>
                {String(value)}
              </span>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div style={{ padding: "16px 24px", background: "#f9fafb", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={() => window.location.href = `/cotisation-configs/association/${associationId}/edit`}
            style={{ padding: "10px 20px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            ✏️ Modifier
          </button>
          <button onClick={handleDelete}
            style={{ padding: "10px 20px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}