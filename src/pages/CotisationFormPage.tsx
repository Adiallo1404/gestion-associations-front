import { useEffect, useState } from "react";
import { createCotisation, getCotisationById, updateCotisation } from "../api/cotisationService";
import { getAssociations } from "../api/associationService";
import { memberService } from "../api/memberService";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const DEVISES = [
  { code: "EUR", label: "€ Euro" },
  { code: "USD", label: "$ Dollar américain" },
  { code: "XOF", label: "FCFA Franc CFA (UEMOA)" },
  { code: "XAF", label: "FCFA Franc CFA (CEMAC)" },
  { code: "GNF", label: "GNF Franc Guinéen" },
  { code: "MAD", label: "MAD Dirham marocain" },
  { code: "DZD", label: "DZD Dinar algérien" },
  { code: "TND", label: "TND Dinar tunisien" },
  { code: "GBP", label: "£ Livre sterling" },
  { code: "CHF", label: "CHF Franc suisse" },
];

export default function CotisationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState<any>({
    montant: "",
    devise: "EUR",
    statut: "EN_ATTENTE",
    periodeDebut: "",
    periodeFin: "",
    dateEcheance: "",
    montantPenalite: "0",
    referencePaiement: "",
    associationId: "",
    memberId: "",
  });

  const [associations, setAssociations] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    getAssociations(0, 1000).then((res) => setAssociations(res.content));

    if (id) {
      getCotisationById(Number(id)).then((data) => {
        setForm({
          montant: data.montant || "",
          devise: data.devise || "EUR",
          statut: data.statut || "EN_ATTENTE",
          periodeDebut: data.periodeDebut || "",
          periodeFin: data.periodeFin || "",
          dateEcheance: data.dateEcheance || "",
          montantPenalite: data.montantPenalite ?? "0",
          referencePaiement: data.referencePaiement || "",
          associationId: data.associationId || "",
          memberId: data.memberId || "",
        });
      });
    }
  }, [id]);

  useEffect(() => {
    if (form.associationId) {
      memberService.getAll({ associationId: form.associationId, page: 0, size: 1000 })
        .then((res) => {
          setMembers(res.content);
          if (!id) setForm((prev: any) => ({ ...prev, memberId: "" }));
        });
    } else {
      setMembers([]);
    }
  }, [form.associationId]);

  // Symbole affiché à côté des montants
  const deviseLabel = DEVISES.find(d => d.code === form.devise)?.label || form.devise;

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!form.montant || Number(form.montant) <= 0) {
      toast.error("⚠️ Montant obligatoire et strictement positif"); return;
    }
    if (!form.devise) {
      toast.error("⚠️ Choisir une devise"); return;
    }
    if (!form.associationId) {
      toast.error("⚠️ Choisir une association"); return;
    }
    if (!form.memberId) {
      toast.error("⚠️ Choisir un membre"); return;
    }
    if (!form.periodeDebut || !form.periodeFin) {
      toast.error("⚠️ Période début et fin obligatoires"); return;
    }
    if (form.periodeFin < form.periodeDebut) {
      toast.error("⚠️ La période de fin doit être après la période de début"); return;
    }
    if (Number(form.montantPenalite) < 0) {
      toast.error("⚠️ La pénalité ne peut pas être négative"); return;
    }

    const payload = {
      ...form,
      montant: Number(form.montant),
      montantPenalite: Number(form.montantPenalite) || 0,
      associationId: Number(form.associationId),
      memberId: Number(form.memberId),
      dateEcheance: form.dateEcheance || null,
      referencePaiement: form.referencePaiement || null,
    };

    try {
      if (id) {
        await updateCotisation(Number(id), payload);
        toast.success("✅ Cotisation modifiée !");
      } else {
        await createCotisation(payload);
        toast.success("✅ Cotisation créée !");
      }
      navigate("/cotisations");
    } catch (err) {
      console.error(err);
      toast.error("❌ Erreur lors de l'enregistrement");
    }
  };

  return (
    <div style={container}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={title}>
          {id ? "✏️ Modifier une cotisation" : "➕ Créer une cotisation"}
        </h2>

        {/* Association */}
        <label style={labelStyle}>Association *</label>
        <select style={input} value={form.associationId}
          onChange={(e) => setForm({ ...form, associationId: e.target.value, memberId: "" })}>
          <option value="">-- Choisir une association --</option>
          {associations.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        {/* Membre */}
        <label style={labelStyle}>Membre *</label>
        <select
          style={{ ...input, background: !form.associationId ? "#f5f5f5" : "white", cursor: !form.associationId ? "not-allowed" : "pointer" }}
          value={form.memberId}
          disabled={!form.associationId}
          onChange={(e) => setForm({ ...form, memberId: e.target.value })}>
          <option value="">
            {!form.associationId
              ? "-- Choisir d'abord une association --"
              : members.length === 0
              ? "-- Aucun membre dans cette association --"
              : "-- Choisir un membre --"}
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
          ))}
        </select>

        {/* ✅ Devise */}
        <label style={labelStyle}>Devise *</label>
        <select style={input} value={form.devise}
          onChange={(e) => setForm({ ...form, devise: e.target.value })}>
          {DEVISES.map((d) => (
            <option key={d.code} value={d.code}>{d.label}</option>
          ))}
        </select>

        {/* ✅ Montant avec devise dynamique */}
        <label style={labelStyle}>Montant ({deviseLabel}) *</label>
        <input style={input} type="number" step="0.01" min="0.01"
          placeholder="Ex: 50.00"
          value={form.montant}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (val < 0) return;
            setForm({ ...form, montant: e.target.value });
          }} />

        {/* Statut */}
        <label style={labelStyle}>Statut *</label>
        <select style={input} value={form.statut}
          onChange={(e) => setForm({ ...form, statut: e.target.value })}>
          <option value="EN_ATTENTE">En attente</option>
          <option value="PAYEE">Payée</option>
          <option value="EN_RETARD">En retard</option>
          <option value="ANNULEE">Annulée</option>
        </select>

        {/* Période début */}
        <label style={labelStyle}>Période début *</label>
        <input style={input} type="date" value={form.periodeDebut}
          onChange={(e) => setForm({ ...form, periodeDebut: e.target.value })} />

        {/* Période fin */}
        <label style={labelStyle}>Période fin *</label>
        <input style={input} type="date" value={form.periodeFin}
          onChange={(e) => setForm({ ...form, periodeFin: e.target.value })} />

        {/* Date échéance */}
        <label style={labelStyle}>Date d'échéance</label>
        <input style={input} type="date" value={form.dateEcheance}
          onChange={(e) => setForm({ ...form, dateEcheance: e.target.value })} />

        {/* ✅ Montant pénalité avec devise dynamique */}
        <label style={labelStyle}>Montant pénalité ({deviseLabel})</label>
        <input style={input} type="number" step="0.01" min="0"
          placeholder="0.00"
          value={form.montantPenalite}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (val < 0) return;
            setForm({ ...form, montantPenalite: e.target.value });
          }} />

        {/* Référence paiement */}
        <label style={labelStyle}>Référence paiement</label>
        <input style={input} placeholder="Ex: VIR-2024-001"
          value={form.referencePaiement}
          onChange={(e) => setForm({ ...form, referencePaiement: e.target.value })} />

        <button type="submit" style={btnSave}>
          💾 {id ? "Mettre à jour" : "Enregistrer"}
        </button>
        <button type="button" style={btnCancel} onClick={() => navigate("/cotisations")}>
          ✖️ Annuler
        </button>
      </form>
    </div>
  );
}

const container = { display: "flex", justifyContent: "center", marginTop: "35px", background: "#f4f6f9", minHeight: "100vh" };
const formStyle = { background: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", width: "420px", display: "flex", flexDirection: "column" as const, gap: "8px" };
const title = { textAlign: "center" as const, color: "#273c50", marginBottom: "10px" };
const labelStyle = { fontSize: "13px", fontWeight: "590" as const, color: "#555" };
const input = { padding: "10px", borderRadius: "6px", border: "1px solid #ccc" };
const btnSave = { marginTop: "10px", padding: "10px", background: "#27ae60", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" };
const btnCancel = { padding: "10px", background: "#95a5a6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" };