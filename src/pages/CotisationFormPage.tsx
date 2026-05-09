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

const STATUTS = [
  { value: "EN_ATTENTE", label: "En attente",  color: "#f59e0b" },
  { value: "PAYEE",      label: "Payée",        color: "#10b981" },
  { value: "EN_RETARD",  label: "En retard",    color: "#ef4444" },
  { value: "ANNULEE",    label: "Annulée",      color: "#6b7280" },
];

export default function CotisationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

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
  const [loading, setLoading] = useState(false);

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

  const deviseLabel = DEVISES.find(d => d.code === form.devise)?.label || form.devise;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.montant || Number(form.montant) <= 0) { toast.error("⚠️ Montant obligatoire et strictement positif"); return; }
    if (!form.devise) { toast.error("⚠️ Choisir une devise"); return; }
    if (!form.associationId) { toast.error("⚠️ Choisir une association"); return; }
    if (!form.memberId) { toast.error("⚠️ Choisir un membre"); return; }
    if (!form.periodeDebut || !form.periodeFin) { toast.error("⚠️ Période début et fin obligatoires"); return; }
    if (form.periodeFin < form.periodeDebut) { toast.error("⚠️ La période de fin doit être après le début"); return; }
    if (Number(form.montantPenalite) < 0) { toast.error("⚠️ La pénalité ne peut pas être négative"); return; }

    const payload = {
      ...form,
      montant: Number(form.montant),
      montantPenalite: Number(form.montantPenalite) || 0,
      associationId: Number(form.associationId),
      memberId: Number(form.memberId),
      dateEcheance: form.dateEcheance || null,
      referencePaiement: form.referencePaiement || null,
    };

    setLoading(true);
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
      toast.error("❌ Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", letterSpacing: "0.02em" }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
    </div>
  );

  const selectStyle: React.CSSProperties = {
    padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db",
    fontSize: 14, color: "#111827", background: "#fff",
    outline: "none", width: "100%", cursor: "pointer",
    appearance: "none" as const,
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db",
    fontSize: 14, color: "#111827", background: "#fff",
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    /* ✅ FIX SCROLL : minHeight + pas de overflow:hidden */
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f4ff 0%, #fafafa 100%)",
      padding: "32px 16px 48px",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 580, margin: "0 auto" }}>

        {/* BOUTON RETOUR */}
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

        {/* CARTE PRINCIPALE */}
        <div style={{
          background: "#fff", borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden",
        }}>

          {/* EN-TÊTE */}
          <div style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
            padding: "24px 32px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, background: "rgba(255,255,255,0.2)",
                borderRadius: 12, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 22,
              }}>💰</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>
                  {isEdit ? "Modifier la cotisation" : "Nouvelle cotisation"}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                  {isEdit ? `Modification de la cotisation #${id}` : "Remplissez les informations ci-dessous"}
                </p>
              </div>
            </div>
          </div>

          {/* FORMULAIRE */}
          <form onSubmit={handleSubmit} style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Section : Affectation */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
                Affectation
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Association" required>
                  <div style={{ position: "relative" }}>
                    <select style={selectStyle} value={form.associationId}
                      onChange={(e) => setForm({ ...form, associationId: e.target.value, memberId: "" })}>
                      <option value="">Choisir une association</option>
                      {associations.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 12, color: "#9ca3af" }}>▼</span>
                  </div>
                </Field>
                <Field label="Membre" required>
                  <div style={{ position: "relative" }}>
                    <select
                      style={{ ...selectStyle, background: !form.associationId ? "#f9fafb" : "#fff", color: !form.associationId ? "#9ca3af" : "#111827" }}
                      value={form.memberId}
                      disabled={!form.associationId}
                      onChange={(e) => setForm({ ...form, memberId: e.target.value })}>
                      <option value="">
                        {!form.associationId ? "Choisir d'abord une association" : members.length === 0 ? "Aucun membre" : "Choisir un membre"}
                      </option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 12, color: "#9ca3af" }}>▼</span>
                  </div>
                </Field>
              </div>
            </div>

            {/* Section : Montant */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
                Montant & Devise
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Devise" required>
                  <div style={{ position: "relative" }}>
                    <select style={selectStyle} value={form.devise}
                      onChange={(e) => setForm({ ...form, devise: e.target.value })}>
                      {DEVISES.map((d) => (
                        <option key={d.code} value={d.code}>{d.label}</option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 12, color: "#9ca3af" }}>▼</span>
                  </div>
                </Field>
                <Field label={`Montant (${deviseLabel})`} required>
                  <input style={inputStyle} type="number" step="0.01" min="0.01"
                    placeholder="0.00"
                    value={form.montant}
                    onChange={(e) => { if (Number(e.target.value) < 0) return; setForm({ ...form, montant: e.target.value }); }} />
                </Field>
                <Field label={`Pénalité (${deviseLabel})`}>
                  <input style={inputStyle} type="number" step="0.01" min="0"
                    placeholder="0.00"
                    value={form.montantPenalite}
                    onChange={(e) => { if (Number(e.target.value) < 0) return; setForm({ ...form, montantPenalite: e.target.value }); }} />
                </Field>
                <Field label="Référence paiement">
                  <input style={inputStyle} placeholder="Ex: VIR-2024-001"
                    value={form.referencePaiement}
                    onChange={(e) => setForm({ ...form, referencePaiement: e.target.value })} />
                </Field>
              </div>
            </div>

            {/* Section : Statut & Dates */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
                Statut & Dates
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Statut" required>
                  <div style={{ position: "relative" }}>
                    <select style={selectStyle} value={form.statut}
                      onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                      {STATUTS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 12, color: "#9ca3af" }}>▼</span>
                  </div>
                </Field>
                <Field label="Date d'échéance">
                  <input style={inputStyle} type="date" value={form.dateEcheance}
                    onChange={(e) => setForm({ ...form, dateEcheance: e.target.value })} />
                </Field>
                <Field label="Période début" required>
                  <input style={inputStyle} type="date" value={form.periodeDebut}
                    onChange={(e) => setForm({ ...form, periodeDebut: e.target.value })} />
                </Field>
                <Field label="Période fin" required>
                  <input style={inputStyle} type="date" value={form.periodeFin}
                    onChange={(e) => setForm({ ...form, periodeFin: e.target.value })} />
                </Field>
              </div>
            </div>

            {/* ACTIONS */}
            <div style={{ display: "flex", gap: 12, paddingTop: 8, borderTop: "1px solid #f3f4f6", marginTop: 4 }}>
              <button
                type="button"
                onClick={() => navigate("/cotisations")}
                style={{
                  flex: 1, padding: "12px", borderRadius: 10,
                  border: "1px solid #d1d5db", background: "#fff",
                  color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2, padding: "12px", borderRadius: 10,
                  border: "none",
                  background: loading ? "#93c5fd" : "linear-gradient(135deg, #1d4ed8, #2563eb)",
                  color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(29,78,216,0.3)",
                }}
              >
                {loading ? "Enregistrement…" : isEdit ? "💾 Mettre à jour" : "💾 Créer la cotisation"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}