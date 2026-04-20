import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { cotisationConfigService } from "../api/cotisationConfigService";
import { getAssociations } from "../api/associationService";
import { toast } from "react-toastify";
import type { Periodicite } from "../types/cotisationConfig";
import { PERIODICITE_LABELS } from "../types/cotisationConfig";

const PERIODICITE_OPTIONS: Periodicite[] = [
  "MENSUELLE", "TRIMESTRIELLE", "SEMESTRIELLE", "ANNUELLE"
];

export default function CotisationConfigFormPage() {
  const { associationId } = useParams<{ associationId: string }>();
  const isEdit = !!associationId;

  const [form, setForm] = useState({
    montantDefaut: "",
    periodicite: "MENSUELLE" as Periodicite,
    jourLimitePaiement: "",
    penaliteRetard: "",
    delaiRappelJours: "3",
    associationId: associationId || "",
  });

  const [associations, setAssociations] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getAssociations(0, 1000)
      .then((res) => setAssociations(res.content || []))
      .catch(() => toast.error("Impossible de charger les associations"));
  }, []);

  useEffect(() => {
    if (isEdit) {
      cotisationConfigService.getByAssociation(Number(associationId))
        .then((data) => setForm({
          montantDefaut:      String(data.montantDefaut || ""),
          periodicite:        data.periodicite || "MENSUELLE",
          jourLimitePaiement: String(data.jourLimitePaiement || ""),
          penaliteRetard:     String(data.penaliteRetard || ""),
          delaiRappelJours:   String(data.delaiRappelJours || "3"),
          associationId:      String(data.associationId || associationId),
        }))
        .catch(() => toast.error("Configuration introuvable"));
    }
  }, [associationId]);

  const handleSubmit = async () => {
    if (!form.montantDefaut || isNaN(Number(form.montantDefaut))) {
      toast.error("⚠️ Montant par défaut obligatoire"); return;
    }
    if (!form.associationId) {
      toast.error("⚠️ Choisir une association"); return;
    }

    const payload = {
      montantDefaut:      Number(form.montantDefaut),
      periodicite:        form.periodicite,
      jourLimitePaiement: form.jourLimitePaiement ? Number(form.jourLimitePaiement) : null,
      penaliteRetard:     form.penaliteRetard ? Number(form.penaliteRetard) : 0,
      delaiRappelJours:   form.delaiRappelJours ? Number(form.delaiRappelJours) : 3,
      associationId:      Number(form.associationId),
    };

    console.log("📤 Payload envoyé :", payload);
    setSubmitting(true);
    try {
      if (isEdit) {
        await cotisationConfigService.update(Number(associationId), payload);
        toast.success("✅ Configuration mise à jour !");
      } else {
        await cotisationConfigService.create(payload);
        toast.success("✅ Configuration créée !");
      }
      window.location.href = "/cotisation-configs";
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Erreur inconnue";
      toast.error(`❌ Erreur : ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 35, background: "#f4f6f9", minHeight: "100vh" }}>
      <div style={{
        background: "white", padding: 30, borderRadius: 10,
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)", width: 480,
        display: "flex", flexDirection: "column", gap: 10, alignSelf: "flex-start",
      }}>
        <h2 style={{ textAlign: "center", color: "#4c1d95", marginBottom: 10 }}>
          ⚙️ {isEdit ? "Modifier la configuration" : "Créer une configuration"}
        </h2>

        {/* ASSOCIATION */}
        <label style={labelStyle}>Association *</label>
        {isEdit ? (
          <input style={{ ...input, background: "#f5f5f5" }} disabled
            value={associations.find((a) => String(a.id) === String(associationId))?.name || `Association #${associationId}`} />
        ) : (
          <select style={input} value={form.associationId}
            onChange={(e) => setForm({ ...form, associationId: e.target.value })}>
            <option value="">-- Choisir une association --</option>
            {associations.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}

        {/* MONTANT */}
        <label style={labelStyle}>Montant par défaut (€) *</label>
        <input style={input} type="number" min="0" step="0.01" placeholder="Ex: 50.00"
          value={form.montantDefaut}
          onChange={(e) => setForm({ ...form, montantDefaut: e.target.value })} />

        {/* PERIODICITE */}
        <label style={labelStyle}>Périodicité *</label>
        <select style={input} value={form.periodicite}
          onChange={(e) => setForm({ ...form, periodicite: e.target.value as Periodicite })}>
          {PERIODICITE_OPTIONS.map((p) => (
            <option key={p} value={p}>{PERIODICITE_LABELS[p]}</option>
          ))}
        </select>

        {/* JOUR LIMITE */}
        <label style={labelStyle}>Jour limite de paiement (optionnel)</label>
        <input style={input} type="number" min="1" max="31" placeholder="Ex: 15"
          value={form.jourLimitePaiement}
          onChange={(e) => setForm({ ...form, jourLimitePaiement: e.target.value })} />
        <span style={{ fontSize: 12, color: "#9ca3af", marginTop: -6 }}>
          Le paiement doit être effectué avant ce jour du mois
        </span>

        {/* PENALITE */}
        <label style={labelStyle}>Pénalité de retard (€) (optionnel)</label>
        <input style={input} type="number" min="0" step="0.01" placeholder="Ex: 5.00"
          value={form.penaliteRetard}
          onChange={(e) => setForm({ ...form, penaliteRetard: e.target.value })} />

        {/* DELAI RAPPEL */}
        <label style={labelStyle}>Délai de rappel (jours avant échéance)</label>
        <input style={input} type="number" min="0" placeholder="Ex: 3"
          value={form.delaiRappelJours}
          onChange={(e) => setForm({ ...form, delaiRappelJours: e.target.value })} />
        <span style={{ fontSize: 12, color: "#9ca3af", marginTop: -6 }}>
          Envoyer un rappel X jours avant l'échéance
        </span>

        <button onClick={handleSubmit} disabled={submitting}
          style={{
            marginTop: 10, padding: 10,
            background: submitting ? "#c4b5fd" : "#8b5cf6",
            color: "white", border: "none", borderRadius: 6,
            cursor: submitting ? "not-allowed" : "pointer",
            fontWeight: 600, fontSize: 14,
          }}>
          {submitting ? "⏳ Enregistrement..." : "💾 Enregistrer"}
        </button>

        <button onClick={() => window.location.href = "/cotisation-configs"}
          style={{ padding: 10, background: "#95a5a6", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>
          ✖️ Annuler
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 590, color: "#555" };
const input: React.CSSProperties = { padding: 10, borderRadius: 6, border: "1px solid #ccc" };