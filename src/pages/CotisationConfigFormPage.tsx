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
  const [members, setMembers]           = useState<any[]>([]);
  const [submitting, setSubmitting]     = useState(false);

  useEffect(() => {
    getAssociations(0, 1000).then((res) => setAssociations(res.content));
    if (id) {
      getCotisationById(Number(id)).then((data) => {
        setForm({
          montant:           data.montant           ?? "",
          devise:            data.devise            || "EUR",
          statut:            data.statut            || "EN_ATTENTE",
          periodeDebut:      data.periodeDebut      || "",
          periodeFin:        data.periodeFin        || "",
          dateEcheance:      data.dateEcheance      || "",
          montantPenalite:   data.montantPenalite   ?? "0",
          referencePaiement: data.referencePaiement || "",
          associationId:     data.associationId     || "",
          memberId:          data.memberId          || "",
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

  // ✅ Handler générique — pas de validation bloquante pendant la saisie
  const handleChange = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // ✅ Validation uniquement au submit
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
      montant:          Number(form.montant),
      montantPenalite:  Number(form.montantPenalite) || 0,
      associationId:    Number(form.associationId),
      memberId:         Number(form.memberId),
      dateEcheance:     form.dateEcheance     || null,
      referencePaiement: form.referencePaiement || null,
    };

    setSubmitting(true);
    try {
      if (id) {
        await updateCotisation(Number(id), payload);
        toast.success("✅ Cotisation modifiée !");
      } else {
        await createCotisation(payload);
        toast.success("✅ Cotisation créée !");
      }
      navigate("/cotisations");
    } catch {
      toast.error("❌ Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const devisSymbol = DEVISES.find(d => d.code === form.devise)?.label.split(" ")[0] ?? "";

  return (
    <div style={s.page}>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate("/cotisations")}>
          ← Retour aux cotisations
        </button>
        <div>
          <h1 style={s.headerTitle}>
            {id ? "✏️ Modifier la cotisation" : "💰 Nouvelle cotisation"}
          </h1>
          <p style={s.headerSub}>
            {id ? "Modifiez les informations de la cotisation" : "Remplissez les informations ci-dessous"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={s.formGrid}>

        {/* ── Affectation ── */}
        <div style={s.card}>
          <div style={s.cardTitle}>🏛️ Affectation</div>

          <div style={s.field}>
            <label style={s.label}>Association <span style={s.req}>*</span></label>
            <select style={s.select} value={form.associationId}
              onChange={(e) => setForm({ ...form, associationId: e.target.value, memberId: "" })}>
              <option value="">Choisir une association</option>
              {associations.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>Membre <span style={s.req}>*</span></label>
            <select
              style={{ ...s.select, background: !form.associationId ? "#f8fafc" : "white", color: !form.associationId ? "#94a3b8" : "#0f172a" }}
              value={form.memberId}
              disabled={!form.associationId}
              onChange={(e) => handleChange("memberId", e.target.value)}>
              <option value="">
                {!form.associationId ? "Choisir d'abord une association"
                  : members.length === 0 ? "Aucun membre"
                  : "Choisir un membre"}
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Montant & Devise ── */}
        <div style={s.card}>
          <div style={s.cardTitle}>💵 Montant & Devise</div>

          <div style={s.field}>
            <label style={s.label}>Devise <span style={s.req}>*</span></label>
            <select style={s.select} value={form.devise}
              onChange={(e) => handleChange("devise", e.target.value)}>
              {DEVISES.map((d) => (
                <option key={d.code} value={d.code}>{d.label}</option>
              ))}
            </select>
          </div>

          <div style={s.row2col}>
            <div style={s.field}>
              {/* ✅ label dynamique avec la devise choisie */}
              <label style={s.label}>Montant ({form.devise}) <span style={s.req}>*</span></label>
              <div style={s.inputWrap}>
                <span style={s.inputPrefix}>{devisSymbol}</span>
                {/* ✅ Saisie libre — pas de condition bloquante onChange */}
                <input
                  style={s.inputWithPrefix}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={form.montant}
                  onChange={(e) => handleChange("montant", e.target.value)}
                />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Pénalité ({form.devise})</label>
              <div style={s.inputWrap}>
                <span style={s.inputPrefix}>{devisSymbol}</span>
                {/* ✅ Saisie libre — pas de condition bloquante onChange */}
                <input
                  style={s.inputWithPrefix}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.montantPenalite}
                  onChange={(e) => handleChange("montantPenalite", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Référence paiement</label>
            <input
              style={s.input}
              placeholder="Ex: VIR-2024-001"
              value={form.referencePaiement}
              onChange={(e) => handleChange("referencePaiement", e.target.value)}
            />
            <span style={s.hint}>Optionnel — numéro de virement, chèque, etc.</span>
          </div>
        </div>

        {/* ── Statut & Dates ── */}
        <div style={s.card}>
          <div style={s.cardTitle}>📅 Statut & Dates</div>

          <div style={s.field}>
            <label style={s.label}>Statut <span style={s.req}>*</span></label>
            <select style={s.select} value={form.statut}
              onChange={(e) => handleChange("statut", e.target.value)}>
              <option value="EN_ATTENTE">⏳ En attente</option>
              <option value="PAYEE">✅ Payée</option>
              <option value="EN_RETARD">🔴 En retard</option>
              <option value="ANNULEE">⚫ Annulée</option>
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>Date d'échéance</label>
            {/* ✅ input type="date" — saisie directe libre */}
            <input
              style={s.input}
              type="date"
              value={form.dateEcheance}
              onChange={(e) => handleChange("dateEcheance", e.target.value)}
            />
          </div>

          <div style={s.row2col}>
            <div style={s.field}>
              <label style={s.label}>Période début <span style={s.req}>*</span></label>
              <input
                style={s.input}
                type="date"
                value={form.periodeDebut}
                onChange={(e) => handleChange("periodeDebut", e.target.value)}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Période fin <span style={s.req}>*</span></label>
              <input
                style={s.input}
                type="date"
                value={form.periodeFin}
                onChange={(e) => handleChange("periodeFin", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div style={s.actions}>
          <button type="button" style={s.btnCancel} onClick={() => navigate("/cotisations")}>
            Annuler
          </button>
          <button type="submit" style={{ ...s.btnSave, opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
            {submitting ? "⏳ Enregistrement..." : `💾 ${id ? "Mettre à jour" : "Créer la cotisation"}`}
          </button>
        </div>

      </form>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:            { background: "#f1f5f9", minHeight: "100vh", padding: "28px 32px" },
  header:          { display: "flex", alignItems: "center", gap: 20, marginBottom: 28 },
  backBtn:         { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 16px", fontSize: 14, color: "#475569", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" },
  headerTitle:     { fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 },
  headerSub:       { fontSize: 14, color: "#64748b", margin: "4px 0 0" },
  formGrid:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 900, margin: "0 auto" },
  card:            { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 },
  cardTitle:       { fontSize: 13, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: ".05em", paddingBottom: 12, borderBottom: "1px solid #f1f5f9" },
  field:           { display: "flex", flexDirection: "column", gap: 6 },
  label:           { fontSize: 13, fontWeight: 600, color: "#374151" },
  req:             { color: "#ef4444" },
  hint:            { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  input:           { padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, color: "#0f172a", outline: "none", width: "100%", boxSizing: "border-box" },
  select:          { padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, color: "#0f172a", background: "white", cursor: "pointer" },
  row2col:         { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  inputWrap:       { display: "flex", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" },
  inputPrefix:     { background: "#f8fafc", padding: "10px 12px", fontSize: 14, fontWeight: 600, color: "#475569", borderRight: "1px solid #e2e8f0", whiteSpace: "nowrap" },
  inputWithPrefix: { flex: 1, padding: "10px 12px", border: "none", fontSize: 14, color: "#0f172a", outline: "none" },
  actions:         { gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 4 },
  btnCancel:       { padding: "11px 24px", background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" },
  btnSave:         { padding: "11px 28px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
};